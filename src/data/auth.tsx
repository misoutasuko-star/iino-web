import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

// Sign-in (05 §5.2, web version): Google, email + password, password reset,
// or "Continue without an account" (data stays in this browser).

type Mode = 'loading' | 'signedOut' | 'cloud' | 'local'

interface AuthValue {
  mode: Mode
  session: Session | null
  email: string | null
  userId: string | null
  displayName: string
  working: boolean
  error: string | null
  awaitingConfirmationFor: string | null
  notice: string | null
  showPasswordReset: boolean
  clearMessages(): void
  signInWithGoogle(): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<boolean>
  dismissPasswordReset(): void
  continueLocally(): void
  leaveLocal(): void
  signOut(): Promise<void>
  deleteAccount(): Promise<boolean>
  updateDisplayName(name: string): Promise<void>
  resetConfirmation(): void
}

const LOCAL_FLAG = 'iino.localMode'
const AuthContext = createContext<AuthValue | null>(null)

const redirectTo = () => `${window.location.origin}/`

export function friendlyMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  const text = raw.toLowerCase()
  if (text.includes('invalid login')) return "That email and password don't match."
  if (text.includes('already registered')) return "There's already an account with this email. Try signing in."
  if (text.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link.'
  if (text.includes('rate limit')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (text.includes('failed to fetch') || text.includes('network')) return "Can't reach the server. Check your internet connection."
  if (text.includes('not enabled')) return "Google sign-in isn't switched on yet."
  return raw
}

const readLocalFlag = () => {
  try {
    return localStorage.getItem(LOCAL_FLAG) === '1'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!supabase)
  const [local, setLocal] = useState(readLocalFlag)
  const [displayName, setDisplayName] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [awaitingConfirmationFor, setAwaiting] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setShowPasswordReset(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!supabase || !userId) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setDisplayName((data?.display_name as string | null) ?? ''))
  }, [userId])

  const perform = useCallback(async (fn: () => Promise<void>) => {
    setWorking(true)
    setError(null)
    setNotice(null)
    try {
      await fn()
    } catch (e) {
      setError(friendlyMessage(e))
    } finally {
      setWorking(false)
    }
  }, [])

  const value = useMemo<AuthValue>(() => {
    const client = supabase
    const need = () => {
      if (!client) throw new Error('Sign-in isn’t set up on this site yet.')
      return client
    }
    const mode: Mode = !ready ? 'loading' : session ? 'cloud' : local ? 'local' : 'signedOut'
    return {
      mode,
      session,
      email: session?.user.email ?? null,
      userId,
      displayName,
      working,
      error,
      notice,
      awaitingConfirmationFor,
      showPasswordReset,
      clearMessages: () => {
        setError(null)
        setNotice(null)
      },
      signInWithGoogle: () =>
        perform(async () => {
          const { error } = await need().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })
          if (error) throw error
        }),
      signIn: (email, password) =>
        perform(async () => {
          const { error } = await need().auth.signInWithPassword({ email, password })
          if (error) throw error
        }),
      signUp: (email, password) =>
        perform(async () => {
          const { data, error } = await need().auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
          if (error) throw error
          if (!data.session) setAwaiting(email)
        }),
      sendPasswordReset: (email) =>
        perform(async () => {
          const { error } = await need().auth.resetPasswordForEmail(email, { redirectTo: redirectTo() })
          if (error) throw error
          setNotice(`Check ${email} for a link to reset your password.`)
        }),
      updatePassword: async (password) => {
        let ok = false
        await perform(async () => {
          const { error } = await need().auth.updateUser({ password })
          if (error) throw error
          ok = true
          setShowPasswordReset(false)
        })
        return ok
      },
      dismissPasswordReset: () => setShowPasswordReset(false),
      continueLocally: () => {
        try {
          localStorage.setItem(LOCAL_FLAG, '1')
        } catch {
          // ignore
        }
        setLocal(true)
      },
      leaveLocal: () => {
        try {
          localStorage.removeItem(LOCAL_FLAG)
        } catch {
          // ignore
        }
        setLocal(false)
      },
      signOut: () =>
        perform(async () => {
          await need().auth.signOut()
        }),
      deleteAccount: async () => {
        let ok = false
        await perform(async () => {
          const c = need()
          const { error } = await c.rpc('delete_my_account')
          if (error) throw error
          await c.auth.signOut()
          ok = true
        })
        return ok
      },
      updateDisplayName: (name) =>
        perform(async () => {
          if (!userId) return
          const { error } = await need().from('profiles').update({ display_name: name }).eq('id', userId)
          if (error) throw error
          setDisplayName(name)
        }),
      resetConfirmation: () => setAwaiting(null),
    }
  }, [ready, session, local, userId, displayName, working, error, notice, awaitingConfirmationFor, showPasswordReset, perform])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

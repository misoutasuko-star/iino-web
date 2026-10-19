import { useState } from 'react'
import { CoffeeCup } from '../components/CoffeeArt'
import { Modal, Segmented } from '../components/ui'
import { useAuth } from '../data/auth'
import { isSupabaseConfigured } from '../data/supabase'

// "Save your brew" sign-in screen (04 §4.9). Apple sign-in on the web comes later.

export function SignIn() {
  const auth = useAuth()
  const [mode, setMode] = useState<'signIn' | 'create'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const valid = mode === 'create' ? email.includes('@') && password.length >= 8 : email.length > 0 && password.length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    if (mode === 'create') auth.signUp(email.trim(), password)
    else auth.signIn(email.trim(), password)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <CoffeeCup progress={0.7} size={110} steaming />
        <h1 className="mt-2 font-serif text-4xl font-semibold">Save your brew</h1>
        <p className="mt-2 text-muted">Sign in to keep your tasks, habits and streaks safe and in step on all your devices.</p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="card p-4 text-center text-sm text-muted">Sign-in isn’t set up on this site yet. You can still try iino in this browser.</div>
      ) : auth.awaitingConfirmationFor ? (
        <div className="card space-y-3 p-5 text-center">
          <div className="font-serif text-xl font-semibold">Check your inbox</div>
          <p className="text-muted">We sent a link to {auth.awaitingConfirmationFor}. Open it to finish creating your account.</p>
          <button className="btn-soft" onClick={auth.resetConfirmation}>
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <button onClick={auth.signInWithGoogle} className="card flex items-center justify-center gap-3 p-3.5 font-medium">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={submit} className="card space-y-3 p-4">
            <Segmented
              value={mode}
              onChange={(m) => {
                setMode(m)
                auth.clearMessages()
              }}
              options={[
                { value: 'signIn', label: 'Sign in' },
                { value: 'create', label: 'Create account' },
              ]}
            />
            <input className="input" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className="input"
              type="password"
              autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              placeholder={mode === 'create' ? 'Password (8+ characters)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn-primary" disabled={!valid || auth.working}>
              {auth.working ? 'One moment…' : mode === 'create' ? 'Create account' : 'Sign in'}
            </button>
            {mode === 'signIn' && (
              <button type="button" className="block w-full text-center text-sm text-primary disabled:opacity-40" disabled={!email.includes('@')} onClick={() => auth.sendPasswordReset(email.trim())}>
                Forgot password?
              </button>
            )}
            {auth.error && <p className="text-center text-sm text-danger">{auth.error}</p>}
            {auth.notice && <p className="text-center text-sm text-success">{auth.notice}</p>}
          </form>
          <p className="text-center text-xs text-muted">Signed up on your iPhone with Apple? Apple sign-in on the web is coming soon.</p>
        </>
      )}

      <div className="text-center">
        <button className="font-medium text-primary" onClick={auth.continueLocally}>
          Continue without an account
        </button>
        <p className="mt-1 text-sm text-muted">Your data stays in this browser. You can sign in later in Settings.</p>
      </div>
    </div>
  )
}

export function NewPassword() {
  const auth = useAuth()
  const [password, setPassword] = useState('')
  return (
    <Modal
      title="Choose a new password"
      onClose={auth.dismissPasswordReset}
      leading={
        <button className="text-muted" onClick={auth.dismissPasswordReset}>
          Cancel
        </button>
      }
      trailing={
        <button className="font-semibold text-primary disabled:opacity-40" disabled={password.length < 8 || auth.working} onClick={() => auth.updatePassword(password)}>
          Save
        </button>
      }
    >
      <div className="space-y-3">
        <input className="input" type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {auth.error && <p className="text-sm text-danger">{auth.error}</p>}
      </div>
    </Modal>
  )
}

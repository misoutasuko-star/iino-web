import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSheets } from '../components/sheets'
import { Field, Segmented } from '../components/ui'
import { useAuth } from '../data/auth'
import { useStore } from '../data/store'
import { isSupabaseConfigured } from '../data/supabase'
import { getWeekStartsOn, orderedWeekdays, shortWeekdayName, weekday } from '../lib/dates'
import { endMinutes, startMinutes } from '../lib/models'
import { setStoredWeekStart } from '../weekStart'

const GRID_START = 6
const GRID_END = 24
const PX_PER_HOUR = 20

export function Settings() {
  const navigate = useNavigate()
  useEffect(() => {
    if (window.location.hash === '#study-windows') document.getElementById('study-windows')?.scrollIntoView()
  }, [])
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="grid size-9 place-items-center rounded-full bg-fill text-primary md:hidden">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-4xl font-semibold">Settings</h1>
      </header>
      <AccountSection />
      <StudyWindows />
      <WeekStartSection />
      <Field label="About" footer="Reminders and calendar events come from the iPhone app for now.">
        <div className="flex justify-between">
          <span>Version</span>
          <span className="text-muted">Web 0.1</span>
        </div>
      </Field>
    </div>
  )
}

function AccountSection() {
  const auth = useAuth()
  const store = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState(auth.displayName)
  const [confirm, setConfirm] = useState<'signOut' | 'delete' | null>(null)
  useEffect(() => setName(auth.displayName), [auth.displayName])

  if (auth.mode === 'local')
    return (
      <Field label="Account" footer="Your data is only in this browser. Signing in starts fresh with your account’s data.">
        <div className="font-medium">Sign in to sync</div>
        <p className="text-sm text-muted">Keep your data safe and see the same tasks and habits as on your iPhone.</p>
        {isSupabaseConfigured && (
          <button
            className="btn-primary"
            onClick={() => {
              auth.leaveLocal()
              navigate('/')
            }}
          >
            Sign in
          </button>
        )}
      </Field>
    )

  const status = store.status
  const statusText =
    status.kind === 'loading'
      ? 'Syncing…'
      : status.kind === 'error'
        ? status.message.toLowerCase().includes('fetch')
          ? 'Offline. Will sync when you’re back online.'
          : status.message
        : `Synced ${status.at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`

  return (
    <Field label="Account" footer="Signing out keeps your data safe in your account. Deleting your account permanently removes everything synced to it.">
      <div className="text-sm text-muted">Signed in as {auth.email}</div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Name</span>
        <input
          className="input"
          placeholder="Shown on leaderboards later"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && auth.updateDisplayName(name.trim())}
          onBlur={() => name.trim() !== auth.displayName && auth.updateDisplayName(name.trim())}
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm ${status.kind === 'error' ? 'text-danger' : 'text-muted'}`}>{statusText}</span>
        <button className="btn-soft" onClick={() => store.reload()}>
          Sync now
        </button>
      </div>
      {auth.error && <p className="text-sm text-danger">{auth.error}</p>}
      {confirm === null && (
        <div className="flex gap-2 pt-1">
          <button className="flex-1 rounded-full bg-fill py-2.5" onClick={() => setConfirm('signOut')}>
            Sign out
          </button>
          <button className="flex-1 rounded-full bg-fill py-2.5 text-danger" onClick={() => setConfirm('delete')}>
            Delete account
          </button>
        </div>
      )}
      {confirm && (
        <div className="space-y-3 rounded-2xl bg-fill p-4">
          <p className="text-sm">
            {confirm === 'signOut'
              ? 'Your data stays in your account. Sign back in any time.'
              : 'This permanently deletes your account and all synced data, including what your iPhone has synced. It can’t be undone.'}
          </p>
          <div className="flex gap-2">
            <button className="flex-1 rounded-full bg-card py-2.5" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="flex-1 rounded-full bg-danger py-2.5 font-semibold text-card"
              onClick={async () => {
                if (confirm === 'signOut') await auth.signOut()
                else await auth.deleteAccount()
                setConfirm(null)
              }}
            >
              {confirm === 'signOut' ? 'Sign out' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </Field>
  )
}

function StudyWindows() {
  const { windows, now } = useStore()
  const sheets = useSheets()
  const days = orderedWeekdays()
  const hours = GRID_END - GRID_START
  return (
    <section id="study-windows" className="space-y-2">
      <h3 className="section-header px-1">Study windows</h3>
      <div className="card p-3">
        <div className="flex">
          <div className="w-9 shrink-0" />
          <div className="grid flex-1 grid-cols-7 gap-1">
            {days.map((d) => (
              <div key={d} className={`text-center text-xs font-semibold ${d === weekday(now) ? 'text-primary' : 'text-muted'}`}>
                {shortWeekdayName(d)}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1 flex">
          <div className="relative w-9 shrink-0" style={{ height: hours * PX_PER_HOUR }}>
            {Array.from({ length: hours / 3 + 1 }, (_, i) => GRID_START + i * 3).map((h) => (
              <span key={h} className="absolute right-1 -translate-y-1/2 text-[10px] text-muted" style={{ top: (h - GRID_START) * PX_PER_HOUR }}>
                {h === 24 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7 gap-1">
            {days.map((d) => (
              <div
                key={d}
                className="relative cursor-pointer rounded-lg bg-fill/60"
                style={{ height: hours * PX_PER_HOUR }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const hour = Math.min(22, GRID_START + Math.floor((e.clientY - rect.top) / PX_PER_HOUR))
                  sheets.open({ kind: 'newWindow', weekday: d, hour })
                }}
              >
                {windows
                  .filter((w) => w.weekday === d)
                  .map((w) => {
                    const top = Math.max(0, (startMinutes(w) / 60 - GRID_START) * PX_PER_HOUR)
                    const bottom = Math.min(hours * PX_PER_HOUR, (endMinutes(w) / 60 - GRID_START) * PX_PER_HOUR)
                    if (bottom <= top) return null
                    return (
                      <button
                        key={w.id}
                        aria-label="Edit study time"
                        className="absolute inset-x-0.5 rounded-md bg-crema hover:brightness-95"
                        style={{ top, height: bottom - top }}
                        onClick={(e) => {
                          e.stopPropagation()
                          sheets.open({ kind: 'editWindow', window: w })
                        }}
                      />
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
        <button className="btn-soft mt-3" onClick={() => sheets.open({ kind: 'newWindow' })}>
          Add study time
        </button>
      </div>
      <p className="px-1 text-sm text-muted">Tap a block to edit it, or an empty spot to add study time. Without any, iino plans between 8 AM and 10 PM.</p>
    </section>
  )
}

function WeekStartSection() {
  const [value, setValue] = useState(String(getWeekStartsOn()))
  return (
    <Field label="Week starts on" footer="Used for rest days, weekly goals and this week’s beans. Match it to your iPhone’s region setting so both show the same numbers.">
      <Segmented
        value={value}
        onChange={(v) => {
          setValue(v)
          setStoredWeekStart(Number(v) as 0 | 1)
        }}
        options={[
          { value: '0', label: 'Sunday' },
          { value: '1', label: 'Monday' },
        ]}
      />
    </Field>
  )
}

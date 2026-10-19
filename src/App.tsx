import { BarChart3, CalendarClock, Coffee, Flame, ListChecks, Settings as SettingsIcon } from 'lucide-react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { CoffeeCup } from './components/CoffeeArt'
import { ExamEditor, HabitEditor, MissReasonSheet, TaskEditor, WindowEditor } from './components/editors'
import { FeedbackSheet, FocusSession } from './components/FocusSession'
import { SheetsProvider, useSheets, type Sheet } from './components/sheets'
import { AuthProvider, useAuth } from './data/auth'
import { StoreProvider, useStore } from './data/store'
import { HabitDetail } from './pages/HabitDetail'
import { Habits } from './pages/Habits'
import { Insights } from './pages/Insights'
import { Plan } from './pages/Plan'
import { Settings } from './pages/Settings'
import { NewPassword, SignIn } from './pages/SignIn'
import { Tasks } from './pages/Tasks'
import { Today } from './pages/Today'

const TABS = [
  { to: '/', label: 'Today', icon: Coffee },
  { to: '/plan', label: 'Plan', icon: CalendarClock },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}

function Gate() {
  const auth = useAuth()
  if (auth.mode === 'loading')
    return (
      <div className="grid min-h-screen place-items-center">
        <CoffeeCup progress={0.5} size={80} steaming />
      </div>
    )
  return (
    <>
      {auth.mode === 'signedOut' ? (
        <SignIn />
      ) : (
        <StoreProvider>
          <SheetsProvider>
            <Shell />
          </SheetsProvider>
        </StoreProvider>
      )}
      {auth.showPasswordReset && <NewPassword />}
    </>
  )
}

function Shell() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl">
      <nav className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 px-4 py-8 md:flex">
        <div className="mb-6 flex items-center gap-2 px-3 font-serif text-2xl font-semibold">
          <CoffeeCup progress={0.7} size={34} /> iino
        </div>
        {[...TABS, { to: '/settings', label: 'Settings', icon: SettingsIcon }].map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 font-medium transition-colors ${isActive ? 'bg-card text-ink shadow-sm' : 'text-muted hover:bg-card/60'}`}
          >
            <t.icon size={20} /> {t.label}
          </NavLink>
        ))}
      </nav>
      <main className="min-w-0 flex-1 px-5 pt-6 pb-28 md:px-10 md:pt-10 md:pb-12">
        <div className="mx-auto max-w-2xl">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-primary' : 'text-muted'}`}>
            <t.icon size={22} />
            {t.label}
          </NavLink>
        ))}
      </nav>
      <SheetHost />
      <Toast />
    </div>
  )
}

function SheetHost() {
  const { sheet, open, close } = useSheets()
  const store = useStore()
  if (!sheet) return null
  const back = (s: Sheet | undefined) => (s ? () => open(s) : close)
  // Always edit the latest version of a record, not the one captured when the sheet opened.
  const latestTask = (id: string) => store.tasks.find((t) => t.id === id)
  const latestHabit = (id: string) => store.habits.find((h) => h.id === id)

  switch (sheet.kind) {
    case 'newTask':
      return <TaskEditor onClose={close} />
    case 'editTask':
      return <TaskEditor task={latestTask(sheet.task.id) ?? sheet.task} onClose={close} />
    case 'newHabit':
      return <HabitEditor onClose={close} />
    case 'editHabit':
      return <HabitEditor habit={latestHabit(sheet.habit.id) ?? sheet.habit} onClose={back(sheet.back)} onDelete={close} />
    case 'habitDetail':
      return <HabitDetail habitId={sheet.habitId} onClose={close} />
    case 'missReason':
      return <MissReasonSheet habit={latestHabit(sheet.habit.id) ?? sheet.habit} onClose={back(sheet.back)} />
    case 'newExam':
      return <ExamEditor onClose={close} />
    case 'editExam':
      return <ExamEditor exam={sheet.exam} onClose={close} />
    case 'focus':
      return (
        <FocusSession
          task={latestTask(sheet.task.id) ?? sheet.task}
          onClose={close}
          onFinished={() => open({ kind: 'feedback', task: latestTask(sheet.task.id) ?? sheet.task })}
        />
      )
    case 'feedback':
      return <FeedbackSheet task={latestTask(sheet.task.id) ?? sheet.task} onClose={close} />
    case 'newWindow':
      return <WindowEditor weekday={sheet.weekday} hour={sheet.hour} onClose={close} />
    case 'editWindow':
      return <WindowEditor window={sheet.window} onClose={close} />
  }
}

function Toast() {
  const { celebration, dismissCelebration } = useStore()
  if (!celebration) return null
  return (
    <button
      key={celebration.id}
      onClick={dismissCelebration}
      className="toast card fixed top-4 left-1/2 z-50 flex w-[min(92vw,26rem)] items-center gap-3 p-4 text-left"
      style={{ transform: 'translateX(-50%)' }}
    >
      <span className="text-3xl">{celebration.icon}</span>
      <span>
        <span className="block font-serif text-lg font-semibold">{celebration.title}</span>
        <span className="block text-sm text-muted">{celebration.message}</span>
      </span>
    </button>
  )
}

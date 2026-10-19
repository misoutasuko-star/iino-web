import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { habitLogMissToday, habitSetCompletedToday, taskSetCompletedToday, difficultyMinutes, type LogChange } from '../lib/actions'
import { isHabitCompletedToday } from '../lib/models'
import { milestoneBonus } from '../lib/beans'
import { MILESTONES, streakReport } from '../lib/streaks'
import type {
  DifficultyFeedback,
  Exam,
  ExamRow,
  Habit,
  HabitRow,
  MissReason,
  TableName,
  Tables,
  Task,
  TaskRow,
  WorkWindow,
  WorkWindowRow,
} from '../lib/types'
import { useAuth } from './auth'
import { emptyTables, LocalBackend, SupabaseBackend, type Backend } from './backend'
import { supabase } from './supabase'

export interface Celebration {
  id: number
  icon: string
  title: string
  message: string
}

type SyncStatus = { kind: 'loading' } | { kind: 'ready'; at: Date } | { kind: 'error'; message: string }

interface StoreValue {
  tasks: Task[]
  habits: Habit[]
  exams: Exam[]
  windows: WorkWindow[]
  status: SyncStatus
  now: Date
  celebration: Celebration | null
  dismissCelebration(): void
  reload(): Promise<void>
  saveTask(row: TaskRow): void
  setTaskDoneToday(task: Task, done: boolean): void
  finishTask(task: Task): void
  restoreTask(task: Task): void
  deleteTask(task: Task): void
  giveFeedback(task: Task, feedback: DifficultyFeedback): void
  saveHabit(row: HabitRow): void
  deleteHabit(habit: Habit): void
  toggleHabitToday(habit: Habit): void
  logMiss(habit: Habit, reason: MissReason): void
  saveExam(row: ExamRow): void
  deleteExam(exam: Exam): void
  saveWindows(rows: WorkWindowRow[]): void
  deleteWindow(window: WorkWindow): void
}

const StoreContext = createContext<StoreValue | null>(null)

type Change = { table: TableName; upserts: unknown[]; deletes: string[] }

const stripLogs = <T extends object>(row: T) => {
  const { logs: _logs, ...rest } = row as T & { logs?: unknown }
  return rest
}

/** Re-renders every 30 s so "today" rolls over at midnight. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    const onFocus = () => setNow(new Date())
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])
  return now
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const now = useNow()
  const [tables, setTables] = useState<Tables>(emptyTables)
  const [status, setStatus] = useState<SyncStatus>({ kind: 'loading' })
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const tablesRef = useRef(tables)
  tablesRef.current = tables

  const backend: Backend | null = useMemo(() => {
    if (auth.mode === 'cloud' && supabase && auth.userId) return new SupabaseBackend(supabase, auth.userId)
    if (auth.mode === 'local') return new LocalBackend()
    return null
  }, [auth.mode, auth.userId])

  const reload = useCallback(async () => {
    if (!backend) return
    try {
      const data = await backend.load()
      setTables(data)
      setStatus({ kind: 'ready', at: new Date() })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }, [backend])

  useEffect(() => {
    setTables(emptyTables())
    setStatus({ kind: 'loading' })
    if (!backend) return
    reload()
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = backend.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(reload, 800)
    })
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [backend, reload])

  const celebrate = useCallback((icon: string, title: string, message: string) => {
    const id = Date.now()
    setCelebration({ id, icon, title, message })
    setTimeout(() => setCelebration((c) => (c?.id === id ? null : c)), 3000)
  }, [])

  /** Applies changes in memory right away, then writes them (parents first). */
  const commit = useCallback(
    (changes: Change[]) => {
      setTables((prev) => {
        const next = { ...prev }
        for (const c of changes) {
          const removed = new Set(c.deletes)
          const byId = new Map((next[c.table] as { id: string }[]).filter((r) => !removed.has(r.id)).map((r) => [r.id, r]))
          for (const u of c.upserts as { id: string }[]) byId.set(u.id, u)
          ;(next[c.table] as unknown[]) = [...byId.values()]
        }
        return next
      })
      if (!backend) return
      ;(async () => {
        try {
          for (const c of changes) {
            if (c.upserts.length) await backend.upsert(c.table, c.upserts as never)
            if (c.deletes.length) await backend.softDelete(c.table, c.deletes)
          }
          setStatus({ kind: 'ready', at: new Date() })
        } catch (e) {
          setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
          reload()
        }
      })()
    },
    [backend, reload],
  )

  const value = useMemo<StoreValue>(() => {
    const logsByTask = new Map<string, Tables['task_logs']>()
    for (const l of tables.task_logs) logsByTask.set(l.task_id, [...(logsByTask.get(l.task_id) ?? []), l])
    const logsByHabit = new Map<string, Tables['habit_logs']>()
    for (const l of tables.habit_logs) logsByHabit.set(l.habit_id, [...(logsByHabit.get(l.habit_id) ?? []), l])
    const tasks: Task[] = tables.tasks.map((t) => ({ ...t, logs: logsByTask.get(t.id) ?? [] }))
    const habits: Habit[] = tables.habits
      .map((h) => ({ ...h, repeat_days: h.repeat_days?.length ? h.repeat_days : [1, 2, 3, 4, 5, 6, 7], logs: logsByHabit.get(h.id) ?? [] }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

    const logChange = (table: 'task_logs' | 'habit_logs', c: LogChange<unknown>): Change => ({ table, upserts: c.upserts, deletes: c.deletes })

    return {
      tasks,
      habits,
      exams: tables.exams,
      windows: tables.work_windows,
      status,
      now,
      celebration,
      dismissCelebration: () => setCelebration(null),
      reload,
      saveTask: (row) => commit([{ table: 'tasks', upserts: [stripLogs(row)], deletes: [] }]),
      setTaskDoneToday: (task, done) => commit([logChange('task_logs', taskSetCompletedToday(task, done, new Date()))]),
      finishTask: (task) => {
        commit([{ table: 'tasks', upserts: [{ ...stripLogs(task), finished_at: new Date().toISOString() }], deletes: [] }])
        celebrate('☕', 'Task finished', `${task.title} · +20 beans`)
      },
      restoreTask: (task) => commit([{ table: 'tasks', upserts: [{ ...stripLogs(task), finished_at: null }], deletes: [] }]),
      deleteTask: (task) =>
        commit([
          { table: 'task_logs', upserts: [], deletes: task.logs.map((l) => l.id) },
          { table: 'tasks', upserts: [], deletes: [task.id] },
        ]),
      giveFeedback: (task, feedback) =>
        commit([
          {
            table: 'tasks',
            upserts: [{ ...stripLogs(task), estimated_minutes: difficultyMinutes(task.estimated_minutes, feedback), difficulty_feedback: feedback }],
            deletes: [],
          },
        ]),
      saveHabit: (row) => commit([{ table: 'habits', upserts: [stripLogs(row)], deletes: [] }]),
      deleteHabit: (habit) =>
        commit([
          { table: 'habit_logs', upserts: [], deletes: habit.logs.map((l) => l.id) },
          { table: 'habits', upserts: [], deletes: [habit.id] },
        ]),
      toggleHabitToday: (habit) => {
        const at = new Date()
        const checking = !isHabitCompletedToday(habit, at)
        const change = habitSetCompletedToday(habit, checking, at)
        commit([logChange('habit_logs', change)])
        if (!checking) return
        const before = streakReport(habit, at)
        const removed = new Set(change.deletes)
        const nextLogs = [...habit.logs.filter((l) => !removed.has(l.id) && !change.upserts.some((u) => u.id === l.id)), ...change.upserts]
        const after = streakReport({ ...habit, logs: nextLogs }, at)
        const unit = after.unit === 'days' ? 'day' : 'week'
        if (after.current > before.current && MILESTONES.includes(after.current)) {
          celebrate('🏆', `${after.current}-${unit} streak!`, `${habit.title} · +${milestoneBonus(after.current)} beans`)
        } else if (after.freezes > before.freezes) {
          celebrate('❄️', 'You earned a streak freeze', 'It saves your streak if you miss a day.')
        } else if (after.unit === 'weeks' && after.state.kind === 'done' && before.state.kind !== 'done') {
          celebrate('☕', 'Weekly goal reached', habit.title)
        }
      },
      logMiss: (habit, reason) => commit([logChange('habit_logs', habitLogMissToday(habit, reason, new Date()))]),
      saveExam: (row) => commit([{ table: 'exams', upserts: [row], deletes: [] }]),
      deleteExam: (exam) => commit([{ table: 'exams', upserts: [], deletes: [exam.id] }]),
      saveWindows: (rows) => commit([{ table: 'work_windows', upserts: rows, deletes: [] }]),
      deleteWindow: (w) => commit([{ table: 'work_windows', upserts: [], deletes: [w.id] }]),
    }
  }, [tables, status, now, celebration, commit, reload, celebrate])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}

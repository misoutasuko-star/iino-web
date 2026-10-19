import { isToday } from './dates'
import type { Habit, HabitLogRow, MissReason, Task, TaskLogRow } from './types'

// Check-off rules (03 §3.1–3.2) as pure functions. Each returns the log rows to
// upsert and the log ids to soft-delete, so the data layer stays a thin writer.

export interface LogChange<T> {
  upserts: T[]
  deletes: string[]
}

const newId = () => crypto.randomUUID()

export function taskSetCompletedToday(task: Task, completed: boolean, now = new Date()): LogChange<TaskLogRow> {
  const todays = task.logs.filter((l) => isToday(l.date, now))
  if (!completed) return { upserts: [], deletes: todays.map((l) => l.id) }
  const existing = todays.find((l) => l.completed) ?? todays[0]
  if (existing) {
    const extras = todays.filter((l) => l.id !== existing.id).map((l) => l.id)
    return { upserts: existing.completed ? [] : [{ ...existing, completed: true }], deletes: extras }
  }
  return { upserts: [{ id: newId(), task_id: task.id, date: now.toISOString(), completed: true }], deletes: [] }
}

export function habitSetCompletedToday(habit: Habit, completed: boolean, now = new Date()): LogChange<HabitLogRow> {
  const todays = habit.logs.filter((l) => isToday(l.date, now))
  if (!completed) return { upserts: [], deletes: todays.map((l) => l.id) }
  return reuseToday(habit, todays, { completed: true, miss_reason: null }, now)
}

export function habitLogMissToday(habit: Habit, reason: MissReason, now = new Date()): LogChange<HabitLogRow> {
  const todays = habit.logs.filter((l) => isToday(l.date, now))
  return reuseToday(habit, todays, { completed: false, miss_reason: reason }, now)
}

function reuseToday(
  habit: Habit,
  todays: HabitLogRow[],
  values: Pick<HabitLogRow, 'completed' | 'miss_reason'>,
  now: Date,
): LogChange<HabitLogRow> {
  const [first, ...extras] = todays
  if (first) return { upserts: [{ ...first, ...values }], deletes: extras.map((l) => l.id) }
  return { upserts: [{ id: newId(), habit_id: habit.id, date: now.toISOString(), ...values }], deletes: [] }
}

/** Applies a change to a log list (used by the in-memory store and tests). */
export function applyLogChange<T extends { id: string }>(logs: T[], change: LogChange<T>): T[] {
  const removed = new Set(change.deletes)
  const byId = new Map(logs.filter((l) => !removed.has(l.id)).map((l) => [l.id, l]))
  for (const u of change.upserts) byId.set(u.id, u)
  return [...byId.values()]
}

export function difficultyMinutes(minutes: number, feedback: 'Too Easy' | 'Okay' | 'Too Hard'): number {
  if (feedback === 'Too Easy') return Math.max(10, minutes - 10)
  if (feedback === 'Too Hard') return Math.min(480, minutes + 15)
  return minutes
}

import { isSameDay, startOfDay, weekday } from './dates'
import { durationMinutes, isFinished, isTaskCompletedToday, windowEndOn, windowStartOn } from './models'
import { sortByPriority } from './priority'
import type { CalendarEvent, Exam, Task, WorkWindow } from './types'

// Port of SchedulingEngine.plan. Plans are never stored; they're recomputed every time.

export const BUFFER_MINUTES = 10
export const MINIMUM_BLOCK_MINUTES = 15

export type PlannedBlock =
  | { kind: 'task'; id: string; start: Date; end: Date; task: Task }
  | { kind: 'event'; id: string; start: Date; end: Date; event: CalendarEvent }

export interface PlanWindow {
  start: Date
  end: Date
}

export interface DayPlan {
  day: Date
  blocks: PlannedBlock[]
  unscheduled: Task[]
  windows: PlanWindow[]
  usesDefaultWindow: boolean
  visibleRange: { start: Date; end: Date }
}

const MINUTE = 60_000
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * MINUTE)

/** Rounds up to the next 5-minute mark (unchanged if already on one). */
export function roundedUp(d: Date): Date {
  const step = 5 * MINUTE
  return new Date(Math.ceil(d.getTime() / step) * step)
}

interface Interval {
  start: Date
  end: Date
}

export function nextFreeSlot(start: Date, minutes: number, occupied: Interval[], windowEnd: Date): Interval | null {
  let candidate = start
  for (let i = 0; i < 96; i++) {
    const end = addMinutes(candidate, minutes)
    if (end > windowEnd) return null
    const overlaps = occupied.filter((o) => o.start < end && o.end > candidate)
    if (overlaps.length === 0) return { start: candidate, end }
    candidate = new Date(Math.max(...overlaps.map((o) => o.end.getTime())))
  }
  return null
}

export function plan(opts: {
  tasks: Task[]
  exams: Exam[]
  events?: CalendarEvent[]
  windows: WorkWindow[]
  day: Date
  now?: Date
}): DayPlan {
  const now = opts.now ?? new Date()
  const day = startOfDay(opts.day)
  const events = opts.events ?? []
  const today = isSameDay(day, now)

  let windows: PlanWindow[] = opts.windows
    .filter((w) => w.weekday === weekday(day) && durationMinutes(w) > 0)
    .map((w) => ({ start: windowStartOn(w, day), end: windowEndOn(w, day) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  let usesDefaultWindow = false
  if (windows.length === 0) {
    const start = new Date(day)
    start.setHours(8, 0, 0, 0)
    const end = new Date(day)
    end.setHours(22, 0, 0, 0)
    windows = [{ start, end }]
    usesDefaultWindow = true
  }

  const occupied: Interval[] = events.map((e) => ({ start: e.start, end: e.end }))
  const pending = sortByPriority(
    opts.tasks.filter((t) => !isFinished(t) && (!today || !isTaskCompletedToday(t, now))),
    opts.exams,
    now,
  )
  const earliestStart = today ? roundedUp(now) : day

  const blocks: PlannedBlock[] = []
  const placed = new Set<string>()
  for (const w of windows) {
    let cursor = new Date(Math.max(w.start.getTime(), earliestStart.getTime()))
    for (const task of pending) {
      if (placed.has(task.id)) continue
      if (cursor >= w.end) break
      const minutes = Math.max(task.estimated_minutes, MINIMUM_BLOCK_MINUTES)
      const slot = nextFreeSlot(cursor, minutes, occupied, w.end)
      if (!slot) continue // a shorter task further down might still fit
      blocks.push({ kind: 'task', id: `task-${task.id}`, start: slot.start, end: slot.end, task })
      placed.add(task.id)
      occupied.push({ start: slot.start, end: addMinutes(slot.end, BUFFER_MINUTES) })
      cursor = addMinutes(slot.end, BUFFER_MINUTES)
    }
  }

  for (const e of events) {
    if (e.end > earliestStart) blocks.push({ kind: 'event', id: `event-${e.id}`, start: e.start, end: e.end, event: e })
  }
  blocks.sort((a, b) => a.start.getTime() - b.start.getTime())

  return {
    day,
    blocks,
    unscheduled: pending.filter((t) => !placed.has(t.id)),
    windows,
    usesDefaultWindow,
    visibleRange: visibleRange(day, windows, blocks),
  }
}

function visibleRange(day: Date, windows: PlanWindow[], blocks: PlannedBlock[]) {
  const all = [...windows, ...blocks]
  if (all.length === 0) {
    const s = new Date(day)
    s.setHours(8, 0, 0, 0)
    const e = new Date(day)
    e.setHours(22, 0, 0, 0)
    return { start: s, end: e }
  }
  const start = new Date(Math.min(...all.map((x) => x.start.getTime())))
  start.setMinutes(0, 0, 0)
  const endMs = Math.max(...all.map((x) => x.end.getTime()))
  const end = new Date(endMs)
  if (end.getMinutes() !== 0 || end.getSeconds() !== 0 || end.getMilliseconds() !== 0) {
    end.setHours(end.getHours() + 1, 0, 0, 0)
  }
  if (end.getTime() - start.getTime() < 60 * MINUTE) return { start, end: addMinutes(start, 60) }
  return { start, end }
}

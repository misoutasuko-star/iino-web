import { dayKey, daysFromToday, isInWeekOf, isToday, orderedWeekdays, shortWeekdayName, startOfDay, timeOfDayText, toDate, weekday } from './dates'
import { REST_DAY, type Habit, type HabitLogRow, type Task, type WorkWindow } from './types'

// ---- Tasks ----

export const isFinished = (t: Task) => t.finished_at != null

export const isTaskCompletedToday = (t: Task, now = new Date()) =>
  t.logs.some((l) => l.completed && isToday(l.date, now))

export const totalCompletions = (t: Task) => t.logs.filter((l) => l.completed).length

export const daysUntilDue = (t: Task, now = new Date()) => (t.due_date ? daysFromToday(t.due_date, now) : null)

export const isOverdue = (t: Task, now = new Date()) => {
  const d = daysUntilDue(t, now)
  return !isFinished(t) && d != null && d < 0
}

// ---- Habits ----

export const isWeeklyGoal = (h: Habit) => h.weekly_target > 0

export const isScheduled = (h: Habit, day: Date) => isWeeklyGoal(h) || h.repeat_days.includes(weekday(day))

/** That day's log, preferring a completed one. */
export function habitLogOn(h: Habit, day: Date): HabitLogRow | undefined {
  const key = dayKey(day)
  const logs = h.logs.filter((l) => dayKey(l.date) === key)
  return logs.find((l) => l.completed) ?? logs[0]
}

export const isHabitCompletedToday = (h: Habit, now = new Date()) => habitLogOn(h, now)?.completed === true

export function missedToday(h: Habit, now = new Date()) {
  const log = habitLogOn(h, now)
  return log != null && !log.completed && log.miss_reason !== REST_DAY
}

export const isRestingToday = (h: Habit, now = new Date()) => habitLogOn(h, now)?.miss_reason === REST_DAY

export function canRestToday(h: Habit, now = new Date()) {
  if (isWeeklyGoal(h) || !isScheduled(h, now)) return false
  if (habitLogOn(h, now)) return false
  return !h.logs.some((l) => !l.completed && l.miss_reason === REST_DAY && isInWeekOf(l.date, now))
}

export const completedDayKeys = (h: Habit) => new Set(h.logs.filter((l) => l.completed).map((l) => dayKey(l.date)))

export const restDayKeys = (h: Habit) =>
  new Set(h.logs.filter((l) => !l.completed && l.miss_reason === REST_DAY).map((l) => dayKey(l.date)))

export function trackingStart(h: Habit): Date {
  let earliest = toDate(h.created_at)
  for (const l of h.logs) {
    const d = toDate(l.date)
    if (d < earliest) earliest = d
  }
  return startOfDay(earliest)
}

export function scheduleDescription(h: Habit): string {
  if (isWeeklyGoal(h)) return h.weekly_target === 1 ? 'Once a week' : `${h.weekly_target} times a week`
  const days = [...h.repeat_days].sort()
  if (days.length === 7) return 'Every day'
  if (days.join() === '2,3,4,5,6') return 'Weekdays'
  if (days.join() === '1,7') return 'Weekends'
  return orderedWeekdays()
    .filter((d) => days.includes(d))
    .map(shortWeekdayName)
    .join(', ')
}

export const reminderText = (h: Habit) => timeOfDayText(h.reminder_hour, h.reminder_minute)

// ---- Study windows ----

export const startMinutes = (w: WorkWindow) => w.start_hour * 60 + w.start_minute
export const endMinutes = (w: WorkWindow) => w.end_hour * 60 + w.end_minute
export const durationMinutes = (w: WorkWindow) => Math.max(0, endMinutes(w) - startMinutes(w))
export const windowLabel = (w: WorkWindow) =>
  `${timeOfDayText(w.start_hour, w.start_minute)} – ${timeOfDayText(w.end_hour, w.end_minute)}`

export function windowStartOn(w: WorkWindow, day: Date) {
  const d = startOfDay(day)
  d.setHours(w.start_hour, w.start_minute, 0, 0)
  return d
}

export function windowEndOn(w: WorkWindow, day: Date) {
  const d = startOfDay(day)
  d.setHours(w.end_hour, w.end_minute, 0, 0)
  return d
}

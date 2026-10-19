import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns'

// "Day" is always a local calendar day; "week" uses the chosen first weekday.
// Weekdays are numbered like Apple's calendar: 1 = Sunday … 7 = Saturday.

let weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0

export function setWeekStartsOn(day: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  weekStartsOn = day
}

export function getWeekStartsOn() {
  return weekStartsOn
}

export const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value))

/** Stable key for a local day, e.g. "2026-10-19". */
export const dayKey = (d: Date | string) => format(toDate(d), 'yyyy-MM-dd')

export const weekday = (d: Date) => d.getDay() + 1

export const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn })

/** Whole calendar days from today to `d` (0 = today, negative = past). */
export const daysFromToday = (d: Date | string, now: Date = new Date()) =>
  differenceInCalendarDays(startOfDay(toDate(d)), startOfDay(now))

export const isToday = (d: Date | string, now: Date = new Date()) => isSameDay(toDate(d), now)

export const isInWeekOf = (d: Date | string, ref: Date) => {
  const start = weekStart(ref)
  const date = toDate(d)
  return date >= start && date < addDays(start, 7)
}

/** Local midnight of the given day, as an ISO string for `due_date` / `exam_date`. */
export const localMidnightISO = (d: Date) => startOfDay(d).toISOString()

/** Weekdays (1–7) in the order the week is shown. */
export function orderedWeekdays(): number[] {
  return Array.from({ length: 7 }, (_, i) => ((weekStartsOn + i) % 7) + 1)
}

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VERY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const shortWeekdayName = (wd: number) => SHORT[wd - 1]
export const veryShortWeekdayName = (wd: number) => VERY_SHORT[wd - 1]

export function relativeDayText(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 1) return `in ${days} days`
  return `${-days} days ago`
}

export function durationText(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr, ${m} min`
}

export function timeOfDayText(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export const timeText = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export { addDays, startOfDay, differenceInCalendarDays, isSameDay, format }

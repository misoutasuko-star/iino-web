import { addDays, dayKey, startOfDay, weekStart } from './dates'
import { completedDayKeys, isScheduled, isWeeklyGoal, restDayKeys, trackingStart } from './models'
import { streakReport, type StreakReport } from './streaks'
import { REST_DAY, type Habit, type MissReason, type Task, type TaskCategory } from './types'

export interface HeatDay {
  date: Date
  count: number
  isFuture: boolean
  isToday: boolean
}

/** Last 4 calendar weeks: 28 days starting 3 weeks before this week's start. */
export function heatGrid(tasks: Task[], habits: Habit[], now = new Date()): HeatDay[] {
  const counts = checkInsByDay(tasks, habits)
  const first = addDays(weekStart(now), -21)
  const todayKey = dayKey(now)
  return Array.from({ length: 28 }, (_, i) => {
    const date = addDays(first, i)
    const key = dayKey(date)
    return { date, count: counts.get(key) ?? 0, isFuture: key > todayKey, isToday: key === todayKey }
  })
}

export function checkInsByDay(tasks: Task[], habits: Habit[]): Map<string, number> {
  const counts = new Map<string, number>()
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1)
  for (const t of tasks) for (const l of t.logs) if (l.completed) bump(dayKey(l.date))
  for (const h of habits) for (const k of completedDayKeys(h)) bump(k)
  return counts
}

export type Roast = 'latte' | 'milk' | 'crema' | 'espresso'
export const roast = (count: number): Roast =>
  count === 0 ? 'latte' : count <= 2 ? 'milk' : count <= 4 ? 'crema' : 'espresso'

export function streakBoard(habits: Habit[], now = new Date()): { habit: Habit; report: StreakReport }[] {
  return habits
    .map((habit) => ({ habit, report: streakReport(habit, now) }))
    .sort((a, b) => b.report.current - a.report.current || b.report.longest - a.report.longest)
}

/** Done due days ÷ due days over the last 7 days (null if nothing was due). */
export function lastSevenDayConsistency(h: Habit, now = new Date()): number | null {
  if (isWeeklyGoal(h)) {
    const r = streakReport(h, now)
    return Math.min(r.weekDone, r.weekTarget) / r.weekTarget
  }
  const done = completedDayKeys(h)
  const rest = restDayKeys(h)
  const start = trackingStart(h)
  const today = startOfDay(now)
  let due = 0
  let hit = 0
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i)
    const key = dayKey(day)
    if (day < start || rest.has(key) || !isScheduled(h, day)) continue
    if (i === 0 && !done.has(key)) continue
    due += 1
    if (done.has(key)) hit += 1
  }
  return due === 0 ? null : hit / due
}

export type InsightCard =
  | { kind: 'category'; title: string; message: string; category: TaskCategory }
  | { kind: 'habit'; title: string; message: string; habit: Habit }
  | { kind: 'reason'; title: string; message: string; reason: MissReason }

export function topCategory(tasks: Task[], now = new Date()): { category: TaskCategory; count: number } | null {
  const from = dayKey(addDays(now, -6))
  const to = dayKey(now)
  const counts = new Map<TaskCategory, number>()
  for (const t of tasks) {
    const n = t.logs.filter((l) => l.completed && dayKey(l.date) >= from && dayKey(l.date) <= to).length
    if (n > 0) counts.set(t.category, (counts.get(t.category) ?? 0) + n)
  }
  let best: { category: TaskCategory; count: number } | null = null
  for (const [category, count] of counts) if (!best || count > best.count) best = { category, count }
  return best
}

export function habitNeedingCare(habits: Habit[], now = new Date()): { habit: Habit; consistency: number } | null {
  let best: { habit: Habit; consistency: number } | null = null
  for (const habit of habits) {
    const c = lastSevenDayConsistency(habit, now)
    if (c == null || c >= 0.7) continue
    if (!best || c < best.consistency) best = { habit, consistency: c }
  }
  return best
}

export function missReasonCounts(habits: Habit[]): Map<MissReason, number> {
  const counts = new Map<MissReason, number>()
  for (const h of habits)
    for (const l of h.logs)
      if (!l.completed && l.miss_reason && l.miss_reason !== REST_DAY)
        counts.set(l.miss_reason, (counts.get(l.miss_reason) ?? 0) + 1)
  return counts
}

export function topMissReason(habits: Habit[]): MissReason | null {
  let best: [MissReason, number] | null = null
  for (const entry of missReasonCounts(habits)) if (!best || entry[1] > best[1]) best = entry
  return best?.[0] ?? null
}

export function noticedThisWeek(tasks: Task[], habits: Habit[], now = new Date(), tips: Record<MissReason, string>): InsightCard[] {
  const cards: InsightCard[] = []
  const cat = topCategory(tasks, now)
  if (cat)
    cards.push({
      kind: 'category',
      category: cat.category,
      title: `Most practiced: ${cat.category}`,
      message: `${cat.count} check-in${cat.count === 1 ? '' : 's'} this week. Lovely consistency.`,
    })
  const care = habitNeedingCare(habits, now)
  if (care)
    cards.push({
      kind: 'habit',
      habit: care.habit,
      title: `${care.habit.title} needs some warmth`,
      message: `Done on ${Math.round(care.consistency * 100)}% of its days this week. A smaller version still counts.`,
    })
  const reason = topMissReason(habits)
  if (reason)
    cards.push({ kind: 'reason', reason, title: `Most common reason for missing: ${reason}`, message: tips[reason] })
  return cards
}

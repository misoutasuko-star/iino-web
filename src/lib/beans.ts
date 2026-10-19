import { dayKey, isInWeekOf } from './dates'
import { completedDayKeys, isFinished } from './models'
import { earnedMilestones, streakReport } from './streaks'
import type { Habit, Task } from './types'

export const PER_HABIT_CHECK_IN = 10
export const PER_TASK_CHECK_IN = 5
export const PER_FINISHED_TASK = 20
export const milestoneBonus = (m: number) => m * 5

export const LEVELS: { name: string; beans: number }[] = [
  { name: 'Green Bean', beans: 0 },
  { name: 'Light Roast', beans: 150 },
  { name: 'Medium Roast', beans: 400 },
  { name: 'Dark Roast', beans: 900 },
  { name: 'Espresso', beans: 1800 },
  { name: 'Master Barista', beans: 3500 },
]

export function totalBeans(tasks: Task[], habits: Habit[], now = new Date()): number {
  let total = 0
  for (const t of tasks) {
    total += t.logs.filter((l) => l.completed).length * PER_TASK_CHECK_IN
    if (isFinished(t)) total += PER_FINISHED_TASK
  }
  for (const h of habits) {
    total += completedDayKeys(h).size * PER_HABIT_CHECK_IN
    total += earnedMilestones(streakReport(h, now)).reduce((sum, m) => sum + milestoneBonus(m), 0)
  }
  return total
}

/** Beans earned this calendar week (milestone bonuses not included). */
export function beansThisWeek(tasks: Task[], habits: Habit[], now = new Date()): number {
  let total = 0
  for (const t of tasks) {
    total += t.logs.filter((l) => l.completed && isInWeekOf(l.date, now)).length * PER_TASK_CHECK_IN
  }
  for (const h of habits) {
    const days = new Set(
      h.logs.filter((l) => l.completed && isInWeekOf(l.date, now)).map((l) => dayKey(l.date)),
    )
    total += days.size * PER_HABIT_CHECK_IN
  }
  return total
}

export interface LevelInfo {
  name: string
  floor: number
  next: { name: string; beans: number } | null
  progress: number
}

export function levelFor(beans: number): LevelInfo {
  let index = 0
  LEVELS.forEach((l, i) => {
    if (beans >= l.beans) index = i
  })
  const current = LEVELS[index]
  const next = LEVELS[index + 1] ?? null
  const progress = next ? (beans - current.beans) / (next.beans - current.beans) : 1
  return { name: current.name, floor: current.beans, next, progress }
}

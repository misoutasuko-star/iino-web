import { addDays, dayKey, differenceInCalendarDays, startOfDay, weekStart } from './dates'
import { completedDayKeys, habitLogOn, isScheduled, isWeeklyGoal, restDayKeys, trackingStart } from './models'
import type { Habit } from './types'

// Port of Streaks.swift. These rules must give the same answers as the iPhone app.

export const FREEZE_EVERY = 7
export const MAX_FREEZES = 2
export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365]

export type StreakUnit = 'days' | 'weeks'
export type StreakState =
  | { kind: 'done' }
  | { kind: 'atRisk' }
  | { kind: 'frozen' }
  | { kind: 'ready' }
  | { kind: 'ended'; length: number }
  | { kind: 'resting' }

export interface StreakReport {
  current: number
  longest: number
  unit: StreakUnit
  state: StreakState
  freezes: number
  frozenDays: Set<string>
  missedDays: Set<string>
  weekDone: number
  weekTarget: number
}

export function streakReport(habit: Habit, now: Date = new Date()): StreakReport {
  return isWeeklyGoal(habit) ? weeklyReport(habit, now) : dailyReport(habit, now)
}

function dailyReport(habit: Habit, now: Date): StreakReport {
  const done = completedDayKeys(habit)
  const rest = restDayKeys(habit)
  const today = startOfDay(now)
  const frozenDays = new Set<string>()
  const missedDays = new Set<string>()
  let run = 0
  let sinceEarned = 0
  let freezes = 0
  let longest = 0
  // Assigned inside miss(); typed loosely so TS doesn't narrow it to null.
  let lastEnded = null as { length: number; day: Date } | null

  const complete = () => {
    run += 1
    sinceEarned += 1
    longest = Math.max(longest, run)
    if (sinceEarned === FREEZE_EVERY) {
      freezes = Math.min(MAX_FREEZES, freezes + 1)
      sinceEarned = 0
    }
  }

  const miss = (day: Date): boolean => {
    if (run > 0 && freezes > 0) {
      freezes -= 1
      frozenDays.add(dayKey(day))
      return true
    }
    if (run > 0) lastEnded = { length: run, day }
    missedDays.add(dayKey(day))
    run = 0
    sinceEarned = 0
    return false
  }

  for (let day = trackingStart(habit); day < today; day = addDays(day, 1)) {
    const key = dayKey(day)
    if (isScheduled(habit, day) && !rest.has(key)) {
      if (done.has(key)) complete()
      else miss(day)
    }
  }

  const todayKey = dayKey(today)
  const ended = lastEnded as { length: number; day: Date } | null
  let state: StreakState
  if (!isScheduled(habit, today) || rest.has(todayKey)) {
    state = { kind: 'resting' }
  } else if (done.has(todayKey)) {
    complete()
    state = { kind: 'done' }
  } else if (habitLogOn(habit, today)) {
    const before = run
    state = miss(today) ? { kind: 'frozen' } : { kind: 'ended', length: before }
  } else if (run > 0) {
    state = { kind: 'atRisk' }
  } else if (ended && differenceInCalendarDays(today, ended.day) <= 3) {
    state = { kind: 'ended', length: ended.length }
  } else {
    state = { kind: 'ready' }
  }
  if (state.kind === 'ended' && state.length === 0) state = { kind: 'ready' }

  return {
    current: run,
    longest,
    unit: 'days',
    state,
    freezes,
    frozenDays,
    missedDays,
    weekDone: 0,
    weekTarget: 0,
  }
}

function weeklyReport(habit: Habit, now: Date): StreakReport {
  const target = habit.weekly_target
  const doneDays = [...completedDayKeys(habit)]
  const firstWeek = weekStart(trackingStart(habit))
  const thisWeek = weekStart(now)
  const count = (week: Date) => {
    const from = dayKey(week)
    const to = dayKey(addDays(week, 7))
    return doneDays.filter((k) => k >= from && k < to).length
  }

  let run = 0
  let longest = 0
  let endedLastWeek: number | null = null
  for (let week = firstWeek; week < thisWeek; week = weekStart(addDays(week, 7))) {
    endedLastWeek = null
    if (count(week) >= target) {
      run += 1
      longest = Math.max(longest, run)
    } else if (week.getTime() !== firstWeek.getTime()) {
      if (run > 0) endedLastWeek = run
      run = 0
    }
  }

  const weekDone = count(thisWeek)
  let state: StreakState
  if (weekDone >= target) {
    run += 1
    longest = Math.max(longest, run)
    state = { kind: 'done' }
  } else if (run > 0) {
    state = { kind: 'atRisk' }
  } else if (endedLastWeek) {
    state = { kind: 'ended', length: endedLastWeek }
  } else {
    state = { kind: 'ready' }
  }

  return {
    current: run,
    longest,
    unit: 'weeks',
    state,
    freezes: 0,
    frozenDays: new Set(),
    missedDays: new Set(),
    weekDone,
    weekTarget: target,
  }
}

export const nextMilestone = (r: StreakReport) => MILESTONES.find((m) => m > r.current) ?? null

export const earnedMilestones = (r: StreakReport) => MILESTONES.filter((m) => m <= r.longest)

export function milestoneProgress(r: StreakReport): number {
  const next = nextMilestone(r)
  if (next == null) return 1
  const previous = [...MILESTONES].reverse().find((m) => m <= r.current) ?? 0
  return (r.current - previous) / (next - previous)
}

export function unitLabel(r: StreakReport, count: number): string {
  if (r.unit === 'days') return count === 1 ? 'day' : 'days'
  return count === 1 ? 'week' : 'weeks'
}

export function streakMessage(r: StreakReport): string {
  const weekly = r.unit === 'weeks'
  switch (r.state.kind) {
    case 'done':
      return weekly ? "This week's goal is done. The cup is full." : 'Done for today. The cup is full.'
    case 'atRisk':
      return weekly
        ? `${r.weekDone} of ${r.weekTarget} this week. Keep it brewing.`
        : 'Still open today. Keep your streak warm before midnight.'
    case 'frozen':
      return 'A freeze saved your streak today.'
    case 'ready':
      return weekly ? `${r.weekDone} of ${r.weekTarget} this week.` : 'Start a streak today.'
    case 'ended':
      return `Your ${r.state.length}-${weekly ? 'week' : 'day'} streak ended. Start fresh today.`
    case 'resting':
      return 'Resting today. Your streak is safe.'
  }
}


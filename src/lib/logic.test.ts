import { describe, expect, it } from 'vitest'
import { addDays, setWeekStartsOn, startOfDay } from './dates'
import { applyLogChange, habitLogMissToday, habitSetCompletedToday, taskSetCompletedToday } from './actions'
import { beansThisWeek, levelFor, totalBeans } from './beans'
import { canRestToday, isHabitCompletedToday, isTaskCompletedToday } from './models'
import { plan } from './planner'
import { boostingExam, priorityScore, sortByPriority } from './priority'
import { streakReport } from './streaks'
import type { Exam, Habit, MissReason, Task, WorkWindow } from './types'

// Ports of the iOS tests in iinosTests.swift, plus a few extra edge cases.
// "now" is Monday 19 October 2026, midday, America/New_York (see vite.config.ts).
const NOW = new Date(2026, 9, 19, 12, 0)
const day = (offset: number, hour = 10) => {
  const d = addDays(startOfDay(NOW), offset)
  d.setHours(hour)
  return d
}

let seq = 0
const id = () => `id-${++seq}`

function habit(opts: Partial<Habit> & { done?: number[]; misses?: [number, MissReason][]; createdOffset?: number } = {}): Habit {
  const h: Habit = {
    id: id(),
    title: 'Read',
    category: 'Health',
    repeat_days: [1, 2, 3, 4, 5, 6, 7],
    reminder_hour: 20,
    reminder_minute: 0,
    reminders_enabled: true,
    weekly_target: 0,
    created_at: day(opts.createdOffset ?? 0, 0).toISOString(),
    logs: [],
    ...opts,
  }
  for (const o of opts.done ?? []) h.logs.push({ id: id(), habit_id: h.id, date: day(o).toISOString(), completed: true, miss_reason: null })
  for (const [o, r] of opts.misses ?? []) h.logs.push({ id: id(), habit_id: h.id, date: day(o).toISOString(), completed: false, miss_reason: r })
  return h
}

function task(opts: Partial<Task> & { done?: number[]; dueOffset?: number } = {}): Task {
  const t: Task = {
    id: id(),
    title: 'Revise',
    category: 'Other',
    due_date: opts.dueOffset != null ? startOfDay(day(opts.dueOffset)).toISOString() : null,
    priority: 'Medium',
    estimated_minutes: 30,
    notes: '',
    difficulty_feedback: null,
    created_at: day(-30).toISOString(),
    finished_at: null,
    logs: [],
    ...opts,
  }
  for (const o of opts.done ?? []) t.logs.push({ id: id(), task_id: t.id, date: day(o).toISOString(), completed: true })
  return t
}

const exam = (category: Exam['category'], offset: number): Exam => ({
  id: id(),
  subject: 'Exam',
  category,
  exam_date: startOfDay(day(offset)).toISOString(),
  notes: '',
  created_at: day(-30).toISOString(),
})

describe('daily streaks', () => {
  it('counts consecutive days including today', () => {
    const r = streakReport(habit({ createdOffset: -2, done: [-2, -1, 0] }), NOW)
    expect(r.current).toBe(3)
    expect(r.state.kind).toBe('done')
  })

  it('keeps the streak at risk while today is open', () => {
    const r = streakReport(habit({ createdOffset: -2, done: [-2, -1] }), NOW)
    expect(r.current).toBe(2)
    expect(r.state.kind).toBe('atRisk')
  })

  it('ends the streak after a missed day', () => {
    const r = streakReport(habit({ createdOffset: -4, done: [-4, -3] }), NOW)
    expect(r.current).toBe(0)
    expect(r.state).toEqual({ kind: 'ended', length: 2 })
    expect(r.longest).toBe(2)
  })

  it('skips days the habit is not due', () => {
    // Mon, Wed, Fri only. Today is Monday.
    const r = streakReport(habit({ repeat_days: [2, 4, 6], createdOffset: -7, done: [-7, -5, -3] }), NOW)
    expect(r.current).toBe(3)
    expect(r.state.kind).toBe('atRisk')
  })

  it('uses a freeze to save a missed day', () => {
    const r = streakReport(habit({ createdOffset: -10, done: [-10, -9, -8, -7, -6, -5, -4, -2, -1] }), NOW)
    expect(r.current).toBe(9)
    expect(r.freezes).toBe(0)
    expect(r.frozenDays.size).toBe(1)
    expect(r.state.kind).toBe('atRisk')
  })

  it('caps freezes at two', () => {
    const done = Array.from({ length: 21 }, (_, i) => -21 + i)
    const r = streakReport(habit({ createdOffset: -21, done }), NOW)
    expect(r.current).toBe(21)
    expect(r.freezes).toBe(2)
  })

  it('does not break the streak on a rest day', () => {
    const r = streakReport(habit({ createdOffset: -3, done: [-3, -2, 0], misses: [[-1, 'Rest Day']] }), NOW)
    expect(r.current).toBe(3)
    expect(r.state.kind).toBe('done')
  })

  it('ends the streak when a miss is logged today and there is no freeze', () => {
    const r = streakReport(habit({ createdOffset: -2, done: [-2, -1], misses: [[0, 'Forgot']] }), NOW)
    expect(r.current).toBe(0)
    expect(r.state).toEqual({ kind: 'ended', length: 2 })
  })

  it('starts a new habit as ready', () => {
    const r = streakReport(habit(), NOW)
    expect(r.current).toBe(0)
    expect(r.state.kind).toBe('ready')
  })
})

describe('weekly streaks', () => {
  it('counts weeks that met the goal', () => {
    // Week starts Sunday; this week started Sun 18 Oct.
    const h = habit({ weekly_target: 2, createdOffset: -22, done: [-22, -20, -15, -13, -8, -6] })
    const r = streakReport(h, NOW)
    expect(r.unit).toBe('weeks')
    expect(r.current).toBe(3)
    expect(r.state.kind).toBe('atRisk')
    expect(r.weekDone).toBe(0)

    h.logs.push({ id: id(), habit_id: h.id, date: day(-1).toISOString(), completed: true, miss_reason: null })
    h.logs.push({ id: id(), habit_id: h.id, date: day(0).toISOString(), completed: true, miss_reason: null })
    const r2 = streakReport(h, NOW)
    expect(r2.current).toBe(4)
    expect(r2.state.kind).toBe('done')
  })

  it('does not end anything on a short first week', () => {
    const r = streakReport(habit({ weekly_target: 3, createdOffset: -2 }), NOW)
    expect(r.state.kind).toBe('ready')
  })
})

describe('check-off', () => {
  it('toggles only today for a task', () => {
    const t = task({ done: [-1] })
    t.logs = applyLogChange(t.logs, taskSetCompletedToday(t, true, NOW))
    expect(t.logs).toHaveLength(2)
    expect(isTaskCompletedToday(t, NOW)).toBe(true)
    t.logs = applyLogChange(t.logs, taskSetCompletedToday(t, false, NOW))
    expect(t.logs).toHaveLength(1)
    expect(isTaskCompletedToday(t, NOW)).toBe(false)
  })

  it('sticks after a quick uncheck and recheck', () => {
    const h = habit()
    for (const v of [true, false, true]) h.logs = applyLogChange(h.logs, habitSetCompletedToday(h, v, NOW))
    expect(h.logs).toHaveLength(1)
    expect(isHabitCompletedToday(h, NOW)).toBe(true)
  })

  it('clears the reason when completing after a miss', () => {
    const h = habit()
    h.logs = applyLogChange(h.logs, habitLogMissToday(h, 'Forgot', NOW))
    h.logs = applyLogChange(h.logs, habitSetCompletedToday(h, true, NOW))
    expect(h.logs).toHaveLength(1)
    expect(h.logs[0]).toMatchObject({ completed: true, miss_reason: null })
  })

  it('allows only one rest day per week', () => {
    const fresh = habit({ createdOffset: -5 })
    expect(canRestToday(fresh, NOW)).toBe(true)
    const rested = habit({ createdOffset: -5, misses: [[-1, 'Rest Day']] }) // Sunday, same week
    expect(canRestToday(rested, NOW)).toBe(false)
  })

  it('does not offer a rest day for weekly goals', () => {
    expect(canRestToday(habit({ weekly_target: 3 }), NOW)).toBe(false)
  })
})

describe('priority and planning', () => {
  it('boosts a same-category task before an upcoming exam', () => {
    const math = task({ category: 'Math' })
    const other = task({ category: 'English' })
    const exams = [exam('Math', 2)]
    expect(boostingExam(math, exams, NOW)).not.toBeNull()
    expect(priorityScore(math, exams, NOW)).toBe(12 + (8 - 2) * 5)
    expect(sortByPriority([other, math], exams, NOW)[0]).toBe(math)
  })

  it('does not boost for a far-away exam', () => {
    const math = task({ category: 'Math' })
    expect(boostingExam(math, [exam('Math', 10)], NOW)).toBeNull()
    expect(priorityScore(math, [exam('Math', 10)], NOW)).toBe(12)
  })

  it('ranks overdue above high priority', () => {
    const overdue = task({ priority: 'Low', dueOffset: -1 })
    const high = task({ priority: 'High' })
    expect(priorityScore(overdue, [], NOW)).toBe(80)
    expect(sortByPriority([high, overdue], [], NOW)[0]).toBe(overdue)
  })

  it('scores due dates on a 14-day scale', () => {
    expect(priorityScore(task({ dueOffset: 0 }), [], NOW)).toBe(70 + 12)
    expect(priorityScore(task({ dueOffset: 20 }), [], NOW)).toBe(12)
  })

  const windows: WorkWindow[] = [{ id: 'w', weekday: 2, start_hour: 16, start_minute: 0, end_hour: 18, end_minute: 0 }]
  const nextMonday = addDays(startOfDay(NOW), 7)
  const at = (h: number, m: number) => {
    const d = new Date(nextMonday)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  }

  it('plans tasks inside the window in priority order', () => {
    const low = task({ priority: 'Low' })
    const high = task({ priority: 'High' })
    const p = plan({ tasks: [low, high], exams: [], windows, day: nextMonday, now: NOW })
    const blocks = p.blocks.filter((b) => b.kind === 'task')
    expect(blocks.map((b) => b.kind === 'task' && b.task.id)).toEqual([high.id, low.id])
    expect(blocks[0].start.getTime()).toBe(at(16, 0))
    expect(blocks[1].start.getTime()).toBe(at(16, 40))
    expect(p.usesDefaultWindow).toBe(false)
  })

  it('avoids calendar events', () => {
    const t = task()
    const events = [{ id: 'e', title: 'Club', start: new Date(at(16, 0)), end: new Date(at(16, 45)) }]
    const p = plan({ tasks: [t], exams: [], windows, events, day: nextMonday, now: NOW })
    const block = p.blocks.find((b) => b.kind === 'task')!
    expect(block.start.getTime()).toBe(at(16, 45))
  })

  it('lists tasks that do not fit', () => {
    const big = task({ estimated_minutes: 180 })
    const p = plan({ tasks: [big], exams: [], windows, day: nextMonday, now: NOW })
    expect(p.unscheduled).toEqual([big])
  })

  it('does not plan finished tasks or tasks done today', () => {
    const finished = task({ finished_at: day(-1).toISOString() })
    const done = task({ done: [0] })
    const open = task()
    const p = plan({ tasks: [finished, done, open], exams: [], windows: [], day: NOW, now: NOW })
    expect(p.usesDefaultWindow).toBe(true)
    const ids = p.blocks.map((b) => b.kind === 'task' && b.task.id)
    expect(ids).toEqual([open.id])
    expect(p.unscheduled).toEqual([])
    expect(p.blocks[0].start.getTime()).toBeGreaterThanOrEqual(NOW.getTime())
  })
})

describe('beans', () => {
  it('earns beans for check-ins, finished tasks and milestones', () => {
    const h = habit({ createdOffset: -2, done: [-2, -1, 0] })
    const t = task({ done: [-1, 0], finished_at: day(0).toISOString() })
    expect(totalBeans([t], [h], NOW)).toBe(3 * 10 + 3 * 5 + 2 * 5 + 20)
    expect(beansThisWeek([t], [h], NOW)).toBe(2 * 10 + 2 * 5) // week started Sunday 18 Oct
  })

  it('computes level progress', () => {
    expect(levelFor(0).name).toBe('Green Bean')
    expect(levelFor(150).name).toBe('Light Roast')
    expect(levelFor(275).progress).toBeCloseTo(0.5)
    const top = levelFor(4000)
    expect(top.name).toBe('Master Barista')
    expect(top.next).toBeNull()
    expect(top.progress).toBe(1)
  })
})

describe('week start', () => {
  it('follows a Monday week start', () => {
    setWeekStartsOn(1)
    try {
      // With Monday starts, Sunday's rest day belongs to last week.
      const h = habit({ createdOffset: -5, misses: [[-1, 'Rest Day']] })
      expect(canRestToday(h, NOW)).toBe(true)
    } finally {
      setWeekStartsOn(0)
    }
  })
})

import { daysFromToday, format, relativeDayText, toDate } from './dates'
import {
  daysUntilDue,
  isFinished,
  isHabitCompletedToday,
  isOverdue,
  isRestingToday,
  isScheduled,
  isTaskCompletedToday,
  isWeeklyGoal,
  missedToday,
  habitLogOn,
} from './models'
import { boostingExam, daysUntilExam, sortByPriority } from './priority'
import { streakReport } from './streaks'
import type { Exam, Habit, Task } from './types'

// Today screen summaries and row text (03 §3.8–3.9).

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h >= 5 && h <= 11) return 'Good morning'
  if (h >= 12 && h <= 17) return 'Good afternoon'
  return 'Good evening'
}

export function brewProgress(tasks: Task[], habits: Habit[], now = new Date()) {
  const active = tasks.filter((t) => !isFinished(t))
  const due = habits.filter((h) => isScheduled(h, now))
  const total = active.length + due.length
  const done = active.filter((t) => isTaskCompletedToday(t, now)).length + due.filter((h) => isHabitCompletedToday(h, now)).length
  return { done, total, progress: total === 0 ? 0 : done / total }
}

export function brewMessage(progress: number): string {
  if (progress <= 0) return 'Just putting the kettle on'
  if (progress < 0.5) return 'Brewing nicely'
  if (progress < 1) return 'Almost a full cup'
  return 'A full cup. Enjoy your day'
}

export function upNext(tasks: Task[], exams: Exam[], now = new Date()): Task | null {
  return sortByPriority(tasks.filter((t) => !isFinished(t) && !isTaskCompletedToday(t, now)), exams, now)[0] ?? null
}

export type Notice =
  | { kind: 'exam'; text: string; exam: Exam }
  | { kind: 'overdue'; text: string; task: Task }
  | { kind: 'streak'; text: string; habit: Habit }

export function todayNotice(tasks: Task[], habits: Habit[], exams: Exam[], now = new Date()): Notice | null {
  const soon = exams
    .filter((e) => {
      const d = daysUntilExam(e, now)
      return d >= 0 && d <= 3
    })
    .sort((a, b) => daysUntilExam(a, now) - daysUntilExam(b, now))[0]
  if (soon) {
    return {
      kind: 'exam',
      exam: soon,
      text: `${soon.subject} ${relativeDayText(daysUntilExam(soon, now))}. ${soon.category} tasks are moved up.`,
    }
  }
  const overdue = sortByPriority(tasks.filter((t) => isOverdue(t, now)), exams, now)
  if (overdue.length > 0) {
    return {
      kind: 'overdue',
      task: overdue[0],
      text: overdue.length === 1 ? `${overdue[0].title} is overdue.` : `${overdue.length} tasks are overdue.`,
    }
  }
  for (const h of habits) {
    if (isWeeklyGoal(h) || !isScheduled(h, now)) continue
    const r = streakReport(h, now)
    if (r.state.kind === 'atRisk' && r.current >= 3)
      return { kind: 'streak', habit: h, text: `Keep your ${r.current}-day ${h.title} streak warm today.` }
  }
  return null
}

export type Tone = 'muted' | 'danger' | 'warning' | 'accent'

export function taskMeta(task: Task, exams: Exam[], now = new Date()): { text: string; tone: Tone }[] {
  if (isFinished(task)) return [{ text: `Finished ${format(toDate(task.finished_at!), 'MMM d')}`, tone: 'muted' }]
  const parts: { text: string; tone: Tone }[] = []
  if (task.priority === 'High') parts.push({ text: 'High priority', tone: 'danger' })
  const d = daysUntilDue(task, now)
  if (d != null && task.due_date) {
    const due = toDate(task.due_date)
    if (d < 0) parts.push({ text: 'Overdue', tone: 'danger' })
    else if (d === 0) parts.push({ text: 'Due today', tone: 'warning' })
    else if (d === 1) parts.push({ text: 'Due tomorrow', tone: 'muted' })
    else if (d <= 6) parts.push({ text: `Due ${format(due, 'EEE')}`, tone: 'muted' })
    else parts.push({ text: `Due ${format(due, 'MMM d')}`, tone: 'muted' })
  }
  const exam = boostingExam(task, exams, now)
  if (exam) {
    const days = daysFromToday(exam.exam_date, now)
    parts.push({ text: `🎓 Exam ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`, tone: 'accent' })
  }
  if (parts.length === 0) parts.push({ text: task.category, tone: 'muted' })
  return parts
}

export function habitSubtitle(h: Habit, now = new Date()): string {
  if (isRestingToday(h, now)) return 'Rest day'
  if (missedToday(h, now)) return `Missed · ${habitLogOn(h, now)?.miss_reason ?? 'Other'}`
  const r = streakReport(h, now)
  if (isWeeklyGoal(h)) return `${r.weekDone} of ${r.weekTarget} this week`
  if (r.state.kind === 'atRisk') return `${r.current}-day streak · still open`
  if (r.current > 0) return `${r.current}-day streak`
  if (r.state.kind === 'ended') return `${r.state.length}-day streak ended`
  return 'Start a streak'
}

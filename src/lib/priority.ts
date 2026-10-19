import { daysFromToday, toDate } from './dates'
import { daysUntilDue, isFinished } from './models'
import type { Exam, Task } from './types'

// Port of PriorityEngine. Used everywhere tasks are listed so all screens agree.

export const EXAM_BOOST_DAYS = 7

const PRIORITY_POINTS = { High: 25, Medium: 12, Low: 0 } as const

export const daysUntilExam = (e: Exam, now = new Date()) => daysFromToday(e.exam_date, now)

/** The nearest same-category exam 0…7 days away, for an unfinished task. */
export function boostingExam(task: Task, exams: Exam[], now = new Date()): Exam | null {
  if (isFinished(task)) return null
  let best: Exam | null = null
  let bestDays = Infinity
  for (const e of exams) {
    if (e.category !== task.category) continue
    const d = daysUntilExam(e, now)
    if (d >= 0 && d <= EXAM_BOOST_DAYS && d < bestDays) {
      best = e
      bestDays = d
    }
  }
  return best
}

export function priorityScore(task: Task, exams: Exam[], now = new Date()): number {
  let score = 0
  const days = daysUntilDue(task, now)
  if (days != null) score += days < 0 ? 80 : (14 - Math.min(days, 14)) * 5
  score += PRIORITY_POINTS[task.priority] ?? 0
  const exam = boostingExam(task, exams, now)
  if (exam) score += (EXAM_BOOST_DAYS + 1 - daysUntilExam(exam, now)) * 5
  return score
}

/** Highest score first; ties go to the older task. */
export function sortByPriority(tasks: Task[], exams: Exam[], now = new Date()): Task[] {
  return tasks
    .map((t) => ({ t, s: priorityScore(t, exams, now) }))
    .sort((a, b) => b.s - a.s || toDate(a.t.created_at).getTime() - toDate(b.t.created_at).getTime())
    .map((x) => x.t)
}

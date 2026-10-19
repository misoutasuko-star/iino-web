// Row shapes match the Supabase tables shared with the iPhone app.
// Enum values are stored as these exact strings — never rename them.

export const CATEGORIES = [
  'Math',
  'Science',
  'English',
  'History',
  'Language',
  'Health',
  'Personal',
  'Project',
  'Other',
] as const
export type TaskCategory = (typeof CATEGORIES)[number]

export const PRIORITIES = ['High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export const DIFFICULTIES = ['Too Easy', 'Okay', 'Too Hard'] as const
export type DifficultyFeedback = (typeof DIFFICULTIES)[number]

export const MISS_REASONS = ['Forgot', 'No Time', 'Too Hard', "Didn't Care", 'Other', 'Rest Day'] as const
export type MissReason = (typeof MISS_REASONS)[number]
export const REST_DAY: MissReason = 'Rest Day'
/** Reasons offered in the "I missed today" sheet (Rest Day is the rest-day marker, not a choice). */
export const MISS_OPTIONS: MissReason[] = ['Forgot', 'No Time', 'Too Hard', "Didn't Care", 'Other']

export interface TaskRow {
  id: string
  user_id?: string
  title: string
  category: TaskCategory
  due_date: string | null
  priority: Priority
  estimated_minutes: number
  notes: string
  difficulty_feedback: DifficultyFeedback | null
  created_at: string
  finished_at: string | null
}

export interface TaskLogRow {
  id: string
  user_id?: string
  task_id: string
  date: string
  completed: boolean
}

export interface HabitRow {
  id: string
  user_id?: string
  title: string
  category: TaskCategory
  repeat_days: number[]
  reminder_hour: number
  reminder_minute: number
  reminders_enabled: boolean
  weekly_target: number
  created_at: string
}

export interface HabitLogRow {
  id: string
  user_id?: string
  habit_id: string
  date: string
  completed: boolean
  miss_reason: MissReason | null
}

export interface ExamRow {
  id: string
  user_id?: string
  subject: string
  category: TaskCategory
  exam_date: string
  notes: string
  created_at: string
}

export interface WorkWindowRow {
  id: string
  user_id?: string
  weekday: number
  start_hour: number
  start_minute: number
  end_hour: number
  end_minute: number
}

/** A task with its (non-deleted) logs attached. */
export interface Task extends TaskRow {
  logs: TaskLogRow[]
}

/** A habit with its (non-deleted) logs attached. */
export interface Habit extends HabitRow {
  logs: HabitLogRow[]
}

export type Exam = ExamRow
export type WorkWindow = WorkWindowRow

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
}

export type TableName = 'tasks' | 'task_logs' | 'habits' | 'habit_logs' | 'exams' | 'work_windows'

export interface Tables {
  tasks: TaskRow[]
  task_logs: TaskLogRow[]
  habits: HabitRow[]
  habit_logs: HabitLogRow[]
  exams: ExamRow[]
  work_windows: WorkWindowRow[]
}

export const TABLES: TableName[] = ['tasks', 'task_logs', 'habits', 'habit_logs', 'exams', 'work_windows']

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  Math: 'function',
  Science: 'atom',
  English: 'book',
  History: 'history',
  Language: 'globe',
  Health: 'walk',
  Personal: 'person',
  Project: 'folder',
  Other: 'grid',
}

export const DIFFICULTY_INFO: Record<DifficultyFeedback, { emoji: string; detail: string }> = {
  'Too Easy': { emoji: '😌', detail: 'Next session will be 10 minutes shorter' },
  Okay: { emoji: '👍', detail: 'Keep the same length' },
  'Too Hard': { emoji: '😮‍💨', detail: 'Next session will be 15 minutes longer' },
}

export const MISS_TIPS: Record<MissReason, string> = {
  Forgot: "Try a reminder at a time you're usually free.",
  'No Time': 'Try a smaller version. Even 5 minutes keeps the habit going.',
  'Too Hard': 'Make it easier for now and build back up.',
  "Didn't Care": 'Check whether this habit still matters to you.',
  Other: 'Notice what got in the way, then adjust the plan.',
  'Rest Day': 'Rest is part of the routine.',
}

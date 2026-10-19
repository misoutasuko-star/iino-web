import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Exam, Habit, Task, WorkWindow } from '../lib/types'

// Every pop-up panel in the app (AppSheet in the iOS code).

export type Sheet =
  | { kind: 'newTask' }
  | { kind: 'editTask'; task: Task }
  | { kind: 'newHabit' }
  | { kind: 'editHabit'; habit: Habit; back?: Sheet }
  | { kind: 'habitDetail'; habitId: string }
  | { kind: 'missReason'; habit: Habit; back?: Sheet }
  | { kind: 'newExam' }
  | { kind: 'editExam'; exam: Exam }
  | { kind: 'focus'; task: Task }
  | { kind: 'feedback'; task: Task }
  | { kind: 'newWindow'; weekday?: number; hour?: number }
  | { kind: 'editWindow'; window: WorkWindow }

interface SheetsValue {
  sheet: Sheet | null
  open(sheet: Sheet): void
  close(): void
}

const SheetsContext = createContext<SheetsValue | null>(null)

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<Sheet | null>(null)
  return <SheetsContext.Provider value={{ sheet, open: setSheet, close: () => setSheet(null) }}>{children}</SheetsContext.Provider>
}

export function useSheets() {
  const ctx = useContext(SheetsContext)
  if (!ctx) throw new Error('useSheets outside SheetsProvider')
  return ctx
}

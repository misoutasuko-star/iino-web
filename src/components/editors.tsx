import { useState } from 'react'
import { useStore } from '../data/store'
import { addDays, durationText, format, localMidnightISO, orderedWeekdays, shortWeekdayName, toDate } from '../lib/dates'
import { isFinished } from '../lib/models'
import { MISS_OPTIONS, PRIORITIES, type Exam, type Habit, type HabitRow, type Priority, type Task, type TaskCategory, type WorkWindow } from '../lib/types'
import { CategoryPicker, DayChips, Field, Modal, Segmented, Stepper, Toggle } from './ui'

// Editors work on a draft; nothing is saved until Add/Save (04 §4.8).

const SaveButton = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <button onClick={onClick} disabled={disabled} className="font-serif font-semibold text-primary disabled:opacity-40">
    {label}
  </button>
)
const CancelButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="text-muted">
    Cancel
  </button>
)

const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd')
const fromInputDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toInputTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
const fromInputTime = (s: string) => s.split(':').map(Number) as [number, number]

function ConfirmDelete({ label, question, detail, onConfirm }: { label: string; question: string; detail: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false)
  if (!asking)
    return (
      <button onClick={() => setAsking(true)} className="card w-full p-4 text-center font-medium text-danger">
        {label}
      </button>
    )
  return (
    <div className="card space-y-3 p-4 text-center">
      <p className="font-semibold">{question}</p>
      <p className="text-sm text-muted">{detail}</p>
      <div className="flex gap-2">
        <button onClick={() => setAsking(false)} className="flex-1 rounded-full bg-fill py-2.5">
          Keep
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-full bg-danger py-2.5 font-semibold text-card">
          Delete
        </button>
      </div>
    </div>
  )
}

export function TaskEditor({ task, onClose }: { task?: Task; onClose: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState(task?.title ?? '')
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? 'Other')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium')
  const [minutes, setMinutes] = useState(task?.estimated_minutes ?? 30)
  const [hasDue, setHasDue] = useState(task?.due_date != null)
  const [due, setDue] = useState(toInputDate(task?.due_date ? toDate(task.due_date) : addDays(new Date(), 1)))
  const [notes, setNotes] = useState(task?.notes ?? '')
  const valid = title.trim().length > 0

  const save = () => {
    if (!valid) return
    store.saveTask({
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      category,
      priority,
      estimated_minutes: minutes,
      due_date: hasDue ? localMidnightISO(fromInputDate(due)) : null,
      notes,
      difficulty_feedback: task?.difficulty_feedback ?? null,
      created_at: task?.created_at ?? new Date().toISOString(),
      finished_at: task?.finished_at ?? null,
    })
    onClose()
  }

  return (
    <Modal
      title={task ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      leading={<CancelButton onClick={onClose} />}
      trailing={<SaveButton label={task ? 'Save' : 'Add'} disabled={!valid} onClick={save} />}
    >
      <div className="space-y-6">
        <Field footer={task ? undefined : 'Tasks come back each day. Check them off whenever you work on them, and mark them finished when they’re done.'}>
          <textarea
            autoFocus={!task}
            rows={2}
            className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted/70"
            placeholder="What do you want to work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), save())}
          />
        </Field>
        <Field label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </Field>
        <Field label="Priority" footer="Time per session sets how long focus sessions and planned blocks are.">
          <Segmented value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
          <div className="pt-1">
            <div className="mb-1 text-sm text-muted">Time per session</div>
            <Stepper value={minutes} min={5} max={480} step={5} onChange={setMinutes} format={durationText} />
          </div>
        </Field>
        <Field>
          <Toggle label="Due date" checked={hasDue} onChange={setHasDue} />
          {hasDue && <input type="date" className="input" value={due} onChange={(e) => e.target.value && setDue(e.target.value)} />}
        </Field>
        <Field label="Notes">
          <textarea rows={3} className="w-full resize-none bg-transparent outline-none placeholder:text-muted/70" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {task && (
          <div className="space-y-3">
            <button
              onClick={() => {
                if (isFinished(task)) store.restoreTask(task)
                else store.finishTask(task)
                onClose()
              }}
              className="card w-full p-4 text-center font-medium text-success"
            >
              {isFinished(task) ? 'Move back to active' : 'Mark as finished'}
            </button>
            <ConfirmDelete
              label="Delete task"
              question="Delete this task?"
              detail="Its history will be removed too."
              onConfirm={() => {
                store.deleteTask(task)
                onClose()
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

export function HabitEditor({ habit, onClose, onDelete }: { habit?: Habit; onClose: () => void; onDelete?: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState(habit?.title ?? '')
  const [category, setCategory] = useState<TaskCategory>(habit?.category ?? 'Health')
  const [mode, setMode] = useState<'days' | 'weekly'>(habit && habit.weekly_target > 0 ? 'weekly' : 'days')
  const [days, setDays] = useState<number[]>(habit?.repeat_days ?? [1, 2, 3, 4, 5, 6, 7])
  const [target, setTarget] = useState(habit && habit.weekly_target > 0 ? habit.weekly_target : 3)
  const [reminders, setReminders] = useState(habit?.reminders_enabled ?? true)
  const [time, setTime] = useState(toInputTime(habit?.reminder_hour ?? 20, habit?.reminder_minute ?? 0))
  const valid = title.trim().length > 0 && (mode === 'weekly' || days.length > 0)

  const save = () => {
    if (!valid) return
    const [h, m] = fromInputTime(time)
    const row: HabitRow = {
      id: habit?.id ?? crypto.randomUUID(),
      title: title.trim(),
      category,
      repeat_days: mode === 'days' ? [...days].sort() : habit?.repeat_days?.length ? habit.repeat_days : [1, 2, 3, 4, 5, 6, 7],
      weekly_target: mode === 'weekly' ? target : 0,
      reminders_enabled: reminders,
      reminder_hour: h,
      reminder_minute: m,
      created_at: habit?.created_at ?? new Date().toISOString(),
    }
    store.saveHabit(row)
    onClose()
  }

  return (
    <Modal
      title={habit ? 'Edit Habit' : 'New Habit'}
      onClose={onClose}
      leading={<CancelButton onClick={onClose} />}
      trailing={<SaveButton label={habit ? 'Save' : 'Add'} disabled={!valid} onClick={save} />}
    >
      <div className="space-y-6">
        <Field>
          <input autoFocus={!habit} className="w-full bg-transparent text-lg outline-none placeholder:text-muted/70" placeholder="e.g. Work out for 30 minutes" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        </Field>
        <Field label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </Field>
        <Field
          label="How often"
          footer={
            mode === 'weekly'
              ? 'Any days you like. The streak counts the weeks you reach your goal.'
              : days.length === 0
                ? 'Pick at least one day.'
                : 'Every picked day counts toward your streak. Other days are off.'
          }
        >
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'days', label: 'On set days' },
              { value: 'weekly', label: 'Times a week' },
            ]}
          />
          {mode === 'days' ? (
            <DayChips selected={days} onChange={setDays} />
          ) : (
            <Stepper value={target} min={1} max={7} step={1} onChange={setTarget} format={(v) => (v === 1 ? 'Once a week' : `${v} times a week`)} />
          )}
        </Field>
        <Field label="Reminder" footer="Reminders come from the iPhone app. Not once you’ve checked it off. A nudge at 9:30 PM if a streak of 3+ is still open.">
          <Toggle label="Remind me" checked={reminders} onChange={setReminders} />
          {reminders && <input type="time" className="input" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />}
        </Field>
        {habit && (
          <ConfirmDelete
            label="Delete habit"
            question="Delete this habit?"
            detail="Its streak and history will be removed too."
            onConfirm={() => {
              store.deleteHabit(habit)
              onDelete?.()
              onClose()
            }}
          />
        )}
      </div>
    </Modal>
  )
}

export function ExamEditor({ exam, onClose }: { exam?: Exam; onClose: () => void }) {
  const store = useStore()
  const [subject, setSubject] = useState(exam?.subject ?? '')
  const [category, setCategory] = useState<TaskCategory>(exam?.category ?? 'Math')
  const [date, setDate] = useState(toInputDate(exam ? toDate(exam.exam_date) : addDays(new Date(), 7)))
  const [notes, setNotes] = useState(exam?.notes ?? '')
  const valid = subject.trim().length > 0

  const save = () => {
    if (!valid) return
    store.saveExam({
      id: exam?.id ?? crypto.randomUUID(),
      subject: subject.trim(),
      category,
      exam_date: localMidnightISO(fromInputDate(date)),
      notes,
      created_at: exam?.created_at ?? new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal
      title={exam ? 'Edit Exam' : 'New Exam'}
      onClose={onClose}
      leading={<CancelButton onClick={onClose} />}
      trailing={<SaveButton label={exam ? 'Save' : 'Add'} disabled={!valid} onClick={save} />}
    >
      <div className="space-y-6">
        <Field>
          <input autoFocus={!exam} className="w-full bg-transparent text-lg outline-none placeholder:text-muted/70" placeholder="e.g. Biology midterm" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </Field>
        <Field
          label="Date"
          footer={`During the 7 days before the exam, your ${category} tasks move up your list and get time in your plan first. You’ll get a reminder 3 days and 1 day ahead.`}
        >
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea rows={3} className="w-full resize-none bg-transparent outline-none placeholder:text-muted/70" placeholder="Topics, room, what to bring…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {exam && (
          <ConfirmDelete
            label="Delete exam"
            question="Delete this exam?"
            detail="Tasks in this category won't be boosted anymore."
            onConfirm={() => {
              store.deleteExam(exam)
              onClose()
            }}
          />
        )}
      </div>
    </Modal>
  )
}

export function WindowEditor({ window: w, weekday, hour, onClose }: { window?: WorkWindow; weekday?: number; hour?: number; onClose: () => void }) {
  const store = useStore()
  const startHour = w?.start_hour ?? hour ?? 16
  const [days, setDays] = useState<number[]>(w ? [w.weekday] : [weekday ?? new Date().getDay() + 1])
  const [start, setStart] = useState(toInputTime(startHour, w?.start_minute ?? 0))
  const [end, setEnd] = useState(toInputTime(w?.end_hour ?? Math.min(23, startHour + 2), w?.end_minute ?? (startHour + 2 > 23 ? 59 : 0)))
  const [sh, sm] = fromInputTime(start)
  const [eh, em] = fromInputTime(end)
  const length = eh * 60 + em - (sh * 60 + sm)
  const valid = length > 0 && days.length > 0

  const save = () => {
    if (!valid) return
    if (w) store.saveWindows([{ ...w, weekday: days[0], start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em }])
    else
      store.saveWindows(
        days.map((d) => ({ id: crypto.randomUUID(), weekday: d, start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em })),
      )
    onClose()
  }

  return (
    <Modal
      title={w ? 'Edit Study Time' : 'Add Study Time'}
      onClose={onClose}
      leading={<CancelButton onClick={onClose} />}
      trailing={<SaveButton label={w ? 'Save' : 'Add'} disabled={!valid} onClick={save} />}
    >
      <div className="space-y-6">
        <Field label={w ? 'Day' : 'Days'}>
          {w ? (
            <select className="input" value={days[0]} onChange={(e) => setDays([Number(e.target.value)])}>
              {orderedWeekdays().map((d) => (
                <option key={d} value={d}>
                  {shortWeekdayName(d)}
                </option>
              ))}
            </select>
          ) : (
            <DayChips selected={days} onChange={setDays} />
          )}
        </Field>
        <Field label="Time" footer={length > 0 ? `Length ${durationText(length)}` : 'End must be after start'}>
          <label className="flex items-center justify-between gap-4">
            Start
            <input type="time" className="input max-w-40" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
          </label>
          <label className="flex items-center justify-between gap-4">
            End
            <input type="time" className="input max-w-40" value={end} onChange={(e) => e.target.value && setEnd(e.target.value)} />
          </label>
        </Field>
        {w && (
          <ConfirmDelete
            label="Delete study window"
            question="Delete this study window?"
            detail="Your plan will stop using this time."
            onConfirm={() => {
              store.deleteWindow(w)
              onClose()
            }}
          />
        )}
      </div>
    </Modal>
  )
}

export function MissReasonSheet({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const store = useStore()
  return (
    <Modal title="Missed today" onClose={onClose}>
      <div className="space-y-3">
        <p className="px-1 text-center font-serif text-lg">What got in the way of “{habit.title}”?</p>
        <div className="card divide-y divide-line/70 overflow-hidden">
          {MISS_OPTIONS.map((r) => (
            <button
              key={r}
              className="block w-full px-4 py-3.5 text-left hover:bg-fill/60"
              onClick={() => {
                store.logMiss(habit, r)
                onClose()
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="px-1 text-sm text-muted">Owning a miss helps you spot patterns in Insights. If you have a freeze, it will save your streak.</p>
      </div>
    </Modal>
  )
}


import { ChevronDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CoffeeCup } from '../components/CoffeeArt'
import { RowMenu } from '../components/RowMenu'
import { TaskRow } from '../components/rows'
import { useSheets } from '../components/sheets'
import { CardStack, CircleIcon, EmptyState, SectionHeader, Segmented, categoryColor, tint } from '../components/ui'
import { useStore } from '../data/store'
import { addDays, format, toDate } from '../lib/dates'
import { isFinished, isTaskCompletedToday } from '../lib/models'
import { daysUntilExam, EXAM_BOOST_DAYS, sortByPriority } from '../lib/priority'
import type { Exam, Task } from '../lib/types'

export function Tasks() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('view') === 'exams' ? 'exams' : 'tasks'
  const sheets = useSheets()
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-semibold">{mode === 'tasks' ? 'Tasks' : 'Exams'}</h1>
        <CircleIcon label={mode === 'tasks' ? 'New task' : 'New exam'} onClick={() => sheets.open({ kind: mode === 'tasks' ? 'newTask' : 'newExam' })}>
          <Plus size={20} />
        </CircleIcon>
      </header>
      <Segmented
        value={mode}
        onChange={(v) => setParams(v === 'exams' ? { view: 'exams' } : {})}
        options={[
          { value: 'tasks', label: 'Tasks' },
          { value: 'exams', label: 'Exams' },
        ]}
      />
      {mode === 'tasks' ? <TaskSections /> : <ExamSections />}
    </div>
  )
}

function TaskSections() {
  const store = useStore()
  const sheets = useSheets()
  const { tasks, exams, now } = store
  const [showFinished, setShowFinished] = useState(false)
  const active = useMemo(() => sortByPriority(tasks.filter((t) => !isFinished(t)), exams, now), [tasks, exams, now])
  const todo = active.filter((t) => !isTaskCompletedToday(t, now))
  const done = active.filter((t) => isTaskCompletedToday(t, now))
  const finished = tasks.filter(isFinished).sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))

  if (tasks.length === 0)
    return (
      <EmptyState
        cup={<CoffeeCup progress={0} size={84} muted />}
        title="No tasks yet"
        message="Tasks come back each day until you mark them finished. Great for ongoing work like revision or a project."
        action="Add a task"
        onAction={() => sheets.open({ kind: 'newTask' })}
      />
    )

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      exams={exams}
      now={now}
      onToggle={isFinished(t) ? undefined : () => store.setTaskDoneToday(t, !isTaskCompletedToday(t, now))}
      onOpen={() => sheets.open({ kind: 'editTask', task: t })}
      actions={
        <RowMenu
          items={[
            { label: 'Focus', tone: 'accent', onClick: () => sheets.open({ kind: 'focus', task: t }), hidden: isFinished(t) },
            { label: 'Finish', tone: 'success', onClick: () => store.finishTask(t), hidden: isFinished(t) },
            { label: 'Restore', onClick: () => store.restoreTask(t), hidden: !isFinished(t) },
            { label: 'Delete', tone: 'danger', onClick: () => store.deleteTask(t) },
          ]}
        />
      }
    />
  )

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader>To do today</SectionHeader>
        <CardStack>
          {todo.length === 0 ? <div className="py-3 text-muted">Everything’s checked off for today.</div> : todo.map(row)}
        </CardStack>
        <p className="mt-2 px-1 text-sm text-muted">Use the ⋯ menu to finish a task for good or start a focus session.</p>
      </section>
      {done.length > 0 && (
        <section>
          <SectionHeader>Done today</SectionHeader>
          <CardStack>{done.map(row)}</CardStack>
        </section>
      )}
      {finished.length > 0 && (
        <section>
          <button className="mb-2 flex items-center gap-1 px-1" onClick={() => setShowFinished((s) => !s)}>
            <span className="section-header">Finished · {finished.length}</span>
            <ChevronDown size={14} className={`text-muted transition-transform ${showFinished ? 'rotate-180' : ''}`} />
          </button>
          {showFinished && <CardStack>{finished.map(row)}</CardStack>}
        </section>
      )}
    </div>
  )
}

function ExamSections() {
  const store = useStore()
  const sheets = useSheets()
  const { exams, now } = store
  const upcoming = exams.filter((e) => daysUntilExam(e, now) >= 0).sort((a, b) => a.exam_date.localeCompare(b.exam_date))
  const past = exams.filter((e) => daysUntilExam(e, now) < 0).sort((a, b) => b.exam_date.localeCompare(a.exam_date))

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="font-serif text-lg font-semibold">How exams help</div>
        <p className="mt-1 text-muted">
          During the 7 days before an exam, tasks in the same category move up your list and get more time in your plan. You’ll also get a reminder 3 days and 1 day ahead.
        </p>
      </div>
      {exams.length === 0 && (
        <EmptyState
          cup={<CoffeeCup progress={0} size={84} muted />}
          title="No exams yet"
          message="Add your next exam to get your study tasks lined up in time."
          action="Add an exam"
          onAction={() => sheets.open({ kind: 'newExam' })}
        />
      )}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader>Upcoming</SectionHeader>
          <CardStack>
            {upcoming.map((e) => (
              <ExamRow key={e.id} exam={e} />
            ))}
          </CardStack>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <SectionHeader>Past</SectionHeader>
          <CardStack>
            {past.map((e) => (
              <ExamRow key={e.id} exam={e} />
            ))}
          </CardStack>
        </section>
      )}
    </div>
  )

  function ExamRow({ exam }: { exam: Exam }) {
    const days = daysUntilExam(exam, now)
    const date = toDate(exam.exam_date)
    const color = categoryColor(exam.category)
    const related = store.tasks.filter((t) => !isFinished(t) && t.category === exam.category).length
    let detail: string
    if (days < 0) detail = exam.category
    else if (related === 0) detail = `No ${exam.category} tasks yet. Add one to prepare.`
    else if (days <= EXAM_BOOST_DAYS) detail = `Boosting ${related} ${exam.category} task${related === 1 ? '' : 's'}`
    else detail = `Boosts ${related} ${exam.category} task${related === 1 ? '' : 's'} from ${format(addDays(date, -EXAM_BOOST_DAYS), 'MMM d')}`
    const relative = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days > 1 ? `In ${days} Days` : `${-days} Days Ago`
    return (
      <div className="flex items-center gap-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => sheets.open({ kind: 'editExam', exam })}>
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl leading-tight" style={{ background: tint(color, 14), color }}>
            <div className="text-center">
              <div className="font-serif text-lg font-bold">{format(date, 'd')}</div>
              <div className="text-[10px] font-semibold uppercase">{format(date, 'MMM')}</div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate">{exam.subject}</div>
            <div className="truncate text-[0.8125rem] text-muted">{detail}</div>
          </div>
          <div className={`text-sm font-medium ${days >= 0 && days <= 3 ? 'text-warning' : 'text-muted'}`}>{relative}</div>
        </button>
        <RowMenu items={[{ label: 'Delete', tone: 'danger', onClick: () => store.deleteExam(exam) }]} />
      </div>
    )
  }
}

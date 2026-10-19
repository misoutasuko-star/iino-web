import { ChevronDown, ChevronRight, Flame, GraduationCap, Play, Plus, Settings, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bean, CoffeeCup } from '../components/CoffeeArt'
import { DayBar, HabitRow, TaskRow } from '../components/rows'
import { useSheets } from '../components/sheets'
import { CardStack, CircleIcon, EmptyState, NoticeBanner, SectionHeader, BeansBadge, categoryColor } from '../components/ui'
import { useStore } from '../data/store'
import { totalBeans } from '../lib/beans'
import { format } from '../lib/dates'
import { isFinished, isScheduled, isTaskCompletedToday } from '../lib/models'
import { plan } from '../lib/planner'
import { sortByPriority } from '../lib/priority'
import { brewMessage, brewProgress, greeting, todayNotice, upNext } from '../lib/summaries'

export function AddMenu() {
  const sheets = useSheets()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <CircleIcon label="Add" onClick={() => setOpen((o) => !o)}>
        <Plus size={20} />
      </CircleIcon>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-30 mt-2 w-44 overflow-hidden py-1">
            {(
              [
                ['New Task', 'newTask'],
                ['New Habit', 'newHabit'],
                ['New Exam', 'newExam'],
              ] as const
            ).map(([label, kind]) => (
              <button
                key={kind}
                className="block w-full px-4 py-2.5 text-left hover:bg-fill"
                onClick={() => {
                  setOpen(false)
                  sheets.open({ kind })
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function Today() {
  const store = useStore()
  const sheets = useSheets()
  const navigate = useNavigate()
  const { tasks, habits, exams, windows, now } = store
  const [showDone, setShowDone] = useState(false)

  const active = useMemo(() => sortByPriority(tasks.filter((t) => !isFinished(t)), exams, now), [tasks, exams, now])
  const pending = active.filter((t) => !isTaskCompletedToday(t, now))
  const done = active.filter((t) => isTaskCompletedToday(t, now))
  const todayHabits = habits.filter((h) => isScheduled(h, now))
  const brew = brewProgress(tasks, habits, now)
  const next = upNext(tasks, exams, now)
  const notice = todayNotice(tasks, habits, exams, now)
  const dayPlan = useMemo(() => plan({ tasks, exams, windows, day: now, now }), [tasks, exams, windows, now])
  const beans = totalBeans(tasks, habits, now)
  const empty = active.length === 0 && habits.length === 0

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between">
          <div className="section-header">{format(now, 'EEEE, MMMM d')}</div>
          <div className="flex items-center gap-2">
            <BeansBadge total={beans} onClick={() => navigate('/insights')} />
            <AddMenu />
            <CircleIcon label="Settings" onClick={() => navigate('/settings')}>
              <Settings size={20} />
            </CircleIcon>
          </div>
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold">{greeting(now)}</h1>
      </header>

      {empty ? (
        <EmptyState
          cup={<CoffeeCup progress={0} size={96} steaming />}
          title="A fresh start"
          message="Add a task or a habit and today's brew will start filling up."
          action="Add a task"
          onAction={() => sheets.open({ kind: 'newTask' })}
        />
      ) : (
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <CoffeeCup progress={brew.progress} size={96} steaming={brew.progress >= 1} />
            <div className="min-w-0 flex-1">
              <div className="section-header">Today’s brew</div>
              <div className="mt-0.5 font-serif text-xl font-semibold">{brewMessage(brew.progress)}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {Array.from({ length: Math.min(12, brew.total) }, (_, i) => (
                  <Bean key={i} size={14} filled={i < brew.done} color={i < brew.done ? 'var(--espresso)' : 'var(--milk)'} />
                ))}
                {brew.total > 12 && <span className="ml-1 text-xs text-muted">+{brew.total - 12}</span>}
              </div>
            </div>
          </div>
          {next && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-fill/70 p-3">
              <span className="h-9 w-1 rounded-full" style={{ background: categoryColor(next.category) }} />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted">Up next</div>
                <div className="truncate font-medium">{next.title}</div>
              </div>
              <button className="btn-soft" onClick={() => sheets.open({ kind: 'focus', task: next })}>
                Brew <Play size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {notice && (
        <NoticeBanner
          icon={notice.kind === 'exam' ? <GraduationCap size={20} /> : notice.kind === 'overdue' ? <TriangleAlert size={20} /> : <Flame size={20} />}
          color={notice.kind === 'overdue' ? 'var(--danger)' : notice.kind === 'exam' ? 'var(--warning)' : 'var(--accent)'}
          text={notice.text}
          onClick={() => {
            if (notice.kind === 'exam') sheets.open({ kind: 'editExam', exam: notice.exam })
            else if (notice.kind === 'overdue') sheets.open({ kind: 'editTask', task: notice.task })
            else sheets.open({ kind: 'habitDetail', habitId: notice.habit.id })
          }}
        />
      )}

      {active.length > 0 && (
        <button className="card block w-full p-4 text-left" onClick={() => navigate('/plan')}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-serif text-lg font-semibold">Your day</span>
            <span className="flex items-center text-sm text-muted">
              Open plan <ChevronRight size={16} />
            </span>
          </div>
          <DayBar plan={dayPlan} now={now} />
        </button>
      )}

      {active.length > 0 && (
        <section>
          <SectionHeader
            right={
              done.length > 0 && (
                <button className="flex items-center gap-1 text-sm text-muted" onClick={() => setShowDone((s) => !s)}>
                  Done today <ChevronDown size={14} className={`transition-transform ${showDone ? 'rotate-180' : ''}`} />
                </button>
              )
            }
          >
            Tasks
          </SectionHeader>
          <CardStack>
            {pending.length === 0 && <div className="py-3 text-muted">Everything’s checked off for today.</div>}
            {pending.map((t) => (
              <TaskRow key={t.id} task={t} exams={exams} now={now} onToggle={() => store.setTaskDoneToday(t, true)} onOpen={() => sheets.open({ kind: 'editTask', task: t })} />
            ))}
            {showDone &&
              done.map((t) => (
                <TaskRow key={t.id} task={t} exams={exams} now={now} onToggle={() => store.setTaskDoneToday(t, false)} onOpen={() => sheets.open({ kind: 'editTask', task: t })} />
              ))}
          </CardStack>
        </section>
      )}

      {todayHabits.length > 0 && (
        <section>
          <SectionHeader>Habits</SectionHeader>
          <CardStack>
            {todayHabits.map((h) => (
              <HabitRow key={h.id} habit={h} now={now} onToggle={() => store.toggleHabitToday(h)} onOpen={() => sheets.open({ kind: 'habitDetail', habitId: h.id })} />
            ))}
          </CardStack>
        </section>
      )}
    </div>
  )
}

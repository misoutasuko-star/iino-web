import { Moon } from 'lucide-react'
import { addDays, dayKey, startOfDay, timeText } from '../lib/dates'
import { habitLogOn, isHabitCompletedToday, isRestingToday, isScheduled, isTaskCompletedToday, trackingStart } from '../lib/models'
import type { DayPlan } from '../lib/planner'
import { streakReport } from '../lib/streaks'
import { habitSubtitle, taskMeta, type Tone } from '../lib/summaries'
import type { Exam, Habit, Task } from '../lib/types'
import { Bean, StreakCup } from './CoffeeArt'
import { CheckButton, categoryColor } from './ui'

const toneColor: Record<Tone, string> = {
  muted: 'var(--muted)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  accent: 'var(--accent)',
}

export function TaskRow({
  task,
  exams,
  now,
  onToggle,
  onOpen,
  actions,
}: {
  task: Task
  exams: Exam[]
  now: Date
  onToggle?: () => void
  onOpen: () => void
  actions?: React.ReactNode
}) {
  const done = isTaskCompletedToday(task, now)
  const meta = taskMeta(task, exams, now)
  return (
    <div className="group flex items-center gap-3">
      {onToggle ? <CheckButton checked={done} onToggle={onToggle} label={done ? `Uncheck ${task.title}` : `Check off ${task.title}`} /> : <span className="w-8" />}
      <button onClick={onOpen} className="min-w-0 flex-1 py-1 text-left">
        <div className={`truncate ${done ? 'text-muted line-through decoration-muted/40' : ''}`}>{task.title}</div>
        <div className="truncate text-[0.8125rem]">
          {meta.map((m, i) => (
            <span key={i} style={{ color: toneColor[m.tone] }}>
              {i > 0 && <span className="text-muted"> · </span>}
              {m.text}
            </span>
          ))}
        </div>
      </button>
      {actions}
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: categoryColor(task.category) }} />
    </div>
  )
}

export function HabitRow({ habit, now, onToggle, onOpen }: { habit: Habit; now: Date; onToggle: () => void; onOpen: () => void }) {
  const report = streakReport(habit, now)
  const done = isHabitCompletedToday(habit, now)
  return (
    <div className="flex items-center gap-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <StreakCup report={report} size={40} />
        <div className="min-w-0">
          <div className="truncate">{habit.title}</div>
          <div className="truncate text-[0.8125rem] text-muted">{habitSubtitle(habit, now)}</div>
        </div>
      </button>
      {isRestingToday(habit, now) ? (
        <Moon size={22} className="mx-1 text-muted" aria-label="Rest day" />
      ) : (
        <CheckButton checked={done} onToggle={onToggle} label={done ? `Uncheck ${habit.title}` : `Check off ${habit.title}`} />
      )}
    </div>
  )
}

/** Last 7 days: roasted bean = done, outline = due & missed, dot = not due, ❄️ = frozen. */
export function WeekBeans({ habit, now }: { habit: Habit; now: Date }) {
  const report = streakReport(habit, now)
  const today = startOfDay(now)
  const start = trackingStart(habit)
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => {
        const key = dayKey(d)
        const log = habitLogOn(habit, d)
        let mark: React.ReactNode
        if (log?.completed) mark = <Bean size={14} />
        else if (report.frozenDays.has(key)) mark = <span className="text-[11px]">❄️</span>
        else if (log?.miss_reason === 'Rest Day') mark = <Moon size={12} className="text-muted" />
        else if (d < start) mark = <span className="size-1.5 rounded-full bg-muted/40" />
        else if (isScheduled(habit, d) && (report.missedDays.has(key) || log)) mark = <Bean size={14} filled={false} color="var(--danger)" />
        else if (isScheduled(habit, d)) mark = <Bean size={14} filled={false} color="var(--muted)" />
        else mark = <span className="size-1.5 rounded-full bg-muted/40" />
        return (
          <span key={key} className="grid size-4 place-items-center" title={d.toDateString()}>
            {mark}
          </span>
        )
      })}
    </div>
  )
}

/** A horizontal bar of the day: study windows, task blocks, events and a "now" tick. */
export function DayBar({ plan, now }: { plan: DayPlan; now: Date }) {
  const { start, end } = plan.visibleRange
  const span = end.getTime() - start.getTime()
  const pos = (d: Date) => `${((d.getTime() - start.getTime()) / span) * 100}%`
  const width = (a: Date, b: Date) => `${((b.getTime() - a.getTime()) / span) * 100}%`
  const showNow = now >= start && now <= end
  return (
    <div>
      <div className="relative h-7 overflow-hidden rounded-full bg-fill">
        {plan.windows.map((w, i) => (
          <span key={i} className="absolute inset-y-0 bg-milk/70" style={{ left: pos(w.start), width: width(w.start, w.end) }} />
        ))}
        {plan.blocks.map((b) => (
          <span
            key={b.id}
            className="absolute inset-y-1 rounded-full"
            style={{
              left: pos(b.start),
              width: width(b.start, b.end),
              background: b.kind === 'task' ? categoryColor(b.task.category) : 'var(--muted)',
              opacity: b.kind === 'task' ? 0.85 : 0.45,
            }}
          />
        ))}
        {showNow && <span className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: pos(now) }} />}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
        <span>{timeText(start)}</span>
        {showNow && <span className="text-danger">now</span>}
        <span>{timeText(end)}</span>
      </div>
    </div>
  )
}


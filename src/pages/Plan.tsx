import { Play, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CoffeeCup } from '../components/CoffeeArt'
import { TaskRow } from '../components/rows'
import { useSheets } from '../components/sheets'
import { CardStack, CircleIcon, EmptyState, Modal, SectionHeader, categoryColor, tint } from '../components/ui'
import { useStore } from '../data/store'
import { addDays, dayKey, durationText, format, isSameDay, startOfDay, weekday } from '../lib/dates'
import { isFinished, isTaskCompletedToday, startMinutes, windowLabel } from '../lib/models'
import { plan, type PlannedBlock } from '../lib/planner'
import type { Task } from '../lib/types'

const HOUR_PX = 84

const hourText = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric' })

export function Plan() {
  const store = useStore()
  const sheets = useSheets()
  const navigate = useNavigate()
  const { tasks, exams, windows, now } = store
  const today = startOfDay(now)
  const [selectedKey, setSelectedKey] = useState(dayKey(today))
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const selected = days.find((d) => dayKey(d) === selectedKey) ?? today
  const isTodaySelected = isSameDay(selected, now)
  const [blockAction, setBlockAction] = useState<Task | null>(null)

  // Coming back to the app moves a past selected day forward.
  useEffect(() => {
    if (selectedKey < dayKey(today)) setSelectedKey(dayKey(today))
  }, [selectedKey, today])

  const dayPlan = useMemo(() => plan({ tasks, exams, windows, day: selected, now }), [tasks, exams, windows, selected, now])
  const active = tasks.filter((t) => !isFinished(t))
  const doneToday = active.filter((t) => isTaskCompletedToday(t, now))
  const dayWindows = windows.filter((w) => w.weekday === weekday(selected)).sort((a, b) => startMinutes(a) - startMinutes(b))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-semibold">Plan</h1>
        <CircleIcon label="Refresh" onClick={() => store.reload()}>
          <RefreshCw size={18} />
        </CircleIcon>
      </header>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const on = dayKey(d) === selectedKey
          const hasWindows = windows.some((w) => w.weekday === weekday(d))
          return (
            <button
              key={dayKey(d)}
              onClick={() => setSelectedKey(dayKey(d))}
              className={`flex flex-col items-center rounded-2xl py-2 transition-colors ${on ? 'bg-primary text-on-primary' : 'bg-card text-ink'}`}
            >
              <span className={`text-xs ${on ? '' : 'text-muted'}`}>{i === 0 ? 'Today' : format(d, 'EEE')}</span>
              <span className="font-serif text-lg font-semibold">{format(d, 'd')}</span>
              <span className={`size-1.5 rounded-full ${hasWindows ? (on ? 'bg-on-primary' : 'bg-accent') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-1 text-sm">
        <span className="text-muted">
          {dayWindows.length > 0 ? `Study time ${dayWindows.map(windowLabel).join(', ')}` : 'No study windows set. Planning 8 AM – 10 PM.'}
        </span>
        <button className="btn-soft shrink-0" onClick={() => navigate('/settings#study-windows')}>
          {dayWindows.length > 0 ? 'Edit' : 'Set'}
        </button>
      </div>

      {active.length === 0 ? (
        <EmptyState
          cup={<CoffeeCup progress={0} size={84} muted />}
          title="Nothing brewing yet"
          message="Add a few tasks and iino will fit them into your study time."
          action="Add a task"
          onAction={() => sheets.open({ kind: 'newTask' })}
        />
      ) : (
        <>
          <Timeline blocks={dayPlan.blocks} range={dayPlan.visibleRange} windows={dayPlan.windows} now={now} isToday={isTodaySelected} onTask={setBlockAction} />
          <p className="px-1 text-sm text-muted">
            {isTodaySelected
              ? dayPlan.blocks.length === 0 && dayPlan.unscheduled.length === 0
                ? 'Everything’s done for today. Time to rest.'
                : ''
              : 'A preview using your current tasks. It updates as you check things off.'}
          </p>
          {dayPlan.unscheduled.length > 0 && (
            <section>
              <SectionHeader>Didn’t fit</SectionHeader>
              <CardStack>
                {dayPlan.unscheduled.map((t) => (
                  <TaskRow key={t.id} task={t} exams={exams} now={now} onOpen={() => sheets.open({ kind: 'editTask', task: t })} />
                ))}
              </CardStack>
              <p className="mt-2 px-1 text-sm text-muted">Add more study time in Settings, or shorten the time per session.</p>
            </section>
          )}
          {isTodaySelected && doneToday.length > 0 && (
            <section>
              <SectionHeader>Done today</SectionHeader>
              <CardStack>
                {doneToday.map((t) => (
                  <TaskRow key={t.id} task={t} exams={exams} now={now} onToggle={() => store.setTaskDoneToday(t, false)} onOpen={() => sheets.open({ kind: 'editTask', task: t })} />
                ))}
              </CardStack>
            </section>
          )}
        </>
      )}

      {blockAction && (
        <Modal title={blockAction.title} onClose={() => setBlockAction(null)}>
          <div className="card divide-y divide-line/70 overflow-hidden">
            <button
              className="block w-full px-4 py-3.5 text-left hover:bg-fill/60"
              onClick={() => {
                setBlockAction(null)
                sheets.open({ kind: 'focus', task: blockAction })
              }}
            >
              Start focus session
            </button>
            {!isTaskCompletedToday(blockAction, now) && (
              <button
                className="block w-full px-4 py-3.5 text-left hover:bg-fill/60"
                onClick={() => {
                  store.setTaskDoneToday(blockAction, true)
                  setBlockAction(null)
                }}
              >
                Check off for today
              </button>
            )}
            <button
              className="block w-full px-4 py-3.5 text-left hover:bg-fill/60"
              onClick={() => {
                setBlockAction(null)
                sheets.open({ kind: 'editTask', task: blockAction })
              }}
            >
              Edit task
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Timeline({
  blocks,
  range,
  windows,
  now,
  isToday,
  onTask,
}: {
  blocks: PlannedBlock[]
  range: { start: Date; end: Date }
  windows: { start: Date; end: Date }[]
  now: Date
  isToday: boolean
  onTask: (t: Task) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hours = Math.round((range.end.getTime() - range.start.getTime()) / 3_600_000)
  const y = (d: Date) => ((d.getTime() - range.start.getTime()) / 3_600_000) * HOUR_PX
  const height = hours * HOUR_PX
  const showNow = isToday && now >= range.start && now <= range.end

  useEffect(() => {
    if (showNow && scrollRef.current) scrollRef.current.scrollTop = Math.max(0, y(now) - 120)
    // only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={scrollRef} className="card max-h-[62vh] overflow-y-auto p-3">
      <div className="relative ml-16" style={{ height }}>
        {Array.from({ length: hours + 1 }, (_, i) => {
          const t = new Date(range.start.getTime() + i * 3_600_000)
          return (
            <div key={i} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }}>
              <span className="absolute -top-2 -left-16 w-14 text-right text-xs whitespace-nowrap text-muted tabular-nums">{hourText(t)}</span>
            </div>
          )
        })}
        {windows.map((w, i) => (
          <div key={i} className="window-band absolute inset-x-0 rounded-xl" style={{ top: y(w.start), height: y(w.end) - y(w.start) }} />
        ))}
        {showNow && <div className="absolute inset-x-0 top-0 bg-bg/50" style={{ height: y(now) }} />}
        {blocks.map((b) => {
          const top = y(b.start) + 1
          const h = Math.max(22, y(b.end) - y(b.start) - 2)
          const minutes = Math.round((b.end.getTime() - b.start.getTime()) / 60_000)
          if (b.kind === 'event')
            return (
              <div key={b.id} className="absolute inset-x-1 overflow-hidden rounded-xl bg-fill px-3 py-1.5 text-sm text-muted" style={{ top, height: h }}>
                <div className="truncate font-medium text-ink">{b.event.title}</div>
                <div className="text-xs">Calendar · {durationText(minutes)}</div>
              </div>
            )
          const color = categoryColor(b.task.category)
          return (
            <button
              key={b.id}
              onClick={() => onTask(b.task)}
              className="absolute inset-x-1 flex items-start justify-between gap-2 overflow-hidden rounded-xl border-l-4 px-3 py-1.5 text-left text-sm"
              style={{ top, height: h, background: tint(color, 16), borderColor: color }}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{b.task.title}</span>
                {h > 36 && <span className="block text-xs text-muted">{durationText(minutes)}</span>}
              </span>
              <Play size={14} style={{ color }} className="mt-0.5 shrink-0" />
            </button>
          )
        })}
        {showNow && (
          <div className="pointer-events-none absolute inset-x-0" style={{ top: y(now) }}>
            <div className="h-0.5 bg-danger" />
            <div className="absolute -top-1 -left-1.5 size-2.5 rounded-full bg-danger" />
          </div>
        )}
      </div>
    </div>
  )
}

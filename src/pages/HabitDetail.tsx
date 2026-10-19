import { ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import { useState } from 'react'
import { Bean, StreakCup } from '../components/CoffeeArt'
import { useSheets } from '../components/sheets'
import { Modal, ProgressBar } from '../components/ui'
import { useStore } from '../data/store'
import { addDays, dayKey, format, orderedWeekdays, startOfDay, veryShortWeekdayName } from '../lib/dates'
import { canRestToday, habitLogOn, isHabitCompletedToday, isRestingToday, isScheduled, isWeeklyGoal, missedToday, reminderText, scheduleDescription, trackingStart } from '../lib/models'
import { milestoneBonus } from '../lib/beans'
import { earnedMilestones, MILESTONES, milestoneProgress, nextMilestone, streakMessage, streakReport, unitLabel } from '../lib/streaks'
import { missReasonCounts } from '../lib/insights'
import { MISS_TIPS, type Habit, type MissReason } from '../lib/types'

export function HabitDetail({ habitId, onClose }: { habitId: string; onClose: () => void }) {
  const store = useStore()
  const sheets = useSheets()
  const habit = store.habits.find((h) => h.id === habitId)
  if (!habit) return null
  const now = store.now
  const r = streakReport(habit, now)
  const next = nextMilestone(r)
  const earned = new Set(earnedMilestones(r))
  const due = isScheduled(habit, now)
  const reasons = [...missReasonCounts([habit])].sort((a, b) => b[1] - a[1])

  return (
    <Modal
      title={habit.title}
      onClose={onClose}
      leading={
        <button className="text-primary" onClick={() => sheets.open({ kind: 'editHabit', habit, back: { kind: 'habitDetail', habitId } })}>
          Edit
        </button>
      }
      trailing={
        <button className="font-semibold text-primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <StreakCup report={r} size={128} />
          <div className="mt-2 font-serif text-3xl font-bold">
            {r.current} {r.unit === 'days' ? 'day' : 'week'} streak
          </div>
          <p className="mt-1 text-muted">{streakMessage(r)}</p>
          <p className="mt-1 text-sm text-muted">
            {scheduleDescription(habit)}
            {habit.reminders_enabled && ` · reminder ${reminderText(habit)}`}
          </p>
        </div>

        {isRestingToday(habit, now) ? (
          <div className="card flex items-center justify-center gap-2 p-4 text-muted">
            <Moon size={18} /> Rest day today
          </div>
        ) : isHabitCompletedToday(habit, now) ? (
          <button className="w-full rounded-full p-4 font-medium text-success" style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)' }} onClick={() => store.toggleHabitToday(habit)}>
            Done today · Undo
          </button>
        ) : (
          due && (
            <button className="btn-primary" onClick={() => store.toggleHabitToday(habit)}>
              {missedToday(habit, now) ? 'I did it after all' : 'Check off today'}
            </button>
          )
        )}

        <div className="grid grid-cols-3 gap-3">
          <Stat title="Best">
            <span className="font-serif text-2xl font-bold">{r.longest}</span> <span className="text-sm text-muted">{unitLabel(r, r.longest)}</span>
          </Stat>
          {isWeeklyGoal(habit) ? (
            <Stat title="This week">
              <div className="flex flex-wrap justify-center gap-0.5">
                {Array.from({ length: r.weekTarget }, (_, i) => (
                  <Bean key={i} size={14} filled={i < r.weekDone} color={i < r.weekDone ? undefined : 'var(--muted)'} />
                ))}
              </div>
            </Stat>
          ) : (
            <Stat title="Freezes">
              <span className="text-xl">
                <span className={r.freezes >= 1 ? '' : 'opacity-25 grayscale'}>❄️</span>
                <span className={r.freezes >= 2 ? '' : 'opacity-25 grayscale'}>❄️</span>
              </span>
            </Stat>
          )}
          <Stat title={next ? `Next: ${next}` : 'All earned'}>
            <ProgressBar value={milestoneProgress(r)} />
          </Stat>
        </div>

        <section>
          <h3 className="section-header mb-2 px-1">Milestones</h3>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {MILESTONES.map((m) => (
              <div
                key={m}
                className={`grid size-16 shrink-0 place-items-center rounded-full text-center leading-tight ${earned.has(m) ? 'bg-accent text-card' : 'bg-fill text-muted'}`}
              >
                <div>
                  <div className="font-serif text-lg font-bold">{m}</div>
                  <div className="text-[10px]">{earned.has(m) ? `+${milestoneBonus(m)}` : r.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MonthHistory habit={habit} now={now} frozen={r.frozenDays} />

        {(canRestToday(habit, now) || (due && !habitLogOn(habit, now))) && (
          <div className="card divide-y divide-line/70 overflow-hidden">
            {canRestToday(habit, now) && (
              <button className="block w-full px-4 py-3 text-left hover:bg-fill/60" onClick={() => store.logMiss(habit, 'Rest Day')}>
                <div className="font-medium">Take a rest day</div>
                <div className="text-sm text-muted">One a week. Doesn’t break your streak.</div>
              </button>
            )}
            {due && !habitLogOn(habit, now) && (
              <button className="block w-full px-4 py-3 text-left hover:bg-fill/60" onClick={() => sheets.open({ kind: 'missReason', habit, back: { kind: 'habitDetail', habitId } })}>
                <div className="font-medium">I missed today</div>
                <div className="text-sm text-muted">Uses a freeze if you have one.</div>
              </button>
            )}
          </div>
        )}

        {reasons.length > 0 && (
          <section>
            <h3 className="section-header mb-2 px-1">Why it was missed</h3>
            <div className="card space-y-2 p-4">
              {reasons.map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between gap-3">
                  <span>{reason}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: Math.min(10, count) }, (_, i) => (
                      <Bean key={i} size={12} color="var(--danger)" />
                    ))}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-sm text-muted">💡 {MISS_TIPS[reasons[0][0] as MissReason]}</p>
            </div>
          </section>
        )}
      </div>
    </Modal>
  )
}

function Stat({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-between gap-2 p-3 text-center">
      <div className="text-xs text-muted">{title}</div>
      <div className="w-full">{children}</div>
    </div>
  )
}

function MonthHistory({ habit, now, frozen }: { habit: Habit; now: Date; frozen: Set<string> }) {
  const [offset, setOffset] = useState(0)
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const start = trackingStart(habit)
  const minOffset = (start.getFullYear() - now.getFullYear()) * 12 + start.getMonth() - now.getMonth()
  const weekdays = orderedWeekdays()
  const lead = weekdays.indexOf(first.getDay() + 1)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const todayKey = dayKey(now)
  const report = streakReport(habit, now)

  const cell = (d: Date) => {
    const key = dayKey(d)
    const log = habitLogOn(habit, d)
    const isTodayCell = key === todayKey
    if (log?.completed) return <Bean size={16} />
    if (frozen.has(key)) return <span className="text-xs">❄️</span>
    if (log?.miss_reason === 'Rest Day') return <Moon size={13} className="text-muted" />
    if (report.missedDays.has(key) || (isTodayCell && log)) return <Bean size={16} filled={false} color="var(--danger)" />
    if (isTodayCell && isScheduled(habit, d)) return <span className="size-4 rounded-full border-2 border-primary" />
    return <span className="size-1 rounded-full bg-muted/40" />
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="section-header">{format(first, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button aria-label="Previous month" disabled={offset <= minOffset} className="grid size-8 place-items-center rounded-full bg-fill disabled:opacity-30" onClick={() => setOffset(offset - 1)}>
            <ChevronLeft size={16} />
          </button>
          <button aria-label="Next month" disabled={offset >= 0} className="grid size-8 place-items-center rounded-full bg-fill disabled:opacity-30" onClick={() => setOffset(offset + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {weekdays.map((w, i) => (
            <div key={i} className="text-xs font-semibold text-muted">
              {veryShortWeekdayName(w)}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = addDays(startOfDay(first), i)
            return (
              <div key={i} className="grid h-7 place-items-center" title={format(d, 'EEE d MMM')}>
                {cell(d)}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Bean size={12} /> Done
          </span>
          <span>❄️ Freeze</span>
          <span className="flex items-center gap-1">
            <Bean size={12} filled={false} color="var(--danger)" /> Missed
          </span>
          <span className="flex items-center gap-1">
            <Moon size={12} /> Rest
          </span>
        </div>
      </div>
    </section>
  )
}

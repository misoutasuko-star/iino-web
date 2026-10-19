import { ChevronDown, Moon, Plus } from 'lucide-react'
import { useState } from 'react'
import { CoffeeCup, StreakCup } from '../components/CoffeeArt'
import { RowMenu } from '../components/RowMenu'
import { WeekBeans } from '../components/rows'
import { useSheets } from '../components/sheets'
import { CheckButton, CircleIcon, EmptyState, SectionHeader } from '../components/ui'
import { useStore } from '../data/store'
import { canRestToday, habitLogOn, isHabitCompletedToday, isRestingToday, isScheduled, scheduleDescription } from '../lib/models'
import { streakReport, unitLabel } from '../lib/streaks'
import { habitSubtitle } from '../lib/summaries'
import type { Habit } from '../lib/types'

const RULES_KEY = 'iino.streakRulesOpen'

function StreakRulesCard() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(RULES_KEY) !== '0'
    } catch {
      return true
    }
  })
  const toggle = () => {
    setOpen(!open)
    try {
      localStorage.setItem(RULES_KEY, open ? '0' : '1')
    } catch {
      // ignore
    }
  }
  return (
    <div className="card p-4">
      <button className="flex w-full items-center justify-between" onClick={toggle}>
        <span className="font-serif text-lg font-semibold">How streaks work</span>
        <ChevronDown size={18} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2 text-[0.9375rem] text-muted">
          <li>☕ Check off every day a habit is due. Miss one and the streak ends.</li>
          <li>❄️ Every 7 days in a row earns a freeze (hold 2). It saves your streak if you miss.</li>
          <li>🌙 One rest day a week doesn’t count against you.</li>
          <li>🏆 Milestones at 3, 7, 14, 30, 100 days and more earn bonus beans.</li>
        </ul>
      )}
    </div>
  )
}

export function Habits() {
  const store = useStore()
  const sheets = useSheets()
  const { habits, now } = store
  const today = habits.filter((h) => isScheduled(h, now))
  const other = habits.filter((h) => !isScheduled(h, now))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-semibold">Habits</h1>
        <CircleIcon label="New habit" onClick={() => sheets.open({ kind: 'newHabit' })}>
          <Plus size={20} />
        </CircleIcon>
      </header>
      {habits.length === 0 ? (
        <EmptyState
          cup={<CoffeeCup progress={0} size={84} muted />}
          title="No habits yet"
          message="Pick a routine you want to keep, like working out or reading. Every day you show up keeps your streak brewing."
          action="Add a habit"
          onAction={() => sheets.open({ kind: 'newHabit' })}
        />
      ) : (
        <>
          <StreakRulesCard />
          {today.length > 0 && (
            <section className="space-y-3">
              <SectionHeader>Today</SectionHeader>
              {today.map((h) => (
                <HabitCard key={h.id} habit={h} />
              ))}
            </section>
          )}
          {other.length > 0 && (
            <section className="space-y-3">
              <SectionHeader>Other days</SectionHeader>
              {other.map((h) => (
                <HabitCard key={h.id} habit={h} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function HabitCard({ habit }: { habit: Habit }) {
  const store = useStore()
  const sheets = useSheets()
  const now = store.now
  const r = streakReport(habit, now)
  const done = isHabitCompletedToday(habit, now)
  const due = isScheduled(habit, now)
  return (
    <div className="card flex cursor-pointer items-center gap-3 p-4" onClick={() => sheets.open({ kind: 'habitDetail', habitId: habit.id })}>
      <StreakCup report={r} size={54} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{habit.title}</div>
        <div className="flex flex-wrap items-baseline gap-x-1 text-sm text-muted">
          <span className="font-serif text-xl font-bold text-ink tabular-nums">{r.current}</span>
          <span>{unitLabel(r, r.current)}</span>
          {r.freezes > 0 && <span>· ❄️ {r.freezes}</span>}
          <span>· {scheduleDescription(habit)}</span>
        </div>
        <div className="mt-1.5">
          <WeekBeans habit={habit} now={now} />
        </div>
        <div className="sr-only">{habitSubtitle(habit, now)}</div>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <RowMenu
          items={[
            { label: 'Take a rest day', onClick: () => store.logMiss(habit, 'Rest Day'), hidden: !canRestToday(habit, now) },
            { label: 'I missed today', onClick: () => sheets.open({ kind: 'missReason', habit }), hidden: !due || habitLogOn(habit, now) != null },
            { label: 'Edit', onClick: () => sheets.open({ kind: 'editHabit', habit }) },
            { label: 'Delete', tone: 'danger', onClick: () => store.deleteHabit(habit) },
          ]}
        />
        {isRestingToday(habit, now) ? (
          <Moon size={22} className="mx-1 text-muted" aria-label="Rest day" />
        ) : (
          due && <CheckButton checked={done} onToggle={() => store.toggleHabitToday(habit)} label={done ? `Uncheck ${habit.title}` : `Check off ${habit.title}`} />
        )}
      </div>
    </div>
  )
}

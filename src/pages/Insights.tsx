import { Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bean, StreakCup } from '../components/CoffeeArt'
import { useSheets } from '../components/sheets'
import { EmptyState, ProgressBar, SectionHeader } from '../components/ui'
import { CoffeeCup } from '../components/CoffeeArt'
import { useStore } from '../data/store'
import { beansThisWeek, levelFor, totalBeans } from '../lib/beans'
import { orderedWeekdays, veryShortWeekdayName } from '../lib/dates'
import { heatGrid, noticedThisWeek, roast, streakBoard, type Roast } from '../lib/insights'
import { MISS_TIPS } from '../lib/types'
import { unitLabel } from '../lib/streaks'

const roastColor: Record<Roast, string> = {
  latte: 'var(--fill)',
  milk: 'var(--milk)',
  crema: 'var(--crema)',
  espresso: 'var(--espresso)',
}

export function Insights() {
  const { tasks, habits, now } = useStore()
  const sheets = useSheets()
  const navigate = useNavigate()

  if (tasks.length === 0 && habits.length === 0)
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl font-semibold">Insights</h1>
        <EmptyState
          cup={<CoffeeCup progress={0} size={84} steaming />}
          title="Insights brew over time"
          message="Check off tasks and habits for a few days and your patterns will show up here."
        />
      </div>
    )

  const total = totalBeans(tasks, habits, now)
  const week = beansThisWeek(tasks, habits, now)
  const level = levelFor(total)
  const grid = heatGrid(tasks, habits, now)
  const board = streakBoard(habits, now)
  const cards = noticedThisWeek(tasks, habits, now, MISS_TIPS)

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl font-semibold">Insights</h1>

      <div className="card space-y-3 p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-fill">
            <Bean size={28} />
          </div>
          <div>
            <div className="section-header">{level.name}</div>
            <div>
              <span className="font-serif text-4xl font-bold tabular-nums">{total}</span> <span className="text-muted">beans</span>
            </div>
          </div>
        </div>
        <ProgressBar value={level.progress} />
        <div className="text-sm text-muted">
          {level.next ? `${level.next.beans - total} to ${level.next.name}` : 'Top roast reached'} · +{week} this week
        </div>
      </div>

      <section>
        <SectionHeader>Last 4 weeks</SectionHeader>
        <div className="card p-4">
          <div className="mx-auto grid max-w-md grid-cols-7 gap-2">
            {orderedWeekdays().map((w, i) => (
              <div key={i} className="text-center text-xs font-semibold text-muted">
                {veryShortWeekdayName(w)}
              </div>
            ))}
            {grid.map((d) => (
              <div
                key={d.date.toISOString()}
                title={`${d.date.toDateString()}: ${d.count}`}
                className="aspect-square rounded-lg"
                style={
                  d.isFuture
                    ? { border: '1.5px solid var(--border)' }
                    : { background: roastColor[roast(d.count)], outline: d.isToday ? '2px solid var(--primary)' : undefined, outlineOffset: 1 }
                }
              />
            ))}
          </div>
          <div className="mx-auto mt-3 flex max-w-md items-center justify-end gap-1.5 text-xs text-muted">
            Quiet
            {(['latte', 'milk', 'crema', 'espresso'] as Roast[]).map((r) => (
              <span key={r} className="size-3 rounded" style={{ background: roastColor[r] }} />
            ))}
            Busy
          </div>
        </div>
      </section>

      {board.length > 0 && (
        <section>
          <SectionHeader>Your streak board</SectionHeader>
          <div className="card divide-y divide-line/70 overflow-hidden">
            {board.map(({ habit, report }, i) => (
              <button key={habit.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill/50" onClick={() => navigate('/habits')}>
                <span className="w-5 text-center font-serif font-bold text-muted">{i + 1}</span>
                <StreakCup report={report} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{habit.title}</span>
                  <span className="block text-xs text-muted">
                    Best {report.longest} {unitLabel(report, report.longest)}
                  </span>
                </span>
                <span className="font-serif text-xl font-bold tabular-nums">
                  {report.current}
                  <span className="text-sm font-normal text-muted">{report.unit === 'days' ? 'd' : 'wk'}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {cards.length > 0 && (
        <section className="space-y-3">
          <SectionHeader>Noticed this week</SectionHeader>
          {cards.map((c) => (
            <button
              key={c.title}
              className="card flex w-full items-start gap-3 p-4 text-left"
              onClick={() => c.kind === 'habit' && sheets.open({ kind: 'habitDetail', habitId: c.habit.id })}
            >
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block font-medium">{c.title}</span>
                <span className="block text-sm text-muted">{c.message}</span>
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}

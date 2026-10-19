import { Check, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../data/store'
import { isTaskCompletedToday } from '../lib/models'
import { DIFFICULTIES, DIFFICULTY_INFO, type Task } from '../lib/types'
import { PourOver } from './CoffeeArt'
import { categoryColor, Modal } from './ui'

// Focus timer (06 §6.3). Timing uses a fixed end time, so a background tab stays accurate.

export function FocusSession({ task, onClose, onFinished }: { task: Task; onClose: () => void; onFinished: () => void }) {
  const store = useStore()
  const [planned, setPlanned] = useState(Math.max(5, task.estimated_minutes))
  const [endAt, setEndAt] = useState<number | null>(null)
  const [remainingMs, setRemainingMs] = useState(planned * 60_000)
  const [finished, setFinished] = useState(false)
  const [, tick] = useState(0)
  const doneRef = useRef(false)
  const running = endAt != null

  const remaining = running ? Math.max(0, endAt - Date.now()) : remainingMs
  const progress = 1 - remaining / (planned * 60_000)

  const complete = () => {
    if (doneRef.current) return
    doneRef.current = true
    setEndAt(null)
    setRemainingMs(0)
    setFinished(true)
    if (!isTaskCompletedToday(task)) store.setTaskDoneToday(task, true)
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Your focus brew is ready ☕', { body: `Nice work on ${task.title}. Time for a coffee break.` })
    }
    setTimeout(onFinished, 900)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      tick((t) => t + 1)
      if (endAt - Date.now() <= 0) complete()
    }, 250)
    return () => clearInterval(id)
  })

  const mins = Math.floor(remaining / 60_000)
  const secs = Math.floor((remaining % 60_000) / 1000)
  const timeText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  useEffect(() => {
    const original = document.title
    if (running) document.title = `${timeText} · iino`
    return () => {
      document.title = original
    }
  }, [running, timeText])

  const status = finished ? 'Brewed. Time for a coffee break.' : running ? 'Brewing… stay with it.' : progress > 0 ? 'Paused' : 'Ready to brew'
  const adjust = (delta: number) => {
    const next = Math.min(480, Math.max(5, planned + delta))
    setPlanned(next)
    setRemainingMs(next * 60_000)
  }

  return (
    <Modal title="Focus" onClose={onClose} dismissable={!running}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="section-header">Focus brew</div>
        <h2 className="font-serif text-2xl font-semibold">{task.title}</h2>
        <span className="text-sm font-medium" style={{ color: categoryColor(task.category) }}>
          {task.category}
        </span>
        <PourOver progress={progress} brewing={running} />
        <div className="font-serif text-6xl font-bold tabular-nums">{timeText}</div>
        <div className="text-muted">{status}</div>
        {!running && progress === 0 && !finished && (
          <div className="flex items-center gap-3">
            <button className="btn-soft" onClick={() => adjust(-5)} disabled={planned <= 5}>
              − 5 min
            </button>
            <button className="btn-soft" onClick={() => adjust(5)} disabled={planned >= 480}>
              + 5 min
            </button>
          </div>
        )}
        <div className="mt-2 flex items-center gap-5">
          <button
            aria-label="Reset"
            className="grid size-12 place-items-center rounded-full bg-fill text-primary"
            onClick={() => {
              setEndAt(null)
              setRemainingMs(planned * 60_000)
              setFinished(false)
              doneRef.current = false
            }}
          >
            <RotateCcw size={20} />
          </button>
          <button
            aria-label={running ? 'Pause' : 'Start'}
            className="grid size-16 place-items-center rounded-full bg-primary text-on-primary disabled:opacity-40"
            disabled={finished}
            onClick={() => {
              if (running) {
                setRemainingMs(Math.max(0, endAt - Date.now()))
                setEndAt(null)
              } else {
                setEndAt(Date.now() + remainingMs)
                if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
              }
            }}
          >
            {running ? <Pause size={26} /> : <Play size={26} className="translate-x-0.5" />}
          </button>
          <button aria-label="Finish" className="grid size-12 place-items-center rounded-full bg-fill text-success" onClick={complete} disabled={finished}>
            <Check size={22} />
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function FeedbackSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const store = useStore()
  return (
    <Modal title="How did that feel?" onClose={onClose} trailing={<button className="text-muted" onClick={onClose}>Skip</button>}>
      <div className="space-y-3">
        <p className="text-center text-muted">iino adjusts the next session to match.</p>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            className="card flex w-full items-center gap-4 p-4 text-left hover:brightness-[0.98]"
            onClick={() => {
              store.giveFeedback(task, d)
              onClose()
            }}
          >
            <span className="text-3xl">{DIFFICULTY_INFO[d].emoji}</span>
            <span>
              <span className="block font-semibold">{d}</span>
              <span className="block text-sm text-muted">{DIFFICULTY_INFO[d].detail}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

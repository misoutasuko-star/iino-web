import { Check, ChevronRight, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { orderedWeekdays, veryShortWeekdayName } from '../lib/dates'
import { CATEGORIES, type TaskCategory } from '../lib/types'
import { Bean } from './CoffeeArt'

export const categoryColor = (c: TaskCategory) => `var(--cat-${c.toLowerCase()})`

export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`

export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <h2 className="section-header">{children}</h2>
      {right}
    </div>
  )
}

/** Rows inside one card, separated by hairlines. */
export function CardStack({ children }: { children: ReactNode }) {
  return <div className="card divide-y divide-line/70 overflow-hidden [&>*]:px-4 [&>*]:py-2.5">{children}</div>
}

export function CircleIcon({ onClick, label, children }: { onClick?: () => void; label: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-[42px] place-items-center rounded-full bg-fill text-primary hover:brightness-95"
    >
      {children}
    </button>
  )
}

export function CheckButton({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const [pulse, setPulse] = useState(0)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (!checked) setPulse((p) => p + 1)
        onToggle()
      }}
      aria-label={label}
      aria-pressed={checked}
      className="relative grid size-8 shrink-0 place-items-center"
    >
      {pulse > 0 && <span key={pulse} className="ripple absolute inset-0 rounded-full border-2 border-success" />}
      <span
        className={`grid size-7 place-items-center rounded-full border-2 transition-all ${
          checked ? 'scale-100 border-success bg-success text-card' : 'border-muted/50 hover:border-success'
        }`}
      >
        {checked && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  )
}

export function BeansBadge({ total, onClick }: { total: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex h-[42px] items-center gap-1.5 rounded-full bg-fill px-3.5 font-serif font-semibold text-ink">
      <Bean size={16} />
      <span className="tabular-nums">{total}</span>
    </button>
  )
}

export function NoticeBanner({ icon, text, color, onClick }: { icon: ReactNode; text: string; color: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
      style={{ background: tint(color, 10), color }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-[0.9375rem] font-medium text-ink">{text}</span>
      <ChevronRight size={18} className="shrink-0 opacity-60" />
    </button>
  )
}

export function EmptyState({ title, message, action, onAction, cup }: { title: string; message: string; action?: string; onAction?: () => void; cup: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
      {cup}
      <h3 className="font-serif text-xl font-semibold">{title}</h3>
      <p className="max-w-sm text-muted">{message}</p>
      {action && (
        <button className="btn-soft mt-2" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

export function DayChips({ selected, onChange }: { selected: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex justify-between gap-1.5">
      {orderedWeekdays().map((d) => {
        const on = selected.includes(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(on ? selected.filter((x) => x !== d) : [...selected, d].sort())}
            className={`size-10 rounded-full text-sm font-semibold transition-colors ${on ? 'bg-primary text-on-primary' : 'bg-fill text-muted'}`}
            aria-pressed={on}
          >
            {veryShortWeekdayName(d)}
          </button>
        )
      })}
    </div>
  )
}

export function CategoryPicker({ value, onChange }: { value: TaskCategory; onChange: (c: TaskCategory) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const on = c === value
        const color = categoryColor(c)
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            style={on ? { background: color, color: 'var(--card)' } : { background: tint(color, 12), color }}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full bg-fill p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${o.value === value ? 'bg-card text-ink shadow-sm' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-card shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function Stepper({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="tabular-nums">{format(value)}</span>
      <div className="flex overflow-hidden rounded-full bg-fill">
        <button type="button" className="px-4 py-1.5 text-lg disabled:opacity-30" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="Less">
          −
        </button>
        <span className="w-px bg-line" />
        <button type="button" className="px-4 py-1.5 text-lg disabled:opacity-30" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="More">
          +
        </button>
      </div>
    </div>
  )
}

export function Field({ label, footer, children }: { label?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {label && <h3 className="section-header px-1">{label}</h3>}
      <div className="card space-y-3 p-4">{children}</div>
      {footer && <p className="px-1 text-sm text-muted">{footer}</p>}
    </section>
  )
}

/** A sheet: bottom panel on phones, centered dialog on wide screens. */
export function Modal({ title, onClose, children, leading, trailing, dismissable = true }: { title?: string; onClose: () => void; children: ReactNode; leading?: ReactNode; trailing?: ReactNode; dismissable?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissable && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose, dismissable])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 sm:items-center sm:p-6" onClick={() => dismissable && onClose()}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-bg shadow-2xl sm:max-w-lg sm:rounded-[28px]"
      >
        <header className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
          <div className="flex min-w-16">{leading}</div>
          <h2 className="flex-1 truncate text-center font-serif text-lg font-semibold">{title}</h2>
          <div className="flex min-w-16 justify-end">
            {trailing ?? (
              <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full bg-fill text-muted">
                <X size={16} />
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">{children}</div>
      </div>
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-fill">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  )
}

import { useId } from 'react'
import type { StreakReport } from '../lib/streaks'

// SVG versions of CoffeeArt.swift: cup, bean, streak cup and pour-over.

export function CoffeeCup({
  progress,
  size = 96,
  steaming = false,
  muted = false,
}: {
  progress: number
  size?: number
  steaming?: boolean
  muted?: boolean
}) {
  const clip = useId()
  const p = Math.max(0, Math.min(1, progress))
  const top = 34
  const bottom = 80
  const level = bottom - (bottom - top) * p
  const outline = muted ? 'var(--muted)' : 'var(--espresso)'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {steaming && (
        <g stroke="var(--crema)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
          {[36, 46, 56].map((x, i) => (
            <path key={x} className="steam" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} 26 q-4 -6 0 -10 q4 -4 0 -10`} />
          ))}
        </g>
      )}
      <ellipse cx="46" cy="86" rx="38" ry="6" fill={muted ? 'var(--fill)' : 'var(--milk)'} />
      <path d="M74 44 q14 0 14 12 q0 12 -16 14" fill="none" stroke={outline} strokeOpacity="0.5" strokeWidth="5" />
      <defs>
        <clipPath id={clip}>
          <path d="M16 32 h60 l-6 42 q-2 8 -10 8 h-28 q-8 0 -10 -8 z" />
        </clipPath>
      </defs>
      <path d="M16 32 h60 l-6 42 q-2 8 -10 8 h-28 q-8 0 -10 -8 z" fill={muted ? 'var(--fill)' : 'var(--ceramic)'} stroke={outline} strokeOpacity="0.35" strokeWidth="1.5" />
      {p > 0 && (
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y={level} width="100" height="100" fill={muted ? 'var(--muted)' : 'var(--espresso)'} style={{ transition: 'y 0.6s ease' }} />
          <rect x="0" y={level} width="100" height="2.5" fill="var(--crema)" style={{ transition: 'y 0.6s ease' }} />
        </g>
      )}
    </svg>
  )
}

export function Bean({ size = 14, filled = true, color }: { size?: number; filled?: boolean; color?: string }) {
  const c = color ?? 'var(--espresso)'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <ellipse
        cx="10"
        cy="10"
        rx="6.5"
        ry="8.5"
        transform="rotate(-25 10 10)"
        fill={filled ? c : 'none'}
        stroke={c}
        strokeWidth={filled ? 0 : 1.5}
      />
      <path d="M7.5 3.5 c4 3 -1 9 4 13" transform="rotate(-8 10 10)" stroke={filled ? 'var(--card)' : c} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={filled ? 0.7 : 0.6} />
    </svg>
  )
}

export function StreakCup({ report, size = 54 }: { report: StreakReport; size?: number }) {
  switch (report.state.kind) {
    case 'done':
      return <CoffeeCup progress={0.85} size={size} steaming />
    case 'atRisk':
      return <CoffeeCup progress={0.6} size={size} />
    case 'frozen':
      return (
        <div className="relative inline-block">
          <CoffeeCup progress={0.6} size={size} />
          <span className="absolute -top-1 -right-1 text-sm">❄️</span>
        </div>
      )
    case 'resting':
      return report.current > 0 ? <CoffeeCup progress={0.6} size={size} /> : <CoffeeCup progress={0} size={size} muted />
    default:
      return <CoffeeCup progress={0} size={size} muted />
  }
}

export function PourOver({ progress, brewing, size = 180 }: { progress: number; brewing: boolean; size?: number }) {
  const p = Math.max(0, Math.min(1, progress))
  const clipCup = useId()
  const clipDrip = useId()
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden>
      <defs>
        <clipPath id={clipDrip}>
          <path d="M22 14 h56 l-20 30 h-16 z" />
        </clipPath>
        <clipPath id={clipCup}>
          <path d="M24 60 h52 l-5 34 q-2 7 -9 7 h-24 q-7 0 -9 -7 z" />
        </clipPath>
      </defs>
      {/* dripper */}
      <path d="M22 14 h56 l-20 30 h-16 z" fill="var(--ceramic)" stroke="var(--espresso)" strokeOpacity="0.35" strokeWidth="1.5" />
      <g clipPath={`url(#${clipDrip})`}>
        <rect x="0" y={14 + 30 * p} width="100" height="40" fill="var(--espresso)" style={{ transition: 'y 1s linear' }} />
      </g>
      <rect x="18" y="44" width="64" height="5" rx="2.5" fill="var(--crema)" />
      {brewing && p < 1 && (
        <g fill="var(--espresso)">
          {[0, 0.35, 0.7].map((d) => (
            <ellipse key={d} className="drip" style={{ animationDelay: `${d}s` }} cx="50" cy="52" rx="1.6" ry="2.4" />
          ))}
        </g>
      )}
      {/* cup */}
      <path d="M76 66 q12 0 12 10 q0 10 -14 12" fill="none" stroke="var(--espresso)" strokeOpacity="0.5" strokeWidth="4.5" />
      <path d="M24 60 h52 l-5 34 q-2 7 -9 7 h-24 q-7 0 -9 -7 z" fill="var(--ceramic)" stroke="var(--espresso)" strokeOpacity="0.35" strokeWidth="1.5" />
      <g clipPath={`url(#${clipCup})`}>
        <rect x="0" y={101 - 38 * p} width="100" height="60" fill="var(--espresso)" style={{ transition: 'y 1s linear' }} />
        <rect x="0" y={101 - 38 * p} width="100" height="2" fill="var(--crema)" style={{ transition: 'y 1s linear' }} />
      </g>
      <ellipse cx="50" cy="104" rx="38" ry="4.5" fill="var(--milk)" />
    </svg>
  )
}

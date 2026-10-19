import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

// Swipe actions and long-press menus from the iPhone app become a "⋯" menu on the web.

export interface MenuItem {
  label: string
  onClick: () => void
  tone?: 'danger' | 'success' | 'accent'
  hidden?: boolean
}

const toneClass = { danger: 'text-danger', success: 'text-success', accent: 'text-accent' }

export function RowMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const visible = items.filter((i) => !i.hidden)
  if (visible.length === 0) return null
  return (
    <div className="relative">
      <button
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="grid size-8 place-items-center rounded-full text-muted hover:bg-fill"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-30 mt-1 w-48 overflow-hidden py-1">
            {visible.map((i) => (
              <button
                key={i.label}
                className={`block w-full px-4 py-2.5 text-left hover:bg-fill ${i.tone ? toneClass[i.tone] : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  i.onClick()
                }}
              >
                {i.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

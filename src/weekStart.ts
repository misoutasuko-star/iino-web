import { setWeekStartsOn } from './lib/dates'

// The iPhone uses the phone's region for the first weekday. On the web we
// remember the choice in this browser (Sunday by default, like the US and Japan).

const KEY = 'iino.weekStart'

export function loadStoredWeekStart() {
  try {
    const v = localStorage.getItem(KEY)
    if (v === '1') setWeekStartsOn(1)
  } catch {
    // ignore
  }
}

export function setStoredWeekStart(day: 0 | 1) {
  setWeekStartsOn(day)
  try {
    localStorage.setItem(KEY, String(day))
  } catch {
    // ignore
  }
  // Recompute everything with the new week.
  window.location.reload()
}

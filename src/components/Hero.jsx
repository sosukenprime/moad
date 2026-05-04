import { useEffect, useState } from 'react'
import { useStore } from '../lib/store.js'
import { greeting, longDate } from '../lib/dates.js'

function formatClock(d) {
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`
}

function useClock() {
  const [time, setTime] = useState(() => formatClock(new Date()))
  useEffect(() => {
    const id = setInterval(() => setTime(formatClock(new Date())), 30000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function Hero() {
  const name = useStore((s) => s.user.name)
  const focusMode = useStore((s) => s.settings.focusMode)
  const toggleFocusMode = useStore((s) => s.toggleFocusMode)
  const time = useClock()

  return (
    <header className="relative">
      {/* Brand bar: gold pill + MOAD wordmark + divider + clock */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-5 bg-gold rounded-sm accent-glow-gold" />
        <span className="font-heading text-gold tracking-[0.35em] text-sm leading-none">
          MOAD COMMAND DECK
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gold/40 via-border to-transparent" />
        <span className="num text-[11px] text-text-dim tracking-widest">{time}</span>
      </div>

      {/* Greeting + date + focus toggle */}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-5xl sm:text-6xl text-text leading-[0.95] drop-shadow-[0_0_18px_rgba(245,185,66,0.08)]">
            {greeting(name || 'Ken')}
          </h1>
          <div className="mt-2 num text-[11px] text-text-dim tracking-[0.3em] uppercase">
            {longDate()}
          </div>
        </div>
        <button
          onClick={toggleFocusMode}
          className={
            'shrink-0 px-3 py-1.5 rounded text-xs uppercase tracking-wider font-mono border transition ' +
            (focusMode
              ? 'bg-gold/25 text-gold border-gold/60 accent-glow-gold font-bold'
              : 'bg-gold/[0.07] text-gold/75 border-gold/30 hover:bg-gold/15 hover:text-gold hover:border-gold/50')
          }
          aria-pressed={focusMode}
          title="Focus Mode (F)"
        >
          {focusMode ? '◉ Focus' : '○ Focus'}
        </button>
      </div>
    </header>
  )
}

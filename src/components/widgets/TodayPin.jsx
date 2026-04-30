// Tiny "+ Today" toggle button used on Mission / Deadline / Lab rows.
// Tapping creates a todaySchedule entry pointing at the source (independent
// completion). Tapping again removes it (only if not yet completed).

import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'

export default function TodayPin({ refType, refId, className = '' }) {
  const schedule = useStore((s) => s.todaySchedule)
  const scheduleToToday = useStore((s) => s.scheduleToToday)
  const today = useUI((u) => u.today)
  // Ignore cleared entries — they're history, not "currently on Today's list"
  const entry = schedule.find(
    (e) => e.refType === refType && e.refId === refId && e.dateKey === today && !e.clearedFromTodayAt
  )
  const active = !!entry
  const locked = entry?.completed // completed today AND not cleared — can't toggle off (history)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (locked) return
        scheduleToToday(refType, refId)
      }}
      disabled={locked}
      title={
        locked ? 'Completed today — kept for history' :
        active ? 'Remove from Today' : 'Schedule for Today'
      }
      className={
        'text-[10px] uppercase tracking-wider font-mono rounded border px-1.5 py-0.5 transition ' +
        (active
          ? 'bg-gold/15 text-gold border-gold/50'
          : 'bg-surface text-text-muted border-border hover:text-gold hover:border-gold/40') +
        ' ' + className
      }
    >
      {active ? (locked ? '✓ Today' : '◉ Today') : '+ Today'}
    </button>
  )
}

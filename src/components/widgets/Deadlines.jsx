import { useMemo } from 'react'
import WidgetCard from './WidgetCard.jsx'
import TodayPin from './TodayPin.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'
import { daysUntil } from '../../lib/dates.js'

export default function Deadlines() {
  const deadlines = useStore((s) => s.deadlines)
  const looseEnds = useStore((s) => s.looseEnds)
  const deleteDeadline = useStore((s) => s.deleteDeadline)
  const openModal = useUI((u) => u.openModal)

  // Subscribe to today so "Xd over"/"Xd" re-renders at midnight.
  const today = useUI((u) => u.today)

  const items = useMemo(() => {
    const direct = deadlines.map((d) => ({ id: d.id, title: d.title, date: d.date, note: d.note, _kind: 'deadline' }))
    const mirrored = looseEnds
      .filter((l) => l.inDeadlines && l.dueDate && !l.completed)
      .map((l) => ({ id: l.id, title: l.text, date: l.dueDate, _kind: 'looseEnd' }))
    return [...direct, ...mirrored].sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlines, looseEnds, today])

  return (
    <WidgetCard
      tone="coral"
      title="Deadlines"
      badge={items.length > 0 ? `${items.length}` : null}
      action={
        <button
          onClick={() => openModal('addDeadline')}
          className="text-xs uppercase tracking-wider font-mono text-coral/80 hover:text-coral border border-coral/30 hover:border-coral/60 rounded px-2 py-1"
        >
          + Add
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-4 text-center text-text-muted text-sm">
          Nothing on the calendar.
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((d) => {
            const days = daysUntil(d.date)
            const overdue = days < 0
            const soon = days >= 0 && days <= 3
            const isDeadline = d._kind === 'deadline'
            return (
              <li
                key={`${d._kind}:${d.id}`}
                onClick={isDeadline ? () => openModal('editDeadline', { id: d.id }) : undefined}
                className={
                  'group flex items-center justify-between gap-3 py-1 border-b border-border last:border-b-0 ' +
                  (isDeadline ? 'cursor-pointer hover:bg-coral/5 -mx-2 px-2 rounded' : '')
                }
              >
                <div className="min-w-0">
                  <div className="text-sm text-text leading-snug">{d.title}</div>
                  {d.note && <div className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{d.note}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={
                      'text-[10px] uppercase tracking-wider num ' +
                      (overdue ? 'text-coral' : soon ? 'text-gold' : 'text-text-muted')
                    }
                  >
                    {overdue ? `${Math.abs(days)}d over` : days === 0 ? 'Today' : `${days}d`}
                  </div>
                  {isDeadline && <TodayPin refType="deadline" refId={d.id} />}
                  {isDeadline && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDeadline(d.id) }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-coral text-xs"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetCard>
  )
}

import WidgetCard from './WidgetCard.jsx'
import TodayPin from './TodayPin.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'
import { daysUntil } from '../../lib/dates.js'

export default function Missions() {
  const projects = useStore((s) => s.projects)
  const looseEnds = useStore((s) => s.looseEnds)
  const openModal = useUI((u) => u.openModal)
  // Subscribe to today so deadline badges ("1d", "Today") re-render at midnight.
  useUI((u) => u.today)

  const active = projects.filter((p) => p.status === 'active')
  const mirroredCount = looseEnds.filter((l) => l.inMissions && !l.completed).length

  return (
    <WidgetCard
      tone="work"
      title="Active Missions"
      badge={active.length > 0 ? `${active.length}` : null}
      action={
        <button
          onClick={() => openModal('addMission')}
          className="text-xs uppercase tracking-wider font-mono text-work/80 hover:text-work border border-work/30 hover:border-work/60 rounded px-2 py-1"
        >
          + New
        </button>
      }
    >
      {active.length === 0 && mirroredCount === 0 ? (
        <div className="py-4 text-center text-text-muted text-sm">
          No active missions. Tap 🎯 on a Loose End to promote it.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {active.map((p) => (
            <li
              key={p.id}
              onClick={() => openModal('editMission', { id: p.id })}
              className="cursor-pointer rounded border border-border hover:border-work/40 p-2.5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-work font-bold leading-snug">{p.name}</div>
                  {(p.steps?.[0]?.text || p.nextAction) && (
                    <div className="text-[11px] text-text-dim leading-snug mt-0.5">
                      → {p.steps?.[0]?.text || p.nextAction}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.deadline && (
                    <div className="text-[10px] uppercase tracking-wider num text-coral/80">
                      {formatDeadline(p.deadline)}
                    </div>
                  )}
                  <TodayPin refType="mission" refId={p.id} />
                </div>
              </div>
              <div className="mt-1.5 h-1 bg-border rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-work to-work/60 transition-all"
                  style={{ width: `${p.progress || 0}%`, boxShadow: '0 0 6px rgba(96,165,250,0.5)' }}
                />
              </div>
            </li>
          ))}
          {mirroredCount > 0 && (
            <li className="text-[11px] uppercase tracking-wider text-personal/70 num pt-1">
              + {mirroredCount} mirrored from Loose Ends
            </li>
          )}
        </ul>
      )}
    </WidgetCard>
  )
}

function formatDeadline(iso) {
  const d = daysUntil(iso)
  if (d == null) return ''
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'Today'
  if (d === 1) return '1d'
  return `${d}d`
}

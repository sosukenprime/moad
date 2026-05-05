import WidgetCard from './WidgetCard.jsx'
import HexCheckbox from './HexCheckbox.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'
import { daysUntil } from '../../lib/dates.js'

export default function LooseEnds() {
  const items = useStore((s) => s.looseEnds)
  const toggle = useStore((s) => s.toggleLooseEnd)
  const del = useStore((s) => s.deleteLooseEnd)
  const toggleMirror = useStore((s) => s.toggleLooseEndMirror)
  const updateLooseEnd = useStore((s) => s.updateLooseEnd)
  const openModal = useUI((u) => u.openModal)
  // Subscribe to today so due-date badges re-render at midnight.
  useUI((u) => u.today)

  const open = items.filter((l) => !l.completed)
  const sorted = [...open].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return (
    <WidgetCard
      id="looseEnds"
      tone="personal"
      title="Loose Ends"
      badge={open.length > 0 ? `${open.length}` : null}
      action={
        <button
          onClick={() => openModal('addLooseEnd')}
          className="text-xs uppercase tracking-wider font-mono text-personal/80 hover:text-personal border border-personal/30 hover:border-personal/60 rounded px-2 py-1"
        >
          + Add
        </button>
      }
    >
      {sorted.length === 0 ? (
        <div className="py-4 text-center text-text-muted text-sm">
          Inbox is empty. Capture via Comms or tap Add.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((item) => (
            <li key={item.id} className="group py-1.5 flex items-center gap-3">
              <HexCheckbox checked={item.completed} tone="personal" onChange={() => toggle(item.id)} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text leading-snug">{item.text}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.dueDate && (
                    <span className="text-[10px] uppercase tracking-wider num text-coral/80">
                      {formatDue(item.dueDate)}
                    </span>
                  )}
                  {item.priority === 'high' && (
                    <span className="text-[10px] uppercase tracking-wider num text-gold">High</span>
                  )}
                  <MirrorBadges item={item} />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <ActionBtn
                  active={item.inToday}
                  tone="gold"
                  title="Mirror to Today"
                  onClick={() => toggleMirror(item.id, 'inToday')}
                >
                  ➕
                </ActionBtn>
                <ActionBtn
                  active={item.inMissions}
                  tone="work"
                  title="Promote to Mission"
                  onClick={() => openModal('promoteToMission', { id: item.id })}
                >
                  🎯
                </ActionBtn>
                <ActionBtn
                  active={item.inDeadlines}
                  tone="coral"
                  title="Mirror to Deadlines"
                  onClick={() => {
                    if (!item.dueDate) {
                      const dd = window.prompt('Due date (YYYY-MM-DD)?')
                      if (!dd) return
                      updateLooseEnd(item.id, { dueDate: dd, inDeadlines: true })
                    } else {
                      toggleMirror(item.id, 'inDeadlines')
                    }
                  }}
                >
                  📅
                </ActionBtn>
                <button
                  onClick={() => del(item.id)}
                  className="opacity-0 group-hover:opacity-100 sm:opacity-60 sm:hover:opacity-100 text-text-muted hover:text-coral text-xs px-1"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

const ACTIVE = {
  gold: 'border-gold text-gold bg-gold/10',
  work: 'border-work text-work bg-work/10',
  coral: 'border-coral text-coral bg-coral/10',
}
function ActionBtn({ active, tone, title, onClick, children }) {
  const ring = active
    ? ACTIVE[tone] || ACTIVE.gold
    : 'border-border text-text-muted hover:text-text-dim hover:border-border-strong'
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-[11px] rounded border w-7 h-7 flex items-center justify-center transition ${ring}`}
    >
      {children}
    </button>
  )
}

function MirrorBadges({ item }) {
  const dots = []
  if (item.inToday) dots.push(<span key="t" className="w-1.5 h-1.5 rounded-full bg-gold" title="In Today" />)
  if (item.inMissions) dots.push(<span key="m" className="w-1.5 h-1.5 rounded-full bg-work" title="Mission" />)
  if (item.inDeadlines) dots.push(<span key="d" className="w-1.5 h-1.5 rounded-full bg-coral" title="In Deadlines" />)
  if (dots.length === 0) return null
  return <div className="flex items-center gap-1">{dots}</div>
}

function formatDue(iso) {
  const d = daysUntil(iso)
  if (d == null) return ''
  if (d < 0) return `${Math.abs(d)}d over`
  if (d === 0) return 'Today'
  return `${d}d`
}

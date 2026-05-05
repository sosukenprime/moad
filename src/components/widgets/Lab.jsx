import WidgetCard from './WidgetCard.jsx'
import TodayPin from './TodayPin.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'

export default function Lab() {
  const lab = useStore((s) => s.lab)
  const pinLabItem = useStore((s) => s.pinLabItem)
  const unpinLabItem = useStore((s) => s.unpinLabItem)
  const deleteLabItem = useStore((s) => s.deleteLabItem)
  const openModal = useUI((u) => u.openModal)

  const pinned = [0, 1, 2].map((slot) => lab.find((l) => l.pinned && l.pinSlot === slot) || null)
  const unpinned = lab.filter((l) => !l.pinned)

  return (
    <WidgetCard
      id="lab"
      tone="creative"
      title="The Lab"
      badge={lab.length > 0 ? `${lab.length}` : null}
      action={
        <button
          onClick={() => openModal('addLab')}
          className="text-xs uppercase tracking-wider font-mono text-creative/80 hover:text-creative border border-creative/30 hover:border-creative/60 rounded px-2 py-1"
        >
          + Add
        </button>
      }
    >
      {/* Three pinned slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {pinned.map((item, i) => (
          <div
            key={i}
            onClick={item ? () => openModal('editLab', { id: item.id }) : undefined}
            className={
              'rounded border border-creative/30 bg-creative/[0.06] p-2 min-h-[80px] flex flex-col justify-between ' +
              (item ? 'cursor-pointer hover:bg-creative/[0.10] hover:border-creative/50 transition' : '')
            }
          >
            {item ? (
              <>
                <div className="text-xs text-creative font-bold">{item.text}</div>
                <div className="flex flex-col items-start gap-1.5 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); unpinLabItem(item.id) }}
                    className="text-[10px] uppercase tracking-wider text-creative/70 hover:text-creative"
                  >
                    Unpin
                  </button>
                  <TodayPin refType="lab" refId={item.id} />
                </div>
              </>
            ) : (
              <div className="text-xs text-text-muted italic flex items-center justify-center h-full">
                Pin an idea
              </div>
            )}
          </div>
        ))}
      </div>

      {unpinned.length === 0 ? (
        <div className="py-3 text-center text-text-muted text-xs">
          Drop ideas here. Pin up to 3 to focus on.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {unpinned.map((item) => (
            <li key={item.id} className="group flex items-center gap-2 py-0.5">
              <div
                onClick={() => openModal('editLab', { id: item.id })}
                className="flex-1 min-w-0 cursor-pointer rounded -mx-1 px-1 py-0.5 hover:bg-creative/[0.08]"
              >
                <div className="text-sm text-text leading-snug">{item.text}</div>
                {item.note && (
                  <div className="text-[11px] text-text-muted leading-snug truncate">{item.note}</div>
                )}
              </div>
              <TodayPin refType="lab" refId={item.id} />
              <button
                onClick={(e) => { e.stopPropagation(); pinLabItem(item.id) }}
                disabled={pinned.every(Boolean)}
                className="text-[10px] uppercase tracking-wider text-creative/60 hover:text-creative disabled:opacity-30 disabled:hover:text-creative/60"
                title={pinned.every(Boolean) ? 'All 3 slots taken' : 'Pin'}
              >
                Pin
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteLabItem(item.id) }}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-coral text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

// Michelle's outgoing-requests view — collapsible widget below SendCapture.
// Shows pending and done sections. Tap a row to delete (pending only) or
// review (done). Updates live via the partner_requests subscription wired in
// the store.

import { useMemo } from 'react'
import WidgetCard from './WidgetCard.jsx'
import { useStore } from '../../lib/store.js'

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PartnerStatus({ preview = false, previewItems = [] }) {
  const realOutgoing = useStore((s) => s.outgoingRequests)
  const deletePartnerRequest = useStore((s) => s.deletePartnerRequest)
  const outgoing = preview && realOutgoing.length === 0 ? previewItems : realOutgoing

  const { pending, done } = useMemo(() => {
    const pending = outgoing.filter((r) => r.status === 'pending')
    const done = outgoing.filter((r) => r.status === 'done')
    return { pending, done }
  }, [outgoing])

  const badge = pending.length > 0 ? `${pending.length} pending` : (done.length > 0 ? 'all done' : null)

  return (
    <WidgetCard id="partnerStatus" tone="rose" title="Status" badge={badge}>
      {outgoing.length === 0 ? (
        <div className="py-3 text-center text-text-muted text-sm">
          Nothing sent yet.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <Section
              label="Pending"
              tone="rose"
              items={pending}
              onDelete={preview ? null : (id) => {
                if (confirm('Delete this pending request?')) deletePartnerRequest(id)
              }}
            />
          )}
          {done.length > 0 && (
            <Section label="Done" tone="muted" items={done} />
          )}
        </div>
      )}
    </WidgetCard>
  )
}

function Section({ label, tone, items, onDelete }) {
  const labelClass =
    tone === 'rose'
      ? 'text-[10px] uppercase tracking-wider font-mono text-rose'
      : 'text-[10px] uppercase tracking-wider font-mono text-text-muted'
  const dim = tone !== 'rose'
  return (
    <div>
      <div className={labelClass + ' mb-1.5'}>{label}</div>
      <ul className="space-y-1">
        {items.map((r) => (
          <li
            key={r.id}
            className={
              'group flex items-start justify-between gap-3 py-1.5 border-b border-border last:border-b-0 ' +
              (dim ? 'opacity-70' : '')
            }
          >
            <div className="min-w-0 flex-1">
              <div className={'text-sm leading-snug ' + (dim ? 'text-text-dim line-through decoration-text-muted' : 'text-text')}>
                {r.polished}
              </div>
              <div className="text-[11px] text-text-muted leading-snug mt-0.5">
                {r.status === 'done' && r.completed_at
                  ? `done · ${fmt(r.completed_at)}`
                  : `sent · ${fmt(r.created_at)}`}
              </div>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(r.id)}
                className="opacity-0 group-hover:opacity-100 sm:opacity-60 sm:hover:opacity-100 text-text-muted hover:text-coral text-xs px-1"
                aria-label="Delete"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

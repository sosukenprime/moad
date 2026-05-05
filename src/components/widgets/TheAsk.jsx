// Ken's view of incoming requests from his partners (e.g., Michelle).
// Pending bubbles up live via the partner_requests subscription wired in
// the store; "done" rows stay visible for context but are de-emphasized.

import { useMemo } from 'react'
import WidgetCard from './WidgetCard.jsx'
import { useStore } from '../../lib/store.js'

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function TheAsk() {
  const incoming = useStore((s) => s.incomingRequests)
  const myPartners = useStore((s) => s.myPartners)
  const markDone = useStore((s) => s.markPartnerRequestDone)
  const markPending = useStore((s) => s.markPartnerRequestPending)

  const { pending, done } = useMemo(() => {
    const pending = incoming.filter((r) => r.status === 'pending')
    const done = incoming.filter((r) => r.status === 'done')
    return { pending, done }
  }, [incoming])

  // Map sender user_id → display name from myPartners (where I added them).
  const nameByUserId = useMemo(() => {
    const m = new Map()
    for (const p of myPartners) m.set(p.user_id, p.partner_name || p.partner_email)
    return m
  }, [myPartners])

  function senderLabel(r) {
    return nameByUserId.get(r.from_user_id) || 'Partner'
  }

  const badge = pending.length > 0 ? `${pending.length}` : null

  return (
    <WidgetCard id="theAsk" tone="rose" title="The Ask" badge={badge}>
      {incoming.length === 0 ? (
        <div className="py-3 text-center text-text-muted text-sm">
          {myPartners.length === 0
            ? 'Add a partner in Settings to start receiving requests.'
            : 'No requests yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-rose mb-1.5">Pending</div>
              <ul className="space-y-1.5">
                {pending.map((r) => (
                  <li key={r.id} className="group flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                    <button
                      onClick={() => markDone(r.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-rose/50 hover:border-rose hover:bg-rose/15 transition shrink-0"
                      title="Mark done"
                      aria-label="Mark done"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text leading-snug">{r.polished}</div>
                      <div className="text-[11px] text-text-muted leading-snug mt-0.5">
                        {senderLabel(r)} · {fmt(r.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-text-muted mb-1.5">Done</div>
              <ul className="space-y-1">
                {done.slice(0, 5).map((r) => (
                  <li key={r.id} className="group flex items-start gap-3 py-1 opacity-70">
                    <button
                      onClick={() => markPending(r.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-rose bg-rose/30 hover:bg-rose/10 transition shrink-0 flex items-center justify-center text-rose text-[10px]"
                      title="Mark not done"
                      aria-label="Mark not done"
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text-dim leading-snug line-through decoration-text-muted">{r.polished}</div>
                      <div className="text-[11px] text-text-muted leading-snug mt-0.5">
                        {senderLabel(r)} · done {fmt(r.completed_at)}
                      </div>
                    </div>
                  </li>
                ))}
                {done.length > 5 && (
                  <li className="text-[11px] text-text-muted pt-1">+ {done.length - 5} older</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  )
}

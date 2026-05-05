// Michelle's view. When the signed-in user is listed as someone's partner,
// they land here instead of the dashboard. Focused, single-purpose: a
// header that feels personal, a SendCapture block, and a collapsible
// PartnerStatus widget below.
//
// `preview` mode: rendered when ?preview=partner is on the URL and the
// signed-in user is NOT actually a partner. Used by Ken to review the
// design without needing Michelle's account. Polish API still runs;
// Send is faked; sample rows seed the Status widget.

import { supabase } from '../lib/supabase.js'
import { useStore } from '../lib/store.js'
import SendCapture from './SendCapture.jsx'
import PartnerStatus from './widgets/PartnerStatus.jsx'

const PREVIEW_RECIPIENT = { user_id: 'preview', partner_name: 'Michelle' }
const PREVIEW_SAMPLE_REQUESTS = [
  {
    id: 'preview-pending-1',
    polished: 'Pick up bread on the way home tonight.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    completed_at: null,
  },
  {
    id: 'preview-done-1',
    polished: 'Remind me to call mom tomorrow.',
    status: 'done',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

export default function PartnerMode({ preview = false }) {
  const partnersListingMe = useStore((s) => s.partnersListingMe)
  const recipient = preview ? PREVIEW_RECIPIENT : (partnersListingMe[0] || null)
  const myDisplayName = recipient?.partner_name || 'You'

  async function signOut() {
    if (preview) {
      // Drop the preview param and reload back to the dashboard.
      const url = new URL(window.location.href)
      url.searchParams.delete('preview')
      window.location.assign(url.toString())
      return
    }
    await supabase.auth.signOut()
  }

  const brandLabel = `${(myDisplayName || 'YOUR').toUpperCase()}'S MOAD`

  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {preview && (
          <div className="rounded border border-gold/40 bg-gold/[0.08] text-gold text-[11px] uppercase tracking-wider font-mono px-3 py-2 text-center">
            Preview mode · sends are faked · ?preview=partner
          </div>
        )}

        {/* Brand pill — mirrors Ken's MOAD COMMAND DECK header */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="w-1.5 h-5 bg-rose rounded-sm accent-glow-pink" />
          <span className="font-heading text-rose tracking-[0.35em] text-sm leading-none accent-glow-pink-text">
            {brandLabel}
          </span>
          <div className="w-1.5 h-5 bg-rose rounded-sm accent-glow-pink" />
        </div>

        {/* Personal greeting + sign-out */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-heading text-3xl text-rose tracking-wider leading-none truncate accent-glow-pink-text">
              Hi {myDisplayName}
            </div>
            <div className="text-[11px] text-text-muted font-mono uppercase tracking-wider mt-1">
              Send a request
            </div>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border border-border hover:border-border-strong rounded px-2 py-1"
            title={preview ? 'Exit preview' : 'Sign out'}
          >
            {preview ? 'Exit' : 'Sign Out'}
          </button>
        </header>

        {/* Send capture */}
        <SendCapture recipient={recipient} preview={preview} />

        {/* Status (collapsible) */}
        <PartnerStatus preview={preview} previewItems={PREVIEW_SAMPLE_REQUESTS} />
      </div>
    </div>
  )
}

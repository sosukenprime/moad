// Michelle's view. When the signed-in user is listed as someone's partner,
// they land here instead of the dashboard. Focused, single-purpose: a
// header that feels personal, a SendCapture block, and a collapsible
// PartnerStatus widget below.

import { supabase } from '../lib/supabase.js'
import { useStore } from '../lib/store.js'
import SendCapture from './SendCapture.jsx'
import PartnerStatus from './widgets/PartnerStatus.jsx'

export default function PartnerMode() {
  const partnersListingMe = useStore((s) => s.partnersListingMe)
  // v1: assume one partner (the first user who listed me). Multi-partner
  // routing can come later if it ever matters.
  const recipient = partnersListingMe[0] || null
  const myDisplayName = recipient?.partner_name || 'You'
  const recipientName = 'them' // we don't know Ken's display name from this side

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Personal header — feels like Hero, but for Michelle */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-1.5 h-6 bg-rose rounded-sm accent-glow-rose shrink-0" />
            <div className="min-w-0">
              <div className="font-heading text-3xl text-rose tracking-wider leading-none truncate">
                Hi {myDisplayName}
              </div>
              <div className="text-[11px] text-text-muted font-mono uppercase tracking-wider mt-1">
                Send a request
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border border-border hover:border-border-strong rounded px-2 py-1"
            title="Sign out"
          >
            Sign Out
          </button>
        </header>

        {/* Send capture */}
        <SendCapture recipient={recipient} />

        {/* Status (collapsible) */}
        <PartnerStatus />
      </div>
    </div>
  )
}

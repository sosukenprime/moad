// Michelle's view. When the signed-in user is listed as someone's partner,
// they land here instead of the dashboard. Focused, single-purpose: a
// header that feels personal, a SendCapture block, and a collapsible
// PartnerStatus widget below.
//
// `preview` mode: rendered when ?preview=partner is on the URL and the
// signed-in user is NOT actually a partner. Used by Ken to review the
// design without needing Michelle's account. Polish API still runs;
// Send is faked; sample rows seed the Status widget.
//
// `?design=1|2|3` — preview-only header design switcher. Default 1.
//   1 = Hotline (rose/pink, current)
//   2 = Console (cyan/silver, ops/comms console feel)
//   3 = Counterpart (purple, mirrors Ken's gold COMMAND DECK pattern)

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

function readDesignParam() {
  if (typeof window === 'undefined') return 1
  const n = parseInt(new URLSearchParams(window.location.search).get('design') || '1', 10)
  return n >= 1 && n <= 3 ? n : 1
}

export default function PartnerMode({ preview = false }) {
  const partnersListingMe = useStore((s) => s.partnersListingMe)
  const recipient = preview ? PREVIEW_RECIPIENT : (partnersListingMe[0] || null)
  const myDisplayName = recipient?.partner_name || 'You'
  const design = preview ? readDesignParam() : 1

  async function signOut() {
    if (preview) {
      const url = new URL(window.location.href)
      url.searchParams.delete('preview')
      url.searchParams.delete('design')
      window.location.assign(url.toString())
      return
    }
    await supabase.auth.signOut()
  }

  function setDesign(n) {
    const url = new URL(window.location.href)
    url.searchParams.set('design', String(n))
    window.location.assign(url.toString())
  }

  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {preview && (
          <div className="rounded border border-gold/40 bg-gold/[0.08] text-gold text-[11px] uppercase tracking-wider font-mono px-3 py-2 text-center">
            Preview mode · sends are faked · design {design} of 3
            <div className="flex justify-center gap-2 mt-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setDesign(n)}
                  className={
                    'w-7 h-7 rounded text-[11px] font-mono border transition ' +
                    (n === design
                      ? 'bg-gold/25 text-gold border-gold/70'
                      : 'bg-surface text-text-dim border-border hover:border-gold/40')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {design === 1 && <HeaderHotline name={myDisplayName} preview={preview} onExit={signOut} />}
        {design === 2 && <HeaderConsole name={myDisplayName} preview={preview} onExit={signOut} />}
        {design === 3 && <HeaderCounterpart name={myDisplayName} preview={preview} onExit={signOut} />}

        <SendCapture recipient={recipient} preview={preview} />

        <PartnerStatus preview={preview} previewItems={PREVIEW_SAMPLE_REQUESTS} />
      </div>
    </div>
  )
}

// ============================================================================
// Design 1 — Hotline (rose/pink). Original. Brand pill + big greeting.
// ============================================================================
function HeaderHotline({ name, preview, onExit }) {
  const brandLabel = `${(name || 'YOUR').toUpperCase()}'S MOAD HOTLINE`
  return (
    <>
      <div className="flex items-center justify-center gap-2.5 pt-1">
        <div className="w-1.5 h-5 bg-rose rounded-sm accent-glow-pink shrink-0" />
        <span className="font-heading text-rose tracking-[0.22em] text-xs sm:text-sm leading-none whitespace-nowrap">
          {brandLabel}
        </span>
        <div className="w-1.5 h-5 bg-rose rounded-sm accent-glow-pink shrink-0" />
      </div>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-heading text-3xl text-rose tracking-wider leading-none truncate">
            Hi {name}
          </div>
          <div className="text-[11px] text-text-muted font-mono uppercase tracking-wider mt-1">
            Send a request
          </div>
        </div>
        <ExitButton preview={preview} onClick={onExit} />
      </header>
    </>
  )
}

// ============================================================================
// Design 2 — Console (cyan/silver). Ops/comms console feel. Status indicator
// dot pulses; greeting reads like a terminal session. No "Hi Michelle" — uses
// "CALLING KEN" framing as the dominant element.
// ============================================================================
function HeaderConsole({ name, preview, onExit }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] font-mono pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-mint accent-glow-mint pulse-soft shrink-0" />
          <span className="text-mint">Hotline · Active</span>
        </div>
        <span className="text-text-muted shrink-0">{(name || 'guest').toUpperCase()} ↗</span>
      </div>
      <header className="flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="font-heading text-4xl text-cyan tracking-wider leading-none truncate">
            Direct Line
          </div>
          <div className="text-[11px] text-text-muted font-mono uppercase tracking-[0.2em] mt-2">
            <span className="text-cyan/80">Open</span>
            <span className="text-text-muted/60"> · channel secure</span>
          </div>
        </div>
        <ExitButton preview={preview} onClick={onExit} />
      </header>
    </>
  )
}

// ============================================================================
// Design 3 — Counterpart (purple). Mirrors Ken's gold COMMAND DECK header
// almost exactly, just in personal-purple instead. Most "branded" of the
// three; reads as a parallel deck, not a guest interface.
// ============================================================================
function HeaderCounterpart({ name, preview, onExit }) {
  const brandLabel = `${(name || 'YOUR').toUpperCase()}'S COMMAND`
  return (
    <>
      <div className="flex items-center justify-center gap-3 pt-1">
        <div className="w-1.5 h-5 bg-personal rounded-sm accent-glow-neon-purple shrink-0" />
        <span className="font-heading text-personal tracking-[0.35em] text-sm leading-none whitespace-nowrap">
          {brandLabel}
        </span>
      </div>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-heading text-3xl text-personal tracking-wider leading-none truncate">
            Hi {name}
          </div>
          <div className="text-[11px] text-text-muted font-mono uppercase tracking-wider mt-1">
            File a request
          </div>
        </div>
        <ExitButton preview={preview} onClick={onExit} />
      </header>
    </>
  )
}

function ExitButton({ preview, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border border-border hover:border-border-strong rounded px-2 py-1"
      title={preview ? 'Exit preview' : 'Sign out'}
    >
      {preview ? 'Exit' : 'Sign Out'}
    </button>
  )
}

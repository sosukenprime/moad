// Michelle's view. When the signed-in user is listed as someone's partner,
// they land here instead of the dashboard.
//
// `preview` mode: rendered when ?preview=partner is on the URL and the
// signed-in user is NOT actually a partner. Used by Ken to review the
// design without needing Michelle's account. Polish API still runs;
// Send is faked; sample rows seed the Status widget.
//
// `?design=1|2|3` — preview-only design switcher between three full-page
// design philosophies (not just color swaps):
//   1 = Sunset   — editorial / postcard (gradient hero, italic serif)
//   2 = Pulse    — voice-first minimal (huge centered mic)
//   3 = Threads  — chat-style (iMessage-feel composer + bubble status)

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

  const switcher = preview ? (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 rounded-full border border-gold/40 bg-bg-deep/85 backdrop-blur px-2 py-1 flex gap-1 items-center shadow-lg">
      <span className="text-[10px] uppercase tracking-wider font-mono text-gold/80 px-1">design</span>
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => setDesign(n)}
          className={
            'w-6 h-6 rounded-full text-[11px] font-mono border transition ' +
            (n === design
              ? 'bg-gold/30 text-gold border-gold/70'
              : 'bg-surface text-text-dim border-border hover:border-gold/40')
          }
        >
          {n}
        </button>
      ))}
    </div>
  ) : null

  if (design === 2) {
    return (
      <>
        {switcher}
        <DesignPulse name={myDisplayName} recipient={recipient} preview={preview} onExit={signOut} />
      </>
    )
  }
  if (design === 3) {
    return (
      <>
        {switcher}
        <DesignThreads name={myDisplayName} recipient={recipient} preview={preview} onExit={signOut} />
      </>
    )
  }
  return (
    <>
      {switcher}
      <DesignSunset name={myDisplayName} recipient={recipient} preview={preview} onExit={signOut} />
    </>
  )
}

// ============================================================================
// Design 1 — Sunset. Editorial postcard. Gradient hero block, italic serif
// greeting, paper-card capture surface. Warm, romantic, less "ops."
// ============================================================================
function DesignSunset({ name, recipient, preview, onExit }) {
  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-12 space-y-5">
        {/* Gradient hero — sunset stripes */}
        <div className="relative rounded-xl overflow-hidden h-32">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(244, 90, 145, 0.85) 0%, rgba(255, 138, 101, 0.7) 50%, rgba(245, 185, 66, 0.55) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/60 to-transparent" />
          <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.3em] font-mono text-white/80">
            moad · hotline
          </div>
          <div className="absolute top-3 right-3">
            <button
              onClick={onExit}
              className="text-[10px] uppercase tracking-wider font-mono text-white/85 hover:text-white border border-white/30 hover:border-white/60 rounded px-2 py-1 backdrop-blur-sm bg-bg-deep/30"
              title={preview ? 'Exit preview' : 'Sign out'}
            >
              {preview ? 'Exit' : 'Sign Out'}
            </button>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-xs uppercase tracking-[0.3em] font-mono text-white/85 mb-1.5">
              tell ken
            </div>
            <div className="font-heading text-4xl text-white tracking-wider leading-none">
              What You Want
            </div>
          </div>
        </div>

        {/* Capture wrapped in a paper-card style */}
        <div className="rounded-xl border border-rose/25 bg-rose/[0.04] p-1">
          <SendCapture recipient={recipient} preview={preview} />
        </div>

        <PartnerStatus preview={preview} previewItems={PREVIEW_SAMPLE_REQUESTS} />
      </div>
    </div>
  )
}

// ============================================================================
// Design 2 — Pulse. Voice-first minimal. The capture surface gets a wide
// breathing rose halo behind it; surrounded by negative space. Status is
// pushed to the very bottom and de-emphasized.
// ============================================================================
function DesignPulse({ name, recipient, preview, onExit }) {
  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-12 text-[10px] uppercase tracking-[0.3em] font-mono">
        <span className="text-text-muted">moad</span>
        <button
          onClick={onExit}
          className="text-text-muted hover:text-text-dim border border-border hover:border-border-strong rounded px-2 py-1"
          title={preview ? 'Exit preview' : 'Sign out'}
        >
          {preview ? 'Exit' : 'Sign Out'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-md mx-auto w-full">
        <div className="text-center space-y-2">
          <div className="text-text-dim text-xs uppercase tracking-[0.4em] font-mono">tell ken</div>
          <div className="font-heading text-4xl text-rose tracking-wider leading-none">What's up?</div>
        </div>
        {/* Capture sits inside a wide breathing halo */}
        <div className="relative w-full">
          <div
            className="absolute inset-0 -m-4 rounded-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(244, 90, 145, 0.18) 0%, transparent 60%)',
              filter: 'blur(8px)',
            }}
            aria-hidden
          />
          <div className="relative">
            <SendCapture recipient={recipient} preview={preview} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 max-w-md mx-auto w-full opacity-80">
        <PartnerStatus preview={preview} previewItems={PREVIEW_SAMPLE_REQUESTS} />
      </div>
    </div>
  )
}

// ============================================================================
// Design 3 — Threads. Chat-style. iMessage-feel composer with the recipient
// pinned at the top. Status renders as bubble thread (sent: rose right;
// done: dim gray with checkmark, left).
// ============================================================================
function DesignThreads({ name, recipient, preview, onExit }) {
  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-2 space-y-4">
        {/* Threads header — minimal routing bar */}
        <header className="flex items-center justify-between gap-3 py-2 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose/20 border border-rose/40 flex items-center justify-center text-rose font-heading text-base">
              {(name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-text-muted leading-tight">to</div>
              <div className="text-sm text-text font-bold leading-tight">Ken</div>
            </div>
          </div>
          <button
            onClick={onExit}
            className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border border-border hover:border-border-strong rounded px-2 py-1"
            title={preview ? 'Exit preview' : 'Sign out'}
          >
            {preview ? 'Exit' : 'Sign Out'}
          </button>
        </header>

        {/* Bubble-thread status */}
        <ThreadsBubbles preview={preview} />

        {/* Composer at the bottom — feels like a chat input */}
        <div className="rounded-2xl border border-rose/30 bg-bg-deep/50 p-1">
          <SendCapture recipient={recipient} preview={preview} />
        </div>
      </div>
    </div>
  )
}

function ThreadsBubbles({ preview }) {
  const real = useStore((s) => s.outgoingRequests)
  const items = preview && real.length === 0 ? PREVIEW_SAMPLE_REQUESTS : real
  if (items.length === 0) {
    return (
      <div className="text-center text-text-muted text-xs py-6">
        Nothing sent yet. Type or speak below to send Ken your first ask.
      </div>
    )
  }
  return (
    <div className="space-y-2 py-2">
      {items.slice().reverse().map((r) => {
        const isPending = r.status === 'pending'
        return (
          <div key={r.id} className={'flex ' + (isPending ? 'justify-end' : 'justify-start')}>
            <div
              className={
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug ' +
                (isPending
                  ? 'bg-rose/20 text-text rounded-br-sm border border-rose/30'
                  : 'bg-surface text-text-dim rounded-bl-sm border border-border')
              }
            >
              <div className={isPending ? '' : 'line-through decoration-text-muted/60'}>{r.polished}</div>
              <div className={'text-[10px] mt-1 num ' + (isPending ? 'text-rose/70 text-right' : 'text-text-muted')}>
                {fmt(isPending ? r.created_at : r.completed_at)}
                {!isPending && ' · ✓'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

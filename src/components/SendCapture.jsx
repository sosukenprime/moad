// SendCapture — Michelle's primary capture surface in Partner Mode.
// Type a request → polish via /api/comms (mode=polish) → preview → send.
// Three view states: 'edit' (typing), 'preview' (polished version shown,
// confirm/edit/cancel), and 'sent' (success → send another / done).

import { useState } from 'react'
import { useStore } from '../lib/store.js'

export default function SendCapture({ recipient, preview = false }) {
  const [raw, setRaw] = useState('')
  const [polished, setPolished] = useState('')
  const [view, setView] = useState('edit') // edit | preview | sent
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sendPartnerRequest = useStore((s) => s.sendPartnerRequest)

  // recipient: { user_id, partner_name } from partners row where Michelle is listed.
  // partner_name is the name Ken set ("Michelle"). We use it in the polish prompt
  // to ground the assistant on who's writing.
  const senderName = recipient?.partner_name || 'me'
  const recipientName = 'them' // partners table doesn't carry recipient's display name

  async function onPolish() {
    if (!raw.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'polish',
          message: raw.trim(),
          senderName,
          recipientName,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const out = (data?.polished || '').trim()
      if (!out) throw new Error('empty polish response')
      setPolished(out)
      setView('preview')
    } catch (err) {
      console.error('[send-capture] polish failed', err)
      setError(err.message || 'failed to polish')
    } finally {
      setBusy(false)
    }
  }

  async function onSend() {
    if (!polished.trim() || busy || !recipient?.user_id) return
    setBusy(true)
    setError('')
    try {
      if (preview) {
        // Preview mode: fake the send so Ken can see the success state without
        // writing to the real partner_requests table.
        await new Promise((resolve) => setTimeout(resolve, 400))
        setView('sent')
        return
      }
      await sendPartnerRequest({
        toUserId: recipient.user_id,
        raw: raw.trim(),
        polished: polished.trim(),
      })
      setView('sent')
    } catch (err) {
      console.error('[send-capture] send failed', err)
      setError(err.message || 'failed to send')
    } finally {
      setBusy(false)
    }
  }

  function backToEdit() {
    setView('edit')
    setError('')
  }

  function reset() {
    setRaw('')
    setPolished('')
    setView('edit')
    setError('')
  }

  if (view === 'sent') {
    return (
      <div className="glass rounded-lg p-6 space-y-5 text-center">
        <div className="font-heading text-3xl text-rose tracking-wider">Sent ✓</div>
        <div className="rounded border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-text">
          {polished}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={reset}
            className="flex-1 text-xs uppercase tracking-wider font-mono rounded px-4 py-2 bg-rose/15 text-rose border border-rose/40 hover:border-rose/70 transition"
          >
            Send Another
          </button>
        </div>
      </div>
    )
  }

  if (view === 'preview') {
    return (
      <div className="glass rounded-lg p-6 space-y-4">
        <div className="text-[11px] uppercase tracking-wider text-text-dim font-mono text-center">
          Preview before sending
        </div>
        <div className="rounded border border-rose/30 bg-rose/5 px-4 py-4 text-base text-text">
          {polished}
        </div>
        <div className="flex gap-2">
          <button
            onClick={backToEdit}
            disabled={busy}
            className="flex-1 text-xs uppercase tracking-wider font-mono rounded px-3 py-2 bg-surface text-text-dim border border-border hover:border-border-strong transition"
          >
            Edit
          </button>
          <button
            onClick={onSend}
            disabled={busy}
            className="flex-[2] text-xs uppercase tracking-wider font-mono rounded px-4 py-2 bg-rose/20 text-rose border border-rose/50 hover:border-rose/80 disabled:opacity-50 transition"
          >
            {busy ? 'Sending…' : 'Send →'}
          </button>
        </div>
        {error && <div className="text-xs text-coral text-center">{error}</div>}
      </div>
    )
  }

  return (
    <div className="glass rounded-lg p-6 space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-text-dim font-mono">
        New request
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="What do you need?"
        rows={4}
        autoFocus
        className="w-full bg-bg-deep/60 border border-border focus:border-rose/50 focus:ring-1 focus:ring-rose/40 outline-none rounded px-3 py-3 text-base text-text placeholder:text-text-muted resize-y"
        disabled={busy}
      />
      <button
        onClick={onPolish}
        disabled={busy || !raw.trim()}
        className="w-full text-xs uppercase tracking-wider font-mono rounded px-4 py-3 bg-rose/15 text-rose border border-rose/40 hover:border-rose/70 disabled:opacity-40 transition"
      >
        {busy ? 'Polishing…' : 'Polish & Preview →'}
      </button>
      {error && <div className="text-xs text-coral text-center">{error}</div>}
      {!recipient?.user_id && !preview && (
        <div className="text-[11px] text-text-muted text-center pt-1">
          You're not paired with anyone yet. Ask them to add your email under Settings → Partner.
        </div>
      )}
    </div>
  )
}

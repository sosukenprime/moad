// SendCapture — Michelle's primary capture surface in Partner Mode.
// Speak or type a request → polish via /api/comms (mode=polish) → preview → send.
// Three view states: 'edit' (typing), 'preview' (polished version shown,
// confirm/edit/cancel), and 'sent' (success → send another / done).

import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.js'

export default function SendCapture({ recipient, preview = false }) {
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState([]) // parsed polished items
  const [view, setView] = useState('edit') // edit | preview | sent
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const sendPartnerRequest = useStore((s) => s.sendPartnerRequest)

  // recipient: { user_id, partner_name } from partners row where Michelle is listed.
  // partner_name is the name Ken set ("Michelle"). We use it in the polish prompt
  // to ground the assistant on who's writing.
  const senderName = recipient?.partner_name || 'me'
  const recipientName = 'them' // partners table doesn't carry recipient's display name

  const speechSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  async function polishText(text) {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'polish',
          message: trimmed,
          senderName,
          recipientName,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const data = await res.json()
      // Accept new {items:[...]} shape or legacy {polished:"..."}.
      let parsed = []
      if (Array.isArray(data?.items)) parsed = data.items.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      else if (typeof data?.polished === 'string' && data.polished.trim()) parsed = [data.polished.trim()]
      if (parsed.length === 0) throw new Error('empty polish response')
      setItems(parsed)
      setView('preview')
    } catch (err) {
      console.error('[send-capture] polish failed', err)
      setError(err.message || 'failed to polish')
    } finally {
      setBusy(false)
    }
  }

  function onPolish() {
    polishText(raw)
  }

  function startListening() {
    if (!speechSupported || busy) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let s = ''
      for (const r of e.results) s += r[0].transcript
      setRaw(s)
    }
    rec.onerror = (err) => {
      console.warn('[send-capture] speech error', err)
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      // auto-polish if speech captured something — saves a tap
      setRaw((current) => {
        if (current.trim()) polishText(current)
        return current
      })
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  function stopListening() {
    recRef.current?.stop()
  }

  useEffect(() => {
    return () => {
      try { recRef.current?.stop() } catch {}
    }
  }, [])

  async function onSend() {
    if (items.length === 0 || busy || !recipient?.user_id) return
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
      // Send each item as its own row. Sequential to keep ordering stable.
      for (const polished of items) {
        await sendPartnerRequest({
          toUserId: recipient.user_id,
          raw: raw.trim(),
          polished,
        })
      }
      setView('sent')
    } catch (err) {
      console.error('[send-capture] send failed', err)
      setError(err.message || 'failed to send')
    } finally {
      setBusy(false)
    }
  }

  function removeItem(index) {
    setItems((arr) => arr.filter((_, i) => i !== index))
  }

  function updateItem(index, value) {
    setItems((arr) => arr.map((s, i) => (i === index ? value : s)))
  }

  function backToEdit() {
    setView('edit')
    setError('')
  }

  function reset() {
    setRaw('')
    setItems([])
    setView('edit')
    setError('')
  }

  if (view === 'sent') {
    const count = items.length
    return (
      <div className="glass rounded-lg p-6 space-y-4 text-center">
        <div className="font-heading text-3xl text-rose tracking-wider">Sent ✓</div>
        <div className="text-xs text-text-muted">
          {count === 1 ? '1 request sent' : `${count} requests sent`}
        </div>
        <ul className="space-y-1.5 text-left">
          {items.map((s, i) => (
            <li key={i} className="rounded border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-text">
              {s}
            </li>
          ))}
        </ul>
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
    const count = items.length
    return (
      <div className="glass rounded-lg p-6 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-text-dim font-mono text-center">
          {count === 1 ? 'Preview before sending' : `Heard ${count} requests — review before sending`}
        </div>
        <ul className="space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className="group flex items-start gap-2 rounded border border-rose/30 bg-rose/5 px-3 py-2">
              <input
                value={s}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text"
              />
              {count > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="shrink-0 text-text-muted hover:text-coral text-xs px-1"
                  aria-label="Remove"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 pt-1">
          <button
            onClick={backToEdit}
            disabled={busy}
            className="flex-1 text-xs uppercase tracking-wider font-mono rounded px-3 py-2 bg-surface text-text-dim border border-border hover:border-border-strong transition"
          >
            Back
          </button>
          <button
            onClick={onSend}
            disabled={busy || items.length === 0}
            className="flex-[2] text-xs uppercase tracking-wider font-mono rounded px-4 py-2 bg-rose/20 text-rose border border-rose/50 hover:border-rose/80 disabled:opacity-50 transition"
          >
            {busy ? 'Sending…' : count === 1 ? 'Send →' : `Send ${count} →`}
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
        placeholder={speechSupported ? 'Speak or type…' : 'What do you need?'}
        rows={4}
        autoFocus
        className="w-full bg-bg-deep/60 border border-border focus:border-rose/50 focus:ring-1 focus:ring-rose/40 outline-none rounded px-3 py-3 text-base text-text placeholder:text-text-muted resize-y"
        disabled={busy || listening}
      />
      <div className="flex items-center gap-2">
        {speechSupported && (
          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={busy}
            aria-label={listening ? 'Stop' : 'Speak'}
            title={listening ? 'Stop listening' : 'Speak'}
            className={
              'shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition border ' +
              (listening
                ? 'bg-rose/25 text-rose border-rose/70 animate-pulse accent-glow-rose'
                : 'bg-rose/10 text-rose/80 border-rose/40 hover:bg-rose/20 hover:text-rose hover:border-rose/70')
            }
          >
            {listening ? '●' : '🎤'}
          </button>
        )}
        <button
          onClick={onPolish}
          disabled={busy || listening || !raw.trim()}
          className="flex-1 text-xs uppercase tracking-wider font-mono rounded px-4 py-3 bg-rose/15 text-rose border border-rose/40 hover:border-rose/70 disabled:opacity-40 transition"
        >
          {busy ? 'Polishing…' : listening ? 'Listening…' : 'Polish & Preview →'}
        </button>
      </div>
      {error && <div className="text-xs text-coral text-center">{error}</div>}
      {!recipient?.user_id && !preview && (
        <div className="text-[11px] text-text-muted text-center pt-1">
          You're not paired with anyone yet. Ask them to add your email under Settings → Partner.
        </div>
      )}
    </div>
  )
}

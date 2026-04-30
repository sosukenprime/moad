import { useEffect, useRef, useState } from 'react'
import WidgetCard from './WidgetCard.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'

export default function Comms() {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const addLooseEndsBatch = useStore((s) => s.addLooseEndsBatch)
  const toast = useUI((u) => u.toast)

  // Web Speech API (best-effort; not all browsers support)
  const speechSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  function startListening() {
    if (!speechSupported) {
      toast('Voice not supported on this browser', 'error')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let s = ''
      for (const r of e.results) s += r[0].transcript
      setText(s)
    }
    rec.onerror = (e) => {
      console.warn('[comms] speech error', e)
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      // auto-submit if we got something
      setText((current) => {
        if (current.trim()) submit(current)
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

  async function submit(value) {
    const message = (value ?? text).trim()
    if (!message || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, today: new Date().toISOString().slice(0, 10) }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const items = Array.isArray(data.items) ? data.items : []
      if (items.length === 0) {
        toast('No items parsed', 'warn')
      } else {
        addLooseEndsBatch(items)
        toast(data.reply || `Added ${items.length} item${items.length === 1 ? '' : 's'}`, 'success')
      }
      setText('')
    } catch (err) {
      console.error('[comms] submit failed', err)
      toast(`Comms error: ${err.message || 'failed'}`, 'error')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    return () => {
      try { recRef.current?.stop() } catch {}
    }
  }, [])

  return (
    <WidgetCard tone="silver" title="Comms">
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Speak or type. I'll capture it into Loose Ends."
          rows={3}
          className="w-full bg-bg-deep/60 border border-border focus:border-silver/50 focus:ring-1 focus:ring-silver/40 outline-none rounded px-3 py-2 text-sm text-text placeholder:text-text-muted resize-y"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={sending}
            className={
              'text-xs uppercase tracking-wider font-mono rounded px-3 py-1.5 border transition ' +
              (listening
                ? 'bg-coral/15 text-coral border-coral/50 animate-pulse'
                : 'bg-surface text-text-dim border-border hover:border-border-strong')
            }
            title="Voice (Web Speech API)"
          >
            {listening ? '● Listening…' : '🎤 Voice'}
          </button>
          <button
            onClick={() => submit()}
            disabled={sending || !text.trim()}
            className="text-xs uppercase tracking-wider font-mono rounded px-4 py-1.5 bg-silver/15 text-silver border border-silver/40 hover:border-silver/70 disabled:opacity-40 disabled:hover:border-silver/40 transition"
          >
            {sending ? 'Sending…' : 'Send →'}
          </button>
        </div>
      </div>
    </WidgetCard>
  )
}

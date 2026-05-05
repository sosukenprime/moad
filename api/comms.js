// Vercel serverless function — proxies the user's capture text to Anthropic.
// Server-side only. Reads ANTHROPIC_API_KEY from process.env.
// In dev, served by a tiny Vite plugin (see vite.config.js).
//
// Modes:
//   default ("capture"): parses input into Loose End items
//   "polish": rewrites a partner's request as a terse, just-the-facts ask

const MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

function buildCaptureSystemPrompt(today) {
  return [
    "You are MOAD's capture assistant. The user will speak or type things they need to remember or do. Parse their input into individual items.",
    "",
    `Today's date: ${today}`,
    "",
    "Each item should have:",
    "- text: the action or thing, written cleanly (e.g., \"Schedule vet appointment for Cooper\")",
    "- dueDate: YYYY-MM-DD if a date is mentioned or implied (\"tomorrow\", \"Friday\", \"next week\"), else null",
    "- priority: \"high\" if urgency is signaled (\"urgent\", \"ASAP\", \"important\"), else \"medium\"",
    "",
    "Multiple items in one message → split into separate items.",
    "Don't ask clarifying questions — just parse and return.",
    "",
    'Return strict JSON, no markdown:',
    '{',
    '  "items": [',
    '    { "text": "...", "dueDate": "YYYY-MM-DD" | null, "priority": "high" | "medium" }',
    '  ],',
    '  "reply": "Short confirmation, e.g. \'Added 3 items to Loose Ends\'"',
    '}',
  ].join('\n')
}

function buildPolishSystemPrompt(senderName, recipientName) {
  const sender = senderName || 'the sender'
  const recipient = recipientName || 'the recipient'
  return [
    `You are rewriting a casual message from ${sender} into a brief, just-the-facts request directed at ${recipient}.`,
    "",
    "Rules:",
    "- Strip filler words, greetings, and apologies.",
    "- Keep it terse — todo-style, like a sticky note.",
    "- Preserve any concrete details (places, times, items).",
    "- Do NOT add information that wasn't in the input.",
    "- Output ONE line, under 100 characters when possible.",
    "",
    "Examples:",
    'Input: "hey could u maybe pick up some bread on the way home tonight pleaaaase"',
    'Output: "Bread on the way home tonight."',
    "",
    'Input: "babe pls remind me to call my mom tomorrow"',
    'Output: "Remind me to call mom tomorrow."',
    "",
    'Return strict JSON, no markdown:',
    '{ "polished": "..." }',
  ].join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'POST only' }))
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set on server' }))
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const mode = (body && body.mode) === 'polish' ? 'polish' : 'capture'
  const message = (body && body.message ? String(body.message) : '').trim()
  const today = (body && body.today) || new Date().toISOString().slice(0, 10)
  const senderName = body && body.senderName ? String(body.senderName) : ''
  const recipientName = body && body.recipientName ? String(body.recipientName) : ''
  if (!message) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'message is required' }))
    return
  }

  const systemPrompt = mode === 'polish'
    ? buildPolishSystemPrompt(senderName, recipientName)
    : buildCaptureSystemPrompt(today)

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: mode === 'polish' ? 256 : 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })
    if (!r.ok) {
      const errText = await r.text()
      console.error('[api/comms] anthropic error', r.status, errText)
      res.statusCode = r.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `Anthropic ${r.status}`, detail: errText }))
      return
    }
    const data = await r.json()
    const content = (data.content || []).map((c) => c.text).filter(Boolean).join('')
    let parsed = null
    try {
      parsed = JSON.parse(content)
    } catch {
      const m = content.match(/\{[\s\S]*\}/)
      if (m) {
        try { parsed = JSON.parse(m[0]) } catch {}
      }
    }
    if (mode === 'polish') {
      if (!parsed || typeof parsed.polished !== 'string' || !parsed.polished.trim()) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Could not parse model response', raw: content }))
        return
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ polished: parsed.polished.trim() }))
      return
    }
    if (!parsed || !Array.isArray(parsed.items)) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Could not parse model response', raw: content }))
      return
    }
    const items = parsed.items
      .filter((it) => it && typeof it.text === 'string' && it.text.trim())
      .map((it) => ({
        text: String(it.text).trim(),
        dueDate: it.dueDate || null,
        priority: it.priority === 'high' ? 'high' : 'medium',
      }))
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ items, reply: parsed.reply || `Added ${items.length} item${items.length === 1 ? '' : 's'} to Loose Ends` }))
  } catch (err) {
    console.error('[api/comms] failed', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message || 'unknown error' }))
  }
}

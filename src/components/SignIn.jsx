import { useState } from 'react'
import { supabase, HAS_SUPABASE_CONFIG } from '../lib/supabase.js'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-1.5 h-5 bg-gold rounded-sm accent-glow-gold" />
          <span className="font-heading text-gold tracking-[0.35em] text-sm leading-none">
            MOAD COMMAND DECK
          </span>
        </div>

        {!HAS_SUPABASE_CONFIG && (
          <div className="mb-4 p-3 rounded border border-coral/40 bg-coral/10 text-xs text-coral">
            Supabase not configured. Set <code className="num">VITE_SUPABASE_URL</code> and{' '}
            <code className="num">VITE_SUPABASE_ANON_KEY</code> env vars and redeploy.
          </div>
        )}

        {status === 'sent' ? (
          <div className="glass rounded-lg p-5 text-center text-sm space-y-3">
            <div className="font-heading text-2xl text-gold tracking-wider">Check Your Email</div>
            <p className="text-text-dim">
              We sent a sign-in link to{' '}
              <span className="text-text font-bold break-all">{email}</span>
            </p>
            <p className="text-xs text-text-muted">
              Tap the link in the email and you'll be brought back here signed in.
              Same email on phone + desktop = same data, synced live.
            </p>
            <button
              onClick={() => {
                setStatus('idle')
                setEmail('')
              }}
              className="text-[11px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border-t border-border pt-3 mt-3 w-full"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="glass rounded-lg p-5 space-y-3">
            <label className="block text-[11px] uppercase tracking-wider text-text-dim font-mono">
              Email
            </label>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg-deep/60 border border-border focus:border-gold/50 focus:ring-1 focus:ring-gold/40 outline-none rounded px-3 py-2 text-sm text-text placeholder:text-text-muted"
              disabled={status === 'sending' || !HAS_SUPABASE_CONFIG}
            />
            <button
              type="submit"
              disabled={status === 'sending' || !email.trim() || !HAS_SUPABASE_CONFIG}
              className="w-full text-xs uppercase tracking-wider font-mono rounded px-4 py-2 bg-gold/15 text-gold border border-gold/40 hover:border-gold/70 disabled:opacity-40 transition"
            >
              {status === 'sending' ? 'Sending…' : 'Send Sign-In Link →'}
            </button>
            {error && <div className="text-xs text-coral">{error}</div>}
            <p className="text-[11px] text-text-muted text-center pt-2">
              Magic link via email. No password. Sign in on any device with the same email — your data follows.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

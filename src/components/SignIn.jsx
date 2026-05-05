import { useState } from 'react'
import { supabase, HAS_SUPABASE_CONFIG } from '../lib/supabase.js'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // email | code
  const [status, setStatus] = useState('idle') // idle | sending | verifying
  const [error, setError] = useState('')

  async function onSendCode(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // For users who tap the link instead of entering the code.
        // The code-entry path doesn't depend on this redirect at all.
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      setError(error.message)
      setStatus('idle')
    } else {
      setStep('code')
      setStatus('idle')
    }
  }

  async function onVerifyCode(e) {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed.length < 6 || trimmed.length > 10) return
    setStatus('verifying')
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: 'email',
    })
    if (error) {
      setError(error.message)
      setStatus('idle')
    }
    // On success, App.jsx onAuthStateChange picks up the session and the
    // dashboard renders. Nothing else to do here.
  }

  function startOver() {
    setStep('email')
    setCode('')
    setError('')
    setStatus('idle')
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

        {step === 'code' ? (
          <form onSubmit={onVerifyCode} className="glass rounded-lg p-5 space-y-3">
            <div className="font-heading text-2xl text-gold tracking-wider text-center">Enter Code</div>
            <p className="text-xs text-text-muted text-center">
              We sent a code to{' '}
              <span className="text-text-dim font-bold break-all">{email}</span>.
              Type it below.
            </p>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim font-mono">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              autoFocus
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="000000"
              className="w-full bg-bg-deep/60 border border-border focus:border-gold/50 focus:ring-1 focus:ring-gold/40 outline-none rounded px-3 py-3 text-2xl text-text placeholder:text-text-muted text-center tracking-[0.35em] num"
              disabled={status === 'verifying'}
            />
            <button
              type="submit"
              disabled={status === 'verifying' || code.length < 6}
              className="w-full text-xs uppercase tracking-wider font-mono rounded px-4 py-2 bg-gold/15 text-gold border border-gold/40 hover:border-gold/70 disabled:opacity-40 transition"
            >
              {status === 'verifying' ? 'Verifying…' : 'Sign In →'}
            </button>
            {error && <div className="text-xs text-coral text-center">{error}</div>}
            <button
              type="button"
              onClick={startOver}
              className="block text-[11px] uppercase tracking-wider font-mono text-text-muted hover:text-text-dim border-t border-border pt-3 mt-3 w-full text-center"
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={onSendCode} className="glass rounded-lg p-5 space-y-3">
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
              {status === 'sending' ? 'Sending…' : 'Send Code →'}
            </button>
            {error && <div className="text-xs text-coral">{error}</div>}
            <p className="text-[11px] text-text-muted text-center pt-2">
              We'll email a 6-digit code. Type it on this device — works on any phone or browser. Same email = same data, synced live.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

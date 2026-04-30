import { useUI } from '../lib/ui.js'

export default function Toasts() {
  const toasts = useUI((u) => u.toasts)
  const dismiss = useUI((u) => u.dismissToast)
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={
            'pointer-events-auto px-4 py-2 rounded glass text-sm shadow-lg border ' +
            (t.tone === 'error'
              ? 'border-coral/50 text-coral'
              : t.tone === 'success'
              ? 'border-mint/50 text-mint'
              : t.tone === 'warn'
              ? 'border-gold/50 text-gold'
              : 'border-border text-text')
          }
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}

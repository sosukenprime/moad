import { useEffect } from 'react'
import { useUI } from '../../lib/ui.js'

export default function Modal({ title, tone = 'gold', children, onClose, footer }) {
  const closeModal = useUI((u) => u.closeModal)
  const close = onClose || closeModal

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [close])

  const stripe = {
    gold: 'bg-gold', cyan: 'bg-cyan', work: 'bg-work',
    coral: 'bg-coral', mint: 'bg-mint', creative: 'bg-creative', personal: 'bg-personal',
    rose: 'bg-rose', silver: 'bg-silver',
  }[tone] || 'bg-gold'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center sm:items-center justify-center p-3 sm:p-6 bg-bg-deep/80 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md glass rounded-lg overflow-hidden"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${stripe}`} />
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-heading text-2xl tracking-wider text-text">{title}</h3>
          <button onClick={close} className="text-text-muted hover:text-text-dim text-lg" aria-label="Close">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function ModalInput(props) {
  return (
    <input
      {...props}
      className={
        'w-full bg-bg-deep/60 border border-border focus:border-gold/50 focus:ring-1 focus:ring-gold/40 outline-none rounded px-3 py-2 text-sm text-text placeholder:text-text-muted ' +
        (props.className || '')
      }
    />
  )
}

export function ModalLabel({ children, className = '' }) {
  return <label className={'block text-[11px] uppercase tracking-wider text-text-dim font-mono mb-1 ' + className}>{children}</label>
}

export function ModalBtn({ tone = 'gold', children, ...rest }) {
  const cls = {
    gold:  'border-gold/50 text-gold hover:bg-gold/10',
    cyan:  'border-cyan/50 text-cyan hover:bg-cyan/10',
    coral: 'border-coral/50 text-coral hover:bg-coral/10',
    work:  'border-work/50 text-work hover:bg-work/10',
    mint:  'border-mint/50 text-mint hover:bg-mint/10',
    creative: 'border-creative/50 text-creative hover:bg-creative/10',
    personal: 'border-personal/50 text-personal hover:bg-personal/10',
    rose:  'border-rose/50 text-rose hover:bg-rose/10',
    ghost: 'border-border text-text-dim hover:bg-surface',
  }[tone] || 'border-gold/50 text-gold hover:bg-gold/10'
  return (
    <button
      {...rest}
      className={`text-xs uppercase tracking-wider font-mono rounded px-4 py-1.5 border transition disabled:opacity-40 ${cls} ${rest.className || ''}`}
    >
      {children}
    </button>
  )
}

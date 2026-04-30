// Shared widget shell: 3px left accent stripe with glow, integrated header,
// subtle accent wash, glass body. NOT a floating heading above a plain card.

const TONE = {
  cyan:     { stripe: 'bg-cyan',     glow: 'accent-glow-cyan',     text: 'text-cyan',     wash: 'from-cyan/[0.10]'     },
  gold:     { stripe: 'bg-gold',     glow: 'accent-glow-gold',     text: 'text-gold',     wash: 'from-gold/[0.10]'     },
  work:     { stripe: 'bg-work',     glow: 'accent-glow-work',     text: 'text-work',     wash: 'from-work/[0.10]'     },
  coral:    { stripe: 'bg-coral',    glow: 'accent-glow-coral',    text: 'text-coral',    wash: 'from-coral/[0.10]'    },
  mint:     { stripe: 'bg-mint',     glow: 'accent-glow-mint',     text: 'text-mint',     wash: 'from-mint/[0.10]'     },
  creative: { stripe: 'bg-creative', glow: 'accent-glow-creative', text: 'text-creative', wash: 'from-creative/[0.10]' },
  personal: { stripe: 'bg-personal', glow: 'accent-glow-personal', text: 'text-personal', wash: 'from-personal/[0.10]' },
  rose:     { stripe: 'bg-rose',     glow: 'accent-glow-rose',     text: 'text-rose',     wash: 'from-rose/[0.12]'     },
  silver:   { stripe: 'bg-white',    glow: 'accent-glow-silver',   text: 'text-silver',   wash: 'from-silver/[0.10]'   },
}

export default function WidgetCard({ tone = 'gold', title, badge, action, children, className = '' }) {
  const t = TONE[tone] || TONE.gold

  return (
    <section className={'relative glass rounded-lg overflow-hidden h-full ' + className}>
      {/* left accent stripe with glow */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${t.stripe} ${t.glow}`} />

      {/* header with subtle accent wash */}
      <div className={`relative bg-gradient-to-r ${t.wash} to-transparent`}>
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className={`font-heading text-2xl tracking-wider ${t.text}`}>{title}</h2>
            {badge != null && <span className="text-xs num text-text-muted">{badge}</span>}
          </div>
          {action != null && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4">
        {children}
      </div>
    </section>
  )
}

// Hexagon checkbox — clip-path polygon. Tone matches accent.

const RING = {
  gold: 'bg-gold',
  cyan: 'bg-cyan',
  mint: 'bg-mint',
  coral: 'bg-coral',
  work: 'bg-work',
  personal: 'bg-personal',
  creative: 'bg-creative',
}

export default function HexCheckbox({ checked, onChange, tone = 'gold', size = 18, label }) {
  const fill = RING[tone] || RING.gold
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label || (checked ? 'Mark incomplete' : 'Mark complete')}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.(!checked)
      }}
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="hex absolute inset-0 bg-border-strong"
      />
      <span
        className={`hex absolute inset-[2px] ${checked ? fill : 'bg-bg-deep'}`}
      />
      {checked && (
        <svg className="relative" width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <path d="M2 6.2L4.8 9 10 3" stroke="#0A0E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

import { useState } from 'react'
import { useUI } from '../lib/ui.js'

const ACTIONS = [
  { name: 'addTask',     label: 'Task',      tone: 'gold',     icon: '✓' },
  { name: 'addLooseEnd', label: 'Loose End', tone: 'personal', icon: '~' },
  { name: 'addMission',  label: 'Mission',   tone: 'work',     icon: '🎯' },
  { name: 'addDeadline', label: 'Deadline',  tone: 'coral',    icon: '📅' },
  { name: 'addHabit',    label: 'Habit',     tone: 'mint',     icon: '🔥' },
  { name: 'addLab',      label: 'Lab Idea',  tone: 'creative', icon: '✦' },
]

const TONE_BG = {
  gold: 'bg-gold text-bg-deep',
  work: 'bg-work text-bg-deep',
  coral: 'bg-coral text-bg-deep',
  mint: 'bg-mint text-bg-deep',
  creative: 'bg-creative text-bg-deep',
  personal: 'bg-personal text-bg-deep',
}

export default function Fab() {
  const [open, setOpen] = useState(false)
  const openModal = useUI((u) => u.openModal)
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in">
          {ACTIONS.map((a) => (
            <button
              key={a.name}
              onClick={() => { openModal(a.name); setOpen(false) }}
              className="flex items-center gap-2 group"
            >
              <span className="text-xs uppercase tracking-wider font-mono px-2 py-1 rounded bg-surface-solid border border-border text-text-dim group-hover:text-text">
                {a.label}
              </span>
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${TONE_BG[a.tone] || TONE_BG.gold}`}>
                {a.icon}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={'w-14 h-14 rounded-full bg-gold text-bg-deep font-bold text-2xl shadow-lg transition ' + (open ? 'rotate-45' : '')}
        aria-label={open ? 'Close menu' : 'Add'}
      >
        +
      </button>
    </div>
  )
}

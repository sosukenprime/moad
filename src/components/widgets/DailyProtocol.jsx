import WidgetCard from './WidgetCard.jsx'
import HexCheckbox from './HexCheckbox.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'

export default function DailyProtocol() {
  const habits = useStore((s) => s.habits)
  const userStreak = useStore((s) => s.user.streak)
  const toggleHabitToday = useStore((s) => s.toggleHabitToday)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const openModal = useUI((u) => u.openModal)
  const today = useUI((u) => u.today)

  return (
    <WidgetCard
      tone="mint"
      title="Daily Protocol"
      badge={userStreak > 0 ? `🔥 ${userStreak}d` : null}
      action={
        <button
          onClick={() => openModal('addHabit')}
          className="text-xs uppercase tracking-wider font-mono text-mint/80 hover:text-mint border border-mint/30 hover:border-mint/60 rounded px-2 py-1"
        >
          + Add
        </button>
      }
    >
      {habits.length === 0 ? (
        <div className="py-4 text-center text-text-muted text-sm">
          No habits yet. Add one to start a streak.
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const doneToday = h.lastCompleted === today
            return (
              <li key={h.id} className="group flex items-center gap-3 py-1">
                <HexCheckbox
                  checked={doneToday}
                  tone="mint"
                  onChange={() => toggleHabitToday(h.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className={'text-sm ' + (doneToday ? 'text-text-muted' : 'text-text')}>
                    {h.name}
                  </div>
                </div>
                {h.streak > 0 && (
                  <div className="text-[11px] num text-mint/80 shrink-0">🔥 {h.streak}d</div>
                )}
                <button
                  onClick={() => deleteHabit(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-coral text-xs"
                  aria-label="Delete habit"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetCard>
  )
}

import { useEffect } from 'react'
import { useStore } from './lib/store.js'
import { useUI } from './lib/ui.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useDateRollover } from './hooks/useDateRollover.js'
import Hero from './components/Hero.jsx'
import LayoutGrid from './components/LayoutGrid.jsx'
import ActiveModal from './components/modals/index.jsx'
import Toasts from './components/Toasts.jsx'
import Fab from './components/Fab.jsx'

export default function App() {
  const initialized = useStore((s) => s.initialized)
  const init = useStore((s) => s.init)
  const layoutEdit = useUI((u) => u.layoutEdit)
  const toggleLayoutEdit = useUI((u) => u.toggleLayoutEdit)
  const openModal = useUI((u) => u.openModal)

  useKeyboardShortcuts()
  useDateRollover()

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-dim font-mono text-sm">
        Booting MOAD…
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Hero />
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={toggleLayoutEdit}
            className={
              'text-[11px] uppercase tracking-wider font-mono rounded px-2.5 py-1 border ' +
              (layoutEdit
                ? 'bg-gold/15 text-gold border-gold/40'
                : 'bg-surface text-text-muted border-border hover:border-border-strong')
            }
            title="Edit layout (E)"
          >
            {layoutEdit ? '◉ Edit' : '○ Edit'}
          </button>
          <button
            onClick={() => openModal('help')}
            className="text-[11px] uppercase tracking-wider font-mono rounded px-2.5 py-1 border bg-surface text-text-muted border-border hover:border-border-strong"
            title="Keyboard (?)"
          >
            ?
          </button>
          <button
            onClick={() => openModal('settings')}
            className="text-[11px] uppercase tracking-wider font-mono rounded px-2.5 py-1 border bg-surface text-text-muted border-border hover:border-border-strong"
          >
            ⚙
          </button>
        </div>
        <main className="mt-4">
          <LayoutGrid />
        </main>
      </div>
      <Fab />
      <Toasts />
      <ActiveModal />
    </div>
  )
}

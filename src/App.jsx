import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { useStore } from './lib/store.js'
import { useUI } from './lib/ui.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useDateRollover } from './hooks/useDateRollover.js'
import Hero from './components/Hero.jsx'
import LayoutGrid from './components/LayoutGrid.jsx'
import ActiveModal from './components/modals/index.jsx'
import Toasts from './components/Toasts.jsx'
import Fab from './components/Fab.jsx'
import SignIn from './components/SignIn.jsx'

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [session, setSession] = useState(null)
  const initialized = useStore((s) => s.initialized)
  const init = useStore((s) => s.init)
  const teardown = useStore((s) => s.teardown)
  const layoutEdit = useUI((u) => u.layoutEdit)
  const toggleLayoutEdit = useUI((u) => u.toggleLayoutEdit)
  const openModal = useUI((u) => u.openModal)

  useKeyboardShortcuts()
  useDateRollover()

  // Auth lifecycle: detect existing session, then react to changes.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setSession(session)
      setAuthLoading(false)
      if (session) init(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return
      setSession(newSession)
      setAuthLoading(false)
      if (newSession) init(newSession.user.id)
      else teardown()
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [init, teardown])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-dim font-mono text-sm">
        Authenticating…
      </div>
    )
  }

  if (!session) {
    return <SignIn />
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-dim font-mono text-sm">
        Loading your dashboard…
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

import { useEffect } from 'react'
import { useStore } from '../lib/store.js'
import { useUI } from '../lib/ui.js'

export function useKeyboardShortcuts() {
  const toggleFocusMode = useStore((s) => s.toggleFocusMode)
  const toggleLayoutEdit = useUI((u) => u.toggleLayoutEdit)
  const openModal = useUI((u) => u.openModal)
  const modal = useUI((u) => u.modal)

  useEffect(() => {
    function onKey(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (modal) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openModal('addTask')
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        toggleLayoutEdit()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFocusMode()
      } else if (e.key === '?') {
        e.preventDefault()
        openModal('help')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFocusMode, toggleLayoutEdit, openModal, modal])
}

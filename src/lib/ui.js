// Lightweight UI store for ephemeral things: modals, toasts, focus mode visibility,
// the current calendar day (updated at midnight by useDateRollover so anything
// showing date-relative info re-renders correctly when the day flips).

import { create } from 'zustand'
import { todayISO } from './dates.js'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const useUI = create((set, get) => ({
  modal: null,        // { name, payload } | null
  toasts: [],         // [{ id, message, tone }]
  layoutEdit: false,
  today: todayISO(),  // updated at midnight by hooks/useDateRollover

  setToday: (today) => set({ today }),

  openModal: (name, payload = null) => set({ modal: { name, payload } }),
  closeModal: () => set({ modal: null }),

  toggleLayoutEdit: () => set((s) => ({ layoutEdit: !s.layoutEdit })),
  setLayoutEdit: (v) => set({ layoutEdit: !!v }),

  toast: (message, tone = 'info') => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

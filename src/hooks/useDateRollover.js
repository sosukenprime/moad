// Updates `useUI.today` when the calendar day changes — so widgets showing
// date-relative info (Daily Protocol checkboxes, Today widget filtering,
// TodayPin button states, "1d overdue" badges) re-render at the day boundary
// without needing a manual reload.
//
// Triggers:
// 1. setTimeout aligned to next midnight (+ 5s buffer) — handles the normal case
//    of leaving the tab open across midnight.
// 2. visibilitychange / focus listeners — handles laptop sleep / tab unfocus,
//    where setTimeout would not fire on schedule.

import { useEffect } from 'react'
import { useUI } from '../lib/ui.js'
import { todayISO } from '../lib/dates.js'

export function useDateRollover() {
  useEffect(() => {
    let timeoutId

    function syncIfChanged() {
      const t = todayISO()
      if (t !== useUI.getState().today) {
        useUI.getState().setToday(t)
      }
    }

    function tick() {
      syncIfChanged()
      const now = new Date()
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 5, 0
      )
      timeoutId = setTimeout(tick, Math.max(1000, nextMidnight - now))
    }
    tick()

    function onWake() {
      // tab became visible / window focused — re-check date in case
      // setTimeout drifted across system sleep
      syncIfChanged()
      clearTimeout(timeoutId)
      tick()
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [])
}

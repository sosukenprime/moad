import { useStore } from '../lib/store.js'
import { useUI } from '../lib/ui.js'
import Comms from './widgets/Comms.jsx'
import Today from './widgets/Today.jsx'
import Missions from './widgets/Missions.jsx'
import Deadlines from './widgets/Deadlines.jsx'
import DailyProtocol from './widgets/DailyProtocol.jsx'
import Lab from './widgets/Lab.jsx'
import LooseEnds from './widgets/LooseEnds.jsx'
import TheAsk from './widgets/TheAsk.jsx'

const COMPONENT = {
  comms: Comms,
  today: Today,
  projects: Missions,
  deadlines: Deadlines,
  habits: DailyProtocol,
  lab: Lab,
  looseEnds: LooseEnds,
  theAsk: TheAsk,
}

export default function LayoutGrid() {
  const layout = useStore((s) => s.layout)
  const setLayout = useStore((s) => s.setLayout)
  const focusMode = useStore((s) => s.settings.focusMode)
  const layoutEdit = useUI((u) => u.layoutEdit)

  const visible = focusMode ? layout.filter((l) => l.id === 'today') : layout

  function move(idx, delta) {
    const next = [...layout]
    const j = idx + delta
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setLayout(next)
  }
  function toggleSize(idx) {
    const next = layout.map((l, i) => (i === idx ? { ...l, size: l.size === 'half' ? 'full' : 'half' } : l))
    setLayout(next)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map((entry) => {
        const idx = layout.findIndex((l) => l.id === entry.id)
        const C = COMPONENT[entry.id]
        if (!C) return null
        const span = entry.size === 'full' ? 'sm:col-span-2' : 'sm:col-span-1'
        return (
          <div key={entry.id} className={`relative h-full ${span}`}>
            {layoutEdit && !focusMode && (
              <div className="absolute -top-2 right-1 z-10 flex gap-1">
                <EditBtn onClick={() => move(idx, -1)} title="Move up">↑</EditBtn>
                <EditBtn onClick={() => move(idx, 1)} title="Move down">↓</EditBtn>
                <EditBtn onClick={() => toggleSize(idx)} title="Toggle width">
                  {entry.size === 'full' ? '½' : '◻︎'}
                </EditBtn>
              </div>
            )}
            <C />
          </div>
        )
      })}
    </div>
  )
}

function EditBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded bg-surface-solid border border-border-strong text-text text-xs hover:bg-bg flex items-center justify-center"
    >
      {children}
    </button>
  )
}

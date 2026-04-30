import { useMemo } from 'react'
import WidgetCard from './WidgetCard.jsx'
import HexCheckbox from './HexCheckbox.jsx'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'

export default function Today() {
  const tasks = useStore((s) => s.tasks)
  const looseEnds = useStore((s) => s.looseEnds)
  const todaySchedule = useStore((s) => s.todaySchedule)
  const projects = useStore((s) => s.projects)
  const deadlines = useStore((s) => s.deadlines)
  const lab = useStore((s) => s.lab)
  const toggleTask = useStore((s) => s.toggleTask)
  const toggleLooseEnd = useStore((s) => s.toggleLooseEnd)
  const toggleScheduleEntry = useStore((s) => s.toggleTodayScheduleEntry)
  const removeScheduleEntry = useStore((s) => s.removeTodayScheduleEntry)
  const deleteTask = useStore((s) => s.deleteTask)
  const clearTodayCompleted = useStore((s) => s.clearTodayCompleted)
  const openModal = useUI((u) => u.openModal)
  const today = useUI((u) => u.today)

  // Today shows: state.tasks + Loose Ends with inToday + todaySchedule entries for today.
  // Items "cleared from today" are hidden but kept in storage (history preserved).
  const items = useMemo(() => {
    const direct = tasks
      .filter((t) => !t.clearedFromTodayAt)
      .map((t) => ({ ...t, _kind: 'task' }))
    const mirrored = looseEnds
      .filter((l) => l.inToday)
      .map((l) => ({ ...l, _kind: 'looseEnd' }))
    const scheduled = todaySchedule
      .filter((e) => e.dateKey === today && !e.clearedFromTodayAt)
      .map((e) => {
        let source = null
        if (e.refType === 'mission')   source = projects.find((p) => p.id === e.refId)
        else if (e.refType === 'deadline') source = deadlines.find((d) => d.id === e.refId)
        else if (e.refType === 'lab')  source = lab.find((l) => l.id === e.refId)
        if (!source) return null
        const text =
          e.refType === 'mission'  ? source.name :
          e.refType === 'deadline' ? source.title :
          source.text
        // For Mission entries, surface the next step so Today shows what to actually do.
        const step = e.refType === 'mission'
          ? (source.steps?.[0]?.text || source.nextAction || null)
          : null
        return {
          id: e.id,
          text,
          step,
          completed: e.completed,
          createdAt: e.addedAt,
          _kind: 'schedule',
          _refType: e.refType,
        }
      })
      .filter(Boolean)
    return [...direct, ...mirrored, ...scheduled].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return a.createdAt < b.createdAt ? -1 : 1
    })
  }, [tasks, looseEnds, todaySchedule, projects, deadlines, lab, today])

  const total = items.length
  const done = items.filter((i) => i.completed).length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <WidgetCard
      tone="gold"
      title="Today"
      badge={total ? `${done}/${total} • ${pct}%` : null}
      action={
        <>
          {done > 0 && (
            <button
              onClick={clearTodayCompleted}
              title="Hide completed items from Today (history preserved)"
              className="text-xs uppercase tracking-wider font-mono text-text-muted hover:text-gold border border-border hover:border-gold/40 rounded px-2 py-1"
            >
              Clear Completed
            </button>
          )}
          <button
            onClick={() => openModal('addTask')}
            className="text-xs uppercase tracking-wider font-mono text-gold/80 hover:text-gold border border-gold/30 hover:border-gold/60 rounded px-2 py-1"
          >
            + Add
          </button>
        </>
      }
    >
      {total > 0 && (
        <div className="mb-3 h-1 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold/60 transition-all"
            style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(245,185,66,0.5)' }}
          />
        </div>
      )}

      {total === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item._kind}:${item.id}`} className="group flex items-center gap-3 py-1">
              <HexCheckbox
                checked={item.completed}
                tone="gold"
                onChange={() =>
                  item._kind === 'task'
                    ? toggleTask(item.id)
                    : item._kind === 'looseEnd'
                    ? toggleLooseEnd(item.id)
                    : toggleScheduleEntry(item.id)
                }
              />
              <div className="flex-1 min-w-0">
                <div
                  className={
                    'text-sm font-bold ' +
                    (item.completed ? 'text-text-muted line-through' : 'text-text')
                  }
                >
                  {item.text}
                  {item.step && (
                    <span className="font-normal italic text-text-dim">
                      : {item.step}
                    </span>
                  )}
                </div>
                {item._kind === 'looseEnd' && (
                  <div className="text-[10px] uppercase tracking-wider text-personal/70 num">
                    From Loose Ends
                  </div>
                )}
                {item._kind === 'schedule' && (
                  <div className={'text-[10px] uppercase tracking-wider num ' + scheduleSubLabelClass(item._refType)}>
                    {scheduleSubLabel(item._refType)}
                  </div>
                )}
              </div>
              {item._kind === 'task' && (
                <>
                  <button
                    onClick={() => openModal('editTask', { id: item.id })}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-dim text-xs"
                    aria-label="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteTask(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-coral text-xs"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </>
              )}
              {item._kind === 'schedule' && !item.completed && (
                <button
                  onClick={() => removeScheduleEntry(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-coral text-xs"
                  aria-label="Remove from today"
                  title="Remove from today (source not affected)"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

function scheduleSubLabel(refType) {
  if (refType === 'mission')  return 'From Active Missions'
  if (refType === 'deadline') return 'From Deadlines'
  if (refType === 'lab')      return 'From The Lab'
  return ''
}
function scheduleSubLabelClass(refType) {
  if (refType === 'mission')  return 'text-work/70'
  if (refType === 'deadline') return 'text-coral/70'
  if (refType === 'lab')      return 'text-creative/70'
  return 'text-text-muted'
}

function Empty() {
  return (
    <div className="py-6 text-center text-text-muted text-sm">
      Nothing scheduled. Add a task, mirror from Loose Ends, or schedule a Mission / Deadline / Lab item.
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../lib/store.js'
import { useUI } from '../../lib/ui.js'
import { supabase } from '../../lib/supabase.js'
import Modal, { ModalInput, ModalLabel, ModalBtn } from './Modal.jsx'

// DateField — a date input you can type into AND click anywhere on to open
// the native calendar picker. Dark-themed so the picker matches the app.
function DateField({ value, onChange, ...rest }) {
  const ref = useRef(null)
  function open(e) {
    // Don't reopen if click originated from inside the input itself —
    // the native handler already picks that up.
    const el = ref.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return } catch { /* ignore — fall through */ }
    }
    el.focus()
  }
  return (
    <div
      onClick={open}
      className="relative flex items-center bg-bg-deep/60 border border-border hover:border-border-strong focus-within:border-gold/50 focus-within:ring-1 focus-within:ring-gold/40 rounded cursor-pointer transition"
    >
      <svg
        className="w-4 h-4 text-text-dim shrink-0 ml-3 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <input
        ref={ref}
        type="date"
        value={value || ''}
        onChange={onChange}
        {...rest}
        style={{ colorScheme: 'dark' }}
        className="flex-1 bg-transparent outline-none px-3 py-2 text-sm text-text cursor-pointer"
      />
    </div>
  )
}

// Steps editor: renders one input row per step, plus a permanent trailing
// "ghost" row with greyed "Add step here" placeholder. As the user types into
// the ghost, a new empty ghost is appended automatically. Empty rows are
// filtered out at save time.
function StepsEditor({ steps, setSteps }) {
  // Ensure exactly one trailing empty row at all times. Done inside the
  // functional updater so StrictMode's double-invocation doesn't double-append.
  useEffect(() => {
    setSteps((arr) => {
      const last = arr[arr.length - 1]
      if (!last || last.text !== '') {
        return [...arr, { id: cryptoId(), text: '' }]
      }
      return arr
    })
  }, [steps, setSteps])

  const updateStep = (sid, text) =>
    setSteps((arr) => arr.map((s) => (s.id === sid ? { ...s, text } : s)))
  const removeStep = (sid) =>
    setSteps((arr) => arr.filter((s) => s.id !== sid))
  const moveStep = (sid, delta) =>
    setSteps((arr) => {
      const idx = arr.findIndex((s) => s.id === sid)
      if (idx < 0) return arr
      const j = idx + delta
      // never let a row swap into the trailing-empty slot, and the trailing
      // empty itself is not movable
      if (j < 0 || j >= arr.length - 1 || idx === arr.length - 1) return arr
      const next = [...arr]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  return (
    <ul className="space-y-1.5">
      {steps.map((s, i) => {
        const isGhost = i === steps.length - 1 && s.text === ''
        const lastReal = steps.length - 2 // index of the last real (non-ghost) step
        return (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className="text-[11px] num text-text-muted w-5 text-right">{i + 1}.</span>
            <input
              value={s.text}
              onChange={(e) => updateStep(s.id, e.target.value)}
              placeholder={isGhost ? 'Add step here…' : 'Step…'}
              className={
                'flex-1 outline-none rounded px-2 py-1.5 text-sm text-text ' +
                (isGhost
                  ? 'bg-bg-deep/40 border border-dashed border-border focus:border-work/50 placeholder:text-text-muted/60'
                  : 'bg-bg-deep/60 border border-border focus:border-work/50')
              }
            />
            <StepBtn
              onClick={() => moveStep(s.id, -1)}
              disabled={isGhost || i === 0}
              title="Move up"
            >↑</StepBtn>
            <StepBtn
              onClick={() => moveStep(s.id, 1)}
              disabled={isGhost || i >= lastReal}
              title="Move down"
            >↓</StepBtn>
            <StepBtn
              onClick={() => removeStep(s.id)}
              disabled={isGhost}
              title="Delete"
              tone="coral"
            >✕</StepBtn>
          </li>
        )
      })}
    </ul>
  )
}

function StepBtn({ children, onClick, disabled, title, tone }) {
  const cls =
    tone === 'coral'
      ? 'border-border text-text-muted hover:text-coral hover:border-coral/40'
      : 'border-border text-text-muted hover:text-text-dim hover:border-border-strong'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded border ${cls} disabled:opacity-30 text-xs flex items-center justify-center`}
    >
      {children}
    </button>
  )
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function cleanSteps(steps) {
  return steps
    .map((s) => ({ ...s, text: (s.text || '').trim() }))
    .filter((s) => s.text)
}

export default function ActiveModal() {
  const modal = useUI((u) => u.modal)
  if (!modal) return null
  const { name, payload } = modal
  switch (name) {
    case 'firstTime':       return <FirstTimeModal />
    case 'addTask':         return <AddTaskModal />
    case 'editTask':        return <EditTaskModal id={payload?.id} />
    case 'addMission':      return <AddMissionModal />
    case 'editMission':     return <EditMissionModal id={payload?.id} />
    case 'promoteToMission':return <PromoteToMissionModal id={payload?.id} />
    case 'addDeadline':     return <AddDeadlineModal />
    case 'editDeadline':    return <EditDeadlineModal id={payload?.id} />
    case 'addHabit':        return <AddHabitModal />
    case 'addLab':          return <AddLabModal />
    case 'editLab':         return <EditLabModal id={payload?.id} />
    case 'addLooseEnd':     return <AddLooseEndModal />
    case 'settings':        return <SettingsModal />
    case 'help':            return <HelpModal />
    default: return null
  }
}

function FirstTimeModal() {
  const [name, setName] = useState('')
  const setStoreName = useStore((s) => s.setName)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!name.trim()) return
    setStoreName(name.trim())
    closeModal()
  }
  return (
    <Modal title="Welcome, Captain" tone="gold" onClose={() => {}} footer={<ModalBtn onClick={onSave}>Engage</ModalBtn>}>
      <ModalLabel>Your Name</ModalLabel>
      <ModalInput
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder="What should MOAD call you?"
      />
      <p className="text-xs text-text-muted mt-3">Used in greetings only. Stored locally on this device.</p>
    </Modal>
  )
}

function AddTaskModal() {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const addTask = useStore((s) => s.addTask)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!text.trim()) return
    addTask(text.trim(), { priority, dueDate: dueDate || null })
    closeModal()
  }
  return (
    <Modal title="New Task" tone="gold" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn onClick={onSave} disabled={!text.trim()}>Add</ModalBtn>
    </>}>
      <ModalLabel>Task</ModalLabel>
      <ModalInput autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSave()} placeholder="What needs doing today?" />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <ModalLabel>Priority</ModalLabel>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text">
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <ModalLabel>Due (optional)</ModalLabel>
          <DateField value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function EditTaskModal({ id }) {
  const task = useStore((s) => s.tasks.find((t) => t.id === id))
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const closeModal = useUI((u) => u.closeModal)
  const [text, setText] = useState(task?.text || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  if (!task) return null
  const onSave = () => {
    if (!text.trim()) return
    updateTask(id, { text: text.trim(), priority, dueDate: dueDate || null })
    closeModal()
  }
  return (
    <Modal title="Edit Task" tone="gold" footer={<>
      <ModalBtn tone="coral" onClick={() => { deleteTask(id); closeModal() }}>Delete</ModalBtn>
      <div className="flex-1" />
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn onClick={onSave}>Save</ModalBtn>
    </>}>
      <ModalLabel>Task</ModalLabel>
      <ModalInput autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSave()} />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <ModalLabel>Priority</ModalLabel>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text">
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <ModalLabel>Due</ModalLabel>
          <DateField value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function AddMissionModal({ prefill = {}, onCreated }) {
  const [name, setName] = useState(prefill.name || '')
  const [domain, setDomain] = useState(prefill.domain || 'work')
  const [steps, setSteps] = useState([{ id: cryptoId(), text: '' }])
  const [deadline, setDeadline] = useState(prefill.deadline || '')
  const [notes, setNotes] = useState(prefill.notes || '')
  const addProject = useStore((s) => s.addProject)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!name.trim()) return
    const id = addProject({
      name: name.trim(),
      domain,
      steps: cleanSteps(steps),
      deadline: deadline || null,
      notes,
    })
    onCreated?.(id)
    closeModal()
  }
  return (
    <Modal title="New Mission" tone="work" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="work" onClick={onSave} disabled={!name.trim()}>Create</ModalBtn>
    </>}>
      <ModalLabel>Name</ModalLabel>
      <ModalInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Mission name" />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <ModalLabel>Domain</ModalLabel>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text">
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="creative">Creative</option>
          </select>
        </div>
        <div>
          <ModalLabel>Deadline</ModalLabel>
          <DateField value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <ModalLabel className="mt-3">Steps</ModalLabel>
      <StepsEditor steps={steps} setSteps={setSteps} />
      <p className="text-[11px] text-text-muted mt-1">Only the first step shows on the dashboard.</p>
      <ModalLabel className="mt-3">Notes</ModalLabel>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" />
    </Modal>
  )
}

function EditMissionModal({ id }) {
  const project = useStore((s) => s.projects.find((p) => p.id === id))
  const update = useStore((s) => s.updateProject)
  const archive = useStore((s) => s.archiveProject)
  const del = useStore((s) => s.deleteProject)
  const closeModal = useUI((u) => u.closeModal)
  const [name, setName] = useState(project?.name || '')
  const [domain, setDomain] = useState(project?.domain || 'work')
  const [steps, setSteps] = useState(() => {
    let initial = []
    if (Array.isArray(project?.steps) && project.steps.length > 0) {
      initial = project.steps.map((s) => ({ id: s.id || cryptoId(), text: s.text }))
    } else if (project?.nextAction?.trim()) {
      // legacy fallback: in-memory project may still have nextAction (pre-migration)
      initial = [{ id: cryptoId(), text: project.nextAction.trim() }]
    }
    return initial
  })
  const [deadline, setDeadline] = useState(project?.deadline || '')
  const [progress, setProgress] = useState(project?.progress || 0)
  const [notes, setNotes] = useState(project?.notes || '')
  if (!project) return null

  const onSave = () => {
    update(id, {
      name: name.trim(),
      domain,
      steps: cleanSteps(steps),
      deadline: deadline || null,
      progress: Number(progress) || 0,
      notes,
    })
    closeModal()
  }
  return (
    <Modal title="Edit Mission" tone="work" footer={<>
      <ModalBtn tone="coral" onClick={() => { del(id); closeModal() }}>Delete</ModalBtn>
      <ModalBtn tone="ghost" onClick={() => { archive(id); closeModal() }}>Archive</ModalBtn>
      <div className="flex-1" />
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="work" onClick={onSave}>Save</ModalBtn>
    </>}>
      <ModalLabel>Name</ModalLabel>
      <ModalInput autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <ModalLabel>Domain</ModalLabel>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text">
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="creative">Creative</option>
          </select>
        </div>
        <div>
          <ModalLabel>Deadline</ModalLabel>
          <DateField value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      <ModalLabel className="mt-3">Steps</ModalLabel>
      <StepsEditor steps={steps} setSteps={setSteps} />

      <ModalLabel className="mt-4">Progress: {progress}%</ModalLabel>
      <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full accent-work" />
      <ModalLabel className="mt-3">Notes</ModalLabel>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" />
    </Modal>
  )
}

// Promote a Loose End → real Mission. Loose End stays in inbox (per locked decision).
function PromoteToMissionModal({ id }) {
  const looseEnd = useStore((s) => s.looseEnds.find((l) => l.id === id))
  return <AddMissionModal prefill={{ name: looseEnd?.text || '' }} onCreated={() => {}} />
}

function AddDeadlineModal() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const addDeadline = useStore((s) => s.addDeadline)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!title.trim() || !date) return
    addDeadline({ title: title.trim(), date, note })
    closeModal()
  }
  return (
    <Modal title="New Deadline" tone="coral" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="coral" onClick={onSave} disabled={!title.trim() || !date}>Add</ModalBtn>
    </>}>
      <ModalLabel>Title</ModalLabel>
      <ModalInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's due?" />
      <ModalLabel className="mt-3">Date</ModalLabel>
      <DateField value={date} onChange={(e) => setDate(e.target.value)} />
      <ModalLabel className="mt-3">Note</ModalLabel>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" placeholder="Optional" />
    </Modal>
  )
}

function EditDeadlineModal({ id }) {
  const deadline = useStore((s) => s.deadlines.find((d) => d.id === id))
  const updateDeadline = useStore((s) => s.updateDeadline)
  const deleteDeadline = useStore((s) => s.deleteDeadline)
  const closeModal = useUI((u) => u.closeModal)
  const [title, setTitle] = useState(deadline?.title || '')
  const [date, setDate] = useState(deadline?.date || '')
  const [note, setNote] = useState(deadline?.note || '')
  if (!deadline) return null
  const onSave = () => {
    if (!title.trim() || !date) return
    updateDeadline(id, { title: title.trim(), date, note })
    closeModal()
  }
  return (
    <Modal title="Edit Deadline" tone="coral" footer={<>
      <ModalBtn tone="coral" onClick={() => { deleteDeadline(id); closeModal() }}>Delete</ModalBtn>
      <div className="flex-1" />
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="coral" onClick={onSave} disabled={!title.trim() || !date}>Save</ModalBtn>
    </>}>
      <ModalLabel>Title</ModalLabel>
      <ModalInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      <ModalLabel className="mt-3">Date</ModalLabel>
      <DateField value={date} onChange={(e) => setDate(e.target.value)} />
      <ModalLabel className="mt-3">Note</ModalLabel>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" placeholder="Optional" />
    </Modal>
  )
}

function AddHabitModal() {
  const [name, setName] = useState('')
  const addHabit = useStore((s) => s.addHabit)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!name.trim()) return
    addHabit(name.trim())
    closeModal()
  }
  return (
    <Modal title="New Habit" tone="mint" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="mint" onClick={onSave} disabled={!name.trim()}>Add</ModalBtn>
    </>}>
      <ModalLabel>Habit</ModalLabel>
      <ModalInput autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSave()} placeholder="What's the daily protocol?" />
    </Modal>
  )
}

function AddLabModal() {
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const add = useStore((s) => s.addLabItem)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!text.trim()) return
    add(text.trim(), note)
    closeModal()
  }
  return (
    <Modal title="New Lab Idea" tone="creative" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="creative" onClick={onSave} disabled={!text.trim()}>Add</ModalBtn>
    </>}>
      <ModalLabel>Idea</ModalLabel>
      <ModalInput autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What are you cooking up?" />
      <ModalLabel className="mt-3">Note (optional)</ModalLabel>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" />
    </Modal>
  )
}

function EditLabModal({ id }) {
  const item = useStore((s) => s.lab.find((l) => l.id === id))
  const update = useStore((s) => s.updateLabItem)
  const del = useStore((s) => s.deleteLabItem)
  const closeModal = useUI((u) => u.closeModal)
  const [text, setText] = useState(item?.text || '')
  const [note, setNote] = useState(item?.note || '')
  if (!item) return null
  const onSave = () => {
    if (!text.trim()) return
    update(id, { text: text.trim(), note })
    closeModal()
  }
  return (
    <Modal title="Edit Lab Idea" tone="creative" footer={<>
      <ModalBtn tone="coral" onClick={() => { del(id); closeModal() }}>Delete</ModalBtn>
      <div className="flex-1" />
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="creative" onClick={onSave} disabled={!text.trim()}>Save</ModalBtn>
    </>}>
      <ModalLabel>Idea</ModalLabel>
      <ModalInput autoFocus value={text} onChange={(e) => setText(e.target.value)} />
      <ModalLabel className="mt-3">Note (optional)</ModalLabel>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text resize-y" />
    </Modal>
  )
}

function AddLooseEndModal() {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const add = useStore((s) => s.addLooseEnd)
  const closeModal = useUI((u) => u.closeModal)
  const onSave = () => {
    if (!text.trim()) return
    add(text.trim(), { dueDate: dueDate || null, priority })
    closeModal()
  }
  return (
    <Modal title="New Loose End" tone="personal" footer={<>
      <ModalBtn tone="ghost" onClick={closeModal}>Cancel</ModalBtn>
      <ModalBtn tone="personal" onClick={onSave} disabled={!text.trim()}>Add</ModalBtn>
    </>}>
      <ModalLabel>Item</ModalLabel>
      <ModalInput autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSave()} placeholder="What needs catching?" />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <ModalLabel>Priority</ModalLabel>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-bg-deep/60 border border-border rounded px-3 py-2 text-sm text-text">
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <ModalLabel>Due (optional)</ModalLabel>
          <DateField value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function SettingsModal() {
  const user = useStore((s) => s.user)
  const settings = useStore((s) => s.settings)
  const setName = useStore((s) => s.setName)
  const toggleHaptic = useStore((s) => s.toggleHaptic)
  const resetLayout = useStore((s) => s.resetLayout)
  const resetAll = useStore((s) => s.resetAll)
  const myPartners = useStore((s) => s.myPartners)
  const addPartner = useStore((s) => s.addPartner)
  const removePartner = useStore((s) => s.removePartner)
  const closeModal = useUI((u) => u.closeModal)
  const toast = useUI((u) => u.toast)
  const [name, setNameLocal] = useState(user.name)
  const [signedInEmail, setSignedInEmail] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [savingPartner, setSavingPartner] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedInEmail(data?.user?.email || '')
    })
  }, [])

  const onAddPartner = async () => {
    const email = partnerEmail.trim()
    if (!email) return
    setSavingPartner(true)
    try {
      await addPartner({ email, name: partnerName.trim() })
      toast(`Added ${partnerName.trim() || email}`, 'success')
      setPartnerEmail('')
      setPartnerName('')
    } catch (err) {
      toast(`Could not add partner: ${err.message || err}`, 'error')
    } finally {
      setSavingPartner(false)
    }
  }

  const onRemovePartner = async (id, label) => {
    if (!confirm(`Remove ${label} as a partner? They won't be able to send you new requests.`)) return
    try {
      await removePartner(id)
      toast('Partner removed', 'info')
    } catch (err) {
      toast(`Could not remove: ${err.message || err}`, 'error')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    closeModal()
  }

  const exportJson = () => {
    const data = JSON.stringify({
      __version: 1,
      data: {
        user, settings,
        projects: useStore.getState().projects,
        tasks: useStore.getState().tasks,
        habits: useStore.getState().habits,
        lab: useStore.getState().lab,
        looseEnds: useStore.getState().looseEnds,
        deadlines: useStore.getState().deadlines,
        todaySchedule: useStore.getState().todaySchedule,
        layout: useStore.getState().layout,
      },
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moad-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Backup downloaded', 'success')
  }

  const importJson = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      const data = parsed.data || parsed
      // crude restore
      const state = useStore.getState()
      useStore.setState({
        ...state,
        ...data,
        initialized: true,
      })
      state._persist()
      toast('Backup restored', 'success')
      closeModal()
    } catch (err) {
      toast('Import failed: ' + err.message, 'error')
    }
  }

  return (
    <Modal title="Settings" tone="gold" footer={<ModalBtn tone="ghost" onClick={closeModal}>Done</ModalBtn>}>
      <ModalLabel>Your Name</ModalLabel>
      <div className="flex gap-2">
        <ModalInput value={name} onChange={(e) => setNameLocal(e.target.value)} />
        <ModalBtn onClick={() => { setName(name.trim()); toast('Name saved', 'success') }}>Save</ModalBtn>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-text-dim">Haptic feedback (mobile)</span>
        <button
          onClick={toggleHaptic}
          className={'text-xs uppercase tracking-wider font-mono rounded px-3 py-1.5 border ' + (settings.hapticEnabled ? 'bg-gold/15 text-gold border-gold/40' : 'bg-surface text-text-dim border-border')}
        >
          {settings.hapticEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <ModalBtn tone="ghost" onClick={exportJson}>Export</ModalBtn>
        <label className="text-xs uppercase tracking-wider font-mono rounded px-4 py-1.5 border border-border text-text-dim hover:bg-surface cursor-pointer text-center">
          Import
          <input type="file" accept="application/json" onChange={importJson} className="hidden" />
        </label>
        <ModalBtn tone="ghost" onClick={() => { resetLayout(); toast('Layout reset', 'info') }}>Reset Layout</ModalBtn>
        <ModalBtn tone="coral" onClick={() => { if (confirm('Wipe everything? This cannot be undone.')) { resetAll(); toast('All data reset', 'info') } }}>Reset All</ModalBtn>
      </div>

      {/* Partners — people allowed to send you requests via The Ask */}
      <div className="mt-5 pt-4 border-t border-border">
        <ModalLabel>Partners</ModalLabel>
        <p className="text-[11px] text-text-muted mb-2">
          Add someone's email and they can sign in on their own device to send you requests via The Ask. They never see your dashboard.
        </p>
        {myPartners.length > 0 && (
          <ul className="space-y-1 mb-3">
            {myPartners.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm bg-bg-deep/40 rounded px-3 py-2 border border-border">
                <div className="min-w-0">
                  <div className="text-text truncate">{p.partner_name || p.partner_email}</div>
                  {p.partner_name && <div className="text-[11px] text-text-muted truncate">{p.partner_email}</div>}
                </div>
                <button
                  onClick={() => onRemovePartner(p.id, p.partner_name || p.partner_email)}
                  className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-text-muted hover:text-coral border border-border hover:border-coral/40 rounded px-2 py-1"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          <ModalInput
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Name (optional)"
            disabled={savingPartner}
          />
          <ModalInput
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            disabled={savingPartner}
          />
        </div>
        <ModalBtn
          tone="rose"
          onClick={onAddPartner}
          disabled={savingPartner || !partnerEmail.trim()}
        >
          {savingPartner ? 'Adding…' : 'Add Partner'}
        </ModalBtn>
      </div>
      {signedInEmail && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-text-dim font-mono">Signed in as</div>
              <div className="text-sm text-text truncate">{signedInEmail}</div>
            </div>
            <ModalBtn tone="ghost" onClick={signOut}>Sign Out</ModalBtn>
          </div>
        </div>
      )}
      <div className="mt-5 pt-4 border-t border-border text-[11px] text-text-muted num">
        MOAD v0.1.0 · {user.totalTasksCompleted} total completions
      </div>
    </Modal>
  )
}

function HelpModal() {
  return (
    <Modal title="Keyboard" tone="cyan">
      <ul className="space-y-2 text-sm">
        <Row k="N" v="New task" />
        <Row k="E" v="Toggle layout edit" />
        <Row k="F" v="Focus mode" />
        <Row k="?" v="Show this" />
        <Row k="Esc" v="Close modal" />
      </ul>
    </Modal>
  )
}

function Row({ k, v }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-text-dim">{v}</span>
      <kbd className="text-[11px] num bg-bg-deep border border-border rounded px-2 py-0.5 text-text">{k}</kbd>
    </li>
  )
}

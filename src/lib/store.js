import { create } from 'zustand'
import { loadState, saveState, subscribeToState } from './storage.js'
import { todayISO, isYesterday } from './dates.js'
import * as Partners from './partners.js'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const defaultLayout = [
  { id: 'comms', size: 'full' },
  { id: 'today', size: 'full' },
  { id: 'projects', size: 'half' },
  { id: 'deadlines', size: 'half' },
  { id: 'habits', size: 'half' },
  { id: 'lab', size: 'half' },
  { id: 'looseEnds', size: 'full' },
  { id: 'theAsk', size: 'full' },
]

const defaultState = () => ({
  initialized: false,
  // Auth context — populated on init, never persisted to user_state.
  authEmail: '',
  user: {
    name: '',
    streak: 0,
    lastActiveDate: null,
    totalTasksCompleted: 0,
  },
  settings: {
    focusMode: false,
    hapticEnabled: true,
  },
  projects: [],
  tasks: [],
  habits: [],
  lab: [],
  looseEnds: [],
  deadlines: [],
  // Schedule entries pointing at a Mission, Deadline, or Lab item — independent
  // completion (does NOT modify the source). See locked decision #7.
  todaySchedule: [],
  layout: defaultLayout,
  // Partner pairing + cross-user requests. NOT persisted in user_state — these
  // come from the partners / partner_requests Supabase tables.
  myPartners: [],         // people I've added as my partner (Ken's view)
  partnersListingMe: [],  // people who've added ME as their partner (Michelle's view)
  incomingRequests: [],   // requests where I'm to_user_id
  outgoingRequests: [],   // requests where I'm from_user_id
})

// Fields excluded from persistableSlice (they live in separate tables or
// runtime-only — never round-trip through user_state.data).
const NON_PERSISTED_KEYS = new Set([
  'initialized',
  'authEmail',
  'myPartners',
  'partnersListingMe',
  'incomingRequests',
  'outgoingRequests',
])

// Forward-only migration of loaded state. Bump a version field if needed later;
// for now, normalize legacy project.nextAction → project.steps[].
function migrate(data) {
  if (Array.isArray(data.projects)) {
    data.projects = data.projects.map((p) => {
      if (!Array.isArray(p.steps) || p.steps.length === 0) {
        const text = (p.nextAction || '').trim()
        return { ...p, steps: text ? [{ id: uid(), text }] : [] }
      }
      return p
    })
  }
  return data
}

// Slice exclusion: NON_PERSISTED_KEYS + functions are stripped before save.
function persistableSlice(state) {
  const out = {}
  for (const [k, v] of Object.entries(state)) {
    if (typeof v === 'function') continue
    if (NON_PERSISTED_KEYS.has(k)) continue
    out[k] = v
  }
  return out
}

// Module-level globals for the active session — these are NOT persisted; they
// govern how `_persist()` knows which user to write for and how to suppress
// echoes from our own Supabase writes.
let activeUserId = null
let saveTimer = null
let unsubscribe = null
let lastSavedToken = null
let unsubscribePartners = null

const SAVE_DEBOUNCE_MS = 500

export const useStore = create((set, get) => ({
  ...defaultState(),

  init: async (userId, email = '') => {
    activeUserId = userId
    const loaded = await loadState(userId)
    if (loaded) {
      set({ ...defaultState(), ...migrate(loaded), authEmail: email, initialized: true })
    } else {
      // First sign-in for this user — start with defaults; first action
      // will trigger an upsert.
      set({ ...defaultState(), authEmail: email, initialized: true })
    }

    // Subscribe to remote changes. Filter our own echoes via lastSavedToken.
    if (unsubscribe) unsubscribe()
    unsubscribe = subscribeToState(userId, (incoming) => {
      // Echo from our own write — ignore (token roundtripped).
      if (incoming && incoming.__token && incoming.__token === lastSavedToken) return
      // Otherwise apply the remote update (came from another device).
      set((s) => ({ ...defaultState(), ...migrate(incoming), authEmail: s.authEmail, myPartners: s.myPartners, partnersListingMe: s.partnersListingMe, incomingRequests: s.incomingRequests, outgoingRequests: s.outgoingRequests, initialized: true }))
    })

    // Load partner data + subscribe to live request changes.
    await get().loadPartnerData()
    if (unsubscribePartners) unsubscribePartners()
    unsubscribePartners = Partners.subscribeToPartnerRequests(userId, async () => {
      // Cheap: just refetch both lists on any change. Volume is tiny.
      const [incoming, outgoing] = await Promise.all([
        Partners.loadIncomingRequests(userId),
        Partners.loadOutgoingRequests(userId),
      ])
      set({ incomingRequests: incoming, outgoingRequests: outgoing })
    })
  },

  teardown: () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (unsubscribePartners) {
      unsubscribePartners()
      unsubscribePartners = null
    }
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    activeUserId = null
    lastSavedToken = null
    set({ ...defaultState() })
  },

  // ---- generic save helper (debounced) ----
  _persist: () => {
    if (!activeUserId) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      saveTimer = null
      const snap = persistableSlice(get())
      // Tag the payload with a token so the realtime subscription can
      // distinguish our own echo from a real remote change.
      const token = uid()
      lastSavedToken = token
      await saveState(activeUserId, { ...snap, __token: token })
    }, SAVE_DEBOUNCE_MS)
  },

  // ---- settings ----
  setName: (name) => {
    set((s) => ({ user: { ...s.user, name } }))
    get()._persist()
  },
  toggleFocusMode: () => {
    set((s) => ({ settings: { ...s.settings, focusMode: !s.settings.focusMode } }))
    get()._persist()
  },
  toggleHaptic: () => {
    set((s) => ({ settings: { ...s.settings, hapticEnabled: !s.settings.hapticEnabled } }))
    get()._persist()
  },

  // ---- streak (daily-use, requires a real completion that day) ----
  registerCompletion: () => {
    const today = todayISO()
    const { lastActiveDate, streak } = get().user
    let nextStreak = streak
    if (lastActiveDate === today) {
      // already counted today
    } else if (isYesterday(lastActiveDate)) {
      nextStreak = streak + 1
    } else {
      nextStreak = 1
    }
    set((s) => ({
      user: {
        ...s.user,
        streak: nextStreak,
        lastActiveDate: today,
        totalTasksCompleted: s.user.totalTasksCompleted + 1,
      },
    }))
    get()._persist()
  },

  // ---- tasks (Today direct tasks) ----
  addTask: (text, opts = {}) => {
    const task = {
      id: uid(),
      text,
      projectId: opts.projectId || null,
      priority: opts.priority || 'medium',
      dueDate: opts.dueDate || null,
      completed: false,
      completedAt: null,
      tags: opts.tags || [],
      subtasks: [],
      recurring: opts.recurring || null,
      order: get().tasks.length,
      createdAt: new Date().toISOString(),
      inToday: true,
    }
    set((s) => ({ tasks: [...s.tasks, task] }))
    get()._persist()
    return task.id
  },
  updateTask: (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    get()._persist()
  },
  toggleTask: (id) => {
    const t = get().tasks.find((x) => x.id === id)
    if (!t) return
    const completed = !t.completed
    set((s) => ({
      tasks: s.tasks.map((x) =>
        x.id === id ? { ...x, completed, completedAt: completed ? new Date().toISOString() : null } : x
      ),
    }))
    if (completed) get().registerCompletion()
    else get()._persist()
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    get()._persist()
  },

  // ---- loose ends (universal inbox) ----
  addLooseEnd: (text, opts = {}) => {
    const item = {
      id: uid(),
      text,
      dueDate: opts.dueDate || null,
      priority: opts.priority || 'medium',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      inToday: !!opts.inToday,
      inMissions: !!opts.inMissions,
      inDeadlines: !!opts.inDeadlines,
    }
    set((s) => ({ looseEnds: [...s.looseEnds, item] }))
    get()._persist()
    return item.id
  },
  addLooseEndsBatch: (items) => {
    const now = new Date().toISOString()
    const created = items.map((it) => ({
      id: uid(),
      text: it.text,
      dueDate: it.dueDate || null,
      priority: it.priority || 'medium',
      completed: false,
      completedAt: null,
      createdAt: now,
      inToday: false,
      inMissions: false,
      inDeadlines: false,
    }))
    set((s) => ({ looseEnds: [...s.looseEnds, ...created] }))
    get()._persist()
    return created.map((c) => c.id)
  },
  updateLooseEnd: (id, patch) => {
    set((s) => ({
      looseEnds: s.looseEnds.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
    get()._persist()
  },
  toggleLooseEnd: (id) => {
    const item = get().looseEnds.find((x) => x.id === id)
    if (!item) return
    const completed = !item.completed
    set((s) => ({
      looseEnds: s.looseEnds.map((x) =>
        x.id === id ? { ...x, completed, completedAt: completed ? new Date().toISOString() : null } : x
      ),
    }))
    if (completed) get().registerCompletion()
    else get()._persist()
  },
  deleteLooseEnd: (id) => {
    set((s) => ({ looseEnds: s.looseEnds.filter((l) => l.id !== id) }))
    get()._persist()
  },
  toggleLooseEndMirror: (id, mirror) => {
    set((s) => ({
      looseEnds: s.looseEnds.map((l) => (l.id === id ? { ...l, [mirror]: !l[mirror] } : l)),
    }))
    get()._persist()
  },

  // ---- projects (Active Missions) ----
  addProject: (project) => {
    let stepsInput = project.steps
    if (!Array.isArray(stepsInput) || stepsInput.length === 0) {
      stepsInput = project.nextAction ? [project.nextAction] : []
    }
    const steps = stepsInput
      .map((s) => (typeof s === 'string' ? s : s?.text || ''))
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ id: uid(), text }))
    const p = {
      id: uid(),
      name: project.name,
      domain: project.domain || 'work',
      progress: 0,
      steps,
      deadline: project.deadline || null,
      notes: project.notes || '',
      tags: project.tags || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ projects: [...s.projects, p] }))
    get()._persist()
    return p.id
  },
  updateProject: (id, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    get()._persist()
  },
  archiveProject: (id) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: 'archived' } : p)),
    }))
    get()._persist()
  },
  deleteProject: (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    get()._persist()
  },

  // ---- deadlines ----
  addDeadline: (d) => {
    const item = {
      id: uid(),
      title: d.title,
      date: d.date,
      note: d.note || '',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ deadlines: [...s.deadlines, item] }))
    get()._persist()
    return item.id
  },
  updateDeadline: (id, patch) => {
    set((s) => ({ deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
    get()._persist()
  },
  deleteDeadline: (id) => {
    set((s) => ({ deadlines: s.deadlines.filter((d) => d.id !== id) }))
    get()._persist()
  },

  // ---- habits (Daily Protocol) ----
  addHabit: (name) => {
    const h = {
      id: uid(),
      name,
      streak: 0,
      lastCompleted: null,
      history: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ habits: [...s.habits, h] }))
    get()._persist()
    return h.id
  },
  toggleHabitToday: (id) => {
    const today = todayISO()
    const h = get().habits.find((x) => x.id === id)
    if (!h) return
    const alreadyToday = h.lastCompleted === today
    let history, lastCompleted, streak
    if (alreadyToday) {
      history = h.history.filter((d) => d !== today)
      lastCompleted = history[history.length - 1] || null
      streak = Math.max(0, h.streak - 1)
    } else {
      history = [...h.history, today]
      lastCompleted = today
      streak = isYesterday(h.lastCompleted) || h.lastCompleted === today ? h.streak + 1 : 1
    }
    set((s) => ({
      habits: s.habits.map((x) => (x.id === id ? { ...x, history, lastCompleted, streak } : x)),
    }))
    if (!alreadyToday) get().registerCompletion()
    else get()._persist()
  },
  updateHabit: (id, patch) => {
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }))
    get()._persist()
  },
  deleteHabit: (id) => {
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    get()._persist()
  },

  // ---- lab (creative tracker, 3 pinned slots) ----
  addLabItem: (text, note = '') => {
    const item = {
      id: uid(),
      text,
      note,
      pinned: false,
      pinSlot: null,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ lab: [...s.lab, item] }))
    get()._persist()
    return item.id
  },
  updateLabItem: (id, patch) => {
    set((s) => ({ lab: s.lab.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
    get()._persist()
  },
  pinLabItem: (id) => {
    const items = get().lab
    const used = new Set(items.filter((l) => l.pinned && l.pinSlot != null).map((l) => l.pinSlot))
    let slot = null
    for (let i = 0; i < 3; i++) if (!used.has(i)) { slot = i; break }
    if (slot == null) return // all 3 slots taken
    set((s) => ({
      lab: s.lab.map((l) => (l.id === id ? { ...l, pinned: true, pinSlot: slot } : l)),
    }))
    get()._persist()
  },
  unpinLabItem: (id) => {
    set((s) => ({
      lab: s.lab.map((l) => (l.id === id ? { ...l, pinned: false, pinSlot: null } : l)),
    }))
    get()._persist()
  },
  deleteLabItem: (id) => {
    set((s) => ({ lab: s.lab.filter((l) => l.id !== id) }))
    get()._persist()
  },

  // ---- clear completed items from Today view (preserves history per locked decision #4) ----
  clearTodayCompleted: () => {
    const today = todayISO()
    const now = new Date().toISOString()
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.completed && !t.clearedFromTodayAt ? { ...t, clearedFromTodayAt: now } : t
      ),
      looseEnds: s.looseEnds.map((l) =>
        l.inToday && l.completed ? { ...l, inToday: false } : l
      ),
      todaySchedule: s.todaySchedule.map((e) =>
        e.dateKey === today && e.completed && !e.clearedFromTodayAt
          ? { ...e, clearedFromTodayAt: now }
          : e
      ),
    }))
    get()._persist()
  },

  // ---- todaySchedule (mirror Mission/Deadline/Lab into Today, independent completion) ----
  scheduleToToday: (refType, refId) => {
    const today = todayISO()
    const existing = get().todaySchedule.find(
      (e) => e.refType === refType && e.refId === refId && e.dateKey === today && !e.clearedFromTodayAt
    )
    if (existing) {
      if (!existing.completed) {
        set((s) => ({ todaySchedule: s.todaySchedule.filter((e) => e.id !== existing.id) }))
        get()._persist()
      }
      return
    }
    const entry = {
      id: uid(),
      refType,
      refId,
      dateKey: today,
      completed: false,
      completedAt: null,
      addedAt: new Date().toISOString(),
    }
    set((s) => ({ todaySchedule: [...s.todaySchedule, entry] }))
    get()._persist()
  },
  toggleTodayScheduleEntry: (id) => {
    const e = get().todaySchedule.find((x) => x.id === id)
    if (!e) return
    const completed = !e.completed
    set((s) => ({
      todaySchedule: s.todaySchedule.map((x) =>
        x.id === id
          ? { ...x, completed, completedAt: completed ? new Date().toISOString() : null }
          : x
      ),
    }))
    if (completed) get().registerCompletion()
    else get()._persist()
  },
  removeTodayScheduleEntry: (id) => {
    set((s) => ({ todaySchedule: s.todaySchedule.filter((e) => e.id !== id) }))
    get()._persist()
  },

  // ---- layout ----
  setLayout: (layout) => {
    set({ layout })
    get()._persist()
  },
  resetLayout: () => {
    set({ layout: defaultLayout })
    get()._persist()
  },
  toggleWidgetCollapsed: (id) => {
    set((s) => ({
      layout: s.layout.map((l) => (l.id === id ? { ...l, collapsed: !l.collapsed } : l)),
    }))
    get()._persist()
  },

  // ---- partners + cross-user requests ----
  loadPartnerData: async () => {
    if (!activeUserId) return
    const email = get().authEmail
    const [myPartners, partnersListingMe, incoming, outgoing] = await Promise.all([
      Partners.loadMyPartners(activeUserId),
      email ? Partners.loadPartnersListingMe(email) : Promise.resolve([]),
      Partners.loadIncomingRequests(activeUserId),
      Partners.loadOutgoingRequests(activeUserId),
    ])
    set({
      myPartners,
      partnersListingMe,
      incomingRequests: incoming,
      outgoingRequests: outgoing,
    })
  },
  addPartner: async ({ email, name }) => {
    if (!activeUserId) throw new Error('not signed in')
    const row = await Partners.addPartner(activeUserId, { email, name })
    set((s) => ({ myPartners: [...s.myPartners, row] }))
    return row
  },
  removePartner: async (id) => {
    await Partners.removePartner(id)
    set((s) => ({ myPartners: s.myPartners.filter((p) => p.id !== id) }))
  },
  sendPartnerRequest: async ({ toUserId, raw, polished }) => {
    if (!activeUserId) throw new Error('not signed in')
    const row = await Partners.sendRequest({ fromUserId: activeUserId, toUserId, raw, polished })
    set((s) => ({ outgoingRequests: [row, ...s.outgoingRequests] }))
    return row
  },
  markPartnerRequestDone: async (id) => {
    const row = await Partners.markRequestDone(id)
    set((s) => ({
      incomingRequests: s.incomingRequests.map((r) => (r.id === id ? row : r)),
      outgoingRequests: s.outgoingRequests.map((r) => (r.id === id ? row : r)),
    }))
  },
  markPartnerRequestPending: async (id) => {
    const row = await Partners.markRequestPending(id)
    set((s) => ({
      incomingRequests: s.incomingRequests.map((r) => (r.id === id ? row : r)),
      outgoingRequests: s.outgoingRequests.map((r) => (r.id === id ? row : r)),
    }))
  },
  deletePartnerRequest: async (id) => {
    await Partners.deleteRequest(id)
    set((s) => ({
      outgoingRequests: s.outgoingRequests.filter((r) => r.id !== id),
      incomingRequests: s.incomingRequests.filter((r) => r.id !== id),
    }))
  },

  // ---- nuclear ----
  resetAll: () => {
    set({ ...defaultState(), initialized: true })
    get()._persist()
  },
}))

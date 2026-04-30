# MOAD — Handoff to Claude Code

**Read this first.** Everything you need to continue MOAD is here and in the files in this folder.

---

## What MOAD Is

**M**other **o**f **A**ll **D**ashboards — a personal life dashboard for an ADHD-wired brain. Opened every morning. Consolidates work + personal projects, daily tasks, habits, ideas scratchpad, deadlines, and creative non-urgent projects.

**Vibe:** Dark mode Command Deck aesthetic. Mobile-first. Designed for quick morning orientation + frictionless capture throughout the day.

---

## Naming & Branding — IMPORTANT

**The product name is always written as MOAD — all capital letters.** It is an acronym (Mother of All Dashboards), not a word. Never render it as "Moad" or "moad" anywhere a user can see.

Where MOAD must appear in all caps:
- The browser tab title (`<title>MOAD — Command Dashboard</title>`)
- The app header / logo text
- The favicon / app icon badge if text-based
- The PWA manifest `name` field and `short_name` field
- The "About" / settings footer
- README, package.json `name` (use `"moad"` here — npm requires lowercase — but `"displayName": "MOAD"` where supported)
- Any loading screens or splash screens
- The welcome / first-time setup modal title

Where lowercase is acceptable:
- File paths and folder names (`src/`, `moad/`, `moad-v2-reference.html`) — Unix/web convention
- GitHub repo URL slug (`github.com/username/moad`) — lowercase convention
- npm package name in package.json (required by npm)
- Environment variable prefixes (`VITE_ANTHROPIC_API_KEY` follows its own convention)

In the built app, the user should see MOAD written as MOAD in every visible surface.

---

## Current State

**Working prototype:** `moad-v2-reference.html` in this folder. Single-file HTML artifact, ~3,500 lines, runs on Claude artifact storage. Has most features working.

**Reason for porting:** Artifact storage is fragile, single-file edits fail at scale, no cross-device sync, no real deploy target.

---

## Locked Design Decisions

Do NOT re-litigate these unless asked:

| Thing              | Choice                              |
|--------------------|-------------------------------------|
| Heading font       | Bebas Neue (Title Case)             |
| Body font          | IBM Plex Sans                       |
| Numbers/mono       | IBM Plex Mono                       |
| Palette            | Command Deck (dark navy + gold)     |
| Corner radius      | 6px                                 |
| Card treatment     | Glass (translucent + backdrop blur) |
| Background         | Gradient mesh (3-layer radial)      |
| Checkbox shape     | Hexagon (clip-path polygon)         |
| Progress bar       | Smooth gradient with soft glow      |
| Streak display     | 🔥 + number + "d"                   |
| Terminology        | Military/Ops — Missions, Daily Protocol, Side Operations, Field Notes, Captain |
| Greeting           | Time-based + name                   |
| Date format        | Long ("MONDAY, APRIL 21")           |

### Color tokens
```css
--bg: #0A0E1A
--bg-deep: #060912
--surface: rgba(255,255,255,0.04)
--surface-solid: #151A2E
--border: rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.16)

--text: #EDEFF7
--text-dim: #9AA0B8
--text-muted: #5C6380

--gold: #F5B942
--mint: #6EE7B7
--coral: #FF8A65
--rose: #F472B6
--cyan: #5EEAD4

--work: #60A5FA
--personal: #A78BFA
--creative: #F472B6
--daily: #6EE7B7
```

### Font imports
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Changes from v2 → v3 (not yet in reference HTML)

The owner decided these AFTER v2 was built. Implement during port:

### 1. REMOVE the XP/Level/Rank system entirely
No XP, no levels, no rank-ups, no XP tags on tasks, no level-up animations, no XP bar. Stats that stay (meaningful progress):
- Daily completion % (in Today widget)
- Per-habit streaks
- Overall daily-use streak (🔥 badge in Daily Protocol header)
- Project progress bars
- Total tasks completed (settings footer only)

### 2. Remove hero stats grid
Hero becomes minimal: greeting + date, icon buttons (help/edit/settings), Focus Mode toggle.

### 3. Widget-card redesign (critical — previous artifact attempts failed)
Each widget = ONE unified card. Title lives INSIDE the card, in that widget's accent color, with colored header wash and a 3px left accent stripe (with glow). NOT a floating heading above a plain card.

Per-widget accents:
- **Comms** → cyan ("Coming soon" placeholder for now)
- **Today** → gold
- **Active Missions** → blue (#60A5FA)
- **Deadlines** → coral
- **Daily Protocol** → mint (+ 🔥 streak badge in header)
- **The Lab** → pink (creative tracker, was Side Ops)
- **Loose Ends** → purple (one-off tasker, was Field Notes)
- **The Ask** → cyan ("Coming soon" placeholder, future Michelle requests inbox)

### 4. The COMMS widget — Active in v3 (one-shot capture)

Sits at the top (between hero and Today). Contains:
- Expandable textarea
- Mic button (Web Speech API)
- Send button

**Behavior:** User types or speaks → text sent to Anthropic API (`claude-sonnet-4-20250514`) → Claude parses into items → ALL items land in Loose Ends (the universal capture inbox). User triages from there.

**Why this is the simplest viable version:**
- One API call per message (no multi-turn conversation yet)
- One target widget (Loose Ends) — no "is this a task or a note or a mission?" ambiguity
- Owner controls routing manually with the per-row promote buttons in Loose Ends
- Easy to upgrade later to conversational model (replace single API call with message thread)

**System prompt** (inject today's date):

```
You are MOAD's capture assistant. The user will speak or type things they need to remember or do. Parse their input into individual items.

Today's date: {YYYY-MM-DD}

Each item should have:
- text: the action or thing, written cleanly (e.g., "Schedule vet appointment for Cooper")
- dueDate: YYYY-MM-DD if a date is mentioned or implied ("tomorrow", "Friday", "next week"), else null
- priority: "high" if urgency is signaled ("urgent", "ASAP", "important"), else "medium"

Multiple items in one message → split into separate items.
Don't ask clarifying questions — just parse and return.

Return strict JSON, no markdown:
{
  "items": [
    { "text": "...", "dueDate": "YYYY-MM-DD" | null, "priority": "high" | "medium" }
  ],
  "reply": "Short confirmation, e.g. 'Added 3 items to Loose Ends'"
}
```

**On success:** Show the `reply` string as a toast. Items appear in Loose Ends.
**On error:** Show error toast, log to console.

**Voice flow:**
- User taps mic button → Web Speech API starts listening
- User speaks → live transcript shows in textarea
- When user stops speaking, transcription finalizes → auto-submit to API
- Response items appear in Loose Ends

**API key:** MUST be loaded from env var (`VITE_ANTHROPIC_API_KEY`). Never hardcoded, never committed. Add to `.env.example` and `.gitignore`.

**Future upgrade path (NOT in v3):** Replace one-shot API call with multi-turn conversation. Keep all the wiring, env var, prompt builder. Just swap the function. The infrastructure stays the same.

### 4b. The Ask widget — Coming Soon placeholder
Future Michelle's-requests inbox. For v3 launch, just a placeholder card.
- Cyan accent
- Body content: "Coming soon — Michelle's request inbox"
- Lives in the default layout (full-width, at the bottom)

### 4c. Loose Ends widget — UNIVERSAL CAPTURE INBOX

This is THE inbox. Everything captured via Comms (or the FAB, or manual entry) lands here first. The owner triages by tapping action buttons on each row to promote items into Today, Active Missions, or Deadlines — without removing them from Loose Ends.

- Purple accent
- Each row: hexagon checkbox, item text, optional due date, optional priority, action buttons
- "+ Add" button in header

**Per-row action buttons** (visible on hover desktop, always visible on mobile):
- **➕ Today** — toggles whether item is mirrored to Today list
- **🎯 Mission** — toggles whether item is mirrored to Active Missions
- **📅 Deadline** — toggles whether item is mirrored to Deadlines (prompts for date if not set)
- **✕ Delete** — removes from Loose Ends entirely

**Mirroring behavior (single source of truth):**
- The item ALWAYS lives in Loose Ends. Promote actions don't move it — they create mirrored references.
- A Loose Ends item with `inToday: true` shows up in BOTH Loose Ends AND Today.
- Checking the hexagon checkbox in EITHER widget completes the item in BOTH places.
- Deleting from Loose Ends removes from all mirrors.
- Un-promoting (tapping ➕ Today again on an active mirror) removes from Today only — item stays in Loose Ends.

**Visual indicator:** When an item is mirrored, show small icon badges in its row indicating where it appears (a tiny gold dot for Today, blue for Mission, coral for Deadline). Helps owner see at a glance which items are routed.

**No subtasks, no recurring, no project linking** — Loose Ends items stay simple. If something needs that complexity, the user creates it directly in Today / Active Missions instead.

### 4d. The Lab widget (replaces Side Operations)
A creative tracker. Always-on creative output across all mediums (digital, video, dance, art, crafting).
- Pink accent
- List of items with text + optional note
- **Three permanent pinned slots at the top** with a subtle pink-tinted background (lower opacity of widget accent) — these are the "what I'm actively working on" slots
- Empty pinned slots show a "Pin an idea" placeholder
- User can pin/unpin items via a pin icon on each item
- Below pinned: regular list of all other Lab items
- "+ Add" button in header

### 5. Features to port from v2 (keep working)
- Focus mode (hides non-Today widgets)
- Inline editing (pencil icon on task, click project card)
- Recurring tasks (completes current, spawns next)
- Subtasks (inline per task)
- Drag-to-reorder tasks in Today
- Widget layout editor (drag + ↑↓ + half/full toggle)
- Custom tags (purple chips)
- Project notes field
- Archive for missions
- Keyboard shortcuts: N (new task), / (focus Comms), E (edit layout), F (focus mode), ? (help), Esc (close)
- Haptic feedback (task complete, habit tick)
- First-time name setup modal
- Export/import JSON backup
- Reset layout / reset all data

### 6. Features deferred (mention in README, build later)
- Calendar grid view for deadlines
- Weekly Sunday reflection prompt
- Global search
- Stats/analytics charts
- Audio sound effects

---

## State Shape (v3)

```js
{
  initialized: true,
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
  projects: [
    // { id, name, domain, progress, nextAction, deadline, notes, tags, status: 'active'|'archived', createdAt }
  ],
  tasks: [
    // { id, text, projectId, priority, dueDate, completed, completedAt, tags, subtasks, recurring, order, createdAt }
  ],
  habits: [
    // { id, name, streak, lastCompleted, history: [dates], createdAt }
  ],
  lab: [
    // { id, text, note, pinned: boolean, pinSlot: 0|1|2|null, createdAt }
    // pinned items occupy fixed slots 0/1/2 — only 3 can be pinned at once
  ],
  looseEnds: [
    // { id, text, dueDate, priority, completed, completedAt, createdAt,
    //   inToday: boolean,    // if true, mirror in Today widget
    //   inMissions: boolean, // if true, mirror in Active Missions widget
    //   inDeadlines: boolean // if true, mirror in Deadlines widget
    // }
    // Loose Ends is the universal inbox. Items live here permanently and are
    // mirrored (referenced) into other widgets via the in* flags. Checking the
    // hexagon checkbox in any mirrored location toggles the single completed
    // boolean, which updates everywhere.
  ],
  deadlines: [
    // { id, title, date, note, createdAt }
  ],
  layout: [
    // { id: 'comms'|'today'|'projects'|'deadlines'|'habits'|'lab'|'looseEnds'|'theAsk', size: 'half'|'full' }
  ],
}
```

**Default layout (top to bottom):**
1. `comms` (full) — placeholder, "Coming soon"
2. `today` (full)
3. `projects` (half) — Active Missions
4. `deadlines` (half)
5. `habits` (half) — Daily Protocol
6. `lab` (half) — The Lab (creative)
7. `looseEnds` (full) — Loose Ends (one-off tasks)
8. `theAsk` (full) — placeholder, "Coming soon"

**Migration note:** v2 had `sideQuests` and `ideas` collections. In v3 these are renamed/replaced — `lab` replaces `sideQuests`, and `ideas` is dropped (Field Notes scratchpad is gone, replaced by Loose Ends as a structured task list, not a free-text scratchpad).

---

## Recommended Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS (wire color tokens into `tailwind.config.js`)
- **State:** Zustand (or useReducer + Context for simpler start)
- **Storage v1:** `localStorage` wrapper
- **Storage v2 (later):** Supabase or Cloudflare Worker + D1 for cross-device
- **Voice:** Native Web Speech API
- **API:** Direct fetch to Anthropic with env-loaded key
- **Deploy:** Vercel or Cloudflare Pages (free, auto-deploy from GitHub)

### Suggested structure
```
moad/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── Hero.jsx
│   │   ├── widgets/
│   │   │   ├── WidgetCard.jsx       (shared shell: accent stripe, header)
│   │   │   ├── Comms.jsx            (placeholder card "Coming soon")
│   │   │   ├── Today.jsx
│   │   │   ├── Task.jsx
│   │   │   ├── Missions.jsx         (Active Missions)
│   │   │   ├── Project.jsx
│   │   │   ├── Deadlines.jsx
│   │   │   ├── Habits.jsx           (Daily Protocol)
│   │   │   ├── Lab.jsx              (creative tracker, 3 pinned + list)
│   │   │   ├── LooseEnds.jsx        (one-off tasker)
│   │   │   └── TheAsk.jsx           (placeholder card "Coming soon")
│   │   ├── modals/
│   │   └── Fab.jsx
│   ├── lib/
│   │   ├── store.js
│   │   ├── storage.js
│   │   ├── dates.js
│   │   └── recurring.js
│   ├── hooks/
│   │   ├── useHaptic.js
│   │   └── useKeyboardShortcuts.js
│   └── styles/index.css
├── .env.local            (gitignored)
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Files in This Folder

1. **`MOAD-HANDOFF.md`** (this) — read first
2. **`CHECKLIST.md`** — step-by-step execution
3. **`CLAUDE-CODE-PROMPT.md`** — the opening prompt to paste
4. **`moad-v2-reference.html`** — working prototype (reference only, don't port line-by-line)
5. **`MOAD-brief.md`** — original project brief with research
6. **`design-config.json`** — locked design config

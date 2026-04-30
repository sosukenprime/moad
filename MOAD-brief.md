# MOAD — Project Brief

**Mother of All Dashboards** · v1.0
*Built: April 21, 2026*

---

## What I Built

A mobile-first, ADHD-aware, lightly-gamified life dashboard that lives as a Claude artifact with persistent storage. Data saves automatically between sessions via the artifact storage API, so anything you add stays — no re-entering every morning.

**Aesthetic:** "Command Deck" — refined terminal meets subtle RPG character sheet. Dark base, warm amber as the XP/gold accent, strategic domain colors, clean type hierarchy.

---

## Design Decisions & Why

### The RPG/ADHD Problem
Standard productivity tools are built like accounting software — spreadsheets of obligations. ADHD brains starved of dopamine don't engage with guilt-driven task lists. RPG brains already know how it *feels* to clear a quest log; we're borrowing that neural pattern for real life.

### The Over-Gamification Trap
Research was clear: the biggest failure mode of tools like Habitica is users spending more time *customizing their avatar* than *completing tasks*. So I deliberately kept the game layer **thin but visible**:

- ✓ XP, levels, streaks, progress bars (dopamine delivery system)
- ✓ "Quest" / "Campaign" terminology (reframes without replacing)
- ✗ No avatars, pets, costumes, collectibles, item shops
- ✗ No HP/health loss mechanics (punishment is counterproductive for ADHD)

### Why a Single Scrolling Page
ADHD working memory is fragile. Hiding important sections behind tabs or menus means they effectively don't exist. MOAD shows everything on one page, in a deliberate priority order:

1. **Status/hero** (level, XP, streak, today's ratio) — the at-a-glance dopamine
2. **Today** — the only tasks you should be looking at right now
3. **Active Campaigns** — projects with progress bars
4. **Deadlines** — what you must not forget
5. **Daily Rituals** (habits) — streak mechanics
6. **Side Quests** — pressure-free creative pool
7. **Scratchpad** — idea dump, no structure required

### Why the Scratchpad Separates from Tasks
The ADHD research called this out specifically: **separate capture from planning**. When an idea hits at 2pm during a call, you don't want to pause and decide "is this a task or a project or a habit?" You want to dump it fast. Scratchpad is a zero-friction drain. Triage later (or never — some ideas are just meant to exist on a list).

### Why Side Quests Are Separate
You mentioned "creative non-urgent projects/ideas" distinctly from regular projects. That's a real category — the stuff you want to pick up when inspired, without a deadline-shaped gun to your head. Giving it its own section (pink/creative-coded) keeps those things visible without letting them masquerade as urgent work.

---

## Research That Shaped It

Key findings from ~45 sources across dashboard design, ADHD UX, and gamified productivity:

**On dashboards**
- Limit visible metrics to 3–5 at a time; more = cognitive overload
- Progress bars outperform numeric percentages for motivation
- Hide nothing important in submenus
- Morning-open priority should be a single glance that answers "where do I stand?"

**On ADHD**
- *Progress bars literally fire dopamine* (Dopamine Dash, ADDA, Brain.fm research) — seeing a bar move activates the same reward system as completion
- Break tasks small (<30 min where possible); large undefined tasks trigger avoidance
- Color-coding boosts retention/scanning speed
- Externalize memory — don't rely on working memory to hold what matters
- "Keep it fresh" — ADHD brains adapt to sameness and disengage

**On gamification (Habitica, BeeDone, LifeUp)**
- Three task shapes work: **Habits** (recurring behaviors), **Dailies** (repeated tasks), **To-Dos** (one-time). MOAD uses Tasks + Habits as the clean version
- XP for completion + streaks for consistency covers 80% of the motivational payoff
- Over-customization kills engagement (the avatar trap)

**On mobile UI**
- FAB (floating action button) at bottom-right, thumb-reach zone, 56px is standard
- Primary action = quick capture. Secondary actions fan out from it
- Keep destructive actions out of easy-tap zones

---

## Features Included (v1)

**Core**
- Persistent storage across sessions (window.storage API)
- Mobile-first responsive layout (tested down to ~360px)
- Dark theme with warm accent
- FAB for quick capture (Task / Project / Deadline / Habit / Side Quest)

**Gamification**
- XP system with custom per-task values (5 low / 10 med / 20 high / 15 habit)
- Level progression (cumulative threshold system)
- Streak counter (with automatic break detection)
- Per-habit streaks
- XP "pop" animation on completion
- Level-up toast notification

**Tasks**
- Inline-checkable tasks with strikethrough + XP award
- Priority flagging (low/medium/high)
- Due date with color-coded urgency (overdue / due today / soon / far)
- Optional project linkage
- Auto-rollover of overdue incomplete tasks into Today

**Projects / Campaigns**
- Progress bar (0–100%)
- "Next action" field (GTD-style — the ONE thing to do next)
- 4 domain categories with distinct colors: Work / Personal / Creative / Daily
- Optional deadline with urgency color

**Deadlines**
- Unified view combining project deadlines + standalone deadlines
- Calendar-chip date display
- Overdue warning with visual differentiation

**Habits**
- Tap-to-complete daily toggle
- Running streak counter
- History preserved for future analytics

**Side Quests**
- Pressure-free creative project pool
- Optional "note to future self" field

**Scratchpad**
- Enter-to-save instant capture
- Reverse-chronological list
- Per-idea delete

**Settings**
- Export all data to JSON (backup)
- Import from JSON (restore)
- Seed with example data
- Reset everything (with double-confirm)

---

## What's Easy to Change

Everything is CSS variables at the top of the `<style>` block:

```css
:root {
  --gold: #F5B942;    /* Change the accent color here */
  --bg: #0A0E1A;      /* Background */
  --work: #60A5FA;    /* Domain colors */
  --personal: #A78BFA;
  /* ... etc */
  --radius: 14px;     /* Rounded-ness */
  --font-display: 'Instrument Serif', serif;
}
```

XP values are easy to tune in `saveFromModal('task')` and `toggleHabit()`. The level curve is in `xpProgressInLevel()` — currently `level * 100` XP per level (so L2 = 100, L3 = 300 cumulative, L4 = 600, etc.). Easy to swap for a flatter curve (`100` constant) or steeper (`level * level * 100`).

---

## V2 Ideas (When You're Ready)

**Near-term (easy additions):**
- Edit existing items (currently delete-and-readd)
- Drag to reorder tasks within Today
- "Energy level" tag on tasks (ADHD research: match task to current state — low/medium/high)
- Pomodoro timer embedded in a task row
- Completed tasks history / "wins" view (proof-of-productivity)
- Recurring tasks (daily/weekly/monthly patterns)
- Subtasks (checklist inside a task)
- Filter/search bar

**Medium-term:**
- Project detail view (click a campaign → see its tasks, notes, full history)
- Weekly reflection prompt (Sunday evening check-in modal)
- Simple analytics: tasks/week chart, XP trend line, domain breakdown
- Calendar grid view toggle for deadlines
- Tags/areas beyond the 4 domain presets

**Experimental:**
- Voice-to-task via the browser's speech API (for when typing is friction)
- A "boss fight" framing for big deadline projects (optional visual treatment)
- Connection to Claude — ask MOAD questions about your week in natural language
- Export weekly status update to paste into meetings

**Migration path (when this graduates from Claude):**
The JSON export is your escape hatch. The data model is simple and maps cleanly to Notion databases, Airtable bases, a Postgres schema, or a proper web app backend. If/when MOAD moves out of Claude, it becomes: `state.projects` → projects table, `state.tasks` → tasks table, etc.

---

## How to Use It Tomorrow Morning

1. **Open MOAD** — top of page is your at-a-glance status (level, XP, streak, today's ratio)
2. **Scan Today** — tap checkboxes as you complete; watch the progress bar fill
3. **Tap the + button** (bottom right) anytime inspiration or anxiety strikes
4. **Ideas → Scratchpad** for raw thought dumps; triage to tasks/projects later
5. **Weekly**: Use Sunday to add new tasks/deadlines for the week, review projects' progress, clear stale side quests

---

## Known Limitations

- Data lives inside this artifact — if you use MOAD in a different artifact instance, you'll start fresh. Export regularly if you care about the data.
- No sync across devices yet — it's per-artifact-instance.
- No recurring task support in v1 (workaround: habits cover daily recurrence)
- Can't edit items inline — delete and re-add for now
- No timezone handling — dates use local device time

---

## The Vibe

MOAD should feel like opening your command deck each morning. Not a guilt-delivery system, not a dopamine slot machine, not a stale spreadsheet. A clear, calm, data-forward view of where you actually stand — with just enough RPG texture to make checking boxes feel slightly better than it should.

If it stops feeling that way, tell me what's off. We iterate.

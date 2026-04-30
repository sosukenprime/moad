# Opening Prompt for Claude Code

**Copy everything below the line and paste into Claude Code as your first message.**

---

I'm porting a productivity dashboard called MOAD from a Claude artifact to a real web app. I have reference files in this folder — please read all of them before writing any code:

1. `MOAD-HANDOFF.md` — full specification, locked design decisions, v2→v3 changes, state shape
2. `moad-v2-reference.html` — working prototype (reference for behavior and styling, do NOT port line-by-line)
3. `MOAD-brief.md` — original project brief with research and rationale
4. `design-config.json` — locked design choices exported from my design studio

After you've read all four, propose:
1. A file/folder structure
2. Tech stack (my default suggestion is Vite + React + Tailwind + localStorage + Vercel deploy, but push back if you have a better idea)
3. A build order (what to ship first, second, third)

**Do not write any code yet.** I want to agree on the approach before you start.

## Critical changes from the v2 reference

The v2 HTML in this folder is the OLD structure. Don't mirror it directly — implement the v3 widgets per the handoff doc.

**v3 widget lineup (top to bottom default order):**
1. **Comms** (cyan) — ACTIVE, one-shot capture. Textarea + mic (Web Speech API) + send button. User speaks or types → text sent to Anthropic API (`claude-sonnet-4-20250514`) → Claude returns parsed items → ALL items land in Loose Ends (the universal inbox). API key loaded from `VITE_ANTHROPIC_API_KEY` env var (NEVER hardcoded, NEVER committed). See MOAD-HANDOFF.md for the exact system prompt and behavior.
2. **Today** (gold) — daily focus task list. Tasks here.
3. **Active Missions** (blue) — multi-step long-running projects. Replaces what v2 called "projects."
4. **Deadlines** (coral) — time-sensitive dates.
5. **Daily Protocol** (mint) — habits with 🔥 streak badge in header.
6. **The Lab** (pink) — creative tracker. **3 permanent pinned slots at top** with subtle pink-tinted background, "Pin an idea" placeholders when empty. Below pinned: regular list of ideas. Replaces v2's "Side Operations."
7. **Loose Ends** (purple) — **THE UNIVERSAL CAPTURE INBOX.** All items captured via Comms or manual add land here. Each row has action buttons (➕ Today, 🎯 Mission, 📅 Deadline, ✕ Delete) that toggle whether the item is mirrored into other widgets. Items live ONLY in Loose Ends — mirroring is via boolean flags. Checking the box in any mirror completes the item everywhere. Replaces v2's "Field Notes" scratchpad.
8. **The Ask** (cyan) — placeholder card with "Coming soon" body text. Future: Michelle's request inbox.

**Other v3 changes:**
- **NO XP/level/rank system.** Removed entirely. Progress tracking that stays: daily completion %, per-habit streaks, overall daily-use streak (🔥 badge in Daily Protocol header), project progress bars on missions.
- **Unified widget-card design.** Each widget is ONE card with the title integrated INSIDE, colored in that widget's accent color, with a 3px left accent stripe (with glow) and a subtle accent-colored wash across the header background. NOT a floating heading above a plain card. Previous attempts to retrofit this into v2 failed — get it right from the start.
- **Branding:** the product name is always written **MOAD** (all caps) everywhere a user sees it — page title, header, splash, settings, modals, PWA manifest. It's an acronym, not a word. Lowercase `moad` only in file paths, repo slug, npm package name. See "Naming & Branding" in MOAD-HANDOFF.md.

## Build order priority

Owner is on a tight time budget — focus on shipping the core working app:
1. Project scaffolding + design tokens + WidgetCard shell + Hero
2. Today + Active Missions + Deadlines (the high-traffic widgets)
3. Daily Protocol + The Lab + Loose Ends
4. Comms and The Ask placeholders
5. Layout edit mode + focus mode + keyboard shortcuts
6. Modals (add/edit task, add/edit mission, add deadline, etc.)
7. Settings (name, haptic toggle, export/import)
8. Polish + deploy

Questions for you after you've read everything:
- Any concerns about the plan?
- Anything in the spec that's ambiguous or contradictory?
- Anything you'd do differently than what I suggested?

Start with reading the files and proposing a plan.

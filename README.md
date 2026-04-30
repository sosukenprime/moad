# MOAD

**M**other **o**f **A**ll **D**ashboards — a personal command deck for an ADHD-wired brain.

Vite + React + Tailwind + Zustand. localStorage v1. Deployed on Vercel with a serverless `/api/comms` proxy for the Anthropic capture endpoint.

## Local development

```
npm install
cp .env.example .env.local   # then put your real ANTHROPIC_API_KEY in .env.local
npm run dev
```

The dev server proxies `/api/comms` through a tiny Vite plugin so voice/text capture works locally — no separate `vercel dev` needed.

## Build

```
npm run build
npm run preview
```

## Deploy

Push to GitHub. Connect the repo in Vercel. Set `ANTHROPIC_API_KEY` in Project → Settings → Environment Variables (do **not** prefix with `VITE_` — it's server-side only). Vercel auto-detects Vite and builds the React app + the `/api` serverless function from `api/comms.js`.

## Reference files (handoff package)

- `MOAD-HANDOFF.md` — full spec, locked design decisions, v3 widget lineup
- `MOAD-brief.md` — original project brief
- `design-config.json` — locked design tokens
- `moad-v2-reference.html` — v2 prototype (reference only, do not port line-by-line)
- `CHECKLIST.md`, `CLAUDE-CODE-PROMPT.md`, `HANDOFF-README.md` — setup instructions

## Architecture

```
src/
├── App.jsx                      # orchestrator, focus mode, first-time setup
├── main.jsx
├── components/
│   ├── Hero.jsx                 # greeting + date + focus toggle
│   ├── LayoutGrid.jsx           # renders widgets per state.layout
│   ├── Fab.jsx                  # floating action button
│   ├── Toasts.jsx
│   ├── modals/
│   │   ├── Modal.jsx            # shared modal shell
│   │   └── index.jsx            # all flavors (add/edit task, mission, deadline, habit, lab, loose end, settings, help, first-time)
│   └── widgets/
│       ├── WidgetCard.jsx       # shared shell: stripe + glow + header wash
│       ├── HexCheckbox.jsx
│       ├── Comms.jsx            # one-shot capture → /api/comms → Loose Ends
│       ├── Today.jsx            # union of state.tasks + Loose Ends with inToday=true
│       ├── Missions.jsx         # active projects
│       ├── Deadlines.jsx
│       ├── DailyProtocol.jsx    # habits with 🔥 streaks
│       ├── Lab.jsx              # 3 pinned + list
│       ├── LooseEnds.jsx        # universal capture inbox
│       └── TheAsk.jsx           # placeholder, "Coming soon"
├── lib/
│   ├── store.js                 # Zustand store with v3 state shape
│   ├── storage.js               # versioned localStorage wrapper
│   ├── ui.js                    # ephemeral UI store (modals, toasts, layout edit)
│   └── dates.js                 # date helpers
├── hooks/
│   └── useKeyboardShortcuts.js  # N / E / F / ? / Esc
└── styles/
    └── index.css                # Tailwind + design tokens + gradient mesh + hex clip-path

api/
└── comms.js                     # Vercel serverless function (Anthropic proxy)
```

## Locked decisions

See `MOAD-HANDOFF.md`. Notable v3 decisions:
- No XP / level / rank system.
- Loose Ends is the universal inbox; promotion to Today / Missions / Deadlines is via boolean mirror flags, not moves.
- Mission promotion creates a real project; the Loose End stays in inbox.
- Direct-to-Today tasks live in `state.tasks`, separate from `state.looseEnds`.
- Mirrored Loose Ends are simple — no subtasks or recurring.
- Completion history is permanent (`completedAt` timestamps), never deleted.
- Daily-use streak counts only on real completions, not app opens.
- Anthropic API key is server-side only via `/api/comms`.

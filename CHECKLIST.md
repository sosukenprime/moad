# MOAD — Execution Checklist

Follow top to bottom. Each step has a checkbox and a "if it breaks" note. Should take ~30 min for setup, then as long as you want for the build.

---

## Phase 1 — Prerequisites (10 min, one time)

### ☐ 1. Install Node.js
- Go to **nodejs.org** → download the **LTS** version (big green button).
- Run the installer, click through.
- **Verify:** open Terminal (Mac) or PowerShell (Windows) and type:
  ```
  node --version
  ```
  Should print something like `v20.x.x`. If "command not found," restart your terminal.

### ☐ 2. Install Git
- **Mac:** open Terminal, type `git --version`. If prompted to install Command Line Tools, click Install.
- **Windows:** go to **git-scm.com** → download → run installer (default options are fine).
- **Verify:** `git --version` should print something.

### ☐ 3. Get a GitHub account
- If you don't already have one: **github.com** → Sign up (free).
- Remember your username; you'll need it.

### ☐ 4. Install Claude Code
- Open Terminal/PowerShell, run:
  ```
  npm install -g @anthropic-ai/claude-code
  ```
- **Verify:** `claude --version` should print something.
- You'll be prompted to log in the first time you run it — use the same Anthropic account you use for claude.ai.

### ☐ 5. Get an Anthropic API key
- Go to **console.anthropic.com** → Sign in with your Anthropic account.
- Top right → Settings → API Keys → "Create Key" — name it "MOAD" or whatever.
- **Copy the key somewhere safe right now** — you won't see it again.
- Add a small amount of credit to your account ($5-10 is plenty to start — API calls for this app cost fractions of a cent).

---

## Phase 2 — Project Setup (5 min)

### ☐ 6. Download the handoff folder
- Save ALL the files I gave you into a folder somewhere easy, like `Desktop/moad-handoff/`:
  - `MOAD-HANDOFF.md`
  - `CHECKLIST.md` (this file)
  - `CLAUDE-CODE-PROMPT.md`
  - `moad-v2-reference.html`
  - `MOAD-brief.md`
  - `design-config.json`

### ☐ 7. Make the project folder
- Create a new empty folder for the actual app. Example: `Desktop/moad/`.
- This is SEPARATE from the handoff folder. The handoff is read-only reference material.

### ☐ 8. Copy reference files into the project folder
- Copy all 6 files from the handoff folder → into the project folder.
- Claude Code needs them to be in the project folder to read them.

### ☐ 9. Open the project folder in Terminal
- **Mac:** right-click the folder in Finder → "New Terminal at Folder"
- **Windows:** Shift+right-click inside the folder → "Open PowerShell window here"
- **Verify:** type `ls` (Mac) or `dir` (Windows) — you should see your 6 files listed.

---

## Phase 3 — Start Building (5 min to kick off)

### ☐ 10. Launch Claude Code
- In the terminal (still inside your project folder), type:
  ```
  claude
  ```
- Claude Code starts up. You'll see a prompt.

### ☐ 11. Paste the opening prompt
- Open `CLAUDE-CODE-PROMPT.md` in any text editor.
- Copy the entire contents.
- Paste into Claude Code. Press Enter.
- Claude Code will read all your files and propose a plan. **Don't let it write code yet** — read the plan, push back on anything that doesn't match what you want, make it iterate until you're happy with the proposed structure.

### ☐ 12. Approve the plan and let it build
- Once you're happy with the plan, tell it to proceed.
- It will create files, install dependencies, etc. It asks permission before running commands — say yes to obvious stuff like `npm install`.
- **Time:** initial build usually takes 10-30 min of back-and-forth.

### ☐ 13. Add your API key
- Once Claude Code creates a `.env.example` file, it will tell you to make a `.env.local` file.
- Create `.env.local` in the project root with this line (replace with your actual key):
  ```
  VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
  ```
- **IMPORTANT:** check that `.env.local` is listed in `.gitignore` BEFORE you commit anything. Claude Code should handle this automatically, but verify.

### ☐ 14. Run it locally
- When Claude Code says it's ready to run, try:
  ```
  npm run dev
  ```
- Open the URL it prints (usually `http://localhost:5173`).
- Poke around. Break things. Tell Claude Code what's broken.

---

## Phase 4 — Deploy (15 min, once you're happy)

### ☐ 15. Push to GitHub
Tell Claude Code:
> Initialize a git repo, create a new private GitHub repo called "moad," and push this project to it.

It'll walk you through. You may need to authenticate with GitHub once.

### ☐ 16. Deploy to Vercel (the fast path)
- Go to **vercel.com** → sign up with your GitHub account.
- Click "Add New Project" → find your `moad` repo → Import.
- Before clicking Deploy: expand "Environment Variables" and add:
  - Name: `VITE_ANTHROPIC_API_KEY`
  - Value: (paste your Anthropic API key)
- Click Deploy. ~2 minutes later you have a live URL.
- Open the URL on your phone, add it to your home screen, and you're done.

### ☐ 17. Set up auto-deploy
- Vercel automatically redeploys whenever you push to GitHub. You don't have to do anything.
- Future iterations: in Claude Code, tell it to make changes → commit → push → Vercel auto-deploys in a couple minutes.

---

## When Things Break

| Symptom                          | Try                                                 |
|----------------------------------|-----------------------------------------------------|
| "command not found: node"        | Restart terminal, or reinstall Node                |
| "command not found: claude"      | Run `npm install -g @anthropic-ai/claude-code` again |
| Claude Code hangs                | Ctrl+C, restart, describe what you were trying to do |
| API calls fail in browser        | Check the key in `.env.local` is spelled right and matches what's in Vercel |
| CORS errors on Anthropic API     | The browser can't call Anthropic directly from all hosts — Claude Code can set up a tiny API proxy route if needed. Ask it. |
| Site deploys but Comms doesn't work | Check that env var is set on Vercel, then redeploy |

---

## Sanity Tips

- **Commit often.** After every working feature, `git commit`. If something breaks, you can always roll back.
- **Push back.** Claude Code will sometimes over-engineer. If it wants to add 4 dependencies for something simple, ask why and suggest a smaller approach.
- **Don't rush the plan step.** Getting the file structure right up front saves hours of refactoring later.
- **Test on your phone early.** Some features (haptic feedback, Web Speech API) only work on mobile browsers. Don't wait until the end to check.
- **Your data migrates.** On first run with Claude Code's version, you can export your current v2 data as JSON (Settings → Export) and import it into the new app. Tell Claude Code to wire up the same JSON shape so it just works.

---

## When You're Stuck

Two good escape hatches:

1. **Ask Claude Code** — it can read its own codebase, explain things, fix bugs, write tests. Describe the problem plainly.
2. **Come back to claude.ai** — paste the specific broken file and a description of what's going wrong. I can help debug even if you're building elsewhere.

That's it. Good luck — this thing is going to be worth the effort.

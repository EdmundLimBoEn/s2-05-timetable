# CLAUDE.md — timetable/

S2-05 SST Singapore school timetable, Term 2 2026.

**Stack:** vanilla HTML + CSS + JS (public site) + Node.js Express server (API). No build step.
**To preview locally:** `open index.html` (static only; API calls will fail without env vars)
**Live site:** https://timetable.edmundlim.systems
**Testing site:** https://testing.timetable.edmundlim.systems (auto-tracks `dev` branch — updates automatically on every push to `origin/dev`)
**Admin panel:** https://timetable.edmundlim.systems/admin
**GitHub repo:** https://github.com/EdmundLimBoEn/s2-05-timetable (public, main branch)

---

## Architecture

```
Public site (index.html / script.js)
  └─ fetch /api/data (every 10 s, cache: no-store) ──► Express (server.js)
                                                          └─ getData() → local JSON file
                                                                └─ fallback: hardcoded SEED

Admin panel (/admin/index.html + admin/admin.js)
  ├─ GET  /api/me          — check session cookie
  ├─ GET  /api/admin-data  — fresh data (no cache, requires auth)
  └─ POST /api/save        — validate → write JSON file → return {ok, updatedAt}
```

**Hosting:** Hack Club Nest (free Linux LXC container, `edmundlim@hackclub.app`).
**Proxy:** Hack Club reverse proxy → container port 80 (production) / port 3001 (dev).
**Storage:** Local JSON file at `~/timetable/data/timetable-data.json` (production) and `~/timetable-dev/data/timetable-data.json` (dev). Atomic writes via tmp-file rename.
**Auth:** JWT (HS256, `jose`) in an HTTP-only Secure SameSite=Strict cookie (`tt_session`, 7-day expiry). Admin list stored in `ADMINS_JSON` env var as `[{username, passwordHash}]` (bcrypt via `bcryptjs`).
**Process manager:** PM2 — `pm2 status` to check, `pm2 logs timetable` for logs.

---

## Files

### Public site
| File | Role |
|------|------|
| `index.html` | Shell — topbar, bars, demo banner, table mount, settings panel, bottom panel |
| `script.js` | All data, logic, theme, demo mode, URL hash sync, live-data polling, journal, announcements |
| `style.css` | All styles; colour tokens in `:root` |
| `favicon.svg` | Browser-tab favicon — 32×32 pixel-art T |
| `icon.svg` | PWA home-screen icon — 512×512 pixel-art T |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker (`tt-v7`): network-first `/api/data`, cache-first static, bypass `/admin` |

### API (Express routes via server.js)
| File | Role |
|------|------|
| `server.js` | Express entry point — mounts all API routes + serves static files |
| `api/data.js` | `GET /api/data` — public |
| `api/admin-data.js` | `GET /api/admin-data` — requires auth, `no-store` (used by admin panel) |
| `api/save.js` | `POST /api/save` — requires auth, validates, writes JSON file; assigns `id`/`createdAt`/`createdBy` server-side |
| `api/login.js` | `POST /api/login` — bcrypt compare, sets JWT cookie. In-memory rate limit (5/15 min/IP) |
| `api/logout.js` | `POST /api/logout` — clears cookie |
| `api/me.js` | `GET /api/me` — returns `{username}` or 401 |
| `api/version.js` | `GET /api/version` — returns `{updatedAt}` from local file (used by client to skip full fetch) |
| `api/_lib/auth.js` | JWT sign/verify, bcrypt compare, cookie helpers, `getAdminFromRequest()` |
| `api/_lib/kv.js` | `getData()` / `setData()` — local JSON file I/O with atomic write (tmp + rename) |
| `api/_lib/seed.js` | Hardcoded fallback TIMETABLE + EXAMS + `announcements: []` (used when file is missing) |
| `api/_lib/validate.js` | Server-side validation: spans sum to 30/day, valid style keys, ISO dates, announcement fields |

### Admin panel
| File | Role |
|------|------|
| `admin/index.html` | Login card + dashboard shell (TIMETABLE / EVENTS / ANNCS / OVERRIDES / SUBJECTS tabs) |
| `admin/admin.js` | SPA logic: render editors, save, login/logout, week toggle, announcements, custom subjects CRUD |
| `admin/admin.css` | Dark terminal aesthetic, matches public site |

### Utilities
| File | Role |
|------|------|
| `server.js` | Express entry point (`npm start`) |
| `ecosystem.config.cjs` | PM2 config — production on port 80, dev on port 3001 |
| `.env.example` | Template for secrets (`PORT`, `ADMINS_JSON`, `JWT_SECRET`) |
| `scripts/hash-password.js` | CLI: `node scripts/hash-password.js <password>` → prints bcrypt hash |
| `package.json` | `"type": "module"`, deps: `express`, `bcryptjs`, `jose`, `dotenv` |
| `.github/workflows/deploy.yml` | CI/CD: push to `dev` → deploys to testing; push to `main` → deploys to production |

---

## Data model

### Time grid
- `TIMES` — 21 slots, 08:00–14:40, each 20 min wide (`N_COLS = 21`)
- `END_MIN` — 15:00; every day row must total exactly **30 spans**
- `DAY_LABELS` — Mon…Fri, index 0–4 (maps to `getDay()` 1–5)

### `TIMETABLE`
`{ odd: [Mon…Fri], even: [Mon…Fri] }` — each day is an array of block objects:
```js
{ label: 'English', span: 3, style: 'el' }
```
- `span` — 20-min slots; all rows must sum to 30
- `label` — shown in now-bar and used by `tick()`
- `style` — maps to CSS class + `ABBREV` entry

### `EXAMS`
Array of `{ label: string, date: 'YYYY-MM-DD' }`. Shown as an amber countdown bar within 7 days of each exam date.

### `ANNOUNCEMENTS`
Array of `{ id, title, body, category, createdAt, createdBy }` stored in the blob under key `announcements`.
- `id` — UUID, assigned server-side by `api/save.js`
- `title` — required, ≤100 chars
- `body` — optional, ≤5000 chars
- `category` — one of `general | homework | exam | event`
- `createdAt` — ISO timestamp, assigned server-side
- `createdBy` — username, assigned server-side

Admin panel: ANNCS tab — add/delete announcements, then SAVE. Saved instantly to blob; public site picks up within 10 s.

Public site: shown in the bottom panel (ANNOUNCEMENTS pane). New unseen announcements trigger a top-right toast (auto-dismiss 6 s, or ✕ to close). Seen state stored in `localStorage['anncs-seen']`.

### `ABBREV`
Short labels shown inside cells. `BUILTIN_ABBREV` is a frozen constant in `script.js`. On each data refresh, `installCustomStyles()` rebuilds the mutable `ABBREV` from that baseline plus any `customSubjects` entries — so deleted customs never linger.

### `CUSTOM_SUBJECTS`
Array of user-defined subject types stored in `timetable-data.json`:
```json
{
  "key":       "museum",
  "label":     "Museum Tour",
  "abbrev":    "MUSEUM",
  "color":     "#9b59b6",
  "bgOpacity": 0.18,
  "textColor": "#ffffff"
}
```
- `key` — `/^[a-z][a-z0-9_-]{0,30}$/`, must not collide with the 15 built-in keys
- `label` — non-empty, ≤40 chars (shown in admin dropdown + now-bar)
- `abbrev` — non-empty, ≤8 chars (shown inside the cell)
- `color` — 6-digit hex; drives `--c-<key>` CSS var and left border
- `bgOpacity` — number in [0, 1]; controls cell background tint
- `textColor` — 6-digit hex; `.cell.<key> .subj` text color

CSS rules for custom subjects are injected at runtime by `installCustomStyles()` into `<style id="custom-subjects">` in `<head>`, after `#theme-ovr`. No changes to `style.css` are needed.

**Admin flow:** SUBJECTS tab → add form → save → public site picks up within 10 s. Deleting a subject that is still in use shows a destructive-confirm modal listing every timetable row / override block using it; on confirm those blocks are rewritten to `style: 'empty'`; on save failure the in-memory state rolls back.

**Adding a built-in subject type** (not a custom one) still requires four coordinated changes:
1. `style.css` — add `--c-<key>` in `:root` and `.cell.<key>` / `.cell.<key> .subj` rules
2. `script.js` `BUILTIN_ABBREV` — add `key: 'SHORT'`
3. `admin/admin.js` `BUILTIN_SUBJECT_DISPLAY` + `BUILTIN_DEFAULT_LABELS` — add the key
4. `api/_lib/validate.js` `BUILT_IN_STYLES` — add the key

### Local file storage (`timetable-data.json`)
```json
{
  "timetable": {...},
  "exams": [...],
  "announcements": [
    { "id": "uuid", "title": "...", "body": "...", "category": "general", "createdAt": "ISO", "createdBy": "username" }
  ],
  "customSubjects": [
    { "key": "museum", "label": "Museum Tour", "abbrev": "MUSEUM", "color": "#9b59b6", "bgOpacity": 0.18, "textColor": "#ffffff" }
  ],
  "updatedAt": "ISO string",
  "updatedBy": "username"
}
```
`getData()` reads from `./data/timetable-data.json` (or `DATA_PATH` env var). Falls back to seed if missing. `setData()` writes atomically via tmp file + rename. Data directory is created on first save.

---

## Bottom panel (public site)

Below the timetable, between `<main>` and `<footer>`. Contains:
- **Resize handle** — drag the toolbar bar up/down to resize. Height persisted in `localStorage['bottom-height']`.
- **SPLIT / SINGLE toggle** — in the toolbar (right side). SPLIT = both panes side by side; SINGLE = one pane with JOURNAL/ANNCS pill toggle.
- **Journal pane** (`#journalPane`) — free-form textarea, saved to `localStorage['journal-v1']`, debounced 500 ms.
- **Announcements pane** (`#anncsPane`) — renders `ANNCS` global, sorted newest-first.

Layout mode persisted in `localStorage['bottom-layout']` (default: `split`).

---

## Adding / editing a subject type

**Custom subjects (preferred):** use the admin SUBJECTS tab — no code changes needed.

**Adding a new built-in subject** requires four coordinated changes:
1. `style.css` — add `--c-<key>` in `:root` and `.cell.<key>` / `.cell.<key> .subj` rules
2. `script.js` `BUILTIN_ABBREV` — add `key: 'SHORT'`
3. `admin/admin.js` `BUILTIN_SUBJECT_DISPLAY` + `BUILTIN_DEFAULT_LABELS` — add the key
4. `api/_lib/validate.js` `BUILT_IN_STYLES` — add the key

---

## Term calendar & auto week detection

```js
const TERM_START = { date: '2026-01-05', week: 'even' }
```

- Jan 5 = first Monday of Term 1 Week 1 = EVEN
- Weeks alternate continuously across all terms and holidays (counter never resets)
- `calcWeek()` computes `Math.floor((Date.now() - start) / msPerWeek) % 2` against the baseline

**2026 term dates (SST Singapore):**

| Term | Start (Mon) | End (Fri) |
|------|------------|-----------|
| T1 W1–W10 | 5 Jan | 13 Mar |
| T2 W1–W10 | 23 Mar | 29 May |
| T3 W1–W10 | 29 Jun | 4 Sep |
| T4 W1–W10 | 14 Sep | 20 Nov |

School holidays: 16–20 Mar, 1–26 Jun, 7–11 Sep, 23 Nov onwards.

**Odd/even per term (verified):**
- T1: W1=EVEN, W2=ODD, alternates
- T2: W1=ODD, W2=EVEN … W7=ODD (current as of May 2026) … W10=EVEN
- T3: W1=ODD, W2=EVEN, alternates
- T4: W1=EVEN, W2=ODD, alternates

When a new school year starts, update `TERM_START` to the new Term 1 Week 1 Monday.

---

## Live data polling (script.js)

```js
let lastUpdatedAt = null
async function refreshData() {
  const res = await fetch('/api/data', { cache: 'no-store' })
  const remote = await res.json()

  // Announcements always synced (not gated on updatedAt)
  ANNCS = Array.isArray(remote.announcements) ? remote.announcements : []
  renderAnncs()

  if (remote.updatedAt === lastUpdatedAt) return  // timetable/exams unchanged
  lastUpdatedAt = remote.updatedAt
  TIMETABLE = remote.timetable
  EXAMS = remote.exams
  rebuild(); checkExams()
}
await refreshData()
setInterval(refreshData, 10_000)               // poll every 10 s
setTimeout(() => location.reload(), 3_600_000) // hard reload every hour
```

- Public site renders immediately from hardcoded fallback, then overlays server data
- Announcements are synced on every poll (not just when `updatedAt` changes)
- Admin panel reads from `/api/admin-data` (no edge cache, requires auth cookie)

---

## Environment variables (server)

Stored in `~/.env` on the server (never committed). See `.env.example` for the template.

| Var | What |
|-----|------|
| `PORT` | `80` (production) / `3001` (dev) |
| `ADMINS_JSON` | `[{"username":"edmund","passwordHash":"$2a$10$..."}]` |
| `JWT_SECRET` | 32-byte random hex; signs/verifies session tokens |
| `DATA_PATH` | Optional override for JSON file path |

### Adding or changing an admin password
```bash
# On the server:
source ~/.nvm/nvm.sh
cd ~/timetable
node scripts/hash-password.js <new-password>
# Copy the hash, then edit ~/.env:
# ADMINS_JSON=[{"username":"edmund","passwordHash":"<hash>"}]
pm2 restart timetable
```

### Agent / bearer-token auth (`API_TOKENS_JSON`)

Long-lived tokens for AI agents (Claude Desktop, Claude Code, ChatGPT, scripts). Stored as bcrypt hashes — the server **never** holds the raw token.

```env
# ~/.env on the server — add alongside ADMINS_JSON
API_TOKENS_JSON=[{"name":"claude-desktop","tokenHash":"$2a$10$..."}]
```

**Mint a new token** (run on the server or locally, then paste the hash into `~/.env`):
```bash
source ~/.nvm/nvm.sh
cd ~/timetable          # or ~/timetable-dev
node scripts/generate-token.js claude-desktop
# Prints the raw token ONCE and the bcrypt hash.
# Add the hash to API_TOKENS_JSON in ~/.env, then restart PM2.
pm2 restart timetable   # or timetable-dev
```

- All admin endpoints (`/api/admin-data`, `/api/save`, etc.) accept `Authorization: Bearer <raw-token>` in addition to the session cookie.
- `updatedBy` in saved data is recorded as `agent:<name>` so agent edits are distinguishable from human edits.
- To revoke a token: remove its entry from `API_TOKENS_JSON` and restart PM2. No other change needed.
- Full agent setup guide (MCP config, curl examples, system prompt): `AGENTS.md`.

### MCP server (`mcp-server/`)

A local stdio MCP server that wraps the admin API. Not deployed to the server — run it on your own machine and point it at production or testing.

```bash
cd mcp-server && npm install
# Set env vars, then attach to Claude Desktop or Claude Code (see AGENTS.md).
```

Tools: `get_timetable`, `set_week`, `add_custom_subject`, `list_custom_subjects`, `save_timetable`.

### GitHub Actions secret
`DEPLOY_SSH_KEY` — the private SSH key whose public half is in `~/.ssh/authorized_keys` on the server. Add via GitHub repo Settings → Secrets → Actions.

---

## Deployment

### Standard dev workflow

**Whenever the user says "push to dev", "commit to dev", "deploy", or any similar phrase implying work is ready:**
1. Commit all changes to the `dev` branch and push to `origin/dev`.
2. Open (or update) a PR from `dev` → `main` via `gh pr create` (or `gh pr edit` if one already exists).
Do both steps automatically — do not wait to be asked separately for each.

**After opening or updating any PR, run the CodeRabbit review loop:**
1. Wait ~60 s, then poll for new CodeRabbit comments: `gh pr view <number> --repo EdmundLimBoEn/s2-05-timetable --comments`
2. Read every comment posted by `coderabbitai`. For each actionable issue, fix the code in the `dev` branch and commit.
3. Push the fix to `origin/dev` (the same PR updates automatically).
4. Repeat from step 1 until a CodeRabbit comment confirms all issues are resolved or there are no new actionable comments.
Use `gh api repos/EdmundLimBoEn/s2-05-timetable/issues/<number>/comments` to get the full comment text when needed.

Pushing to `origin/dev` triggers GitHub Actions (`.github/workflows/deploy.yml`), which rsyncs to `~/timetable-dev` and restarts the `timetable-dev` PM2 process. `testing.timetable.edmundlim.systems` always shows the dev branch.

For production (`main`):
- Merging the PR triggers GitHub Actions, which rsyncs to `~/timetable` and restarts the `timetable` PM2 process.
- Hotfix (skip PR): push directly to `main`.

```bash
# Commit + push
git add <files> && git commit -m "..." && git push origin dev

# PR (create or update)
gh pr create --title "..." --body "..." || gh pr edit <number> --body "..."
```

### Server management (SSH)
```bash
ssh edmundlim@hackclub.app
source ~/.nvm/nvm.sh

pm2 status                  # check both processes
pm2 logs timetable          # production logs
pm2 logs timetable-dev      # testing logs
pm2 restart timetable       # restart production
```

### Custom domains
- `timetable.edmundlim.systems` — production. DNS: CNAME `timetable → hackclub.app` at Cloudflare. Hack Club proxy: `timetable.edmundlim.systems → 10.60.1.113:80`.
- `testing.timetable.edmundlim.systems` — dev branch. DNS: CNAME `testing.timetable → hackclub.app`. Hack Club proxy: `testing.timetable.edmundlim.systems → 10.60.1.113:3001`.
- Hack Club proxy config: dashboard.hackclub.app → "Add Domain" section.
- Server: `edmundlim@hackclub.app`, container IP `10.60.1.113`.

---

## Style notes

- Fonts: `VT323` (headings/labels/cells) + `Space Mono` (time labels, metadata)
- Retro CRT aesthetic: scanlines overlay (`.scanlines`), blinking cursor (`.cursor`)
- Cell row height: **64px fixed**
- Today's row: `.today-row` — day label glows red
- Active cell: `.cell.now` — brightness boost + red inset ring
- Colour scheme: dark (`#080808` bg), red accent (`#ff3b3b`)
- Icons: pixel-art rects only — no `<text>` or font elements in SVG files

---

## Service worker

`sw.js` cache name is currently `tt-v9`. Bump it (`tt-v10`, etc.) whenever static assets change significantly, to force clients to pick up the new files.

---

## Tests / verification checklist

There is no automated test runner. Use this manual checklist after any change to the data model or admin panel:

### Custom subjects
```bash
# 1. Verify /api/data returns customSubjects: [] on a fresh or seed load
curl -s https://testing.timetable.edmundlim.systems/api/data | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('customSubjects:', JSON.stringify(d.customSubjects))"

# 2. Round-trip the local data file (run on server)
node -e "JSON.parse(require('fs').readFileSync('data/timetable-data.json'))" && echo OK
```

**Admin SUBJECTS tab (manual):**
- Add "Museum Tour" (key `museum`, color `#9b59b6`, abbrev `MUSEUM`, opacity `0.18`, text `#ffffff`) → save → public site shows the styled cell within 10 s
- Assign `museum` to an ODD/MON block → cell renders with correct tint and `MUSEUM` label; now-bar shows full label when active
- Delete `museum` while it's still used in a block → modal lists the row location → **CANCEL** keeps everything unchanged; **CONFIRM DELETE** rewrites the block to `empty` and saves
- Try invalid inputs and verify server rejects them with a clear toast error:
  - Key starting with a digit (`1museum`)
  - Key colliding with a built-in (`el`, `math`, etc.)
  - Duplicate custom key
  - `bgOpacity` > 1
  - `abbrev` longer than 8 chars
  - Bad hex color (e.g. `#xyz`)

### Validation (server-side smoke test)
```bash
# Run on server in ~/timetable or ~/timetable-dev
node -e "
import('./api/_lib/validate.js').then(({validateData}) => {
  const bad = validateData({ timetable: null, exams: [], customSubjects: [{key:'1bad'}] })
  console.assert(bad.length > 0, 'should reject invalid payload')
  console.log('validation smoke test OK — errors:', bad)
})
"
```

### After any save.js / kv.js change
```bash
# Confirm a round-trip save doesn't lose customSubjects
pm2 logs timetable-dev --lines 20   # look for [kv] errors
curl -s http://localhost:3001/api/data | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log('keys:', Object.keys(j))"
```

---

## Known issues / future ideas

- Features discussed but not yet built:
  - Holiday mode — grey out a day
  - Cloud sync for journal / subject notes (needs user accounts)
  - Web push notifications (real OS push)
  - Calendar (.ics) export

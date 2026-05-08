# CLAUDE.md — timetable/

S2-05 SST Singapore school timetable, Term 2 2026.

**Stack:** vanilla HTML + CSS + JS (public site) + Node.js serverless functions (API). No build step.
**To preview locally:** `open index.html` (static only; API calls will fail without env vars)
**Live site:** https://timetable.edmundlim.systems
**Admin panel:** https://timetable.edmundlim.systems/admin
**GitHub repo:** https://github.com/EdmundLimBoEn/s2-05-timetable (public, main branch)
**Vercel project:** `edmundlimboens-projects/s2-05-timetable`

---

## Architecture

```
Public site (index.html / script.js)
  └─ fetch /api/data (every 10 s, cache: no-store) ──► Vercel Function
                                                          └─ getData() → Vercel Blob (private)
                                                                └─ fallback: hardcoded SEED

Admin panel (/admin/index.html + admin/admin.js)
  ├─ GET  /api/me          — check session cookie
  ├─ GET  /api/admin-data  — fresh data (no cache, requires auth)
  └─ POST /api/save        — validate → write blob → return {ok, updatedAt}
```

**Hosting:** Vercel (moved from GitHub Pages — needs serverless functions).
**Storage:** Vercel Blob (private store). One file: `timetable-data.json`.
**Auth:** JWT (HS256, `jose`) in an HTTP-only Secure SameSite=Strict cookie (`tt_session`, 7-day expiry). Admin list stored in `ADMINS_JSON` env var as `[{username, passwordHash}]` (bcrypt via `bcryptjs`).

---

## Files

### Public site
| File | Role |
|------|------|
| `index.html` | Shell — topbar, bars, demo banner, table mount, settings panel |
| `script.js` | All data, logic, theme, demo mode, URL hash sync, live-data polling |
| `style.css` | All styles; colour tokens in `:root` |
| `favicon.svg` | Browser-tab favicon — 32×32 pixel-art T |
| `icon.svg` | PWA home-screen icon — 512×512 pixel-art T |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker (`tt-v5`): network-first `/api/data`, cache-first static, bypass `/admin` |

### API (Vercel serverless functions)
| File | Role |
|------|------|
| `api/data.js` | `GET /api/data` — public, `s-maxage=10, stale-while-revalidate=30` |
| `api/admin-data.js` | `GET /api/admin-data` — requires auth, `no-store` (used by admin panel) |
| `api/save.js` | `POST /api/save` — requires auth, validates, writes blob |
| `api/login.js` | `POST /api/login` — bcrypt compare, sets JWT cookie. In-memory rate limit (5/15 min/IP) |
| `api/logout.js` | `POST /api/logout` — clears cookie |
| `api/me.js` | `GET /api/me` — returns `{username}` or 401 |
| `api/_lib/auth.js` | JWT sign/verify, bcrypt compare, cookie helpers, `getAdminFromRequest()` |
| `api/_lib/kv.js` | `getData()` / `setData()` — Vercel Blob read/write |
| `api/_lib/seed.js` | Hardcoded fallback TIMETABLE + EXAMS (used when blob is empty) |
| `api/_lib/validate.js` | Server-side validation: spans sum to 30/day, valid style keys, ISO dates |

### Admin panel
| File | Role |
|------|------|
| `admin/index.html` | Login card + dashboard shell (TIMETABLE / EXAMS tabs) |
| `admin/admin.js` | SPA logic: render editors, save, login/logout, week toggle |
| `admin/admin.css` | Dark terminal aesthetic, matches public site |

### Utilities
| File | Role |
|------|------|
| `scripts/hash-password.js` | CLI: `node scripts/hash-password.js <password>` → prints bcrypt hash |
| `vercel.json` | Rewrite: `/admin` → `/admin/index.html` |
| `package.json` | `"type": "module"`, deps: `@vercel/blob`, `bcryptjs`, `jose` |

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

### `ABBREV`
Short labels shown inside cells. Keys must match every `style` value used in `TIMETABLE`.

### Blob storage (`timetable-data.json`)
```json
{ "timetable": {...}, "exams": [...], "updatedAt": "ISO string", "updatedBy": "username" }
```
`getData()` uses `list()` + `blob.downloadUrl` (signed URL). Falls back to seed if blob missing. `setData()` uses `put()` with `allowOverwrite: true`.

---

## Adding / editing a subject type

Three coordinated changes required:
1. `style.css` — add `--c-<key>` in `:root` and `.cell.<key>` / `.cell.<key> .subj` rules
2. `script.js` `ABBREV` — add `key: 'SHORT'`
3. `script.js` `TIMETABLE` — use the key as `style` in block objects
4. `admin/admin.js` `SUBJECT_DISPLAY` + `DEFAULT_LABELS` — add the key for the admin dropdowns

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
  if (remote.updatedAt === lastUpdatedAt) return  // no change — skip re-render
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
- Admin panel reads from `/api/admin-data` (no edge cache, requires auth cookie)

---

## Environment variables (Vercel)

| Var | Environments | What |
|-----|-------------|------|
| `BLOB_READ_WRITE_TOKEN` | Production, Preview, Development | Auto-set by Vercel Blob integration |
| `ADMINS_JSON` | Production, Preview | `[{"username":"edmund","passwordHash":"$2a$10$..."}]` |
| `JWT_SECRET` | Production, Preview | 32-byte random hex; signs/verifies session tokens |

### Adding or changing an admin password
```bash
node scripts/hash-password.js <new-password>
# Copy the hash, then:
vercel env rm ADMINS_JSON production
printf '[{"username":"edmund","passwordHash":"<hash>"}]' | vercel env add ADMINS_JSON production
vercel deploy --prod
```

---

## Deployment

```bash
vercel deploy --prod
```

Vercel CLI must be installed (`npm i -g vercel`) and linked (`vercel link`).

The GitHub repo is connected to Vercel — pushes to `main` trigger automatic deploys too.

### Custom domain
`timetable.edmundlim.systems` — DNS: A record `timetable → 76.76.21.21` at Cloudflare (DNS-only, not proxied).

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

`sw.js` cache name is currently `tt-v5`. Bump it (`tt-v6`, etc.) whenever static assets change significantly, to force clients to pick up the new files.

---

## Known issues / future ideas

- Features discussed but not yet built:
  - Holiday mode — grey out a day
  - Subject notes — tap cell to add localStorage note

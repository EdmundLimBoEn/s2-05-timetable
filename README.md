# S2-05 Timetable

Live school timetable for S2-05, SST Singapore — Term 2 2026.

**Production:** https://timetable.edmundlim.systems  
**Testing:** https://testing.timetable.edmundlim.systems  
**Admin:** https://timetable.edmundlim.systems/admin

---

## Features

- **Live timetable** — odd/even week toggle with auto-detection from term calendar
- **Now bar** — highlights the current class and counts down to the next one
- **Exam countdown** — amber bar appears within 7 days of each exam
- **Schedule overrides** — admin marks specific dates as holidays or one-off custom days
- **Announcements** — admin posts class-wide notices; new ones pop up as toasts within 10 s
- **Personal journal** — free-form notes saved on-device, side-by-side with announcements
- **Subject notes** — per-cell sticky notes, also on-device
- **PWA** — installable, works offline with cached data
- **Demo mode** — preview any day/week combination from settings

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML + CSS + JS — no build step |
| API | Node.js serverless functions (Vercel) |
| Storage | Vercel Blob (private, one JSON file) |
| Auth | JWT (HS256) in an HTTP-only cookie, bcrypt password hashing |
| Hosting | Vercel |

---

## Local development

Static site only (API calls won't work without env vars):

```bash
open index.html
```

With the API (requires env vars):

```bash
npm install
vercel dev
```

Required environment variables (set via `vercel env`):

| Variable | Where | Description |
|----------|-------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Production, Preview, Development | Auto-set by Vercel Blob |
| `ADMINS_JSON` | Production, Preview | `[{"username":"...","passwordHash":"..."}]` |
| `JWT_SECRET` | Production, Preview | 32-byte random hex |

To generate a password hash:

```bash
node scripts/hash-password.js <password>
```

---

## Branching & deployment

| Branch | Deploys to | How |
|--------|-----------|-----|
| `dev` | `testing.timetable.edmundlim.systems` | GitHub Actions on every push |
| `main` | `timetable.edmundlim.systems` | Vercel auto-deploy on merge |

**Workflow:** all new work goes on `dev` → open PR to `main` when ready → merge to ship.

---

## Admin panel

The admin panel (`/admin`) lets authorised users:

- Edit the odd/even week timetable
- Toggle school day display between 3 PM and 5 PM
- Manage upcoming exam dates
- Post and delete class announcements
- Add schedule overrides (holidays, custom days)

Changes are live on the public site within 10 seconds.

---

## Fork this for your class

You can run your own instance of this app for any class with a repeating odd/even week schedule.

### 1. Fork & deploy

1. Fork this repo on GitHub
2. Create a new Vercel project and connect the fork
3. Add a Vercel Blob store to the project (Storage tab → Create)
4. Set the environment variables below
5. Push to `main` — Vercel auto-deploys

### 2. Environment variables

| Variable | How to get it |
|----------|--------------|
| `BLOB_READ_WRITE_TOKEN` | Auto-set after adding Vercel Blob |
| `JWT_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMINS_JSON` | Run `node scripts/hash-password.js yourpassword`, then format as `[{"username":"you","passwordHash":"<hash>"}]` |

### 3. Configure your timetable

Use the **[AGENT_SETUP.md](./AGENT_SETUP.md)** file — fill in your class details and hand it to Claude (or any AI coding assistant) to update the code and seed data automatically.

Or do it manually:
- Edit `TIMETABLE` in `script.js` (odd/even week, Mon–Fri blocks)
- Update `TERM_START` and `TERMS_2026` for your school's calendar
- Update `ABBREV` and subject colours in `style.css` to match your subjects
- Edit `EXAMS` in `api/_lib/seed.js` for your exam schedule

### 4. Custom domain (optional)

Point an A record at `76.76.21.21` in your DNS, then add the domain in Vercel project settings.

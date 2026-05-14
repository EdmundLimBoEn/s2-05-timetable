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
| API | Node.js + Express (`server.js`) |
| Storage | Local JSON file (`data/timetable-data.json`), atomic write via tmp + rename |
| Auth | JWT (HS256) in an HTTP-only cookie, bcrypt password hashing |
| Hosting | Hack Club Nest (free Linux LXC container), managed by PM2 |

---

## Local development

Static site only (API calls won't work without env vars):

```bash
open index.html
```

With the API (requires a `.env` file — see `.env.example`):

```bash
npm install
npm start
```

Required environment variables (copy `.env.example` → `.env`):

| Variable | Description |
|----------|-------------|
| `PORT` | `3000` for local dev (production uses `80`) |
| `ADMINS_JSON` | `[{"username":"...","passwordHash":"..."}]` |
| `JWT_SECRET` | 32-byte random hex |

To generate a password hash:

```bash
node scripts/hash-password.js <password>
```

---

## Branching & deployment

| Branch | Deploys to | How |
|--------|-----------|-----|
| `dev` | `testing.timetable.edmundlim.systems` | GitHub Actions → webhook → PM2 restart |
| `main` | `timetable.edmundlim.systems` | GitHub Actions → webhook → PM2 restart |

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

### 1. Fork & get a server

1. Fork this repo on GitHub
2. Get a server with Node.js — [Hack Club Nest](https://hackclub.com/nest/) is free for students
3. Clone your fork onto the server and run `npm install`
4. Copy `.env.example` → `.env` and fill in the variables
5. Start with PM2: `pm2 start ecosystem.config.cjs`

### 2. Environment variables

| Variable | How to get it |
|----------|--------------|
| `PORT` | `80` for production (or any open port) |
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

Point a CNAME at your server's hostname (or an A record at its IP) in your DNS provider.

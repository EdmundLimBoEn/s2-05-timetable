# Agent Setup — Configure This Timetable for Your Class

This file is a guided template. Fill in **Part 1** with your class details, then hand the whole file to an AI coding assistant (Claude, Copilot, Cursor, etc.) and ask it to apply Part 2's instructions. The agent will update the codebase to match your timetable.

---

## Part 1 — Your class details (fill this in)

### Class info

```
Class name:      [e.g. S2-05]
School:          [e.g. School of Science and Technology, Singapore]
Academic year:   [e.g. 2026]
School day:      [e.g. 08:00 – 15:00]   ← use "08:00 – 17:00" if you need extended hours
```

### Term calendar

```
Term 1 Week 1 Monday date:  [e.g. 2026-01-05]
Term 1 Week 1 parity:       [odd / even]

Term dates (start Monday → end Friday):
  Term 1:  [e.g. 2026-01-05] → [e.g. 2026-03-13]
  Term 2:  [e.g. 2026-03-23] → [e.g. 2026-05-29]
  Term 3:  [e.g. 2026-06-29] → [e.g. 2026-09-04]
  Term 4:  [e.g. 2026-09-14] → [e.g. 2026-11-20]

School holidays (label, start date, end date):
  [e.g. TERM BREAK, 2026-03-16, 2026-03-20]
  [e.g. MID-YR HOLS, 2026-06-01, 2026-06-26]
  [...]
```

### Subjects

List every subject with the short key you want in the code, a display name, and the abbreviation shown in the cell. You can reuse existing keys (el, math, sci, hum, mt, sw, cce, hsl, hbl, cm, admt, ict, brk, empty) or define new ones.

```
Key       Full name                  Abbreviation   Colour suggestion
--------  -------------------------  -------------  -----------------
el        English Language           EL             blue  (#4fc3f7)
math      Mathematics                MATH           orange (#ff8a65)
sci       Science                    SCI            green  (#81c784)
hum       Humanities                 HUM            purple (#ce93d8)
mt        Mother Tongue              CL / ML / TL   yellow (#fff176)
sw        Sports & Wellness          S&W            red    (#ef5350)
cce       CCE / Assembly             CCE            grey   (#b0bec5)
hbl       Home-Based Learning        HBL            amber  (#ffb74d)
brk       Break / Recess             BREAK          (no colour)
empty     Free / no class            (blank)        (transparent)

[add your own below]
[key]     [Full name]                [ABBREV]       [hex colour]
```

### Timetable

Each slot = 20 minutes. Each day row **must total 30 slots** (10 hours from 08:00 to 18:00 — unused time at the end should be `empty`).

Use this format: `[key] × [number of slots]`

Example: `empty×3, math×2, sci×3, brk×2, el×3, empty×17`

#### ODD WEEK

```
Monday:    [subject×slots, ...]
Tuesday:   [subject×slots, ...]
Wednesday: [subject×slots, ...]
Thursday:  [subject×slots, ...]
Friday:    [subject×slots, ...]
```

#### EVEN WEEK

```
Monday:    [subject×slots, ...]
Tuesday:   [subject×slots, ...]
Wednesday: [subject×slots, ...]
Thursday:  [subject×slots, ...]
Friday:    [subject×slots, ...]
```

### Upcoming exams (optional)

```
Label                    Date (YYYY-MM-DD)
-----------------------  -----------------
[e.g. T1 CA · Math]     [e.g. 2026-03-05]
[e.g. T1 CA · English]  [e.g. 2026-03-07]
```

---

## Part 2 — Instructions for the AI agent

> **Agent:** read Part 1 above, then carry out the steps below to configure this codebase. Work on the `dev` branch. Commit after all changes are complete.

### Step 1 — Update class identity

- In `index.html`: update the `<title>` and any visible class/school name references.
- In `admin/index.html`: update the `<title>` and topbar label.
- In `CLAUDE.md`: update the class name and year at the top.

### Step 2 — Update the term calendar

In `script.js`:

- Set `TERM_START` to `{ date: '<Term 1 Week 1 Monday>', week: '<parity>' }`.
- Update `TERMS_2026` with the four term start dates from Part 1.
- Update `SCHOOL_HOLIDAYS_2026` with the holiday ranges from Part 1. Use the format `{ label: '...', start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }`.

### Step 3 — Update subjects and colours

For each subject in Part 1 that is new or has a different colour:

- In `style.css` `:root`: add `--c-<key>: <hex>;`
- In `style.css`: add `.cell.<key> { border-left-color: var(--c-<key>); background: rgba(..., 0.06); }` and `.cell.<key> .subj { color: var(--c-<key>); }`
- In `script.js` `ABBREV`: add `<key>: '<ABBREV>'`
- In `admin/admin.js` `SUBJECT_DISPLAY`: add `<key>: '<Full name>'`
- In `admin/admin.js` `DEFAULT_LABELS`: add `<key>: '<ABBREV>'`
- In `api/_lib/validate.js` `VALID_STYLES`: add `'<key>'`

### Step 4 — Update the timetable data

Parse the timetable rows from Part 1. For each entry like `math×3`, produce `{ label: DEFAULT_LABELS['math'], span: 3, style: 'math' }`.

- Update `TIMETABLE` in `script.js` (the hardcoded fallback used when offline / before first API response).
- Update `SEED.timetable` in `api/_lib/seed.js` (the server-side fallback used on first deploy before the admin has saved anything).

Validate: every day row must total exactly 30 spans. Raise an error if any row doesn't.

### Step 5 — Update exam seed data

Replace `SEED.exams` in `api/_lib/seed.js` with the exams from Part 1.

### Step 6 — Extended hours (if applicable)

If the school day in Part 1 ends at 17:00:
- Set `extendedHours: true` in `SEED` (`api/_lib/seed.js`).
- The public site will automatically display columns up to 17:00.

### Step 7 — Service worker cache version

Bump the cache name in `sw.js` (e.g. `tt-v7` → `tt-v8`) so returning visitors pick up the new assets.

### Step 8 — Commit

```
git add -A
git commit -m "Configure timetable for <class name> <year>"
```

Then push to the `dev` branch to trigger a deploy to the testing URL:

```
git push origin dev
```

Verify the timetable renders correctly for both odd and even weeks before merging to `main`.

---

## Checklist (agent fills this in after completing each step)

- [ ] Class identity updated
- [ ] Term calendar updated
- [ ] Subjects and colours updated
- [ ] Timetable data updated (odd + even, all rows = 30 spans)
- [ ] Exam seed data updated
- [ ] Extended hours set (if applicable)
- [ ] Service worker cache bumped
- [ ] Committed and deployed to testing

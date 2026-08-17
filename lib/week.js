export const TERM_START = { date: '2026-01-05', week: 'even' }

export const TERMS_2026 = [
  { term: 1, start: '2026-01-05' },
  { term: 2, start: '2026-03-23' },
  { term: 3, start: '2026-06-29' },
  { term: 4, start: '2026-09-14' },
]

export function localStartOfDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function calcWeek(now = Date.now(), termStart = TERM_START) {
  const days = Math.floor((now - localStartOfDay(termStart.date)) / 86_400_000)
  const weeks = Math.floor((days + 1) / 7)
  const startIsOdd = termStart.week === 'odd'
  return ((weeks % 2 + 2) % 2 === 0) === startIsOdd ? 'odd' : 'even'
}

export function weekForDate(d, termStart = TERM_START) {
  return calcWeek(d.getTime(), termStart)
}

export function calcTermWeek(now = Date.now(), terms = TERMS_2026) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  for (let i = terms.length - 1; i >= 0; i--) {
    const start = localStartOfDay(terms[i].start) - 86_400_000
    if (now >= start) {
      const w = Math.floor((now - start) / msPerWeek) + 1
      return w <= 10 ? { term: terms[i].term, week: w } : null
    }
  }
  return null
}

export function dateForRow(wk, di, today = new Date()) {
  today = new Date(today)
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  const monday = new Date(today)
  if (dow === 0) monday.setDate(today.getDate() + 1)
  else monday.setDate(today.getDate() - (dow - 1))
  if (calcWeek(today.getTime()) !== wk) monday.setDate(monday.getDate() + 7)
  const d = new Date(monday)
  d.setDate(monday.getDate() + di)
  return d
}

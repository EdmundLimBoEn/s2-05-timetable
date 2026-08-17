import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcWeek, weekForDate, calcTermWeek, dateForRow } from '../lib/week.js'

function localMs(y, m, d, hh = 0, mm = 0, ss = 0) {
  return new Date(y, m - 1, d, hh, mm, ss).getTime()
}

function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Term 1 W1 = EVEN starting Monday 2026-01-05.
// T3 W1 = ODD starting Monday 2026-06-29.
// Sat 15 Aug 2026 is T3 W7 ODD; Sun 16 Aug should already be T3 W8 EVEN.

test('Saturday stays on the week that just ran', () => {
  assert.equal(calcWeek(localMs(2026, 8, 15, 23, 59, 59)), 'odd')
})

test('Sunday 00:00 flips to the next week', () => {
  assert.equal(calcWeek(localMs(2026, 8, 16, 0, 0, 0)), 'even')
})

test('Monday after that Sunday stays on the new week', () => {
  assert.equal(calcWeek(localMs(2026, 8, 17, 0, 0, 0)), 'even')
})

test('weekday inside an odd week stays odd', () => {
  assert.equal(calcWeek(localMs(2026, 8, 14, 12, 0, 0)), 'odd')
})

test('term-start Monday is even', () => {
  assert.equal(calcWeek(localMs(2026, 1, 5, 0, 0, 0)), 'even')
})

test('Sunday before term-start Monday already shows week 1 parity', () => {
  assert.equal(calcWeek(localMs(2026, 1, 4, 0, 0, 0)), 'even')
})

test('Saturday of week 1 is still even; Sunday starts week 2 odd', () => {
  assert.equal(calcWeek(localMs(2026, 1, 10, 12, 0, 0)), 'even')
  assert.equal(calcWeek(localMs(2026, 1, 11, 0, 0, 0)), 'odd')
})

test('weekForDate on Sunday matches calcWeek', () => {
  const sunday = new Date(2026, 7, 16, 9, 0, 0)
  assert.equal(weekForDate(sunday), 'even')
})

test('calcTermWeek flips from T3 W7 on Saturday to T3 W8 on Sunday', () => {
  assert.deepEqual(calcTermWeek(localMs(2026, 8, 15, 23, 59, 59)), { term: 3, week: 7 })
  assert.deepEqual(calcTermWeek(localMs(2026, 8, 16, 0, 0, 0)), { term: 3, week: 8 })
  assert.deepEqual(calcTermWeek(localMs(2026, 8, 17, 8, 0, 0)), { term: 3, week: 8 })
})

test('dateForRow on Sunday uses the coming Monday', () => {
  const sunday = new Date(2026, 7, 16)
  assert.equal(ymd(dateForRow('even', 0, sunday)), '2026-08-17')
  assert.equal(ymd(dateForRow('even', 4, sunday)), '2026-08-21')
  assert.equal(ymd(dateForRow('odd', 0, sunday)), '2026-08-24')
})

test('dateForRow on Saturday still uses this week Monday', () => {
  const saturday = new Date(2026, 7, 15)
  assert.equal(ymd(dateForRow('odd', 0, saturday)), '2026-08-10')
  assert.equal(ymd(dateForRow('even', 0, saturday)), '2026-08-17')
})

test('script.js uses the same Sunday-start week formulas', () => {
  const src = readFileSync(new URL('../script.js', import.meta.url), 'utf8')
  assert.match(src, /Math\.floor\(\(days \+ 1\) \/ 7\)/)
  assert.match(src, /localStartOfDay\(TERMS_2026\[i\]\.start\) - 86_400_000/)
  assert.match(src, /if \(dow === 0\) monday\.setDate\(today\.getDate\(\) \+ 1\)/)
})

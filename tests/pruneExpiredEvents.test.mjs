import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pruneExpiredEvents } from '../api/_lib/kv.js'

// Singapore time is UTC+8. We construct reference timestamps accordingly.
// "2026-06-01T10:00:00+08:00" = 2026-06-01T02:00:00Z
const sgMs = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00+08:00`).getTime()

test('no autoRemove — event kept', () => {
  const ev = { id: '1', label: 'Test', date: '2026-06-01', time: '09:30', autoRemove: null }
  const { kept, removed } = pruneExpiredEvents([ev], sgMs('2026-06-01', '20:00'))
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('autoRemove disabled — event kept even after remove time', () => {
  const ev = {
    id: '2', label: 'T', date: '2026-06-01', time: '09:30', autoRemove: { enabled: false, anchor: 'start', offsetMinutes: -30 }
  }
  const { kept, removed } = pruneExpiredEvents([ev], sgMs('2026-06-01', '20:00'))
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('autoRemove before start — not yet expired', () => {
  // Event starts 10:00, remove at 09:30 (-30 min from start). Now = 09:00 → kept
  const ev = {
    id: '3', label: 'T', date: '2026-06-01', time: '10:00',
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: -30 }
  }
  const now = sgMs('2026-06-01', '09:00')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('autoRemove before start — expired', () => {
  // Remove at 09:30, now = 09:35 → removed
  const ev = {
    id: '4', label: 'T', date: '2026-06-01', time: '10:00',
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: -30 }
  }
  const now = sgMs('2026-06-01', '09:35')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 0)
  assert.equal(removed.length, 1)
  assert.equal(removed[0].id, '4')
})

test('autoRemove after start — not yet expired', () => {
  // Event starts 09:30, remove 30 min after start = 10:00. Now = 09:45 → kept
  const ev = {
    id: '5', label: 'T', date: '2026-06-01', time: '09:30',
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: 30 }
  }
  const now = sgMs('2026-06-01', '09:45')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('autoRemove after start — expired', () => {
  // Remove at 10:00, now = 10:01 → removed
  const ev = {
    id: '6', label: 'T', date: '2026-06-01', time: '09:30',
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: 30 }
  }
  const now = sgMs('2026-06-01', '10:01')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 0)
  assert.equal(removed.length, 1)
})

test('autoRemove anchored to end time — not yet expired', () => {
  // Event 09:30–11:30, remove 30 min after end = 12:00. Now = 11:45 → kept
  const ev = {
    id: '7', label: 'T', date: '2026-06-01', time: '09:30', endTime: '11:30',
    autoRemove: { enabled: true, anchor: 'end', offsetMinutes: 30 }
  }
  const now = sgMs('2026-06-01', '11:45')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('autoRemove anchored to end time — expired', () => {
  // Remove at 12:00, now = 12:01 → removed
  const ev = {
    id: '8', label: 'T', date: '2026-06-01', time: '09:30', endTime: '11:30',
    autoRemove: { enabled: true, anchor: 'end', offsetMinutes: 30 }
  }
  const now = sgMs('2026-06-01', '12:01')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 0)
  assert.equal(removed.length, 1)
})

test('autoRemove with end anchor but no endTime — falls back to start time', () => {
  // No endTime → anchor falls back to time (09:30). Remove 30 min after = 10:00. Now = 10:01 → removed
  const ev = {
    id: '9', label: 'T', date: '2026-06-01', time: '09:30', endTime: null,
    autoRemove: { enabled: true, anchor: 'end', offsetMinutes: 30 }
  }
  const now = sgMs('2026-06-01', '10:01')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 0)
  assert.equal(removed.length, 1)
})

test('autoRemove with no time — event kept (cannot compute remove time)', () => {
  const ev = {
    id: '10', label: 'T', date: '2026-06-01', time: null,
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: -30 }
  }
  const now = sgMs('2026-06-01', '20:00')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 1)
  assert.equal(removed.length, 0)
})

test('mixed events — only expired ones removed', () => {
  const events = [
    { id: 'a', label: 'A', date: '2026-06-01', time: '10:00', autoRemove: { enabled: true, anchor: 'start', offsetMinutes: -30 } },
    { id: 'b', label: 'B', date: '2026-06-01', time: '12:00', autoRemove: { enabled: true, anchor: 'start', offsetMinutes: -30 } },
    { id: 'c', label: 'C', date: '2026-06-01', time: '14:00', autoRemove: null },
  ]
  // now = 09:40 → A's remove-at is 09:30 (expired), B's is 11:30 (not yet), C has no AR
  const now = sgMs('2026-06-01', '09:40')
  const { kept, removed } = pruneExpiredEvents(events, now)
  assert.equal(removed.length, 1)
  assert.equal(removed[0].id, 'a')
  assert.deepEqual(kept.map(e => e.id), ['b', 'c'])
})

test('empty array — returns empty kept and removed', () => {
  const { kept, removed } = pruneExpiredEvents([], Date.now())
  assert.deepEqual(kept, [])
  assert.deepEqual(removed, [])
})

test('exactly at remove time — counts as expired', () => {
  // nowMs === removeAt.getTime() should trigger removal
  const ev = {
    id: 'x', label: 'T', date: '2026-06-01', time: '10:00',
    autoRemove: { enabled: true, anchor: 'start', offsetMinutes: 0 }
  }
  const now = sgMs('2026-06-01', '10:00')
  const { kept, removed } = pruneExpiredEvents([ev], now)
  assert.equal(kept.length, 0)
  assert.equal(removed.length, 1)
})

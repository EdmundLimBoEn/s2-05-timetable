import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { SEED } from './seed.js'

const DATA_PATH = process.env.DATA_PATH
  || join(dirname(fileURLToPath(import.meta.url)), '../../data/timetable-data.json')

function coerceEvents(exams) {
  if (!Array.isArray(exams)) return exams
  return exams.map(e => ({
    id:             e.id             || randomUUID(),
    label:          e.label          ?? '',
    date:           e.date           ?? '',
    time:           e.time           ?? null,
    endTime:        e.endTime        ?? null,
    type:           e.type           || 'exam',
    details:        e.details        ?? '',
    announcementId: e.announcementId ?? null,
    autoRemove:     e.autoRemove     ?? null,
  }))
}

// Pure function — pass nowMs to make it deterministically testable.
// Returns { kept, removed } arrays. Events with autoRemove.enabled whose
// computed remove-time (Singapore UTC+8) has passed are moved to removed[].
export function pruneExpiredEvents(events, nowMs = Date.now()) {
  if (!Array.isArray(events)) return { kept: events, removed: [] }
  const kept = []
  const removed = []
  for (const ev of events) {
    const ar = ev.autoRemove
    if (!ar?.enabled) { kept.push(ev); continue }
    const anchorTime = ar.anchor === 'end' ? (ev.endTime || ev.time) : ev.time
    if (!ev.date || !anchorTime) { kept.push(ev); continue }
    // Always parse as Singapore time (UTC+8, no DST)
    const removeAt = new Date(`${ev.date}T${anchorTime}:00+08:00`)
    removeAt.setMinutes(removeAt.getMinutes() + (ar.offsetMinutes ?? 0))
    if (nowMs >= removeAt.getTime()) {
      removed.push(ev)
    } else {
      kept.push(ev)
    }
  }
  return { kept, removed }
}

export async function getData() {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    const data = JSON.parse(raw)
    data.exams = coerceEvents(data.exams)
    const { kept, removed } = pruneExpiredEvents(data.exams)
    if (removed.length > 0) {
      data.exams = kept
      setData(data.timetable, kept, data.announcements, data.overrides, data.extendedHours, data.updatedBy || 'auto').catch(err => {
        console.error('[kv] auto-prune save failed:', err)
      })
    }
    return data
  } catch {
    return { ...SEED, updatedAt: null, updatedBy: null }
  }
}

export async function setData(timetable, exams, announcements, overrides, extendedHours, username) {
  const data = {
    timetable,
    exams,
    announcements:  announcements  ?? [],
    overrides:      overrides      ?? [],
    extendedHours:  extendedHours  ?? false,
    updatedAt: new Date().toISOString(),
    updatedBy: username
  }
  const dataDir = dirname(DATA_PATH)
  // Atomic write: tmp must be on the same filesystem as destination —
  // rename() across mounts fails with EXDEV on Linux (e.g. /tmp on tmpfs).
  const tmp = join(dataDir, `.timetable-${randomUUID()}.json`)
  try {
    await mkdir(dataDir, { recursive: true })
    await writeFile(tmp, JSON.stringify(data), 'utf-8')
    await rename(tmp, DATA_PATH)
  } catch (err) {
    console.error('[kv] setData failed (DATA_PATH=%s):', DATA_PATH, err)
    unlink(tmp).catch(() => {})
    throw err
  }
  return data
}

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
    type:           e.type           || 'exam',
    details:        e.details        ?? '',
    announcementId: e.announcementId ?? null,
  }))
}

export async function getData() {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    const data = JSON.parse(raw)
    data.exams = coerceEvents(data.exams)
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

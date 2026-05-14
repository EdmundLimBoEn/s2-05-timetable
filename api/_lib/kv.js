import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { SEED } from './seed.js'

const DATA_PATH = process.env.DATA_PATH
  || join(dirname(fileURLToPath(import.meta.url)), '../../data/timetable-data.json')

export async function getData() {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
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
  await mkdir(dataDir, { recursive: true })
  // Atomic write: tmp must be on the same filesystem as destination —
  // rename() across mounts fails with EXDEV on Linux (e.g. /tmp on tmpfs).
  const tmp = join(dataDir, `.timetable-${randomUUID()}.json`)
  await writeFile(tmp, JSON.stringify(data), 'utf-8')
  await rename(tmp, DATA_PATH)
  return data
}

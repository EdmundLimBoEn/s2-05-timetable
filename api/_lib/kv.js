import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { tmpdir } from 'node:os'
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
  await mkdir(dirname(DATA_PATH), { recursive: true })
  // Atomic write: write to tmp file then rename to avoid partial reads
  const tmp = join(tmpdir(), `timetable-${randomUUID()}.json`)
  await writeFile(tmp, JSON.stringify(data), 'utf-8')
  await rename(tmp, DATA_PATH)
  return data
}

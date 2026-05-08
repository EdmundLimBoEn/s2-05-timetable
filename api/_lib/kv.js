import { put, list } from '@vercel/blob'
import { SEED } from './seed.js'

const PATHNAME = 'timetable-data.json'

export async function getData() {
  try {
    const { blobs } = await list({ prefix: PATHNAME, limit: 1 })
    if (!blobs.length) return { ...SEED, updatedAt: null, updatedBy: null }

    // downloadUrl is a signed URL valid ~10 min, works inside Vercel functions
    const res = await fetch(blobs[0].downloadUrl)
    if (res.ok) return res.json()

    // Fallback: raw URL with read/write token in Authorization header
    console.error('[getData] downloadUrl failed', res.status, '— trying auth header')
    const res2 = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    })
    if (!res2.ok) throw new Error(`blob read failed: ${res.status} / ${res2.status}`)
    return res2.json()
  } catch (err) {
    console.error('[getData] falling back to seed:', err.message)
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
  await put(PATHNAME, JSON.stringify(data), {
    access:          'private',
    addRandomSuffix: false,
    allowOverwrite:  true,
    contentType:     'application/json'
  })
  return data
}

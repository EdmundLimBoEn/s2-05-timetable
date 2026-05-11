import { put, list } from '@vercel/blob'
import { SEED } from './seed.js'

const PATHNAME = 'timetable-data.json'

// Write updatedAt to Edge Config so clients can cheaply detect changes.
// Uses the Vercel REST API — requires VERCEL_TOKEN and VERCEL_TEAM_ID env vars.
// Non-fatal: a failure here does not break the save.
async function syncEdgeConfigVersion(updatedAt) {
  const ec      = process.env.EDGE_CONFIG
  const token   = process.env.VERCEL_TOKEN
  const teamId  = process.env.VERCEL_TEAM_ID
  if (!ec || !token || !teamId) return

  const match = ec.match(/edge-config\.vercel\.com\/(ecfg_[^?]+)/)
  if (!match) { console.error('[edge-config] cannot parse store ID from EDGE_CONFIG'); return }
  const storeId = match[1]

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${storeId}/items?teamId=${teamId}`,
    {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items: [{ operation: 'upsert', key: 'updatedAt', value: updatedAt }] }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    console.error(`[edge-config] update failed ${res.status}: ${text}`)
  }
}

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
  await syncEdgeConfigVersion(data.updatedAt).catch(err =>
    console.error('[edge-config] sync threw:', err.message)
  )
  return data
}

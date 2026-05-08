import { getAdminFromRequest } from './_lib/auth.js'
import { setData } from './_lib/kv.js'
import { validateData } from './_lib/validate.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const username = await getAdminFromRequest(req)
  if (!username) return res.status(401).json({ error: 'Not authenticated' })

  const body   = req.body || {}
  const errors = validateData(body)
  if (errors.length) return res.status(400).json({ errors })

  // Assign server-side id + timestamp for any new announcement missing them
  const announcements = (body.announcements ?? []).map(a => ({
    ...a,
    id:        a.id        || crypto.randomUUID(),
    createdAt: a.createdAt || new Date().toISOString(),
    createdBy: a.createdBy || username,
  }))

  const overrides = body.overrides ?? []

  try {
    const data = await setData(body.timetable, body.exams, announcements, overrides, username)
    // Return the full saved state so the client can update without a second GET
    res.status(200).json({
      ok:            true,
      updatedAt:     data.updatedAt,
      updatedBy:     data.updatedBy,
      announcements: data.announcements,
      exams:         data.exams,
      overrides:     data.overrides,
    })
  } catch (err) {
    console.error('[/api/save]', err)
    res.status(500).json({ error: 'Failed to save data' })
  }
}

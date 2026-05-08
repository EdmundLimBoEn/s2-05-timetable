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

  try {
    const data = await setData(body.timetable, body.exams, username)
    res.status(200).json({ ok: true, updatedAt: data.updatedAt, updatedBy: data.updatedBy })
  } catch (err) {
    console.error('[/api/save]', err)
    res.status(500).json({ error: 'Failed to save data' })
  }
}

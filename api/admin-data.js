import { getAdminFromRequest } from './_lib/auth.js'
import { getData } from './_lib/kv.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const username = await getAdminFromRequest(req)
  if (!username) return res.status(401).json({ error: 'Not authenticated' })

  try {
    const data = await getData()
    res.setHeader('Cache-Control', 'no-store').status(200).json(data)
  } catch (err) {
    console.error('[/api/admin-data]', err)
    res.status(500).json({ error: 'Failed to load data' })
  }
}

import { getAdminFromRequest } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const username = await getAdminFromRequest(req)
  if (!username) return res.status(401).json({ error: 'Not authenticated' })

  res.status(200).json({ username })
}

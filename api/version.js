import { get } from '@vercel/edge-config'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!process.env.EDGE_CONFIG) return res.status(503).json({ error: 'Edge Config not configured' })

  try {
    const updatedAt = await get('updatedAt')
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10')
    res.status(200).json({ updatedAt: updatedAt ?? null })
  } catch (err) {
    console.error('[/api/version]', err)
    res.status(500).json({ error: 'Failed to read version' })
  }
}

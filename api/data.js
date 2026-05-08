import { getData } from './_lib/kv.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const data = await getData()
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')
    res.status(200).json(data)
  } catch (err) {
    console.error('[/api/data]', err)
    res.status(500).json({ error: 'Failed to read data' })
  }
}

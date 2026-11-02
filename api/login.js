import { getAdmins, verifyPassword, signSession, sessionCookie } from './_lib/auth.js'

import { createRateLimit } from './_lib/rate-limit.js'

const windowMs = 15 * 60 * 1000
const sourceAttempts = createRateLimit({ max: 30, windowMs })
const accountAttempts = createRateLimit({ max: 5, windowMs })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const body     = req.body || {}
  const username = typeof body.username === 'string' ? body.username.toLowerCase().trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || username.length > 128 || !password || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  if (!sourceAttempts.take(ip) || !accountAttempts.take(username)) {
    res.setHeader('Retry-After', '900')
    return res.status(429).json({ error: 'Too many attempts — try again in 15 minutes.' })
  }

  const admins = getAdmins()
  const admin  = admins.find(a => a.username === username)
  const valid  = admin && await verifyPassword(password, admin.passwordHash)

  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password.' })
  }

  accountAttempts.clear(username)
  const token = await signSession(username)
  res.setHeader('Set-Cookie', sessionCookie(token))
  res.status(200).json({ username })
}

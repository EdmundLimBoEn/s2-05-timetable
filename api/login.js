import { getAdmins, verifyPassword, signSession, sessionCookie } from './_lib/auth.js'

// In-memory rate limit — per function instance, resets on cold start.
// Good enough for a school admin page; upgrade to a store if needed.
const attempts = new Map()  // ip → { count, resetAt }
const MAX  = 5
const WIN  = 15 * 60 * 1000   // 15 min

function checkRate(ip) {
  const now  = Date.now()
  const rec  = attempts.get(ip)
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WIN })
    return true
  }
  if (rec.count >= MAX) return false
  rec.count++
  return true
}

function clearRate(ip) { attempts.delete(ip) }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Too many attempts — try again in 15 minutes.' })
  }

  const body     = req.body || {}
  const username = typeof body.username === 'string' ? body.username.toLowerCase().trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const admins = getAdmins()
  const admin  = admins.find(a => a.username === username)
  const valid  = admin && await verifyPassword(password, admin.passwordHash)

  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password.' })
  }

  clearRate(ip)
  const token = await signSession(username)
  res.setHeader('Set-Cookie', sessionCookie(token))
  res.status(200).json({ username })
}

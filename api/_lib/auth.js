import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const COOKIE = 'tt_session'

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var not set')
  return new TextEncoder().encode(s)
}

export async function signSession(username) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret())
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' && getAdmins().some(admin => admin.username === payload.sub)
      ? payload.sub : null
  } catch {
    return null
  }
}

export function getAdmins() {
  try {
    const parsed = JSON.parse(process.env.ADMINS_JSON || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[getAdmins] Invalid admin configuration')
    return []
  }
}

let activeComparisons = 0

export async function verifyPassword(password, hash) {
  // Bound expensive bcrypt work so invalid credentials cannot queue unlimited CPU work.
  if (activeComparisons >= 4) {
    const error = new Error('Authentication busy')
    error.status = 429
    throw error
  }
  activeComparisons++
  try { return await bcrypt.compare(password, hash) }
  finally { activeComparisons-- }
}

export function getApiTokens() {
  try {
    const parsed = JSON.parse(process.env.API_TOKENS_JSON || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[getApiTokens] Invalid token configuration')
    return []
  }
}

export async function getAdminFromRequest(req) {
  // Cookie session (web admin) — only use if the session is valid
  const cookieHeader = req.headers['cookie'] || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (match) {
    let sessionToken
    try { sessionToken = decodeURIComponent(match[1]) } catch { sessionToken = '' }
    const username = await verifySession(sessionToken)
    if (username) return username
    // stale/invalid cookie — fall through to Bearer token
  }

  // Bearer token (agent / API access)
  const auth = req.headers['authorization'] || ''
  const bearerMatch = auth.match(/^Bearer\s+(\S+)$/)
  if (!bearerMatch) return null
  const token = bearerMatch[1]
  if (Buffer.byteLength(token) > 72) return null

  const apiTokens = getApiTokens()
  for (const entry of apiTokens) {
    if (entry && typeof entry.name === 'string' && typeof entry.tokenHash === 'string') {
      const valid = await verifyPassword(token, entry.tokenHash)
      if (valid) return `agent:${entry.name}`
    }
  }
  return null
}

export function sessionCookie(token) {
  const maxAge = 7 * 24 * 60 * 60
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

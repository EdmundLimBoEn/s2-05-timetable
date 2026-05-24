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
    const { payload } = await jwtVerify(token, secret())
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function getAdmins() {
  try {
    return JSON.parse(process.env.ADMINS_JSON || '[]')
  } catch (err) {
    console.error('[getAdmins] ADMINS_JSON parse failed:', err.message)
    return []
  }
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function getApiTokens() {
  try {
    return JSON.parse(process.env.API_TOKENS_JSON || '[]')
  } catch (err) {
    console.error('[getApiTokens] API_TOKENS_JSON parse failed:', err.message)
    return []
  }
}

export async function getAdminFromRequest(req) {
  // Cookie session (web admin)
  const cookieHeader = req.headers['cookie'] || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (match) return verifySession(decodeURIComponent(match[1]))

  // Bearer token (agent / API access)
  const auth = req.headers['authorization'] || ''
  const bearerMatch = auth.match(/^Bearer\s+(\S+)$/)
  if (!bearerMatch) return null
  const token = bearerMatch[1]

  const apiTokens = getApiTokens()
  for (const entry of apiTokens) {
    if (entry && typeof entry.name === 'string' && typeof entry.tokenHash === 'string') {
      const valid = await bcrypt.compare(token, entry.tokenHash)
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

import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { signSession, verifySession, getAdminFromRequest, verifyPassword } from '../api/_lib/auth.js'

test('sessions and bearer tokens authenticate and revoked principals fail closed', async () => {
  const original = { ...process.env }
  try {
    process.env.JWT_SECRET = randomBytes(48).toString('hex')
    process.env.ADMINS_JSON = JSON.stringify([{ username: 'test-admin' }])
    const session = await signSession('test-admin')
    assert.equal(await verifySession(session), 'test-admin')
    assert.equal(await verifySession(session + 'x'), null)
    process.env.ADMINS_JSON = '[]'
    assert.equal(await verifySession(session), null)

    const token = randomBytes(32).toString('base64url')
    process.env.API_TOKENS_JSON = JSON.stringify([{ name: 'test-agent', tokenHash: await bcrypt.hash(token, 4) }])
    const request = { headers: { authorization: `Bearer ${token}`, cookie: 'tt_session=%ZZ' } }
    assert.equal(await getAdminFromRequest(request), 'agent:test-agent')
    assert.equal(await getAdminFromRequest({ headers: { authorization: `Bearer ${'x'.repeat(100)}` } }), null)
    process.env.API_TOKENS_JSON = '[]'
    assert.equal(await getAdminFromRequest(request), null)
  } finally {
    for (const key of ['JWT_SECRET', 'ADMINS_JSON', 'API_TOKENS_JSON']) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  }
})

test('password verification bounds concurrent expensive work and recovers', async () => {
  const hash = await bcrypt.hash('test-only-password', 4)
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => verifyPassword('test-only-password', hash)))
  assert.equal(results.filter(r => r.status === 'fulfilled' && r.value === true).length, 4)
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.status === 429).length, 8)
  assert.equal(await verifyPassword('test-only-password', hash), true)
})

test('deployment does not forward production authentication secrets to other apps', async () => {
  const { deploymentEnvironment } = await import('../api/deploy.js')
  const saved = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-sentinel'
  try {
    const env = deploymentEnvironment('dev', 'timetable-dev')
    assert.equal(env.JWT_SECRET, undefined)
    assert.equal(env.ADMINS_JSON, undefined)
    assert.equal(env.API_TOKENS_JSON, undefined)
    assert.equal(env.PORT, undefined)
    assert.equal(env.DEPLOY_BRANCH, 'dev')
    assert.equal(env.DEPLOY_PM2, 'timetable-dev')
    assert.equal(env.PATH, process.env.PATH)
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = saved
  }
})

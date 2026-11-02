import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { getAdminFromRequest } from '../api/_lib/auth.js'

test('malformed cookies fail closed', async () => {
  assert.equal(await getAdminFromRequest({ headers: { cookie: 'tt_session=%ZZ' } }), null)
})

test('HTTP security boundaries', async t => {
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '0', ADMINS_JSON: '[]', API_TOKENS_JSON: '[]', TRUSTED_PROXY_IPS: '', BLOCKED_CLIENT_IPS: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => child.kill())
  let output = ''
  const port = await new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => {
      output += chunk
      const match = output.match(/port (\d+)/)
      if (match) resolve(match[1])
    })
    child.once('error', reject)
    child.once('exit', () => reject(new Error('server exited before listening')))
  })
  const base = `http://127.0.0.1:${port}`
  for (const path of ['/', '/admin', '/script.js', '/admin/admin.js', '/lib/week.js']) {
    assert.equal((await fetch(base + path)).status, 200, path)
  }
  for (const path of ['/server.js', '/package.json', '/api/_lib/auth.js', '/data/timetable-data.json', '/node_modules/express/package.json', '/.env', '/mcp-server/server.js', '/AGENTS.md']) {
    assert.equal((await fetch(base + path)).status, 404, path)
  }
  for (const path of ['/api/admin-data', '/api/me']) {
    assert.equal((await fetch(base + path, { headers: { Cookie: 'tt_session=%ZZ' } })).status, 401)
  }
  assert.equal((await fetch(base + '/api/save', { method: 'POST' })).status, 401)
  assert.equal((await fetch(base + '/api/deploy', { method: 'POST' })).status, 401)
  for (let i = 0; i < 6; i++) {
    const response = await fetch(base + '/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `192.0.2.${i}` },
      body: JSON.stringify({ username: 'nonexistent', password: 'invalid' }),
    })
    assert.equal(response.status, i < 5 ? 401 : 429)
  }
  child.kill()
  await once(child, 'exit')
})

 test('verified proxy allows targeted containment', async t => {
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '0', TRUSTED_PROXY_IPS: '::ffff:127.0.0.1', BLOCKED_CLIENT_IPS: '192.0.2.50' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => child.kill())
  const [chunk] = await once(child.stdout, 'data')
  const port = chunk.toString().match(/port (\d+)/)[1]
  const base = `http://127.0.0.1:${port}`
  assert.equal((await fetch(base, { headers: { 'X-Forwarded-For': '192.0.2.50' } })).status, 403)
  assert.equal((await fetch(base, { headers: { 'X-Forwarded-For': '192.0.2.51' } })).status, 200)
  child.kill()
  await once(child, 'exit')
})

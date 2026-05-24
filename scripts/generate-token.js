#!/usr/bin/env node
// Usage: node scripts/generate-token.js <name>
// Generates a long-lived API token for agent/API access.
// The raw token is shown ONCE — save it immediately.
// Add the hash to API_TOKENS_JSON in ~/.env, then restart the server.

import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

const name = process.argv[2]
if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
  console.error('Usage: node scripts/generate-token.js <name>')
  console.error('  name: alphanumeric/underscore/dash, e.g. "claude-desktop"')
  process.exit(1)
}

const token = randomBytes(32).toString('base64url')
const hash  = await bcrypt.hash(token, 10)

console.log('\n⚠️  Save the raw token now — it will NEVER be shown again.\n')
console.log('Raw token (paste into your agent/MCP config):')
console.log(token)
console.log('\nBcrypt hash (paste into API_TOKENS_JSON in ~/.env):')
console.log(hash)
console.log('\nAdd this entry to API_TOKENS_JSON:')
console.log(JSON.stringify([{ name, tokenHash: hash }], null, 2))
console.log('\nFor multiple tokens, add objects to the array.')
console.log('\nAfter editing ~/.env, restart the server:')
console.log('  pm2 restart timetable      # production')
console.log('  pm2 restart timetable-dev  # testing')

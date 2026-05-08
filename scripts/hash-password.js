#!/usr/bin/env node
// Usage: node scripts/hash-password.js <password>
// Generates a bcrypt hash to paste into the ADMINS_JSON env var.

import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 10)
console.log('\nBcrypt hash:')
console.log(hash)
console.log('\nPaste into ADMINS_JSON (Vercel env var):')
console.log(JSON.stringify([{ username: 'YOUR_USERNAME', passwordHash: hash }], null, 2))
console.log('\nFor multiple admins, add objects to the array.')

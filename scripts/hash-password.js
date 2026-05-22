#!/usr/bin/env node
// Usage: node scripts/hash-password.js
// Prompts for password without echo, then prints a bcrypt hash.

import bcrypt from 'bcryptjs'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stderr })

const password = await new Promise((resolve) => {
  rl.question('Password: ', (answer) => {
    rl.close()
    resolve(answer)
  })
  // Hide input if running in a TTY
  if (process.stdin.isTTY) rl.stdoutMuted = true
  rl._writeToOutput = (s) => { if (!rl.stdoutMuted) process.stderr.write(s) }
})

if (!password) {
  console.error('Error: password cannot be empty')
  process.exit(1)
}
process.stderr.write('\n')

const hash = await bcrypt.hash(password, 10)
console.log('\nBcrypt hash:')
console.log(hash)
console.log('\nPaste into ADMINS_JSON in ~/.env:')
console.log(JSON.stringify([{ username: 'YOUR_USERNAME', passwordHash: hash }], null, 2))
console.log('\nFor multiple admins, add objects to the array.')

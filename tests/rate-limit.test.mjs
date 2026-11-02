import test from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimit } from '../api/_lib/rate-limit.js'

test('limits expire and storage stays bounded', () => {
  const limit = createRateLimit({ max: 2, windowMs: 1000, maxKeys: 2 })
  assert.equal(limit.take('a', 0), true)
  assert.equal(limit.take('a', 0), true)
  assert.equal(limit.take('a', 0), false)
  assert.equal(limit.take('b', 0), true)
  assert.equal(limit.take('c', 0), false)
  assert.equal(limit.take('a', 1000), true)
  assert.equal(limit.take('c', 1000), true)
})

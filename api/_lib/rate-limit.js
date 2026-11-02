export function createRateLimit({ max, windowMs, maxKeys = 10000 }) {
  const attempts = new Map()
  return {
    take(key, now = Date.now()) {
      for (const [k, value] of attempts) {
        if (value.resetAt <= now) attempts.delete(k)
      }
      const record = attempts.get(key)
      if (record) {
        if (record.count >= max) return false
        record.count++
        return true
      }
      if (attempts.size >= maxKeys) return false
      attempts.set(key, { count: 1, resetAt: now + windowMs })
      return true
    },
    clear(key) { attempts.delete(key) },
  }
}

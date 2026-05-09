const CACHE    = 'tt-v8'
const PRECACHE = ['./', './index.html', './script.js', './style.css', './icon.svg', './manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // /api/data — network-first, fall back to cache for offline
  if (new URL(e.request.url).pathname === '/api/data') {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        try {
          const fresh = await fetch(e.request)
          if (fresh.ok) cache.put(e.request, fresh.clone())
          return fresh
        } catch {
          const cached = await cache.match(e.request)
          return cached ?? new Response(
            '{"error":"offline"}',
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        }
      })
    )
    return
  }

  // Admin routes — always network (no caching)
  if (new URL(e.request.url).pathname.startsWith('/admin')) {
    return
  }

  // Static assets — cache-first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  )
})

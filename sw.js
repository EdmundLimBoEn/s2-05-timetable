const CACHE    = 'tt-v12'
const PRECACHE = ['./', './index.html', './script.js', './style.css', './icon.svg', './favicon.svg', './manifest.json']

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
  const pathname = new URL(e.request.url).pathname

  // /api/data — network-first, fall back to cache for offline
  if (pathname === '/api/data') {
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

  // Other API + admin — let the browser hit the network. Do not intercept
  // cheap /api/version polls (cache-first would stall live updates).
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin')) {
    return
  }

  // Static assets — cache-first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  )
})

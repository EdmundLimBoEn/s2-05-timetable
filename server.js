import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dataHandler      from './api/data.js'
import adminDataHandler from './api/admin-data.js'
import saveHandler      from './api/save.js'
import loginHandler     from './api/login.js'
import logoutHandler    from './api/logout.js'
import meHandler        from './api/me.js'
import versionHandler   from './api/version.js'
import deployHandler    from './api/deploy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

const app = express()
const trustedProxies = new Set((process.env.TRUSTED_PROXY_IPS || '').split(',').filter(Boolean))
app.set('trust proxy', address => trustedProxies.has(address))
const blockedClients = new Set((process.env.BLOCKED_CLIENT_IPS || '').split(',').filter(Boolean))
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store')
  res.on('finish', () => {
    console.log(JSON.stringify({
      event: 'request', time: new Date().toISOString(), method: req.method,
      path: req.path.slice(0, 256), status: res.statusCode,
      peer: req.socket.remoteAddress, client: req.ip,
      forwardedForUnverified: String(req.headers['x-forwarded-for'] || '').slice(0, 256),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 256),
    }))
  })
  if (blockedClients.has(req.ip)) return res.status(403).json({ error: 'Forbidden' })
  next()
})
app.use(express.json({ limit: '100kb', inflate: false }))
const route = handler => (req, res, next) => Promise.resolve().then(() => handler(req, res)).catch(next)

app.get ('/api/data',        route(dataHandler))
app.get ('/api/admin-data',  route(adminDataHandler))
app.post('/api/save',        route(saveHandler))
app.post('/api/login',       route(loginHandler))
app.post('/api/logout',      route(logoutHandler))
app.get ('/api/me',          route(meHandler))
app.get ('/api/version',     route(versionHandler))
app.post('/api/deploy',      route(deployHandler))

// /admin and /admin/ both serve admin/index.html
app.get('/admin',  (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')))
app.get('/admin/', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')))

// Only browser assets are public; never expose the repository or data directory.
const publicFiles = [
  'index.html', 'script.js', 'style.css', 'sw.js', 'manifest.json',
  'favicon.svg', 'icon.svg', 'icon-192.svg', 'icon-512.svg',
  'admin/index.html', 'admin/admin.js', 'admin/admin.css', 'lib/week.js',
]
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))
for (const file of publicFiles) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)))
}
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  const status = err.status >= 400 && err.status < 500 ? err.status : 500
  res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Invalid request' })
})

const server = app.listen(PORT, () => console.log(`Timetable running on port ${server.address().port}`))

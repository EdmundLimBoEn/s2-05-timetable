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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())

app.get ('/api/data',        (req, res) => dataHandler(req, res))
app.get ('/api/admin-data',  (req, res) => adminDataHandler(req, res))
app.post('/api/save',        (req, res) => saveHandler(req, res))
app.post('/api/login',       (req, res) => loginHandler(req, res))
app.post('/api/logout',      (req, res) => logoutHandler(req, res))
app.get ('/api/me',          (req, res) => meHandler(req, res))
app.get ('/api/version',     (req, res) => versionHandler(req, res))

// /admin and /admin/ both serve admin/index.html
app.get('/admin',  (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')))
app.get('/admin/', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')))

app.use(express.static(__dirname))

app.listen(PORT, () => console.log(`Timetable running on port ${PORT}`))

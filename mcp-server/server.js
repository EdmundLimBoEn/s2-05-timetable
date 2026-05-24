#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL  = process.env.TIMETABLE_API_URL?.replace(/\/$/, '')
const API_TOKEN = process.env.TIMETABLE_API_TOKEN
const MCP_PORT  = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : null

if (!BASE_URL) {
  console.error('ERROR: TIMETABLE_API_URL must be set.')
  process.exit(1)
}
if (!MCP_PORT && !API_TOKEN) {
  console.error('ERROR: TIMETABLE_API_TOKEN must be set for stdio mode (or set MCP_PORT for HTTP mode).')
  process.exit(1)
}

const BUILT_IN_STYLES = new Set([
  'el','math','sci','hum','mt','sw','cce','hsl','hbl','cm','admt','ict','brk','empty','holiday'
])

// ── Shared schemas ────────────────────────────────────────────────────────────

const blockSchema = z.object({
  label: z.string().describe('Full subject name shown in the now-bar'),
  span:  z.number().int().positive().describe('Number of 20-min slots (all 5 days must each total 30)'),
  style: z.string().describe('CSS/subject key, e.g. "el", "math", or a custom subject key'),
})

const daySchema = z.array(blockSchema).refine(
  blocks => blocks.reduce((sum, b) => sum + b.span, 0) === 30,
  { message: 'Each day must have blocks whose spans sum to exactly 30 (08:00–14:00, 30 × 20 min)' }
)

// ── Server factory ─────────────────────────────────────────────────────────────
// Creates a fresh McpServer bound to a specific bearer token.
// Called once for stdio mode, and once per HTTP request in HTTP mode.

function buildServer(token) {
  async function apiGet(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`API ${res.status}: ${body}`)
    }
    return res.json()
  }

  async function apiPost(path, payload) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(JSON.stringify(body))
    return body
  }

  function ok(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  }
  function err(msg) {
    return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }
  }

  const server = new McpServer({ name: 'timetable', version: '1.1.0' })

  // ── get_timetable ─────────────────────────────────────────────────────────
  server.tool(
    'get_timetable',
    'Fetch the full timetable data (both odd and even weeks), exams, announcements, overrides, and custom subjects. Always call this before any mutation to avoid overwriting unrelated state.',
    {},
    async () => {
      try {
        return ok(await apiGet('/api/admin-data'))
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── list_custom_subjects ──────────────────────────────────────────────────
  server.tool(
    'list_custom_subjects',
    'Return only the customSubjects array from the current timetable data.',
    {},
    async () => {
      try {
        const data = await apiGet('/api/admin-data')
        return ok(data.customSubjects ?? [])
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── add_custom_subject ────────────────────────────────────────────────────
  server.tool(
    'add_custom_subject',
    'Add a new custom subject type. The key must be lowercase alphanumeric/underscore/dash and must not collide with a built-in subject key.',
    {
      key:       z.string().regex(/^[a-z][a-z0-9_-]{0,30}$/).describe('Unique subject key, e.g. "museum"'),
      label:     z.string().min(1).max(40).describe('Display name, e.g. "Museum Tour"'),
      abbrev:    z.string().min(1).max(8).describe('Short label shown in cell, e.g. "MUSEUM"'),
      color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('6-digit hex colour, e.g. "#9b59b6"'),
      bgOpacity: z.number().min(0).max(1).describe('Cell background opacity from 0 (transparent) to 1 (solid)'),
      textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('6-digit hex text colour, e.g. "#ffffff"'),
    },
    async ({ key, label, abbrev, color, bgOpacity, textColor }) => {
      try {
        if (BUILT_IN_STYLES.has(key)) {
          return err(`"${key}" collides with a built-in subject key`)
        }
        const data = await apiGet('/api/admin-data')
        const existing = data.customSubjects ?? []
        if (existing.some(s => s.key === key)) {
          return err(`Custom subject key "${key}" already exists`)
        }
        const updated = [...existing, { key, label, abbrev, color, bgOpacity, textColor }]
        const result  = await apiPost('/api/save', { ...data, customSubjects: updated })
        return ok({ ok: true, customSubjects: result.customSubjects })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── delete_custom_subject ─────────────────────────────────────────────────
  server.tool(
    'delete_custom_subject',
    'Delete a custom subject by key. Any timetable blocks or override blocks using that key are rewritten to style "empty" before saving.',
    {
      key: z.string().describe('The custom subject key to delete, e.g. "museum"'),
    },
    async ({ key }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const customs = data.customSubjects ?? []
        if (!customs.some(s => s.key === key)) return err(`Custom subject key "${key}" not found`)
        const updatedCustoms = customs.filter(s => s.key !== key)
        const rewrite = blocks => (blocks || []).map(b => b.style === key ? { ...b, style: 'empty' } : b)
        const updatedTimetable = {
          odd:  (data.timetable?.odd  || []).map(rewrite),
          even: (data.timetable?.even || []).map(rewrite),
        }
        const updatedOverrides = (data.overrides || []).map(ovr =>
          ovr.blocks ? { ...ovr, blocks: rewrite(ovr.blocks) } : ovr
        )
        const result = await apiPost('/api/save', {
          ...data,
          timetable:      updatedTimetable,
          overrides:      updatedOverrides,
          customSubjects: updatedCustoms,
        })
        return ok({ ok: true, updatedAt: result.updatedAt })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── set_week ──────────────────────────────────────────────────────────────
  server.tool(
    'set_week',
    'Replace all 5 days of one timetable week (odd or even). Each day is an array of block objects; all 5 days must each have blocks whose spans sum to exactly 30 (each span = 20 minutes; 30 spans = 08:00–14:00). The other week, exams, announcements, overrides, and custom subjects are left untouched.',
    {
      week:          z.enum(['odd', 'even']).describe('"odd" or "even" week'),
      days:          z.array(daySchema).min(5).max(5).describe('Array of exactly 5 days [Mon, Tue, Wed, Thu, Fri]; each day is an array of block objects whose spans must sum to 30'),
      extendedHours: z.boolean().optional().describe('If true, extend the time grid to 15:00 (30 cols instead of 21). Omit to leave unchanged.'),
    },
    async ({ week, days, extendedHours }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const updatedTimetable = { ...data.timetable, [week]: days }
        const payload = { ...data, timetable: updatedTimetable }
        if (typeof extendedHours === 'boolean') payload.extendedHours = extendedHours
        const result = await apiPost('/api/save', payload)
        return ok({ ok: true, updatedAt: result.updatedAt, updatedBy: result.updatedBy })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── add_announcement ──────────────────────────────────────────────────────
  server.tool(
    'add_announcement',
    'Post a new announcement. The server assigns id, createdAt, and createdBy automatically.',
    {
      title:     z.string().min(1).max(100).describe('Announcement title (required, ≤100 chars)'),
      body:      z.string().max(5000).optional().describe('Optional body text (≤5000 chars)'),
      category:  z.enum(['general', 'homework', 'exam', 'event']).describe('Category'),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Optional ISO date for exam/event/homework categories, e.g. "2026-06-10"'),
    },
    async ({ title, body, category, eventDate }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const annc = { title, body: body ?? '', category }
        if (eventDate) annc.eventDate = eventDate
        const updated = [...(data.announcements ?? []), annc]
        const result  = await apiPost('/api/save', { ...data, announcements: updated })
        return ok({ ok: true, updatedAt: result.updatedAt, announcements: result.announcements })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── delete_announcement ───────────────────────────────────────────────────
  server.tool(
    'delete_announcement',
    'Delete an announcement by its server-assigned id. Call get_timetable first to find the id.',
    {
      id: z.string().describe('The id of the announcement to delete'),
    },
    async ({ id }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const anncs = data.announcements ?? []
        if (!anncs.some(a => a.id === id)) return err(`Announcement id "${id}" not found`)
        const updated = anncs.filter(a => a.id !== id)
        const result  = await apiPost('/api/save', { ...data, announcements: updated })
        return ok({ ok: true, updatedAt: result.updatedAt })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── add_exam ──────────────────────────────────────────────────────────────
  server.tool(
    'add_exam',
    'Add an exam or event to the events list. The server assigns an id.',
    {
      label:   z.string().min(1).describe('Event label, e.g. "Math Common Test"'),
      date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('ISO date, e.g. "2026-06-10"'),
      time:    z.string().nullable().optional().describe('Optional start time, e.g. "09:00"'),
      endTime: z.string().nullable().optional().describe('Optional end time, e.g. "11:00"'),
      type:    z.enum(['exam', 'test', 'event', 'holiday', 'other']).optional().describe('Event type (default "exam")'),
      details: z.string().optional().describe('Optional additional details'),
    },
    async ({ label, date, time, endTime, type, details }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const ev = {
          label, date,
          time:           time    ?? null,
          endTime:        endTime ?? null,
          type:           type    ?? 'exam',
          details:        details ?? '',
          id:             '',
          announcementId: null,
          autoRemove:     null,
        }
        const updated = [...(data.exams ?? []), ev]
        const result  = await apiPost('/api/save', { ...data, exams: updated })
        return ok({ ok: true, updatedAt: result.updatedAt, exams: result.exams })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── delete_exam ───────────────────────────────────────────────────────────
  server.tool(
    'delete_exam',
    'Delete an exam/event by its id. Call get_timetable first to find the id.',
    {
      id: z.string().describe('The id of the exam/event to delete'),
    },
    async ({ id }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const exams = data.exams ?? []
        if (!exams.some(e => e.id === id)) return err(`Exam id "${id}" not found`)
        const updated = exams.filter(e => e.id !== id)
        const result  = await apiPost('/api/save', { ...data, exams: updated })
        return ok({ ok: true, updatedAt: result.updatedAt })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── add_override ──────────────────────────────────────────────────────────
  server.tool(
    'add_override',
    'Add a day override for a specific date. Use type "holiday" to mark a day off (no blocks needed), or type "custom" to supply a custom block schedule for that day. Only one override per date is allowed.',
    {
      date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('ISO date to override, e.g. "2026-06-10"'),
      type:   z.enum(['holiday', 'custom']).describe('"holiday" marks the day off; "custom" requires a blocks array'),
      label:  z.string().min(1).describe('Label for the override, e.g. "Youth Day" or "Modified Schedule"'),
      blocks: z.array(blockSchema).optional().describe('Required when type is "custom". Spans must sum to 30.'),
    },
    async ({ date, type, label, blocks }) => {
      try {
        if (type === 'custom') {
          if (!blocks?.length) return err('blocks are required when type is "custom"')
          const total = blocks.reduce((s, b) => s + b.span, 0)
          if (total !== 30) return err(`blocks spans must sum to 30, got ${total}`)
        }
        const data = await apiGet('/api/admin-data')
        const overrides = data.overrides ?? []
        if (overrides.some(o => o.date === date)) {
          return err(`An override already exists for ${date}. Delete it first with delete_override.`)
        }
        const ovr = { date, type, label }
        if (type === 'custom') ovr.blocks = blocks
        const result = await apiPost('/api/save', { ...data, overrides: [...overrides, ovr] })
        return ok({ ok: true, updatedAt: result.updatedAt })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── delete_override ───────────────────────────────────────────────────────
  server.tool(
    'delete_override',
    'Remove a day override by its date.',
    {
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('ISO date of the override to remove, e.g. "2026-06-10"'),
    },
    async ({ date }) => {
      try {
        const data = await apiGet('/api/admin-data')
        const overrides = data.overrides ?? []
        if (!overrides.some(o => o.date === date)) return err(`No override found for ${date}`)
        const result = await apiPost('/api/save', { ...data, overrides: overrides.filter(o => o.date !== date) })
        return ok({ ok: true, updatedAt: result.updatedAt })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  // ── save_timetable ────────────────────────────────────────────────────────
  server.tool(
    'save_timetable',
    'Advanced: POST a full payload directly to /api/save. Prefer set_week or add_custom_subject instead. Use this only when you need to update multiple sections atomically. Always call get_timetable first and spread its result into your payload to avoid losing existing data.',
    {
      timetable:      z.object({
        odd:  z.array(daySchema),
        even: z.array(daySchema),
      }).describe('Full timetable with odd and even weeks, each with 5 days; each day\'s spans must sum to 30'),
      exams:          z.array(z.object({
        id:        z.string().optional(),
        label:     z.string(),
        date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time:      z.string().nullable().optional(),
        endTime:   z.string().nullable().optional(),
        type:      z.string().optional(),
        details:   z.string().optional(),
      })).describe('Events / exams array'),
      announcements:  z.array(z.object({
        id:        z.string().optional(),
        title:     z.string().max(100),
        body:      z.string().max(5000).optional(),
        category:  z.enum(['general','homework','exam','event']),
        createdAt: z.string().optional(),
        createdBy: z.string().optional(),
      })).describe('Announcements array'),
      overrides:      z.array(z.any()).describe('Day overrides array (pass through from get_timetable)'),
      customSubjects: z.array(z.object({
        key:       z.string(),
        label:     z.string(),
        abbrev:    z.string(),
        color:     z.string(),
        bgOpacity: z.number(),
        textColor: z.string(),
      })).describe('Custom subject definitions'),
      extendedHours:  z.boolean().optional().describe('Extend time grid to 15:00'),
    },
    async (payload) => {
      try {
        const result = await apiPost('/api/save', payload)
        return ok({ ok: true, updatedAt: result.updatedAt, updatedBy: result.updatedBy })
      } catch (e) {
        return err(e.message)
      }
    }
  )

  return server
}

// ── Start ─────────────────────────────────────────────────────────────────────

if (MCP_PORT) {
  // HTTP mode: serves MCP over streamable HTTP on MCP_PORT.
  // Callers authenticate with the same bearer tokens used by the admin API.
  // The token is validated via /api/me on each request and forwarded to all API calls.
  const { createServer } = await import('node:http')
  const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js')

  const httpServer = createServer(async (req, res) => {
    const reqUrl = req.url?.split('?')[0]

    if (reqUrl !== '/mcp') {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found — use POST /mcp' }))
      return
    }

    // bearer token auth
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Authorization: Bearer <token> required' }))
      return
    }
    const token = authHeader.slice(7)

    // validate the token by calling /api/me
    try {
      const check = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!check.ok) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid or revoked token' }))
        return
      }
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Cannot reach timetable API' }))
      return
    }

    // read body for POST requests
    let parsedBody
    if (req.method === 'POST') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const raw = Buffer.concat(chunks).toString()
      if (raw) {
        try {
          parsedBody = JSON.parse(raw)
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          return
        }
      }
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const mcpServer = buildServer(token)
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, parsedBody)
    res.on('finish', () => { transport.close(); mcpServer.close() })
  })

  httpServer.listen(MCP_PORT, () => {
    console.log(`[mcp] HTTP server listening on :${MCP_PORT} → ${BASE_URL}`)
  })
} else {
  // stdio mode: default for local development
  const transport = new StdioServerTransport()
  await buildServer(API_TOKEN).connect(transport)
}

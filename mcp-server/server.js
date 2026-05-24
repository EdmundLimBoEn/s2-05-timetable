#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL  = process.env.TIMETABLE_API_URL?.replace(/\/$/, '')
const API_TOKEN = process.env.TIMETABLE_API_TOKEN

if (!BASE_URL || !API_TOKEN) {
  console.error('ERROR: TIMETABLE_API_URL and TIMETABLE_API_TOKEN must be set.')
  process.exit(1)
}

const BUILT_IN_STYLES = new Set([
  'el','math','sci','hum','mt','sw','cce','hsl','hbl','cm','admt','ict','brk','empty','holiday'
])

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
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
      Authorization: `Bearer ${API_TOKEN}`,
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

// ── Tool schemas ────────────────────────────────────────────────────────────

const blockSchema = z.object({
  label: z.string().describe('Full subject name shown in the now-bar'),
  span:  z.number().int().positive().describe('Number of 20-min slots (all 5 days must each total 30)'),
  style: z.string().describe('CSS/subject key, e.g. "el", "math", or a custom subject key'),
})

const server = new McpServer({
  name:    'timetable',
  version: '1.0.0',
})

// ── get_timetable ────────────────────────────────────────────────────────────
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

// ── list_custom_subjects ─────────────────────────────────────────────────────
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

// ── add_custom_subject ───────────────────────────────────────────────────────
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

// ── set_week ─────────────────────────────────────────────────────────────────
server.tool(
  'set_week',
  'Replace all 5 days of one timetable week (odd or even). Each day is an array of block objects; all 5 days must each have blocks whose spans sum to exactly 30 (each span = 20 minutes; 30 spans = 08:00–14:00). The other week, exams, announcements, overrides, and custom subjects are left untouched.',
  {
    week:          z.enum(['odd', 'even']).describe('"odd" or "even" week'),
    days:          z.array(z.array(blockSchema)).min(5).max(5).describe('Array of exactly 5 days [Mon, Tue, Wed, Thu, Fri]; each day is an array of block objects'),
    extendedHours: z.boolean().optional().describe('If true, extend the time grid to 15:00 (30 cols instead of 21). Omit to leave unchanged.'),
  },
  async ({ week, days, extendedHours }) => {
    try {
      const data = await apiGet('/api/admin-data')
      const updatedTimetable = {
        ...data.timetable,
        [week]: days,
      }
      const payload = { ...data, timetable: updatedTimetable }
      if (typeof extendedHours === 'boolean') payload.extendedHours = extendedHours
      const result = await apiPost('/api/save', payload)
      return ok({ ok: true, updatedAt: result.updatedAt, updatedBy: result.updatedBy })
    } catch (e) {
      return err(e.message)
    }
  }
)

// ── save_timetable ───────────────────────────────────────────────────────────
server.tool(
  'save_timetable',
  'Advanced: POST a full payload directly to /api/save. Prefer set_week or add_custom_subject instead. Use this only when you need to update multiple sections atomically. Always call get_timetable first and spread its result into your payload to avoid losing existing data.',
  {
    timetable:      z.object({
      odd:  z.array(z.array(blockSchema)),
      even: z.array(z.array(blockSchema)),
    }).describe('Full timetable with odd and even weeks, each with 5 days'),
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

// ── start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)

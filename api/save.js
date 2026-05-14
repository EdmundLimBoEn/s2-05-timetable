import { randomUUID } from 'node:crypto'
import { getAdminFromRequest } from './_lib/auth.js'
import { setData } from './_lib/kv.js'
import { validateData } from './_lib/validate.js'

const NON_GENERAL = new Set(['exam', 'event', 'homework'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const username = await getAdminFromRequest(req)
  if (!username) return res.status(401).json({ error: 'Not authenticated' })

  const body   = req.body || {}
  const errors = validateData(body)
  if (errors.length) return res.status(400).json({ errors })

  const now = new Date().toISOString()

  // Assign server-side id + timestamp for any new announcement; pass through event link fields
  let announcements = (body.announcements ?? []).map(a => ({
    id:              a.id        || randomUUID(),
    title:           a.title,
    body:            a.body      ?? '',
    category:        a.category,
    eventDate:       NON_GENERAL.has(a.category) ? (a.eventDate ?? null) : null,
    eventId:         a.eventId   ?? null,
    createdAt:       a.createdAt || now,
    createdBy:       a.createdBy || username,
    _addToCalendar:  !!(a.addToCalendar),  // transient — stripped before save
  }))

  // Assign server-side ids to events; strip transient addToAnnouncement flag
  let events = (body.exams ?? []).map(e => ({
    id:             e.id             || randomUUID(),
    label:          e.label,
    date:           e.date,
    time:           e.time           ?? null,
    type:           e.type           || 'exam',
    details:        e.details        ?? '',
    announcementId: e.announcementId ?? null,
    _addToAnnouncement: e.addToAnnouncement ?? false,
  }))

  // Cross-link: announcement → event
  for (const a of announcements) {
    if (NON_GENERAL.has(a.category) && a._addToCalendar && !a.eventId && a.eventDate) {
      const eventId = randomUUID()
      const linked = {
        id:             eventId,
        label:          a.title,
        date:           a.eventDate,
        time:           a.eventTime ?? null,
        type:           a.category,
        details:        a.body ?? '',
        announcementId: a.id,
      }
      events.push(linked)
      a.eventId = eventId
    }
    delete a._addToCalendar
  }

  // Cross-link: event → announcement
  for (const e of events) {
    if (e._addToAnnouncement && !e.announcementId) {
      const anncId = randomUUID()
      const linked = {
        id:        anncId,
        title:     e.label,
        body:      e.details ?? '',
        category:  e.type,
        eventDate: e.date,
        eventId:   e.id,
        createdAt: now,
        createdBy: username,
      }
      announcements.push(linked)
      e.announcementId = anncId
    }
    delete e._addToAnnouncement
  }

  // Handle transient addToCalendar flags from announcements (sent by client)
  announcements = announcements.map(a => {
    const { _addToCalendar, addToCalendar, ...clean } = a
    return clean
  })

  const overrides     = body.overrides ?? []
  const extendedHours = typeof body.extendedHours === 'boolean' ? body.extendedHours : false

  try {
    const data = await setData(body.timetable, events, announcements, overrides, extendedHours, username)
    res.status(200).json({
      ok:            true,
      updatedAt:     data.updatedAt,
      updatedBy:     data.updatedBy,
      announcements: data.announcements,
      exams:         data.exams,
      overrides:     data.overrides,
      extendedHours: data.extendedHours,
    })
  } catch (err) {
    console.error('[/api/save]', err)
    res.status(500).json({ error: 'Failed to save data' })
  }
}

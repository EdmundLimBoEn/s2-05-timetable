const VALID_STYLES = new Set([
  'el','math','sci','hum','mt','sw','cce','hsl','hbl','cm','admt','ict','brk','empty','holiday'
])
const WEEKS   = ['odd', 'even']
const N_DAYS  = 5
const SPAN_TOTAL = 30

const VALID_CATEGORIES = new Set(['general', 'homework', 'exam', 'event'])

export function validateData(body) {
  const errors = []
  if (!body || typeof body !== 'object') return ['Invalid payload']

  const { timetable, exams, announcements, overrides } = body

  // Validate timetable
  if (!timetable || typeof timetable !== 'object') {
    errors.push('Missing timetable object')
    return errors
  }

  for (const week of WEEKS) {
    if (!Array.isArray(timetable[week]) || timetable[week].length !== N_DAYS) {
      errors.push(`timetable.${week} must have exactly ${N_DAYS} days`)
      continue
    }

    timetable[week].forEach((day, di) => {
      if (!Array.isArray(day)) {
        errors.push(`timetable.${week}[${di}] must be an array`)
        return
      }

      let total = 0
      day.forEach((block, bi) => {
        if (typeof block.label !== 'string' || !block.label) {
          errors.push(`timetable.${week}[${di}][${bi}].label must be a string`)
        }
        if (!VALID_STYLES.has(block.style)) {
          errors.push(`timetable.${week}[${di}][${bi}].style "${block.style}" is unknown`)
        }
        if (!Number.isInteger(block.span) || block.span < 1 || block.span > 30) {
          errors.push(`timetable.${week}[${di}][${bi}].span must be an integer 1–30`)
        }
        total += block.span || 0
      })

      if (total !== SPAN_TOTAL) {
        errors.push(
          `timetable.${week} day ${di + 1} spans total ${total} — must be exactly ${SPAN_TOTAL}`
        )
      }
    })
  }

  // Validate exams
  if (!Array.isArray(exams)) {
    errors.push('Missing exams array')
  } else {
    exams.forEach((e, i) => {
      if (typeof e.label !== 'string' || !e.label.trim()) {
        errors.push(`exams[${i}].label must be a non-empty string`)
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        errors.push(`exams[${i}].date must be YYYY-MM-DD (got "${e.date}")`)
      }
    })
  }

  // Validate announcements (optional field — absent means no change)
  if (announcements !== undefined) {
    if (!Array.isArray(announcements)) {
      errors.push('announcements must be an array')
    } else {
      announcements.forEach((a, i) => {
        if (typeof a.title !== 'string' || !a.title.trim() || a.title.length > 100) {
          errors.push(`announcements[${i}].title must be a non-empty string ≤100 chars`)
        }
        if (typeof a.body !== 'string' || a.body.length > 5000) {
          errors.push(`announcements[${i}].body must be a string ≤5000 chars`)
        }
        if (!VALID_CATEGORIES.has(a.category)) {
          errors.push(`announcements[${i}].category must be one of: ${[...VALID_CATEGORIES].join(', ')}`)
        }
      })
    }
  }

  // Validate overrides (optional field — absent means no change)
  if (overrides !== undefined) {
    if (!Array.isArray(overrides)) {
      errors.push('overrides must be an array')
    } else {
      const seen = new Set()
      overrides.forEach((o, i) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date))
          errors.push(`overrides[${i}].date must be YYYY-MM-DD`)
        if (seen.has(o.date))
          errors.push(`overrides[${i}] duplicate date "${o.date}"`)
        seen.add(o.date)
        if (!['holiday', 'custom'].includes(o.type))
          errors.push(`overrides[${i}].type must be holiday or custom`)
        if (typeof o.label !== 'string' || !o.label.trim())
          errors.push(`overrides[${i}].label required`)
        if (o.type === 'custom') {
          if (!Array.isArray(o.blocks)) {
            errors.push(`overrides[${i}].blocks required for custom type`)
          } else {
            const sum = o.blocks.reduce((s, b) => s + (b.span || 0), 0)
            if (sum !== SPAN_TOTAL)
              errors.push(`overrides[${i}].blocks must sum to ${SPAN_TOTAL} (got ${sum})`)
            o.blocks.forEach((b, bi) => {
              if (!VALID_STYLES.has(b.style))
                errors.push(`overrides[${i}].blocks[${bi}].style "${b.style}" is unknown`)
            })
          }
        }
      })
    }
  }

  return errors
}

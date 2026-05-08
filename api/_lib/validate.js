const VALID_STYLES = new Set([
  'el','math','sci','hum','mt','sw','cce','hsl','hbl','cm','admt','ict','brk','empty'
])
const WEEKS   = ['odd', 'even']
const N_DAYS  = 5
const SPAN_TOTAL = 30

export function validateData(body) {
  const errors = []
  if (!body || typeof body !== 'object') return ['Invalid payload']

  const { timetable, exams } = body

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

  return errors
}

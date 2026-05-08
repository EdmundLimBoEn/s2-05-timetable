// S2-05 Admin Dashboard

const SUBJECT_DISPLAY = {
  el:    'English (EL)',
  math:  'Mathematics',
  sci:   'Science',
  hum:   'Humanities',
  mt:    'Chinese (CL)',
  sw:    'Sports & Wellness (S&W)',
  cce:   'CCE / Assembly',
  hsl:   'HSL',
  hbl:   'Home-Based Learning (HBL)',
  cm:    'Class Management (CM)',
  admt:  'ADMT',
  ict:   'ICT',
  brk:   'Break',
  empty: 'Empty / Free period'
}

const DEFAULT_LABELS = {
  el: 'EL', math: 'MATH', sci: 'SCI', hum: 'Humanities',
  mt: 'Chinese', sw: 'S&W', cce: 'CCE / Assembly', hsl: 'HSL',
  hbl: 'HBL', cm: 'CM(CT)', admt: 'ADMT', ict: 'ICT',
  brk: 'BREAK', empty: '—'
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const SPAN_TOTAL = 30
const SUBJECT_KEYS = Object.keys(SUBJECT_DISPLAY)

// ── State ─────────────────────────────────────────────────────
let activeWeek = 'odd'
let editingData = { timetable: { odd: [], even: [] }, exams: [] }
let serverData  = null   // last confirmed saved state

// ── Boot ──────────────────────────────────────────────────────
async function init() {
  try {
    const me = await apiFetch('/api/me')
    document.getElementById('adminUser').textContent = me.username
  } catch {
    show('loginSection')
    return
  }

  try {
    const data = await apiFetch('/api/admin-data')
    serverData  = data
    editingData = deepClone(data)
    renderLastSaved(data)
  } catch {
    showToast('Could not load timetable data.', 'error')
  }

  show('dashboard')
  renderTimetable()
  renderExams()
}

// ── Fetch helper ──────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ── Timetable renderer ────────────────────────────────────────
function renderTimetable() {
  const container = document.getElementById('dayCards')
  container.innerHTML = ''

  for (let di = 0; di < 5; di++) {
    container.appendChild(buildDayCard(di))
  }

  validateAll()
}

function buildDayCard(di) {
  const card = document.createElement('div')
  card.className = 'day-card'
  card.dataset.di = di

  const hdr = document.createElement('div')
  hdr.className = 'day-card-hdr'
  hdr.innerHTML = `
    <span class="day-name">${DAY_LABELS[di]}</span>
    <span class="span-counter" id="spanCounter-${di}">0 / ${SPAN_TOTAL}</span>
  `
  card.appendChild(hdr)

  const rows = document.createElement('div')
  rows.className = 'day-rows'
  rows.id = `dayRows-${di}`
  card.appendChild(rows)

  const addBtn = document.createElement('button')
  addBtn.className = 'row-add-btn'
  addBtn.textContent = '+ add row'
  addBtn.addEventListener('click', () => addRow(di))
  card.appendChild(addBtn)

  renderDayRows(di, rows)
  return card
}

function renderDayRows(di, container) {
  container = container || document.getElementById(`dayRows-${di}`)
  if (!container) return
  const blocks = editingData.timetable[activeWeek][di] || []
  container.innerHTML = ''

  blocks.forEach((block, bi) => {
    const row = document.createElement('div')
    row.className = 'form-row'
    row.dataset.di = di
    row.dataset.bi = bi

    // Subject select
    const sel = document.createElement('select')
    sel.className = 'subj-select'
    SUBJECT_KEYS.forEach(key => {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = SUBJECT_DISPLAY[key]
      if (key === block.style) opt.selected = true
      sel.appendChild(opt)
    })
    sel.addEventListener('change', () => {
      block.style = sel.value
      block.label = DEFAULT_LABELS[sel.value] || sel.value
      validateAll()
    })

    // Span input
    const spanWrap = document.createElement('div')
    spanWrap.className = 'span-wrap'
    spanWrap.innerHTML = `<span class="span-label-txt">SLOTS</span>`
    const spanInp = document.createElement('input')
    spanInp.type = 'number'
    spanInp.className = 'span-input'
    spanInp.min = 1
    spanInp.max = 30
    spanInp.value = block.span
    spanInp.addEventListener('input', () => {
      const v = parseInt(spanInp.value)
      block.span = isNaN(v) ? 0 : v
      spanInp.classList.toggle('invalid', isNaN(v) || v < 1 || v > 30)
      validateAll()
    })
    spanWrap.appendChild(spanInp)

    // Delete button
    const delBtn = document.createElement('button')
    delBtn.className = 'btn danger small'
    delBtn.textContent = '✕'
    delBtn.title = 'Remove this row'
    delBtn.addEventListener('click', () => {
      editingData.timetable[activeWeek][di].splice(bi, 1)
      renderDayRows(di)
      validateAll()
    })

    row.appendChild(sel)
    row.appendChild(spanWrap)
    row.appendChild(delBtn)
    container.appendChild(row)
  })
}

function addRow(di) {
  editingData.timetable[activeWeek][di].push({
    label: DEFAULT_LABELS.empty,
    span:  1,
    style: 'empty'
  })
  renderDayRows(di)
  validateAll()
}

// ── Validation ────────────────────────────────────────────────
function validateAll() {
  let allValid = true

  for (let di = 0; di < 5; di++) {
    const blocks = editingData.timetable[activeWeek][di] || []
    const total  = blocks.reduce((s, b) => s + (b.span || 0), 0)
    const valid  = total === SPAN_TOTAL
    if (!valid) allValid = false

    const counter = document.getElementById(`spanCounter-${di}`)
    if (counter) {
      counter.textContent = `${total} / ${SPAN_TOTAL}`
      counter.classList.toggle('invalid', !valid)
    }
  }

  const saveBtn = document.getElementById('saveTimetableBtn')
  if (saveBtn) saveBtn.disabled = !allValid

  return allValid
}

// ── Exams renderer ────────────────────────────────────────────
function renderExams() {
  const container = document.getElementById('examsList')
  if (!container) return
  const exams = editingData.exams || []
  container.innerHTML = ''

  if (!exams.length) {
    const empty = document.createElement('p')
    empty.className = 'exams-empty'
    empty.textContent = 'No exams scheduled. Click + ADD EXAM to add one.'
    container.appendChild(empty)
    return
  }

  exams.forEach((exam, i) => {
    const row = document.createElement('div')
    row.className = 'exam-row'

    const labelInp = document.createElement('input')
    labelInp.type = 'text'
    labelInp.className = 'exam-label-input'
    labelInp.placeholder = 'e.g. T2 CA · MATH'
    labelInp.value = exam.label
    labelInp.addEventListener('input', () => { exam.label = labelInp.value })

    const dateInp = document.createElement('input')
    dateInp.type = 'date'
    dateInp.className = 'exam-date-input'
    dateInp.value = exam.date
    dateInp.addEventListener('change', () => { exam.date = dateInp.value })

    const delBtn = document.createElement('button')
    delBtn.className = 'btn danger small'
    delBtn.textContent = '✕'
    delBtn.addEventListener('click', () => {
      editingData.exams.splice(i, 1)
      renderExams()
    })

    row.appendChild(labelInp)
    row.appendChild(dateInp)
    row.appendChild(delBtn)
    container.appendChild(row)
  })
}

// ── Save handlers ─────────────────────────────────────────────
async function saveTimetable() {
  const btn = document.getElementById('saveTimetableBtn')
  const status = document.getElementById('saveTimetableStatus')

  btn.disabled = true
  status.textContent = 'Saving...'
  status.className = 'save-status'

  // Also sync the other week from server (don't overwrite with stale)
  const otherWeek = activeWeek === 'odd' ? 'even' : 'odd'
  const payload = {
    timetable: {
      [activeWeek]: editingData.timetable[activeWeek],
      [otherWeek]:  serverData?.timetable?.[otherWeek] ?? editingData.timetable[otherWeek]
    },
    exams: serverData?.exams ?? editingData.exams
  }

  try {
    const result = await apiFetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    serverData = { ...serverData, timetable: payload.timetable }
    editingData.timetable[otherWeek] = payload.timetable[otherWeek]
    renderLastSaved(result)
    status.textContent = 'Saved!'
    status.className = 'save-status ok'
    showToast('Timetable saved ✓', 'success')
  } catch (err) {
    status.textContent = err.message
    status.className = 'save-status err'
    showToast('Save failed: ' + err.message, 'error')
  } finally {
    validateAll()  // re-enables button based on state
  }
}

async function saveExams() {
  const btn    = document.getElementById('saveExamsBtn')
  const status = document.getElementById('saveExamsStatus')

  btn.disabled = true
  status.textContent = 'Saving...'
  status.className = 'save-status'

  const payload = {
    timetable: serverData?.timetable ?? editingData.timetable,
    exams:     editingData.exams
  }

  try {
    const result = await apiFetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    serverData = { ...serverData, exams: editingData.exams }
    renderLastSaved(result)
    status.textContent = 'Saved!'
    status.className = 'save-status ok'
    showToast('Exams saved ✓', 'success')
  } catch (err) {
    status.textContent = err.message
    status.className = 'save-status err'
    showToast('Save failed: ' + err.message, 'error')
  } finally {
    btn.disabled = false
  }
}

// ── Login / Logout ────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault()
  const btn = document.getElementById('loginBtn')
  const err = document.getElementById('loginError')
  btn.disabled = true
  err.textContent = ''

  try {
    const result = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('loginUser').value,
        password: document.getElementById('loginPass').value
      })
    })
    document.getElementById('adminUser').textContent = result.username
    const data = await apiFetch('/api/admin-data')
    serverData  = data
    editingData = deepClone(data)
    renderLastSaved(data)
    hide('loginSection')
    show('dashboard')
    renderTimetable()
    renderExams()
  } catch (e) {
    err.textContent = e.message
    btn.disabled = false
  }
})

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' }).catch(() => {})
  hide('dashboard')
  show('loginSection')
  document.getElementById('loginPass').value = ''
})

// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    const name = tab.dataset.tab
    document.getElementById('tabTimetable').classList.toggle('hidden', name !== 'timetable')
    document.getElementById('tabExams').classList.toggle('hidden', name !== 'exams')
  })
})

// ── Week toggle ────────────────────────────────────────────────
document.querySelectorAll('.week-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeWeek = btn.dataset.week
    renderTimetable()
  })
})

// ── Save buttons ──────────────────────────────────────────────
document.getElementById('saveTimetableBtn').addEventListener('click', saveTimetable)
document.getElementById('saveExamsBtn').addEventListener('click', saveExams)
document.getElementById('addExamBtn').addEventListener('click', () => {
  editingData.exams.push({ label: '', date: '' })
  renderExams()
})

// ── Helpers ───────────────────────────────────────────────────
function show(id) { document.getElementById(id).classList.remove('hidden') }
function hide(id) { document.getElementById(id).classList.add('hidden') }

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)) }

function renderLastSaved(data) {
  const el = document.getElementById('lastSaved')
  if (!el) return
  if (data?.updatedAt && data?.updatedBy) {
    const d = new Date(data.updatedAt)
    el.textContent = `Last saved by ${data.updatedBy} · ${d.toLocaleString('en-SG')}`
  } else {
    el.textContent = 'Using default data — no saves yet.'
  }
}

let toastTimer = null
function showToast(msg, type = '') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = `show ${type}`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { el.className = '' }, 3500)
}

// ── Start ─────────────────────────────────────────────────────
init()

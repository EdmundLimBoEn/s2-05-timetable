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
let editingData = { timetable: { odd: [], even: [] }, exams: [], announcements: [] }
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
    editingData.announcements = editingData.announcements ?? []
    renderLastSaved(data)
  } catch {
    showToast('Could not load timetable data.', 'error')
  }

  show('dashboard')
  renderTimetable()
  renderExams()
  renderAnnouncements()
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

// ── Save helpers ──────────────────────────────────────────────
// After a successful save the server returns the full saved state
// (including server-assigned id/createdAt/createdBy for announcements).
// We apply that directly so we never need a second GET that could
// race with blob propagation delay and return stale data.
function applySaveResult(result) {
  if (Array.isArray(result.announcements)) {
    serverData = { ...serverData, announcements: result.announcements }
    editingData.announcements = result.announcements
    renderAnnouncements()
  }
  if (Array.isArray(result.exams)) {
    serverData = { ...serverData, exams: result.exams }
  }
  renderLastSaved(result)
}

function buildPayload(overrides = {}) {
  return {
    timetable:     serverData?.timetable     ?? editingData.timetable,
    exams:         serverData?.exams         ?? editingData.exams,
    announcements: serverData?.announcements ?? editingData.announcements,
    ...overrides
  }
}

// ── Save handlers ─────────────────────────────────────────────
async function saveTimetable() {
  const btn    = document.getElementById('saveTimetableBtn')
  const status = document.getElementById('saveTimetableStatus')

  btn.disabled = true
  status.textContent = 'Saving...'
  status.className = 'save-status'
  showSaveBar('saving')

  const otherWeek = activeWeek === 'odd' ? 'even' : 'odd'
  const payload = buildPayload({
    timetable: {
      [activeWeek]: editingData.timetable[activeWeek],
      [otherWeek]:  serverData?.timetable?.[otherWeek] ?? editingData.timetable[otherWeek]
    }
  })

  try {
    const result = await apiFetch('/api/save', { method: 'POST', body: JSON.stringify(payload) })
    editingData.timetable[otherWeek] = payload.timetable[otherWeek]
    serverData = { ...serverData, timetable: payload.timetable }
    applySaveResult(result)
    status.textContent = 'Saved!'
    status.className = 'save-status ok'
    showSaveBar('saved')
    showToast('Timetable saved ✓', 'success')
  } catch (err) {
    status.textContent = err.message
    status.className = 'save-status err'
    showSaveBar('error')
    showToast('Save failed: ' + err.message, 'error')
  } finally {
    validateAll()
  }
}

async function saveExams() {
  const btn    = document.getElementById('saveExamsBtn')
  const status = document.getElementById('saveExamsStatus')

  btn.disabled = true
  status.textContent = 'Saving...'
  status.className = 'save-status'
  showSaveBar('saving')

  try {
    const result = await apiFetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(buildPayload({ exams: editingData.exams }))
    })
    applySaveResult(result)
    status.textContent = 'Saved!'
    status.className = 'save-status ok'
    showSaveBar('saved')
    showToast('Exams saved ✓', 'success')
  } catch (err) {
    status.textContent = err.message
    status.className = 'save-status err'
    showSaveBar('error')
    showToast('Save failed: ' + err.message, 'error')
  } finally {
    btn.disabled = false
  }
}

// ── Announcements renderer ────────────────────────────────────
function renderAnnouncements() {
  const list = document.getElementById('anncsList')
  if (!list) return
  const anncs = editingData.announcements || []
  list.innerHTML = ''

  if (!anncs.length) {
    const empty = document.createElement('p')
    empty.className = 'anncs-empty'
    empty.textContent = 'No announcements yet. Use the form above to post one.'
    list.appendChild(empty)
    return
  }

  // newest first
  const sorted = [...anncs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  sorted.forEach(annc => {
    const idx = editingData.announcements.indexOf(annc)
    const card = document.createElement('div')
    card.className = 'annc-card'

    const body = document.createElement('div')
    body.className = 'annc-card-body'

    const title = document.createElement('div')
    title.className = 'annc-card-title'
    title.textContent = annc.title

    const meta = document.createElement('div')
    meta.className = 'annc-card-meta'
    const catPill = `<span class="annc-cat-pill ${annc.category}">${annc.category.toUpperCase()}</span>`
    const date = annc.createdAt ? new Date(annc.createdAt).toLocaleString('en-SG') : 'new'
    meta.innerHTML = `${catPill}${date}${annc.createdBy ? ' · ' + annc.createdBy : ''}`

    body.appendChild(title)
    body.appendChild(meta)

    if (annc.body) {
      const text = document.createElement('div')
      text.className = 'annc-card-text'
      text.textContent = annc.body
      body.appendChild(text)
    }

    const delBtn = document.createElement('button')
    delBtn.className = 'btn danger small'
    delBtn.textContent = '✕'
    delBtn.title = 'Delete announcement'
    delBtn.addEventListener('click', async () => {
      editingData.announcements.splice(idx, 1)
      renderAnnouncements()
      await saveAnnouncements()
    })

    card.appendChild(body)
    card.appendChild(delBtn)
    list.appendChild(card)
  })
}

async function saveAnnouncements() {
  showSaveBar('saving')
  try {
    const result = await apiFetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(buildPayload({ announcements: editingData.announcements }))
    })
    applySaveResult(result)
    showSaveBar('saved')
  } catch (err) {
    showSaveBar('error')
    showToast('Save failed: ' + err.message, 'error')
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
    editingData.announcements = editingData.announcements ?? []
    renderLastSaved(data)
    hide('loginSection')
    show('dashboard')
    renderTimetable()
    renderExams()
    renderAnnouncements()
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
    document.getElementById('tabAnnouncements').classList.toggle('hidden', name !== 'announcements')
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
document.getElementById('addAnncBtn').addEventListener('click', async () => {
  const title = document.getElementById('anncTitle').value.trim()
  if (!title) { showToast('Title is required', 'error'); return }
  const body     = document.getElementById('anncBody').value.trim()
  const category = document.getElementById('anncCategory').value
  editingData.announcements.push({ title, body, category })
  document.getElementById('anncTitle').value = ''
  document.getElementById('anncBody').value  = ''
  renderAnnouncements()
  await saveAnnouncements()
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

let _saveBarTimer = null
function showSaveBar(state) {
  const bar  = document.getElementById('saveBar')
  const text = document.getElementById('saveBarText')
  if (!bar) return
  clearTimeout(_saveBarTimer)
  bar.style.display = 'block'
  bar.className = 'save-bar-indicator ' + state
  if (state === 'saving') {
    text.textContent = 'SAVING...'
  } else if (state === 'saved') {
    text.textContent = 'SAVED'
    _saveBarTimer = setTimeout(() => { bar.style.display = 'none' }, 3000)
  } else {
    text.textContent = 'SAVE FAILED'
    _saveBarTimer = setTimeout(() => { bar.style.display = 'none' }, 4000)
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

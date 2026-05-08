// S2-05 · Term 2 2026

// ── Constants ──────────────────────────────────────────────────
const N_COLS = 21

const TIMES = [
  '08:00','08:20','08:40','09:00','09:20','09:40',
  '10:00','10:20','10:40','11:00','11:20','11:40',
  '12:00','12:20','12:40','13:00','13:20','13:40',
  '14:00','14:20','14:40'
]

const ALL_MINS = TIMES.map(t => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
})

const END_MIN = ALL_MINS[ALL_MINS.length - 1] + 20

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri']

const ABBREV = {
  el:    'EL',
  math:  'MATH',
  sci:   'SCI',
  hum:   'HUM',
  mt:    'CL',
  sw:    'S&W',
  cce:   'CCE',
  hsl:   'HSL',
  hbl:   'HBL',
  cm:    'CM',
  admt:  'ADMT',
  ict:   'ICT',
  brk:   'BREAK',
  empty: ''
}

// First Monday of Term 1 2026 (Week 1). Odd/even alternates continuously across all terms.
const TERM_START = { date: '2026-01-05', week: 'even' }

const TERMS_2026 = [
  { term: 1, start: '2026-01-05' },
  { term: 2, start: '2026-03-23' },
  { term: 3, start: '2026-06-29' },
  { term: 4, start: '2026-09-14' },
]

const SCHOOL_HOLIDAYS_2026 = [
  { label: 'TERM BREAK',    start: '2026-03-16', end: '2026-03-20' },
  { label: 'MID-YR HOLS',  start: '2026-06-01', end: '2026-06-26' },
  { label: 'SEPT BREAK',   start: '2026-09-07', end: '2026-09-11' },
  { label: 'YEAR-END HOLS',start: '2026-11-23', end: '2026-12-31' },
]

function isHoliday(date) {
  const d = date.toISOString().slice(0, 10)
  return SCHOOL_HOLIDAYS_2026.find(h => d >= h.start && d <= h.end) || null
}

function getNextSchoolDay(from = new Date()) {
  const d = new Date(from)
  for (let i = 0; i < 14; i++) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() >= 1 && d.getDay() <= 5 && !isHoliday(d)) return d
  }
  return null
}

function calcDaysToBreak() {
  const today = new Date().toISOString().slice(0, 10)
  const next  = SCHOOL_HOLIDAYS_2026
    .filter(h => h.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  if (!next) return null
  const days = Math.ceil((new Date(next.start) - Date.now()) / 86_400_000)
  return { label: next.label, days }
}

// CSS variable keys → default hex colours
const THEME_VARS = {
  bg:       '#080808',
  red:      '#ff3b3b',
  'c-el':   '#4fc3f7',
  'c-math': '#ff8a65',
  'c-sci':  '#81c784',
  'c-hum':  '#ce93d8',
  'c-mt':   '#fff176',
  'c-sw':   '#ef5350',
  'c-cce':  '#b0bec5',
  'c-hsl':  '#80cbc4',
  'c-hbl':  '#ffb74d',
  'c-cm':   '#f48fb1',
  'c-admt': '#ff8fab',
  'c-ict':  '#80deea',
}

const THEME_LABELS = {
  bg:       'BACKGROUND',
  red:      'ACCENT',
  'c-el':   'ENGLISH',
  'c-math': 'MATH',
  'c-sci':  'SCIENCE',
  'c-hum':  'HUMANITIES',
  'c-mt':   'CHINESE',
  'c-sw':   'S&W',
  'c-cce':  'CCE',
  'c-hsl':  'HSL',
  'c-hbl':  'HBL',
  'c-cm':   'CM',
  'c-admt': 'ADMT',
  'c-ict':  'ICT',
}

let TIMETABLE = {
  odd: [
    // Mon: 3 blank, 2 ADMT, 3 S&W, 2 break, 2 math, 3 science, 3 english, 3 CCE
    [
      { label:'—',               span:3,  style:'empty' },
      { label:'ADMT',            span:2,  style:'admt'  },
      { label:'S&W',             span:3,  style:'sw'    },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'MATH',            span:2,  style:'math'  },
      { label:'SCI',             span:3,  style:'sci'   },
      { label:'EL',              span:3,  style:'el'    },
      { label:'CCE / Assembly',  span:3,  style:'cce'   },
      { label:'—',               span:9,  style:'empty' }
    ],
    // Tue: 2 english, 3 chinese, 2 break, 3 ADMT, 3 humanities, 3 math
    [
      { label:'EL',              span:2,  style:'el'    },
      { label:'Chinese',         span:3,  style:'mt'    },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'ADMT',            span:3,  style:'admt'  },
      { label:'Humanities',      span:3,  style:'hum'   },
      { label:'MATH',            span:3,  style:'math'  },
      { label:'—',               span:14, style:'empty' }
    ],
    // Wed: 1 blank, 2 english, 2 humanities, 3 chinese, 2 break, 2 math, 3 science, 3 CCE
    [
      { label:'—',               span:1,  style:'empty' },
      { label:'EL',              span:2,  style:'el'    },
      { label:'Humanities',      span:2,  style:'hum'   },
      { label:'Chinese',         span:3,  style:'mt'    },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'MATH',            span:2,  style:'math'  },
      { label:'SCI',             span:3,  style:'sci'   },
      { label:'CCE / Assembly',  span:3,  style:'cce'   },
      { label:'—',               span:12, style:'empty' }
    ],
    // Thu: HBL full day
    [
      { label:'HBL',             span:30, style:'hbl'   }
    ],
    // Fri: 3 S&W, 4 science, 2 break, 2 chinese, 3 ICT
    [
      { label:'S&W',             span:3,  style:'sw'    },
      { label:'SCI',             span:4,  style:'sci'   },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'Chinese',         span:2,  style:'mt'    },
      { label:'ICT',             span:3,  style:'ict'   },
      { label:'—',               span:16, style:'empty' }
    ]
  ],
  even: [
    // Mon: 3 blank, 3 english, 2 science, 2 break, 2 chinese, 3 S&W, 3 ADMT, 3 CCE
    [
      { label:'—',               span:3,  style:'empty' },
      { label:'EL',              span:3,  style:'el'    },
      { label:'SCI',             span:2,  style:'sci'   },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'Chinese',         span:2,  style:'mt'    },
      { label:'S&W',             span:3,  style:'sw'    },
      { label:'ADMT',            span:3,  style:'admt'  },
      { label:'CCE / Assembly',  span:3,  style:'cce'   },
      { label:'—',               span:9,  style:'empty' }
    ],
    // Tue: 2 science, 3 math, 2 break, 3 humanities, 3 english, 3 chinese
    [
      { label:'SCI',             span:2,  style:'sci'   },
      { label:'MATH',            span:3,  style:'math'  },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'Humanities',      span:3,  style:'hum'   },
      { label:'EL',              span:3,  style:'el'    },
      { label:'Chinese',         span:3,  style:'mt'    },
      { label:'—',               span:14, style:'empty' }
    ],
    // Wed: 1 blank, 3 chinese, 2 math, 2 ADMT, 2 break, 3 science, 3 english, 3 CCE
    [
      { label:'—',               span:1,  style:'empty' },
      { label:'Chinese',         span:3,  style:'mt'    },
      { label:'MATH',            span:2,  style:'math'  },
      { label:'ADMT',            span:2,  style:'admt'  },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'SCI',             span:3,  style:'sci'   },
      { label:'EL',              span:3,  style:'el'    },
      { label:'CCE / Assembly',  span:3,  style:'cce'   },
      { label:'—',               span:11, style:'empty' }
    ],
    // Thu: 3 blank, 3 S&W, 2 ADMT, 2 ICT, 2 break, 3 math, 3 english, 3 humanities
    [
      { label:'—',               span:3,  style:'empty' },
      { label:'S&W',             span:3,  style:'sw'    },
      { label:'ADMT',            span:2,  style:'admt'  },
      { label:'ICT',             span:2,  style:'ict'   },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'MATH',            span:3,  style:'math'  },
      { label:'EL',              span:3,  style:'el'    },
      { label:'Humanities',      span:3,  style:'hum'   },
      { label:'—',               span:9,  style:'empty' }
    ],
    // Fri: 3 chinese, 2 ICT, 2 humanities, 2 break, 3 science, 2 math
    [
      { label:'Chinese',         span:3,  style:'mt'    },
      { label:'ICT',             span:2,  style:'ict'   },
      { label:'Humanities',      span:2,  style:'hum'   },
      { label:'BREAK',           span:2,  style:'brk'   },
      { label:'SCI',             span:3,  style:'sci'   },
      { label:'MATH',            span:2,  style:'math'  },
      { label:'—',               span:16, style:'empty' }
    ]
  ]
}

// ── State ──────────────────────────────────────────────────────
let week         = 'odd'
let currentTheme = {}
let demoMode     = false
let demoDay      = 3    // Wednesday
let demoMins     = 705  // 11:45
let compact      = !!localStorage.getItem('compact')

let classNotifEnabled  = false
let classNotifTimeouts = []
let eveNotifEnabled    = false
let eveNotifMins       = 19 * 60 + 30
let eveNotifTimeout    = null

let absentDays            = new Set(JSON.parse(localStorage.getItem('absentDays') || '[]'))
let currentNoteKey        = null
let deferredInstallPrompt = null
let touchStartX = null, touchStartY = null, touchStartScrollLeft = null

// Hardcoded exam dates — these are fallback defaults; live data comes from /api/data
let EXAMS = [
  { label: 'T2 CA · MATH', date: '2026-05-12' },
  { label: 'T2 CA · SCI',  date: '2026-05-13' },
  { label: 'T2 CA · EL',   date: '2026-05-15' },
  { label: 'T2 CA · HUM',  date: '2026-05-19' },
  { label: 'T2 CA · CL',   date: '2026-05-20' },
]

// ── DOM refs ───────────────────────────────────────────────────
const wrap = document.getElementById('tableWrap')
const tl   = document.getElementById('tl')

const nowDate  = new Date()
const todayDow = nowDate.getDay()
const DAYS_SH  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

document.getElementById('todayPill').textContent =
  DAYS_SH[todayDow] + ' · ' +
  nowDate.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Demo helpers ───────────────────────────────────────────────
function getEffectiveDow()  { return demoMode ? demoDay  : todayDow  }
function getEffectiveMins() { return demoMode ? demoMins : nowMins() }

// ── Theme helpers ──────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function applyTheme(overrides) {
  const full = { ...THEME_VARS, ...overrides }
  const subjects = ['el','math','sci','hum','mt','sw','cce','hsl','hbl','cm','admt','ict']

  let css = ':root{'
  for (const [k, v] of Object.entries(full)) css += `--${k}:${v};`
  css += '}'

  for (const s of subjects) {
    const [r, g, b] = hexToRgb(full[`c-${s}`])
    css += `.cell.${s}{background:rgba(${r},${g},${b},0.06)}`
  }

  let styleEl = document.getElementById('theme-ovr')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'theme-ovr'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}

function encodeTheme(overrides) {
  const delta = {}
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== THEME_VARS[k]) delta[k] = v
  }
  if (!Object.keys(delta).length) return ''
  return btoa(JSON.stringify(delta)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decodeTheme(code) {
  if (!code) return {}
  try {
    const padded = code.padEnd(code.length + (4 - code.length % 4) % 4, '=')
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return {} }
}

// ── Week auto-detection ────────────────────────────────────────
function calcWeek() {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksDiff = Math.floor((Date.now() - new Date(TERM_START.date)) / msPerWeek)
  const startIsOdd = TERM_START.week === 'odd'
  return (weeksDiff % 2 === 0) === startIsOdd ? 'odd' : 'even'
}

function calcTermWeek() {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  for (let i = TERMS_2026.length - 1; i >= 0; i--) {
    const start = new Date(TERMS_2026[i].start).getTime()
    if (now >= start) {
      const w = Math.floor((now - start) / msPerWeek) + 1
      return w <= 10 ? { term: TERMS_2026[i].term, week: w } : null
    }
  }
  return null
}

function weekForDate(d) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = Math.floor((d.getTime() - new Date(TERM_START.date).getTime()) / msPerWeek)
  const startIsOdd = TERM_START.week === 'odd'
  return (diff % 2 === 0) === startIsOdd ? 'odd' : 'even'
}

function firstRealBlock(schedule) {
  let min = ALL_MINS[0]
  for (const b of schedule) {
    if (b.style !== 'empty' && b.style !== 'brk') return { block: b, startMin: min }
    min += b.span * 20
  }
  return null
}

// ── B1: Auto-scroll to current time ───────────────────────────
function scrollToNow() {
  const nm = getEffectiveMins()
  if (getEffectiveDow() < 1 || getEffectiveDow() > 5) return
  if (nm < ALL_MINS[0] || nm > END_MIN) return
  const cols = colPositions()
  if (!cols) return
  let xPos = null
  for (const c of cols) {
    if (nm >= c.s && nm < c.e) {
      xPos = c.l + (nm - c.s) / (c.e - c.s) * (c.r - c.l)
      break
    }
  }
  if (xPos === null && nm >= cols[cols.length - 1].s) xPos = cols[cols.length - 1].r
  if (xPos !== null) wrap.scrollTo({ left: Math.max(0, xPos - wrap.clientWidth / 2), behavior: 'smooth' })
}

// ── B2: Last real class end time ───────────────────────────────
function lastClassEndMin(day) {
  let min = ALL_MINS[0], lastEnd = null
  for (const b of day) {
    if (b.style !== 'empty' && b.style !== 'brk') lastEnd = min + b.span * 20
    min += b.span * 20
  }
  return lastEnd
}

// ── B8: Exam countdown ─────────────────────────────────────────
function checkExams() {
  const bar = document.getElementById('examBar')
  const txt = document.getElementById('examText')
  if (!bar || !txt) return
  const now = Date.now()
  const upcoming = EXAMS
    .map(e => ({ ...e, ms: new Date(e.date).getTime() }))
    .filter(e => e.ms >= now && e.ms - now <= 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.ms - b.ms)
  if (!upcoming.length) { bar.style.display = 'none'; return }
  const next = upcoming[0]
  const days = Math.max(0, Math.ceil((next.ms - now) / (24 * 60 * 60 * 1000)))
  const extra = upcoming.length > 1 ? ` + ${upcoming.length - 1} MORE` : ''
  txt.textContent = `${next.label} · ${days === 0 ? 'TODAY' : `IN ${days} ${days === 1 ? 'DAY' : 'DAYS'}`}${extra}`
  bar.style.display = 'flex'
}

// ── B11: Bring-today bar ───────────────────────────────────────
function updateBringBar() {
  const bar  = document.getElementById('bringBar')
  const subj = document.getElementById('bringSubjects')
  if (!bar || !subj) return
  const dow = getEffectiveDow()
  if (dow < 1 || dow > 5) { bar.style.display = 'none'; return }
  const day  = TIMETABLE[week][dow - 1]
  const uniq = [...new Set(day.filter(b => b.style !== 'empty' && b.style !== 'brk').map(b => ABBREV[b.style]))]
  subj.textContent = uniq.join(' · ')
  bar.style.display = 'flex'
}

// ── B12: Offline indicator ─────────────────────────────────────
function updateOnlineStatus() {
  const badge = document.getElementById('offlineBadge')
  if (badge) badge.style.display = navigator.onLine ? 'none' : 'inline-block'
}

// ── B14: Weekly subject stats ──────────────────────────────────
function buildStats() {
  const grid = document.getElementById('statsGrid')
  if (!grid) return
  const counts = {}
  TIMETABLE[week].forEach(day => {
    day.forEach(b => {
      if (b.style !== 'empty' && b.style !== 'brk') counts[b.style] = (counts[b.style] || 0) + 1
    })
  })
  grid.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `<span class="stats-chip" style="border-color:var(--c-${k});color:var(--c-${k})">${ABBREV[k]} ×${n}</span>`)
    .join('')
}

// ── B15: Absent day marker ─────────────────────────────────────
function applyAbsentDays() {
  document.querySelectorAll('.tt-table tbody tr').forEach((row, di) => {
    row.classList.toggle('day-absent', absentDays.has(di))
  })
}

// ── B7: Note modal ─────────────────────────────────────────────
function openNoteModal(cellId) {
  const noteKey = 'note-' + cellId.slice(2)   // 'c-odd-0-2' → 'note-odd-0-2'
  currentNoteKey = noteKey
  const cell     = document.getElementById(cellId)
  const subjText = cell?.querySelector('.subj')?.textContent || 'CELL'
  document.getElementById('noteModalTitle').textContent = subjText + ' · NOTE'
  document.getElementById('noteInput').value = localStorage.getItem(noteKey) || ''
  document.getElementById('noteOverlay').style.display = 'block'
  document.getElementById('noteModal').style.display   = 'block'
  document.getElementById('noteInput').focus()
}

function closeNoteModal() {
  currentNoteKey = null
  document.getElementById('noteOverlay').style.display = 'none'
  document.getElementById('noteModal').style.display   = 'none'
}

function saveNote() {
  if (!currentNoteKey) return
  const val    = document.getElementById('noteInput').value.trim()
  const cellId = 'c-' + currentNoteKey.slice(5)   // 'note-odd-0-2' → 'c-odd-0-2'
  if (val) localStorage.setItem(currentNoteKey, val)
  else localStorage.removeItem(currentNoteKey)
  document.getElementById(cellId)?.classList.toggle('has-note', !!val)
  closeNoteModal()
}

function clearNote() {
  if (!currentNoteKey) return
  localStorage.removeItem(currentNoteKey)
  const cellId = 'c-' + currentNoteKey.slice(5)
  document.getElementById(cellId)?.classList.remove('has-note')
  closeNoteModal()
}

// ── Journal ────────────────────────────────────────────────────
function loadJournal() { return localStorage.getItem('journal-v1') || '' }
function saveJournal(text) { localStorage.setItem('journal-v1', text) }

let journalDebounce = null
function initJournal() {
  const ta = document.getElementById('journalText')
  if (!ta) return
  ta.value = loadJournal()
  ta.addEventListener('input', () => {
    clearTimeout(journalDebounce)
    journalDebounce = setTimeout(() => saveJournal(ta.value), 500)
  })
}

// ── Announcements ──────────────────────────────────────────────
let ANNCS = []

function loadAnncsSeen() { return new Set(JSON.parse(localStorage.getItem('anncs-seen') || '[]')) }
function markAnncsSeen(ids) {
  const seen = loadAnncsSeen()
  ids.forEach(id => seen.add(id))
  localStorage.setItem('anncs-seen', JSON.stringify([...seen]))
}

function renderAnncs() {
  const container = document.getElementById('anncsList')
  if (!container) return
  const sorted = [...ANNCS].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  if (!sorted.length) {
    container.innerHTML = '<p class="anncs-empty">No announcements.</p>'
    return
  }
  container.innerHTML = sorted.map(a => {
    const date = a.createdAt ? new Date(a.createdAt).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' }) : ''
    const body = a.body ? `<div class="anncs-card-text">${a.body.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>` : ''
    return `<div class="anncs-card">
      <div class="anncs-card-hd">
        <span class="anncs-cat-pill ${a.category}">${a.category.toUpperCase()}</span>
        <span class="anncs-card-title">${a.title.replace(/</g,'&lt;')}</span>
      </div>
      ${body}
      <div class="anncs-card-meta">${date}</div>
    </div>`
  }).join('')
}

let toastQueue = []
let toastBusy  = false

function showAnncToast(annc) {
  toastQueue.push(annc)
  if (!toastBusy) drainToastQueue()
}

function drainToastQueue() {
  if (!toastQueue.length) { toastBusy = false; return }
  toastBusy = true
  const annc = toastQueue.shift()
  const el   = document.getElementById('anncToast')
  const cat  = document.getElementById('anncToastCat')
  const ttl  = document.getElementById('anncToastTitle')
  if (!el) { drainToastQueue(); return }
  cat.textContent  = annc.category.toUpperCase()
  cat.className    = `annc-toast-cat ${annc.category}`
  ttl.textContent  = annc.title
  markAnncsSeen([annc.id])
  el.style.display = 'flex'
  el.classList.add('visible')
  clearTimeout(toastAutoHide)
  toastAutoHide = setTimeout(() => dismissAnncToast(), 6000)
}

let toastAutoHide = null
function dismissAnncToast() {
  const el = document.getElementById('anncToast')
  if (!el) return
  el.classList.remove('visible')
  setTimeout(() => {
    el.style.display = 'none'
    setTimeout(drainToastQueue, 200)
  }, 300)
}

function checkNewAnncs(list) {
  const seen = loadAnncsSeen()
  list.filter(a => a.id && !seen.has(a.id)).forEach(showAnncToast)
}

// ── Bottom panel layout ────────────────────────────────────────
let bottomLayout = localStorage.getItem('bottom-layout') || 'split'
let activeBottomPane = 'journal'

function setBottomLayout(mode) {
  bottomLayout = mode
  localStorage.setItem('bottom-layout', mode)
  const panel  = document.getElementById('bottomPanel')
  const toggle = document.getElementById('bottomPaneToggle')
  if (!panel) return
  panel.classList.toggle('split-mode', mode === 'split')
  panel.classList.toggle('single-mode', mode === 'single')
  if (toggle) toggle.style.display = mode === 'single' ? '' : 'none'
  const splitBtn  = document.getElementById('btnLayoutSplit')
  const singleBtn = document.getElementById('btnLayoutSingle')
  if (splitBtn)  { splitBtn.setAttribute('aria-pressed',  String(mode === 'split'));  splitBtn.classList.toggle('active', mode === 'split') }
  if (singleBtn) { singleBtn.setAttribute('aria-pressed', String(mode === 'single')); singleBtn.classList.toggle('active', mode === 'single') }
  movePill('pillLayout', document.getElementById(mode === 'split' ? 'btnLayoutSplit' : 'btnLayoutSingle'))
  if (mode === 'single') setBottomPane(activeBottomPane)
  else {
    document.getElementById('journalPane')?.classList.remove('hidden')
    document.getElementById('anncsPane')?.classList.remove('hidden')
  }
}

function setBottomPane(pane) {
  activeBottomPane = pane
  document.getElementById('journalPane')?.classList.toggle('hidden', pane !== 'journal')
  document.getElementById('anncsPane')?.classList.toggle('hidden', pane !== 'anncs')
  const jBtn = document.getElementById('btnPaneJournal')
  const aBtn = document.getElementById('btnPaneAnncs')
  if (jBtn) { jBtn.setAttribute('aria-pressed', String(pane === 'journal')); jBtn.classList.toggle('active', pane === 'journal') }
  if (aBtn) { aBtn.setAttribute('aria-pressed', String(pane === 'anncs'));   aBtn.classList.toggle('active', pane === 'anncs') }
  movePill('pillBottomPane', document.getElementById(pane === 'journal' ? 'btnPaneJournal' : 'btnPaneAnncs'))
}

// ── B10: PWA install prompt ────────────────────────────────────
function updateInstallBtn() {
  const btn = document.getElementById('installBtn')
  if (btn) btn.style.display = deferredInstallPrompt ? '' : 'none'
}

// ── URL hash sync ──────────────────────────────────────────────
function updateHash() {
  const params = new URLSearchParams()
  const code = encodeTheme(currentTheme)
  if (code) params.set('c', code)
  if (week !== calcWeek()) params.set('w', week)
  const str = params.toString()
  history.replaceState(null, '', str ? '#' + str : location.pathname + location.search)
}

function loadFromHash() {
  const params = new URLSearchParams(location.hash.slice(1))
  const cParam = params.get('c')
  if (cParam) {
    currentTheme = decodeTheme(cParam)
    localStorage.setItem('theme', cParam)
  } else {
    const stored = localStorage.getItem('theme')
    if (stored) currentTheme = decodeTheme(stored)
  }
  const wParam = params.get('w')
  week = (wParam === 'odd' || wParam === 'even') ? wParam : calcWeek()
}

// ── Helpers ────────────────────────────────────────────────────
function fmtMins(m) {
  const h   = Math.floor(m / 60)
  const min = m % 60
  return `${h}:${String(min).padStart(2, '0')}`
}

// ── Table builder ──────────────────────────────────────────────
function buildTable(wk) {
  let html = `<table id="tbl${wk}" class="tt-table hidden"><thead><tr><th class="th-day"></th>`

  ALL_MINS.forEach(m => {
    const start = fmtMins(m)
    const end   = fmtMins(m + 20)
    html += `<th class="th-time">${start}<br>${end}</th>`
  })

  html += '</tr></thead><tbody>'

  TIMETABLE[wk].forEach((blocks, di) => {
    const isToday = (di + 1) === getEffectiveDow()
    html += `<tr${isToday ? ' class="today-row"' : ''}>`
    html += `<td class="td-day" title="Tap to mark absent">${DAY_LABELS[di]}</td>`

    let rem = N_COLS
    blocks.forEach((b, bi) => {
      if (rem <= 0) return
      const sp     = Math.min(b.span, rem)
      rem -= sp
      const inner  = ABBREV[b.style] ?? ''
      const isReal = b.style !== 'empty' && b.style !== 'brk'
      const durMins = b.span * 20
      const durStr  = isReal
        ? (durMins >= 60
            ? `${Math.floor(durMins / 60)} HR${durMins % 60 ? ' ' + durMins % 60 + ' MIN' : ''}`
            : `${durMins} MIN`)
        : ''
      const noteKey   = `note-${wk}-${di}-${bi}`
      const noteClass = localStorage.getItem(noteKey) ? ' has-note' : ''
      html += `<td colspan="${sp}"><div class="cell ${b.style}${noteClass}" id="c-${wk}-${di}-${bi}"><span class="subj">${inner}</span>${durStr ? `<span class="dur">${durStr}</span>` : ''}${isReal ? '<div class="period-bar"></div>' : ''}</div></td>`
    })

    html += '</tr>'
  })

  html += '</tbody></table>'
  return html
}

function showActive() {
  ;['odd', 'even'].forEach(w => {
    const t = document.getElementById('tbl' + w)
    if (t) t.classList.toggle('hidden', w !== week)
  })
}

function rebuild() {
  wrap.querySelectorAll('table').forEach(t => t.remove())
  wrap.insertAdjacentHTML('afterbegin', buildTable('odd') + buildTable('even'))
  showActive()
  applyAbsentDays()
  updateBringBar()
  tick()
}

// ── Week toggle ────────────────────────────────────────────────
function movePill(pillId, btnEl) {
  const p = document.getElementById(pillId)
  if (!p || !btnEl) return
  p.style.left  = btnEl.offsetLeft + 'px'
  p.style.width = btnEl.offsetWidth + 'px'
}

function setWeek(w) {
  week = w
  const oddBtn  = document.getElementById('btnOdd')
  const evenBtn = document.getElementById('btnEven')
  oddBtn.classList.toggle('active',    w === 'odd')
  evenBtn.classList.toggle('active',   w === 'even')
  oddBtn.setAttribute('aria-pressed',  String(w === 'odd'))
  evenBtn.setAttribute('aria-pressed', String(w === 'even'))
  movePill('pillWeek', document.getElementById(w === 'odd' ? 'btnOdd' : 'btnEven'))
  showActive()
  updateBringBar()
  tick()
  scrollToNow()
  updateHash()
  scheduleClassNotifs()
}

window.setWeek = setWeek

// ── Time logic ─────────────────────────────────────────────────
function nowMins() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function colPositions() {
  const tbl = document.getElementById('tbl' + week)
  if (!tbl) return null
  const ths = tbl.querySelectorAll('thead th')
  const wr  = wrap.getBoundingClientRect()
  const cols = []

  for (let i = 1; i < ths.length; i++) {
    const r = ths[i].getBoundingClientRect()
    cols.push({
      l: r.left  - wr.left + wrap.scrollLeft,
      r: r.right - wr.left + wrap.scrollLeft,
      s: ALL_MINS[i - 1],
      e: i < ths.length - 1 ? ALL_MINS[i] : END_MIN
    })
  }
  return cols
}

function tick() {
  const nm           = getEffectiveMins()
  const nowBar       = document.getElementById('nowBar')
  const nowSubj      = document.getElementById('nowSubj')
  const nowCountdown = document.getElementById('nowCountdown')
  const nextBar      = document.getElementById('nextBar')
  const nextSubj     = document.getElementById('nextSubj')
  const nextTime     = document.getElementById('nextTime')

  const weekday = getEffectiveDow() >= 1 && getEffectiveDow() <= 5
  const inHours = nm >= ALL_MINS[0] && nm <= END_MIN

  document.querySelectorAll('.cell.now').forEach(c => c.classList.remove('now'))
  document.querySelectorAll('.period-bar').forEach(b => { b.style.width = '0' })

  const upcomingBar = document.getElementById('upcomingBar')

  const todayHol = !demoMode ? isHoliday(new Date()) : null

  if (!weekday || !inHours || todayHol) {
    tl.style.display     = 'none'
    nowBar.style.display = 'none'
    if (nextBar) nextBar.style.display = 'none'

    if (upcomingBar) {
      const dow = getEffectiveDow()
      const isBeforeSchool = !todayHol && dow >= 1 && dow <= 5 && nm < ALL_MINS[0]

      if (todayHol) {
        const nextDay  = getNextSchoolDay()
        const endDate  = new Date(todayHol.end)
        endDate.setDate(endDate.getDate() + 1) // day after last holiday day = first back
        const daysLeft = Math.max(0, Math.ceil((endDate - Date.now()) / 86_400_000))
        document.getElementById('upcomingLabel').textContent = todayHol.label
        document.getElementById('upcomingDay').textContent   =
          nextDay ? 'BACK ' + DAY_LABELS[nextDay.getDay() - 1].toUpperCase() : '—'
        const detail = document.getElementById('upcomingDetail')
        detail.textContent = daysLeft === 1 ? 'LAST DAY' : `${daysLeft} DAYS LEFT`
        detail.classList.remove('has-sw')
      } else if (isBeforeSchool) {
        const sched  = TIMETABLE[week][dow - 1]
        const first  = firstRealBlock(sched)
        const minsTo = first ? first.startMin - nm : null
        const hasSW  = sched.some(b => b.style === 'sw')
        const detail = document.getElementById('upcomingDetail')
        document.getElementById('upcomingLabel').textContent = 'TODAY'
        document.getElementById('upcomingDay').textContent   = DAY_LABELS[dow - 1].toUpperCase() + ' · ' + week.toUpperCase()
        detail.textContent = first
          ? first.block.label + ' · ' + fmtMins(first.startMin) + ' · in ' + minsTo + ' MIN' + (hasSW ? ' · ⚡ S&W' : '')
          : ''
        detail.classList.toggle('has-sw', hasSW)
      } else {
        const d = getNextSchoolDay()
        if (d) {
          const nextDow  = d.getDay()
          const nextWk   = weekForDate(d)
          const sched    = TIMETABLE[nextWk][nextDow - 1]
          const hasSW    = sched.some(b => b.style === 'sw')
          const subjList = [...new Set(
            sched.filter(b => b.style !== 'empty' && b.style !== 'brk').map(b => ABBREV[b.style])
          )]
          const detail = document.getElementById('upcomingDetail')
          document.getElementById('upcomingLabel').textContent = 'NEXT'
          document.getElementById('upcomingDay').textContent   = DAY_LABELS[nextDow - 1].toUpperCase() + ' · ' + nextWk.toUpperCase()
          detail.textContent = subjList.join(' · ') + (hasSW ? ' · ⚡ S&W' : '')
          detail.classList.toggle('has-sw', hasSW)
        }
      }
      upcomingBar.style.display = 'flex'
    }
    return
  }

  if (upcomingBar) upcomingBar.style.display = 'none'

  // Find current slot index
  let nowP = -1
  for (let i = 0; i < ALL_MINS.length; i++) {
    const e = i < ALL_MINS.length - 1 ? ALL_MINS[i + 1] : END_MIN
    if (nm >= ALL_MINS[i] && nm < e) { nowP = i; break }
  }

  const di  = getEffectiveDow() - 1
  const day = TIMETABLE[week]?.[di]

  if (day && nowP >= 0) {
    let pIdx        = 0
    let activeBlock = null
    let nextBlock   = null

    for (let bi = 0; bi < day.length; bi++) {
      const b         = day[bi]
      const startSlot = pIdx
      const endSlot   = pIdx + b.span

      if (nowP >= startSlot && nowP < endSlot) {
        activeBlock = { b, bi, startSlot, endSlot }
      } else if (activeBlock && !nextBlock && b.style !== 'empty' && b.style !== 'brk') {
        nextBlock = { b, startSlot }
      }
      pIdx += b.span
    }

    // Highlight active cell
    if (activeBlock && activeBlock.b.style !== 'empty' && activeBlock.b.style !== 'brk') {
      const cell = document.getElementById(`c-${week}-${di}-${activeBlock.bi}`)
      if (cell) cell.classList.add('now')
    }

    // Now bar — only during a real subject
    const isRealClass = activeBlock &&
      activeBlock.b.style !== 'empty' &&
      activeBlock.b.style !== 'brk' &&
      activeBlock.b.label !== '—'

    if (isRealClass) {
      const blockEndMin = activeBlock.endSlot < ALL_MINS.length
        ? ALL_MINS[activeBlock.endSlot]
        : END_MIN
      const minsLeft = blockEndMin - nm
      const blockStartMin = ALL_MINS[activeBlock.startSlot]
      const progress = Math.min(1, (nm - blockStartMin) / (blockEndMin - blockStartMin))
      document.querySelector(`#c-${week}-${di}-${activeBlock.bi} .period-bar`)
        ?.style.setProperty('width', `${progress * 100}%`)
      nowBar.style.display  = 'flex'
      nowSubj.textContent   = activeBlock.b.label
      if (nowCountdown) nowCountdown.textContent = (minsLeft < 1 ? '< 1' : minsLeft) + ' MIN'
      // B2: school-ends label
      const nowEndsEl = document.getElementById('nowEnds')
      if (nowEndsEl && day) {
        const ends = lastClassEndMin(day)
        nowEndsEl.textContent = ends ? 'ENDS ' + fmtMins(ends) : ''
      }
    } else {
      nowBar.style.display = 'none'
      const nowEndsEl = document.getElementById('nowEnds')
      if (nowEndsEl) nowEndsEl.textContent = ''
    }

    // Next bar — show whenever there's an upcoming class
    if (nextBlock && nextBar) {
      const startMin = nextBlock.startSlot < ALL_MINS.length
        ? ALL_MINS[nextBlock.startSlot]
        : null
      nextSubj.textContent  = nextBlock.b.label
      nextTime.textContent  = startMin !== null ? fmtMins(startMin) : ''
      nextBar.style.display = 'flex'
    } else if (nextBar) {
      nextBar.style.display = 'none'
    }

  } else {
    nowBar.style.display = 'none'
    if (nextBar) nextBar.style.display = 'none'
  }

  // Position the time line
  const cols = colPositions()
  if (!cols) { tl.style.display = 'none'; return }

  let xPos = null
  for (const c of cols) {
    if (nm >= c.s && nm < c.e) {
      xPos = c.l + (nm - c.s) / (c.e - c.s) * (c.r - c.l)
      break
    }
  }
  if (xPos === null && nm >= cols[cols.length - 1].s) xPos = cols[cols.length - 1].r

  const tbl = document.getElementById('tbl' + week)
  if (xPos !== null && tbl) {
    const thead    = tbl.querySelector('thead')
    const todayRow = tbl.querySelector('tr.today-row')
    const wr       = wrap.getBoundingClientRect()

    if (todayRow) {
      const top = thead.getBoundingClientRect().bottom - wr.top + wrap.scrollTop
      const h   = todayRow.getBoundingClientRect().bottom - thead.getBoundingClientRect().bottom
      tl.style.display = 'block'
      tl.style.left    = xPos + 'px'
      tl.style.top     = top  + 'px'
      tl.style.height  = Math.max(h, 0) + 'px'
    } else {
      tl.style.display = 'none'
    }
  } else {
    tl.style.display = 'none'
  }
}

// ── Settings panel ─────────────────────────────────────────────
function buildSettingsPanel() {
  // Colour grid
  const grid = document.getElementById('themeGrid')
  if (grid) {
    const full = { ...THEME_VARS, ...currentTheme }
    grid.innerHTML = Object.entries(THEME_VARS).map(([k]) => `
      <label class="theme-row">
        <span class="theme-var-name">${THEME_LABELS[k] || k}</span>
        <input type="color" class="theme-color-input" data-key="${k}" value="${full[k]}">
      </label>
    `).join('')
    grid.querySelectorAll('input[type=color]').forEach(inp => {
      inp.addEventListener('input', e => {
        currentTheme[e.target.dataset.key] = e.target.value
        applyTheme(currentTheme)
        const code = encodeTheme(currentTheme)
        if (code) localStorage.setItem('theme', code)
        else localStorage.removeItem('theme')
      })
    })
  }

  // Sync demo UI to current state
  const toggle = document.getElementById('demoToggle')
  if (toggle) {
    toggle.checked = demoMode
    const ctrl = document.getElementById('demoControls')
    if (ctrl) ctrl.style.display = demoMode ? 'block' : 'none'
    updateDemoChips()
  }

  applyCompact()
  updateNotifBtns()
  buildStats()
  setBottomLayout(bottomLayout)
  updateInstallBtn()
}

function openTheme() {
  buildSettingsPanel()
  document.getElementById('themePanel').classList.add('open')
  document.getElementById('themeOverlay').classList.add('open')
}

function closeTheme() {
  document.getElementById('themePanel').classList.remove('open')
  document.getElementById('themeOverlay').classList.remove('open')
  updateHash()
}

document.getElementById('btnTheme').addEventListener('click', openTheme)
document.getElementById('themeClose').addEventListener('click', closeTheme)
document.getElementById('themeOverlay').addEventListener('click', closeTheme)

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (e.key === 'Escape') {
    if (document.getElementById('noteModal').style.display !== 'none') { closeNoteModal(); return }
    closeTheme()
    return
  }
  if (document.getElementById('noteModal').style.display !== 'none') return
  if (document.getElementById('themePanel').classList.contains('open')) return
  // B13: keyboard shortcuts — left/right = switch week, s = settings
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setWeek(week === 'odd' ? 'even' : 'odd')
  else if (e.key === 's' || e.key === 'S') openTheme()
})

document.getElementById('themeCopyLink').addEventListener('click', () => {
  updateHash()
  const btn = document.getElementById('themeCopyLink')
  navigator.clipboard.writeText(location.href).then(() => {
    btn.textContent = 'COPIED!'
    btn.classList.add('confirm')
    setTimeout(() => { btn.textContent = 'COPY LINK'; btn.classList.remove('confirm') }, 2000)
  }).catch(() => {
    btn.textContent = 'SEE URL BAR'
    setTimeout(() => { btn.textContent = 'COPY LINK' }, 3000)
  })
})

document.getElementById('themeReset').addEventListener('click', () => {
  currentTheme = {}
  applyTheme({})
  localStorage.removeItem('theme')
  buildSettingsPanel()
  updateHash()
})

// ── Demo mode ──────────────────────────────────────────────────
function updateDemoBanner() {
  const banner = document.getElementById('demoBanner')
  const info   = document.getElementById('demoBannerInfo')
  if (!banner) return
  if (!demoMode) { banner.style.display = 'none'; return }
  const dayLabel = ['MON','TUE','WED','THU','FRI'][demoDay - 1] || '?'
  info.textContent = `${week.toUpperCase()} · ${dayLabel} · ${fmtMins(demoMins)}`
  banner.style.display = 'flex'
}

function updateDemoChips() {
  document.querySelectorAll('#demoWeekBtns .demo-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.week === week)
  })
  document.querySelectorAll('#demoDayBtns .demo-chip').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.day) === demoDay)
  })
  const h   = Math.floor(demoMins / 60)
  const m   = demoMins % 60
  const inp = document.getElementById('demoTime')
  if (inp) inp.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Demo toggle on/off
document.getElementById('demoToggle').addEventListener('change', e => {
  demoMode = e.target.checked
  const ctrl = document.getElementById('demoControls')
  if (ctrl) ctrl.style.display = demoMode ? 'block' : 'none'
  if (!demoMode) {
    const auto = calcWeek()
    if (week !== auto) setWeek(auto)
  }
  updateDemoChips()
  rebuild()
  tick()
  updateDemoBanner()
})

// Week chips
document.getElementById('demoWeekBtns').addEventListener('click', e => {
  const btn = e.target.closest('.demo-chip[data-week]')
  if (!btn) return
  setWeek(btn.dataset.week)
  updateDemoChips()
  updateDemoBanner()
})

// Day chips
document.getElementById('demoDayBtns').addEventListener('click', e => {
  const btn = e.target.closest('.demo-chip[data-day]')
  if (!btn) return
  demoDay = parseInt(btn.dataset.day)
  updateDemoChips()
  rebuild()
  tick()
  updateDemoBanner()
  updateBringBar()
})

// Time input
document.getElementById('demoTime').addEventListener('input', e => {
  const [h, m] = e.target.value.split(':').map(Number)
  if (!isNaN(h) && !isNaN(m)) {
    demoMins = h * 60 + m
    tick()
    updateDemoBanner()
  }
})

// ── Compact mode ───────────────────────────────────────────────
function applyCompact() {
  document.body.classList.toggle('compact', compact)
  const t = document.getElementById('compactToggle')
  if (t) t.checked = compact
}

document.getElementById('compactToggle')?.addEventListener('change', e => {
  compact = e.target.checked
  if (compact) localStorage.setItem('compact', '1')
  else localStorage.removeItem('compact')
  applyCompact()
})

// ── Notifications ──────────────────────────────────────────────
function clearClassNotifs() {
  classNotifTimeouts.forEach(clearTimeout)
  classNotifTimeouts = []
}

function scheduleClassNotifs() {
  clearClassNotifs()
  if (!classNotifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
  if (demoMode) return
  const dow = todayDow
  if (dow < 1 || dow > 5) return
  const nm    = nowMins()
  const sched = TIMETABLE[week][dow - 1]
  let min = ALL_MINS[0]
  for (const b of sched) {
    if (b.style !== 'empty' && b.style !== 'brk') {
      const target = min - 5
      if (target > nm) {
        const delay    = (target - nm) * 60_000
        const label    = b.label
        const startStr = fmtMins(min)
        classNotifTimeouts.push(setTimeout(() => {
          new Notification(`${label} in 5 min`, {
            body: `S2-05 · starts at ${startStr}`,
            icon: './icon.svg',
            tag:  `class-${min}`
          })
        }, delay))
      }
    }
    min += b.span * 20
  }
}

function clearEveNotif() {
  if (eveNotifTimeout) { clearTimeout(eveNotifTimeout); eveNotifTimeout = null }
}

function scheduleEveNotif() {
  clearEveNotif()
  if (!eveNotifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
  const nm    = nowMins()
  const delay = eveNotifMins > nm
    ? (eveNotifMins - nm) * 60_000
    : (24 * 60 - nm + eveNotifMins) * 60_000
  eveNotifTimeout = setTimeout(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDow = tomorrow.getDay()
    const nextWk  = weekForDate(tomorrow)
    const sched   = TIMETABLE[nextWk][nextDow - 1]
    const subjects = [...new Set(sched.filter(b => b.style !== 'empty' && b.style !== 'brk').map(b => b.label))]
    const hasSW   = sched.some(b => b.style === 'sw')
    const body    = subjects.join(' · ') + (hasSW ? '\n⚡ S&W — bring PE kit!' : '')
    new Notification(`Tomorrow: ${DAY_LABELS[nextDow - 1].toUpperCase()} · ${nextWk.toUpperCase()}`, {
      body, icon: './icon.svg', tag: 'eve-reminder'
    })
    scheduleEveNotif()
  }, delay)
}

function updateNotifBtns() {
  const classBtn  = document.getElementById('notifClassBtn')
  const eveBtn    = document.getElementById('notifEveBtn')
  const timeRow   = document.getElementById('notifTimeRow')
  const timeInp   = document.getElementById('notifTime')
  const supported = 'Notification' in window
  const denied    = supported && Notification.permission === 'denied'

  if (classBtn) {
    classBtn.disabled    = !supported || denied
    classBtn.textContent = !supported ? 'N/A' : denied ? 'BLOCKED' : classNotifEnabled ? 'DISABLE' : 'ENABLE'
    classBtn.classList.toggle('confirm', classNotifEnabled)
  }
  if (eveBtn) {
    eveBtn.disabled    = !supported || denied
    eveBtn.textContent = !supported ? 'N/A' : denied ? 'BLOCKED' : eveNotifEnabled ? 'DISABLE' : 'ENABLE'
    eveBtn.classList.toggle('confirm', eveNotifEnabled)
  }
  if (timeRow) timeRow.style.display = eveNotifEnabled ? 'flex' : 'none'
  if (timeInp) {
    const h = Math.floor(eveNotifMins / 60)
    const m = eveNotifMins % 60
    timeInp.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
}

document.getElementById('notifClassBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window)) return
  if (classNotifEnabled) {
    classNotifEnabled = false
    localStorage.removeItem('classNotif')
    clearClassNotifs()
  } else {
    const perm = await Notification.requestPermission()
    classNotifEnabled = perm === 'granted'
    if (classNotifEnabled) { localStorage.setItem('classNotif', '1'); scheduleClassNotifs() }
  }
  updateNotifBtns()
})

document.getElementById('notifEveBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window)) return
  if (eveNotifEnabled) {
    eveNotifEnabled = false
    localStorage.removeItem('eveNotif')
    clearEveNotif()
  } else {
    const perm = await Notification.requestPermission()
    eveNotifEnabled = perm === 'granted'
    if (eveNotifEnabled) { localStorage.setItem('eveNotif', '1'); scheduleEveNotif() }
  }
  updateNotifBtns()
})

document.getElementById('notifTime')?.addEventListener('input', e => {
  const [h, m] = e.target.value.split(':').map(Number)
  if (!isNaN(h) && !isNaN(m)) {
    eveNotifMins = h * 60 + m
    localStorage.setItem('eveNotifTime', String(eveNotifMins))
    if (eveNotifEnabled) scheduleEveNotif()
  }
})

// ── Init ───────────────────────────────────────────────────────
setTimeout(async () => {
  loadFromHash()
  applyTheme(currentTheme)
  applyCompact()

  const tw = calcTermWeek()
  const termPillEl = document.getElementById('termPill')
  if (termPillEl) termPillEl.textContent = tw ? `T${tw.term} W${tw.week}` : ''

  const bp = calcDaysToBreak()
  const breakPillEl = document.getElementById('breakPill')
  if (breakPillEl && bp && bp.days > 0 && bp.days <= 30) {
    breakPillEl.textContent = `${bp.days}D TO BREAK`
    breakPillEl.style.display = ''
  }

  classNotifEnabled = !!localStorage.getItem('classNotif') && 'Notification' in window && Notification.permission === 'granted'
  eveNotifEnabled   = !!localStorage.getItem('eveNotif')   && 'Notification' in window && Notification.permission === 'granted'
  const storedEve   = parseInt(localStorage.getItem('eveNotifTime') || '')
  if (!isNaN(storedEve)) eveNotifMins = storedEve
  if (classNotifEnabled) scheduleClassNotifs()
  if (eveNotifEnabled)   scheduleEveNotif()

  const activeBtn   = document.getElementById(week === 'odd' ? 'btnOdd' : 'btnEven')
  const inactiveBtn = document.getElementById(week === 'odd' ? 'btnEven' : 'btnOdd')
  activeBtn.classList.add('active')
  activeBtn.setAttribute('aria-pressed', 'true')
  inactiveBtn.classList.remove('active')
  inactiveBtn.setAttribute('aria-pressed', 'false')
  movePill('pillWeek', activeBtn)

  // Render immediately with fallback (hardcoded) data
  rebuild()
  checkExams()

  // Fetch live data; re-render only when updatedAt changes
  let lastUpdatedAt = null
  async function refreshData() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      if (!res.ok) return
      const remote = await res.json()
      if (remote.updatedAt === lastUpdatedAt) return   // nothing changed
      lastUpdatedAt = remote.updatedAt
      if (remote.timetable) TIMETABLE = remote.timetable
      if (Array.isArray(remote.exams)) EXAMS = remote.exams
      if (Array.isArray(remote.announcements)) {
        checkNewAnncs(remote.announcements)
        ANNCS = remote.announcements
        renderAnncs()
      }
      rebuild()
      checkExams()
    } catch {
      // Offline or server unavailable — keep current data
    }
  }

  await refreshData()
  setInterval(refreshData, 10_000)              // poll every 10 s
  setTimeout(() => location.reload(), 3_600_000) // hard reload every hour

  scrollToNow()
  updateOnlineStatus()
  initJournal()
  renderAnncs()
  setBottomLayout(bottomLayout)
}, 50)

// ── B3: Touch swipe to switch week ────────────────────────────
wrap.addEventListener('touchstart', e => {
  touchStartX           = e.touches[0].clientX
  touchStartY           = e.touches[0].clientY
  touchStartScrollLeft  = wrap.scrollLeft
}, { passive: true })

wrap.addEventListener('touchend', e => {
  if (touchStartX === null) return
  const dx              = e.changedTouches[0].clientX - touchStartX
  const dy              = Math.abs(e.changedTouches[0].clientY - touchStartY)
  const didScroll       = Math.abs(wrap.scrollLeft - touchStartScrollLeft) > 8
  if (!didScroll && Math.abs(dx) > 55 && Math.abs(dx) > dy * 2) setWeek(week === 'odd' ? 'even' : 'odd')
  touchStartX = null
}, { passive: true })

// ── B7: Note & B15: Absent day — wrap click delegation ────────
wrap.addEventListener('click', e => {
  const dayTd = e.target.closest('.td-day')
  if (dayTd) {
    const row   = dayTd.closest('tr')
    const tbody = row.closest('tbody')
    if (!tbody) return
    const di = Array.from(tbody.querySelectorAll('tr')).indexOf(row)
    if (absentDays.has(di)) absentDays.delete(di)
    else absentDays.add(di)
    localStorage.setItem('absentDays', JSON.stringify([...absentDays]))
    applyAbsentDays()
    return
  }
  const cell = e.target.closest('.cell:not(.empty):not(.brk)')
  if (!cell || !cell.id.startsWith('c-')) return
  openNoteModal(cell.id)
})

// ── Announcement toast close ───────────────────────────────────
document.getElementById('anncToastClose')?.addEventListener('click', dismissAnncToast)

// ── B7: Note modal buttons ─────────────────────────────────────
document.getElementById('noteSave')?.addEventListener('click', saveNote)
document.getElementById('noteClear')?.addEventListener('click', clearNote)
document.getElementById('noteModalClose')?.addEventListener('click', closeNoteModal)
document.getElementById('noteOverlay')?.addEventListener('click', closeNoteModal)
document.getElementById('noteInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveNote()
  if (e.key === 'Escape') closeNoteModal()
})

// ── B9: Print ──────────────────────────────────────────────────
document.getElementById('printBtn')?.addEventListener('click', () => {
  closeTheme()
  setTimeout(() => window.print(), 300)
})

// ── B10: PWA install ───────────────────────────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  deferredInstallPrompt = e
  updateInstallBtn()
})

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  const { outcome } = await deferredInstallPrompt.userChoice
  if (outcome === 'accepted') deferredInstallPrompt = null
  updateInstallBtn()
})

// ── B12: Online/offline ────────────────────────────────────────
window.addEventListener('online',  updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

setInterval(tick, 60_000)
wrap.addEventListener('scroll', tick)

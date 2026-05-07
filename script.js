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

const TIMETABLE = {
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
    html += `<td class="td-day">${DAY_LABELS[di]}</td>`

    let rem = N_COLS
    blocks.forEach((b, bi) => {
      if (rem <= 0) return
      const sp = Math.min(b.span, rem)
      rem -= sp
      const inner = ABBREV[b.style] ?? ''
      html += `<td colspan="${sp}"><div class="cell ${b.style}" id="c-${wk}-${di}-${bi}"><span class="subj">${inner}</span></div></td>`
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
  tick()
  updateHash()
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

  if (!weekday || !inHours) {
    tl.style.display     = 'none'
    nowBar.style.display = 'none'
    if (nextBar) nextBar.style.display = 'none'
    return
  }

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
      nowBar.style.display  = 'flex'
      nowSubj.textContent   = activeBlock.b.label
      if (nowCountdown) nowCountdown.textContent = (minsLeft < 1 ? '< 1' : minsLeft) + ' MIN'
    } else {
      nowBar.style.display = 'none'
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
  if (e.key === 'Escape') closeTheme()
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

// ── Init ───────────────────────────────────────────────────────
setTimeout(() => {
  loadFromHash()
  applyTheme(currentTheme)

  const activeBtn   = document.getElementById(week === 'odd' ? 'btnOdd' : 'btnEven')
  const inactiveBtn = document.getElementById(week === 'odd' ? 'btnEven' : 'btnOdd')
  activeBtn.classList.add('active')
  activeBtn.setAttribute('aria-pressed', 'true')
  inactiveBtn.classList.remove('active')
  inactiveBtn.setAttribute('aria-pressed', 'false')
  movePill('pillWeek', activeBtn)

  rebuild()
}, 50)

setInterval(tick, 60_000)
wrap.addEventListener('scroll', tick)

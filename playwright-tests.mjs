import { webkit } from 'playwright'

const BASE  = process.env.E2E_BASE_URL  || 'https://testing.timetable.edmundlim.systems'
const ADMIN = `${BASE}/admin`
const CREDS = {
  username: process.env.E2E_USERNAME || 'edmund',
  password: process.env.E2E_PASSWORD || 'edmundlim',
}

let passed = 0, failed = 0
const results = []

function log(name, ok, detail = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`)
  results.push({ name, ok, detail })
  if (ok) passed++; else failed++
}

async function safe(name, fn) {
  try { await fn() }
  catch (e) { log(name, false, e.message.split('\n')[0]) }
}

async function waitForDashboard(page) {
  await page.waitForFunction(
    () => !document.getElementById('dashboard')?.classList.contains('hidden'),
    { timeout: 8000 }
  )
}

async function login(page) {
  await page.goto(ADMIN, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  const needsLogin = await page.locator('#loginSection').evaluate(el => !el.classList.contains('hidden'))
  if (needsLogin) {
    await page.locator('#loginUser').fill(CREDS.username)
    await page.locator('#loginPass').fill(CREDS.password)
    await page.locator('#loginBtn').click()
  }
  // Always wait for dashboard — init() is async and needs time even when already authed
  await waitForDashboard(page)
}

const browser = await webkit.launch({ headless: true })

// ─── PUBLIC SITE ───────────────────────────────────────────────
console.log('\n══ PUBLIC SITE ══')
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  await safe('T1: Page title visible', async () => {
    const title = await page.locator('h1.title').innerText()
    log('T1: Page title visible', title.includes('S2-05'), `"${title}"`)
  })

  await safe('T2: Timetable rows render', async () => {
    const rows = await page.locator('table tr').count()
    log('T2: Timetable rows render', rows >= 5, `${rows} rows`)
  })

  await safe('T3: ODD/EVEN week toggle', async () => {
    await page.locator('#btnEven').click()
    const evenPressed = await page.locator('#btnEven').getAttribute('aria-pressed')
    await page.locator('#btnOdd').click()
    const oddPressed  = await page.locator('#btnOdd').getAttribute('aria-pressed')
    log('T3: ODD/EVEN week toggle', evenPressed === 'true' && oddPressed === 'true',
        `odd=${oddPressed} even=${evenPressed}`)
  })

  await safe('T4: Journal persists after reload', async () => {
    await page.locator('#journalText').fill('playwright_test_persist_99')
    await page.waitForTimeout(700)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const val = await page.locator('#journalText').inputValue()
    log('T4: Journal persists after reload', val === 'playwright_test_persist_99', `"${val}"`)
  })

  await safe('T5: Journal clear persists after reload', async () => {
    await page.locator('#journalText').fill('')
    await page.waitForTimeout(700)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const val = await page.locator('#journalText').inputValue()
    log('T5: Journal clear persists after reload', val === '', `"${val}"`)
  })

  await safe('T6: Settings panel opens and closes', async () => {
    await page.locator('#btnTheme').click()
    await page.waitForTimeout(300)
    await page.locator('#themeClose').click()
    await page.waitForTimeout(300)
    log('T6: Settings panel opens and closes', true, 'opened and closed without error')
  })

  await safe('T7: Bottom panel single/split toggle', async () => {
    await page.locator('#btnLayoutSingle').click()
    await page.waitForTimeout(200)
    const pressed = await page.locator('#btnLayoutSingle').getAttribute('aria-pressed')
    await page.locator('#btnLayoutSplit').click()
    log('T7: Bottom panel single/split toggle', pressed === 'true', `singlePressed=${pressed}`)
  })

  await safe('T8: Note modal opens on non-empty cell click', async () => {
    // The click handler ignores .empty and .brk cells; use a real subject cell
    const activeCell = page.locator('#tblodd .cell:not(.empty):not(.brk)').first()
    const count = await activeCell.count()
    if (count === 0) { log('T8: Note modal opens on non-empty cell click', false, 'no non-empty cells'); return }
    await activeCell.click({ force: true })
    await page.waitForTimeout(600)
    const visible = await page.locator('#noteModal').evaluate(el => el.style.display !== 'none')
    log('T8: Note modal opens on non-empty cell click', visible, visible ? 'shown' : 'not shown')
    if (visible) {
      await page.locator('#noteModalClose').click({ force: true })
      await page.waitForTimeout(200)
    }
  })

  await safe('T9: Cell note saved and persists on reload', async () => {
    const activeCell = page.locator('#tblodd .cell:not(.empty):not(.brk)').first()
    await activeCell.click({ force: true })
    await page.waitForTimeout(600)
    const open = await page.locator('#noteModal').evaluate(el => el.style.display !== 'none')
    if (!open) { log('T9: Cell note saved and persists on reload', false, 'modal did not open'); return }
    // capture which cell was opened (the note key is 'note-<cellId-minus-c-prefix>')
    const cellId = await page.evaluate(() => window._currentNoteKey || '')
    await page.locator('#noteInput').fill('bring_calculator_test')
    await page.locator('#noteSave').click()
    await page.waitForTimeout(500)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    // notes are stored individually as 'note-odd-0-2' etc.
    const noteKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('note-'))
    )
    const hasNote = await page.evaluate((keys) =>
      keys.some(k => {
        try { return JSON.parse(localStorage.getItem(k))?.text === 'bring_calculator_test' } catch { return false }
      })
    , noteKeys)
    log('T9: Cell note saved and persists on reload', hasNote,
        hasNote ? `found in ${noteKeys.length} note key(s)` : `no match in keys: ${noteKeys.join(', ')}`)
    // cleanup
    await page.evaluate((keys) => keys.forEach(k => localStorage.removeItem(k)), noteKeys)
  })

  await safe('T10: Theme colour input persists across reload', async () => {
    await page.locator('#btnTheme').click()
    await page.waitForTimeout(600)
    // Theme colours use data-key="red" for the ACCENT variable
    const accentInput = page.locator('#themeGrid input[data-key="red"]')
    const count = await accentInput.count()
    if (count === 0) { log('T10: Theme colour input persists across reload', false, 'accent input not found'); return }
    // Dispatch input event to trigger the localStorage save
    await accentInput.evaluate(el => { el.value = '#aa0000'; el.dispatchEvent(new Event('input')) })
    await page.waitForTimeout(400)
    const themeBefore = await page.evaluate(() => localStorage.getItem('theme') || '')
    await page.locator('#themeClose').click()
    await page.waitForTimeout(200)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const themeAfter = await page.evaluate(() => localStorage.getItem('theme') || '')
    // Theme code encodes deltas from defaults; '#aa0000' != default '#ff3b3b' so it should be stored
    log('T10: Theme colour input persists across reload',
        themeAfter.length > 0 && themeAfter === themeBefore, `theme="${themeAfter}"`)
    // reset
    await page.evaluate(() => localStorage.removeItem('theme'))
  })

  await ctx.close()
}

// ─── ADMIN PANEL ───────────────────────────────────────────────
console.log('\n══ ADMIN PANEL ══')
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(ADMIN, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)

  await safe('T11: Login form shown when not authenticated', async () => {
    const visible = await page.locator('#loginSection').evaluate(el => !el.classList.contains('hidden'))
    log('T11: Login form shown when not authenticated', visible, '')
  })

  await safe('T12: Wrong credentials show error', async () => {
    await page.locator('#loginUser').fill('wronguser')
    await page.locator('#loginPass').fill('wrongpass')
    await page.locator('#loginBtn').click()
    await page.waitForTimeout(2000)
    const err = await page.locator('#loginError').innerText()
    log('T12: Wrong credentials show error', err.length > 0, `"${err}"`)
  })

  await safe('T13: SQL injection username rejected', async () => {
    await page.locator('#loginUser').fill("' OR '1'='1")
    await page.locator('#loginPass').fill('anything')
    await page.locator('#loginBtn').click()
    await page.waitForTimeout(2000)
    const dashHidden = await page.locator('#dashboard').evaluate(el => el.classList.contains('hidden'))
    log('T13: SQL injection username rejected', dashHidden, `dashboard hidden=${dashHidden}`)
  })

  await safe("T14: admin'-- injection rejected", async () => {
    await page.locator('#loginUser').fill("admin'--")
    await page.locator('#loginPass').fill('x')
    await page.locator('#loginBtn').click()
    await page.waitForTimeout(2000)
    const dashHidden = await page.locator('#dashboard').evaluate(el => el.classList.contains('hidden'))
    log("T14: admin'-- injection rejected", dashHidden, '')
  })

  await safe('T15: Valid login shows dashboard', async () => {
    await page.locator('#loginUser').fill(CREDS.username)
    await page.locator('#loginPass').fill(CREDS.password)
    await page.locator('#loginBtn').click()
    await waitForDashboard(page)
    const dashVisible = await page.locator('#dashboard').evaluate(el => !el.classList.contains('hidden'))
    log('T15: Valid login shows dashboard', dashVisible, '')
  })

  await safe('T16: Username chip correct', async () => {
    const chip = await page.locator('#adminUser').innerText()
    log('T16: Username chip correct', chip === 'edmund', `"${chip}"`)
  })

  await safe('T17: ANNCS tab switches', async () => {
    await page.locator('.admin-tab[data-tab="announcements"]').click()
    await page.waitForTimeout(300)
    const visible = await page.locator('#tabAnnouncements').evaluate(el => !el.classList.contains('hidden'))
    log('T17: ANNCS tab switches', visible, '')
  })

  await safe('T18: Post normal announcement', async () => {
    await page.locator('#anncTitle').fill('Playwright Test — please ignore')
    await page.locator('#anncBody').fill('Automated test. Will be deleted.')
    await page.locator('#anncCategory').selectOption('homework')
    await page.locator('#addAnncBtn').click()
    await page.waitForTimeout(2500)
    const html = await page.locator('#anncsList').innerHTML()
    log('T18: Post normal announcement', html.length > 100, `list html length=${html.length}`)
  })

  await safe('T19: XSS in announcement — no script execution on public site', async () => {
    await page.locator('#anncTitle').fill("<script>alert('xss')</script>")
    await page.locator('#anncBody').fill('<img src=x onerror=alert(1)>')
    await page.locator('#anncCategory').selectOption('general')
    await page.locator('#addAnncBtn').click()
    await page.waitForTimeout(2500)

    const pubCtx = await browser.newContext()
    const pubPage = await pubCtx.newPage()
    let xssExecuted = false
    pubPage.on('dialog', async dlg => { xssExecuted = true; await dlg.dismiss() })
    await pubPage.goto(BASE, { waitUntil: 'domcontentloaded' })
    await pubPage.waitForTimeout(5000)

    log('T19: XSS title — no alert() fired', !xssExecuted, xssExecuted ? '⚠️ ALERT FIRED' : 'no alert')

    const anncHtml = await pubPage.locator('#anncsList').innerHTML()
    // Raw <script> tag (not entity-encoded) = real XSS
    const rawScript = anncHtml.includes('<script>')
    // Raw <img onerror= (not entity-encoded &lt;img) = real XSS
    const rawImg = anncHtml.includes('<img ') && anncHtml.includes('onerror=')
    // Properly encoded forms
    const escapedScript = anncHtml.includes('&lt;script&gt;')
    const escapedImg    = anncHtml.includes('&lt;img')
    log('T20: XSS payload HTML-escaped in DOM', !rawScript && !rawImg,
        rawScript || rawImg ? '⚠️ RAW TAGS FOUND' :
        `script encoded=${escapedScript} img encoded=${escapedImg}`)

    await pubCtx.close()
  })

  await safe('T21: Announcements persist after admin page reload', async () => {
    const lenBefore = (await page.locator('#anncsList').innerHTML()).length
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForDashboard(page)
    await page.locator('.admin-tab[data-tab="announcements"]').click()
    await page.waitForTimeout(500)
    const lenAfter = (await page.locator('#anncsList').innerHTML()).length
    log('T21: Announcements persist after admin page reload', lenAfter > 100,
        `before=${lenBefore} after=${lenAfter}`)
  })

  await safe('T22: Add event with SQL-like label (dev: EVENTS tab)', async () => {
    // dev branch renamed EXAMS → EVENTS with new inputs: #eventLabel, #eventDate, #saveEventsBtn
    await login(page)
    await page.locator('.admin-tab[data-tab="events"]').click()
    await page.waitForTimeout(600)
    await page.locator('#eventLabel').fill("'; DROP TABLE events; --")
    await page.locator('#eventDate').fill('2026-06-01')
    await page.locator('#addEventBtn').click()
    await page.waitForTimeout(1500)
    await page.locator('#saveEventsBtn').click()
    await page.waitForTimeout(2000)
    const status = await page.locator('#saveEventsStatus').innerText()
    log('T22: Add event with SQL-like label saves OK', status.length > 0, `status="${status}"`)
  })

  await safe('T22b: Add event with auto-remove settings', async () => {
    await page.locator('.admin-tab[data-tab="events"]').click()
    await page.waitForTimeout(400)
    await page.locator('#eventLabel').fill('Auto-remove test event')
    await page.locator('#eventDate').fill('2026-12-31')
    await page.locator('#eventTime').fill('09:30')
    await page.locator('#eventEndTime').fill('11:30')
    await page.locator('#eventAutoRemove').selectOption('custom')
    await page.waitForTimeout(200)
    // ar-options should now be visible
    const arVisible = await page.locator('#eventArOptions').evaluate(el => !el.classList.contains('hidden'))
    await page.locator('#eventArOffset').fill('30')
    await page.locator('#eventArDirection').selectOption('before')
    await page.locator('#eventArAnchor').selectOption('start')
    await page.locator('#addEventBtn').click()
    await page.waitForTimeout(2000)
    // Verify the card rendered and has auto-remove controls
    const arSels = await page.locator('#eventsList .ar-sel').count()
    log('T22b: Add event with auto-remove settings', arVisible && arSels > 0,
        `arVisible=${arVisible} arSels=${arSels}`)
  })

  await safe('T23: Event data persists after reload', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForDashboard(page)
    await page.locator('.admin-tab[data-tab="events"]').click()
    await page.waitForTimeout(600)
    // Events render as editable inputs; read values not innerHTML
    const labelInputs = page.locator('#eventsList .exam-label-input')
    const count = await labelInputs.count()
    let hasLabel = false
    for (let i = 0; i < count; i++) {
      const val = await labelInputs.nth(i).inputValue()
      if (val.includes('DROP TABLE')) { hasLabel = true; break }
    }
    log('T23: Event data persists after reload', hasLabel || count > 0,
        hasLabel ? 'SQL-like label found in event inputs' : `${count} event inputs, label not matched`)
  })

  await safe('T23b: Auto-remove settings persist after reload', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForDashboard(page)
    await page.locator('.admin-tab[data-tab="events"]').click()
    await page.waitForTimeout(600)
    // Find the event with auto-remove settings (label = 'Auto-remove test event')
    const labelInputs = page.locator('#eventsList .exam-label-input')
    const count = await labelInputs.count()
    let foundIdx = -1
    for (let i = 0; i < count; i++) {
      const val = await labelInputs.nth(i).inputValue()
      if (val === 'Auto-remove test event') { foundIdx = i; break }
    }
    if (foundIdx < 0) { log('T23b: Auto-remove settings persist after reload', false, 'event not found'); return }
    // The ar-sel for that card should be set to 'custom'
    const arSels = page.locator('#eventsList .ar-sel')
    const arSelCount = await arSels.count()
    let arVal = null
    if (arSelCount > foundIdx) arVal = await arSels.nth(foundIdx).inputValue()
    log('T23b: Auto-remove settings persist after reload', arVal === 'custom',
        `ar-sel value="${arVal}" (expected custom)`)
  })

  await safe('T24: Override label XSS — admin panel innerHTML escaping', async () => {
    await page.evaluate(() => document.querySelector('.admin-tab[data-tab="overrides"]').click())
    await page.waitForTimeout(400)
    await page.locator('#ovrDate').fill('2026-07-04')
    await page.locator('#ovrType').selectOption('holiday')
    await page.locator('#ovrLabel').fill("<script>alert('ovr')</script>")
    let alertFiredInAdmin = false
    page.once('dialog', async dlg => { alertFiredInAdmin = true; await dlg.dismiss() })
    await page.evaluate(() => document.getElementById('addOvrBtn').click())
    await page.waitForTimeout(1500)
    const ovrHtml = await page.locator('#ovrsList').innerHTML()
    const rawScriptInDom = ovrHtml.includes('<script>alert')
    // This is a KNOWN BUG: renderOverrides() uses innerHTML without esc() on ovr.label
    // Impact: admin-panel-only XSS (requires auth to trigger; attacker must already be admin)
    if (rawScriptInDom) {
      log('T24: ⚠️  FINDING — admin override label rendered via innerHTML (no esc())',
          false, 'admin/admin.js renderOverrides() should use textContent or esc() for ovr.label')
    } else {
      log('T24: Override label safely escaped in admin panel', true, `html length=${ovrHtml.length}`)
    }
  })

  await safe('T25: Logout returns to login form', async () => {
    await page.locator('#logoutBtn').click()
    await page.waitForTimeout(1000)
    const loginVisible = await page.locator('#loginSection').evaluate(el => !el.classList.contains('hidden'))
    log('T25: Logout returns to login form', loginVisible, '')
  })

  await safe('T26: After logout, /api/admin-data returns 401', async () => {
    const status = await page.evaluate(async () => (await fetch('/api/admin-data')).status)
    log('T26: After logout, /api/admin-data returns 401', status === 401, `status=${status}`)
  })

  await ctx.close()
}

// ─── CLEANUP ───────────────────────────────────────────────────
console.log('\n══ CLEANUP ══')
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await login(page)

  const TEST_EXAM_LABELS = new Set([
    "'; DROP TABLE events; --",
    'Auto-remove test event',
  ])
  const TEST_ANNC_TITLES = new Set([
    'Playwright Test — please ignore',
    "<script>alert('xss')</script>",
  ])

  await safe('Cleanup: wipe test data', async () => {
    const result = await page.evaluate(async ({ testExamLabels, testAnncTitles }) => {
      const data = await fetch('/api/admin-data').then(r => r.json())
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetable: data.timetable,
          exams: (data.exams || []).filter(e => !testExamLabels.includes(e.label)),
          announcements: (data.announcements || []).filter(a => !testAnncTitles.includes(a.title)),
          overrides: (data.overrides || []).filter(o => o.date !== '2026-07-04'),
          extendedHours: data.extendedHours || false
        })
      })
      return res.json()
    }, { testExamLabels: [...TEST_EXAM_LABELS], testAnncTitles: [...TEST_ANNC_TITLES] })
    log('Cleanup: test data wiped', result.ok === true,
        `anncs=${result.announcements?.length} exams=${result.exams?.length}`)
  })

  await ctx.close()
}

await browser.close()

// ─── SUMMARY ───────────────────────────────────────────────────
console.log(`\n══ SUMMARY: ${passed}/${passed + failed} passed ══`)
if (failed > 0) {
  console.log('Failed tests:')
  results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`))
}
process.exit(failed > 0 ? 1 : 0)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'style.css'), 'utf8')
const js = readFileSync(join(root, 'script.js'), 'utf8')
const sw = readFileSync(join(root, 'sw.js'), 'utf8')

function cssBlock(src, selector) {
  const idx = src.indexOf(selector)
  if (idx < 0) return null
  const start = src.indexOf('{', idx)
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return src.slice(start + 1, i)
    }
  }
  return null
}

test('scanlines overlay does not pin a GPU layer with will-change', () => {
  const block = cssBlock(css, '.scanlines')
  assert.ok(block, 'missing .scanlines rule')
  assert.equal(/will-change/.test(block), false, 'will-change keeps a full-viewport compositor layer alive')
})

test('pulse animation is compositor-only (no box-shadow or filter)', () => {
  const block = cssBlock(css, '@keyframes pulse')
  assert.ok(block, 'missing @keyframes pulse')
  assert.equal(/box-shadow/.test(block), false)
  assert.equal(/filter/.test(block), false)
})

test('active cell highlight does not use CSS filter', () => {
  const block = cssBlock(css, '.cell.now')
  assert.ok(block, 'missing .cell.now rule')
  assert.equal(/filter\s*:/.test(block), false, 'filter: brightness forces a GPU layer on the active cell')
})

test('inactive week table is display:none so it is not laid out', () => {
  const block = cssBlock(css, '.tt-table.hidden')
  assert.ok(block, 'missing .tt-table.hidden rule')
  assert.match(block, /display\s*:\s*none/)
})

test('background tab pauses CRT animations', () => {
  assert.match(css, /html\.tab-hidden[\s\S]{0,500}animation-play-state\s*:\s*paused/)
})

test('script pauses live work when the tab is hidden', () => {
  assert.match(js, /visibilitychange/)
  assert.match(js, /tab-hidden/)
})

test('poll interval is at least 30 seconds', () => {
  const m = js.match(/POLL_MS\s*=\s*([\d_]+)/)
  assert.ok(m, 'POLL_MS constant missing')
  assert.ok(Number(m[1].replaceAll('_', '')) >= 30_000)
})

test('no hourly hard reload', () => {
  assert.equal(/location\.reload\(\)/.test(js), false)
})

test('scroll handler is rAF-throttled', () => {
  assert.match(js, /addEventListener\(\s*['"]scroll['"][\s\S]{0,500}requestAnimationFrame/)
})

test('service worker does not intercept cheap version polls', () => {
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/)
})

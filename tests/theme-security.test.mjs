import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8')
const themeVars = source.slice(source.indexOf('const THEME_VARS ='), source.indexOf('const THEME_LABELS ='))
const functions = source.slice(source.indexOf('function encodeTheme('), source.indexOf('// ── Week auto-detection'))
const context = vm.createContext({ atob, btoa })
vm.runInContext(themeVars + functions, context)
const decode = value => JSON.parse(JSON.stringify(context.decodeTheme(btoa(JSON.stringify(value)))))

test('theme links reject markup, CSS injection, unknown keys and non-objects', () => {
  for (const value of [null, [], 42, 'x', { bg: '\"><img src=x onerror=alert(1)>' }, { teal: '#000000;}body{display:none}' }, { bg: {} }, { evil: '#123456' }]) {
    assert.deepEqual(decode(value), {})
  }
  assert.deepEqual(decode({ bg: '#123456', teal: '#AbCdEf' }), { bg: '#123456', teal: '#AbCdEf' })
  assert.deepEqual(decode(JSON.parse('{"__proto__":{"bg":"bad"}}')), {})
})

test('theme settings assign values through DOM properties', () => {
  const settings = source.slice(source.indexOf('function buildSettingsPanel()'), source.indexOf('function openTheme()'))
  assert.doesNotMatch(settings, /innerHTML/)
  assert.match(settings, /input\.value = full\[key\]/)
})

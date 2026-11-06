/**
 * Settings resolve to usable values: the schema builds panel defaults, malformed
 * config falls back, numbers stay inside their bounds, and the browser half only
 * receives the fields it uses.
 * @module dsh-obsidian-vault/tests/pur-settings
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Config, DEFAULT_SETTINGS, clientSettings, resolveSettings } from '../src/settings.ts'

test('the schema parses an empty config into the defaults', () => {
  const parsed = Config({}) as Record<string, unknown>
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    assert.deepEqual(parsed[key], value, key)
  }
})

test('the schema accepts an override', () => {
  const parsed = Config({ runTimeoutMs: 320, showGrid: false }) as Record<string, unknown>
  assert.equal(parsed['runTimeoutMs'], 320)
  assert.equal(parsed['showGrid'], false)
  assert.equal(parsed['saveDelayMs'], DEFAULT_SETTINGS.saveDelayMs)
})

test('an absent config resolves entirely to defaults', () => {
  assert.deepEqual(resolveSettings(undefined), resolveSettings({}))
  assert.equal(resolveSettings(undefined).runTimeoutMs, DEFAULT_SETTINGS.runTimeoutMs)
})

test('numbers are clamped into their accepted ranges', () => {
  const settings = resolveSettings({ runTimeoutMs: 5, saveDelayMs: 99_999, maxDepth: -3, largeCanvasHintMb: 10_000 })
  assert.equal(settings.runTimeoutMs, 200)
  assert.equal(settings.saveDelayMs, 5000)
  assert.equal(settings.maxDepth, 1)
  assert.equal(settings.largeCanvasHintMb, 500)
})

test('malformed values fall back instead of leaking through', () => {
  const settings = resolveSettings({ runTimeoutMs: 'fast', ignore: 'nope', showGrid: 'yes', maxFileBytes: Number.NaN })
  assert.equal(settings.runTimeoutMs, DEFAULT_SETTINGS.runTimeoutMs)
  assert.deepEqual(settings.ignore, [...DEFAULT_SETTINGS.ignore])
  assert.equal(settings.showGrid, DEFAULT_SETTINGS.showGrid)
  assert.equal(settings.maxFileBytes, DEFAULT_SETTINGS.maxFileBytes)
})

test('an ignore list keeps only its string entries', () => {
  assert.deepEqual(resolveSettings({ ignore: ['.git', 3, null, 'node_modules'] }).ignore, ['.git', 'node_modules'])
})

test('booleans pass through', () => {
  const settings = resolveSettings({ allowCodeExecution: false, showGrid: false })
  assert.equal(settings.allowCodeExecution, false)
  assert.equal(settings.showGrid, false)
})

test('the client subset carries only what the canvas reads', () => {
  const dto = clientSettings(resolveSettings({ saveDelayMs: 900, largeCanvasHintMb: 8, showGrid: false, runTimeoutMs: 50 }))
  assert.deepEqual(dto, { runTimeoutMs: 200, saveDelayMs: 900, largeCanvasHintMb: 8, showGrid: false, allowCodeExecution: true, exportScale: 1, exportTransparent: true, exportJpgQuality: 0.9, gridOpacity: 1, snapEnabled: true, snapDistance: 8, autoPanMaxSpeed: 12, lineHitTolerance: 25 })
})

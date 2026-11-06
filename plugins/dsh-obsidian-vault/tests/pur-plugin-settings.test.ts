/**
 * The settings dialog's storage: only the fields it owns are accepted, saved values
 * override the loader config field by field, and a malformed file falls back to
 * the loader settings instead of failing.
 * @module dsh-obsidian-vault/tests/pur-plugin-settings
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  mergeSettings,
  readSettingsPatch,
  settingsDialogOf,
  settingsPatchOf,
  writeSettingsPatch,
} from '../src/vault/plugin-settings.ts'
import { DEFAULT_SETTINGS, resolveSettings } from '../src/settings.ts'

test('only the dialog fields survive a patch', () => {
  assert.deepEqual(settingsPatchOf({ runTimeoutMs: 900, vault: '/tmp/x', ignore: ['a'], showGrid: false, junk: 1 }), {
    vault: '/tmp/x',
    ignore: ['a'],
    runTimeoutMs: 900,
    showGrid: false,
  })
})

test('the vault and index fields validate their own types', () => {
  assert.deepEqual(settingsPatchOf({ vault: 3, ignore: ['a', 2], maxDepth: 'x', maxFileBytes: 1024 }), { ignore: ['a'], maxFileBytes: 1024 })
})

test('the dialog payload carries the vault and index fields', () => {
  const payload = settingsDialogOf(mergeSettings({}, { vault: '/vault', ignore: ['.git'], maxDepth: 4 }))
  assert.equal(payload.vault, '/vault')
  assert.deepEqual(payload.ignore, ['.git'])
  assert.equal(payload.maxDepth, 4)
  assert.equal(payload.defaults.maxFileBytes, DEFAULT_SETTINGS.maxFileBytes)
})

test('wrongly typed fields are dropped', () => {
  assert.deepEqual(settingsPatchOf({ runTimeoutMs: '900', showGrid: 'yes', saveDelayMs: Number.NaN }), {})
  assert.deepEqual(settingsPatchOf(null), {})
})

test('a patch overrides the loader config field by field', () => {
  const merged = mergeSettings({ runTimeoutMs: 1500, maxDepth: 3 }, { runTimeoutMs: 400, showGrid: false })
  assert.equal(merged.runTimeoutMs, 400)
  assert.equal(merged.showGrid, false)
  assert.equal(merged.maxDepth, 3)
})

test('an empty patch keeps the loader settings', () => {
  assert.equal(mergeSettings({ saveDelayMs: 700 }, {}).saveDelayMs, 700)
})

test('a saved patch round-trips through the file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pur-settings-'))
  try {
    const file = join(dir, 'nested', 'settings.json')
    await writeSettingsPatch(file, { runTimeoutMs: 640, allowCodeExecution: false })
    assert.deepEqual(await readSettingsPatch(file), { runTimeoutMs: 640, allowCodeExecution: false })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a missing or broken file reads as no overrides', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pur-settings-'))
  try {
    assert.deepEqual(await readSettingsPatch(join(dir, 'nope.json')), {})
    const broken = join(dir, 'broken.json')
    await writeFile(broken, '{not json', 'utf8')
    assert.deepEqual(await readSettingsPatch(broken), {})
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('the dialog payload carries effective values and defaults', () => {
  const payload = settingsDialogOf(mergeSettings({}, { runTimeoutMs: 800 }))
  assert.equal(payload.runTimeoutMs, 800)
  assert.equal(payload.defaults.runTimeoutMs, DEFAULT_SETTINGS.runTimeoutMs)
  assert.equal(payload.defaults.saveDelayMs, DEFAULT_SETTINGS.saveDelayMs)
})
test('export defaults are validated and clamped', () => {
  assert.equal(resolveSettings({ exportScale: 9 }).exportScale, 3)
  assert.equal(resolveSettings({ exportScale: 0 }).exportScale, 1)
  assert.equal(resolveSettings({ exportJpgQuality: 0.1 }).exportJpgQuality, 0.4)
  assert.equal(resolveSettings({ exportJpgQuality: 1.4 }).exportJpgQuality, 1)
  assert.equal(resolveSettings({ exportTransparent: false }).exportTransparent, false)
})

test('the dialog carries the export fields and accepts a patch', () => {
  const payload = settingsDialogOf(mergeSettings({}, { exportScale: 2, exportTransparent: false, exportJpgQuality: 0.75 }))
  assert.equal(payload.exportScale, 2)
  assert.equal(payload.exportTransparent, false)
  assert.equal(payload.exportJpgQuality, 0.75)
  assert.deepEqual(settingsPatchOf({ exportScale: 2, exportTransparent: false, exportJpgQuality: 0.75, junk: 1 }), {
    exportScale: 2,
    exportTransparent: false,
    exportJpgQuality: 0.75,
  })
})
test('interaction settings validate and reach the dialog', () => {
  assert.equal(resolveSettings({ snapDistance: -5 }).snapDistance, 0)
  assert.equal(resolveSettings({ autoPanMaxSpeed: 999 }).autoPanMaxSpeed, 60)
  assert.equal(resolveSettings({ lineHitTolerance: 2 }).lineHitTolerance, 8)
  assert.equal(resolveSettings({ snapEnabled: false }).snapEnabled, false)
  const payload = settingsDialogOf(mergeSettings({}, { snapEnabled: false, snapDistance: 4, autoPanMaxSpeed: 20, lineHitTolerance: 40 }))
  assert.equal(payload.snapEnabled, false)
  assert.equal(payload.snapDistance, 4)
  assert.equal(payload.autoPanMaxSpeed, 20)
  assert.equal(payload.lineHitTolerance, 40)
  assert.deepEqual(settingsPatchOf({ snapEnabled: false, snapDistance: 4, junk: true }), { snapEnabled: false, snapDistance: 4 })
})
test('grid opacity is clamped and reaches the dialog', () => {
  assert.equal(resolveSettings({ gridOpacity: 2 }).gridOpacity, 1)
  assert.equal(resolveSettings({ gridOpacity: -1 }).gridOpacity, 0)
  assert.equal(resolveSettings({ gridOpacity: 0.35 }).gridOpacity, 0.35)
  const payload = settingsDialogOf(mergeSettings({}, { gridOpacity: 0.4 }))
  assert.equal(payload.gridOpacity, 0.4)
  assert.deepEqual(settingsPatchOf({ gridOpacity: 0.4, junk: 1 }), { gridOpacity: 0.4 })
})
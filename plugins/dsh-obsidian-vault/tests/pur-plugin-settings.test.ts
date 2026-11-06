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
import { DEFAULT_SETTINGS } from '../src/settings.ts'

test('only the dialog fields survive a patch', () => {
  assert.deepEqual(settingsPatchOf({ runTimeoutMs: 900, vault: '/tmp/x', ignore: ['a'], showGrid: false }), {
    runTimeoutMs: 900,
    showGrid: false,
  })
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

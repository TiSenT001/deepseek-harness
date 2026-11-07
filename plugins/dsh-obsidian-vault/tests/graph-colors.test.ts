/**
 * Graph node colours: folder and tag modes are deterministic, distinct across
 * keys, and the colour mode survives a graph.json round trip.
 * @module dsh-obsidian-vault/tests/graph-colors
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { colorByKey, folderColor, folderOf, hueOf, tagColor } from '../src/client/graph/render/colors.ts'
import { graphJsonPatch, settingsPatchFromGraphJson } from '../src/client/graph/graph-json.ts'
import { DEFAULT_GRAPH_SETTINGS, mergeGraphSettings } from '../src/client/graph/settings.ts'

test('folderOf keeps the top-level segment and marks root files', () => {
  assert.equal(folderOf('工具链/研究/a.md'), '工具链')
  assert.equal(folderOf('a.md'), '(root)')
  assert.equal(folderOf('a/b/c.md'), 'a')
})

test('hues are stable and spread across folders', () => {
  assert.equal(hueOf('工具链'), hueOf('工具链'))
  assert.notEqual(folderColor('工具链'), folderColor('美学'))
  assert.match(folderColor('工具链'), /^hsl\(\d+ 58% 58%\)$/)
})

test('tag colours differ from folder colours for the same key', () => {
  assert.notEqual(tagColor('性能'), folderColor('性能'))
})

test('colorByKey follows the configured mode', () => {
  const fallback = '#8b8b94'
  assert.equal(colorByKey('uniform', 'a/b.md', ['x'], fallback), fallback)
  assert.equal(colorByKey('folder', 'a/b.md', ['x'], fallback), folderColor('a'))
  assert.equal(colorByKey('tag', 'a/b.md', ['x'], fallback), tagColor('x'))
  // A note without tags falls back to its folder in tag mode.
  assert.equal(colorByKey('tag', 'a/b.md', [], fallback), folderColor('a'))
})

test('the colour mode survives a graph.json round trip', () => {
  const settings = { ...DEFAULT_GRAPH_SETTINGS, display: { ...DEFAULT_GRAPH_SETTINGS.display, colorBy: 'tag' as const } }
  const patch = settingsPatchFromGraphJson(graphJsonPatch(settings))
  assert.equal(mergeGraphSettings(patch).display.colorBy, 'tag')
})

test('an unknown colour mode falls back to the default', () => {
  const merged = mergeGraphSettings(settingsPatchFromGraphJson({ dshColorBy: 'rainbow' }))
  assert.equal(merged.display.colorBy, 'folder')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  graphJsonPatch,
  hexToRgb,
  rgbToHex,
  settingsPatchFromGraphJson,
} from '../src/client/graph/graph-json.ts'
import {
  DEFAULT_GRAPH_SETTINGS,
  mergeGraphSettings,
  type GraphSettings,
} from '../src/client/graph/settings.ts'

/** Compare settings while tolerating float drift in the converted centre force. */
function assertCloseTo(actual: GraphSettings, expected: GraphSettings): void {
  assert.deepEqual(
    { ...actual, forces: { ...actual.forces, center: 0 } },
    { ...expected, forces: { ...expected.forces, center: 0 } },
  )
  assert.ok(Math.abs(actual.forces.center - expected.forces.center) < 1e-9)
}

test('default settings survive a graph.json round trip', () => {
  assertCloseTo(mergeGraphSettings(settingsPatchFromGraphJson(graphJsonPatch(DEFAULT_GRAPH_SETTINGS))), DEFAULT_GRAPH_SETTINGS)
})

test('a populated settings object survives a graph.json round trip', () => {
  const settings: GraphSettings = {
    filters: { query: 'alpha', tag: '#work', existingOnly: true, showTags: true, showAttachments: true, showOrphans: false },
    groups: [{ query: 'tag:#work', color: '#ff8800' }],
    display: { arrows: true, textFade: 0.4, nodeScale: 1.5, linkWidth: 2 },
    forces: { center: 0.2, repel: 14, link: 0.8, linkDistance: 320 },
  }
  const patch = settingsPatchFromGraphJson(graphJsonPatch(settings))
  const merged = mergeGraphSettings(patch)
  // `tag` has no graph.json key: Obsidian keeps tag filtering inside `search`.
  assertCloseTo(merged, { ...settings, filters: { ...settings.filters, tag: '' } })
})

test('flips hideUnresolved into existingOnly', () => {
  assert.equal(settingsPatchFromGraphJson({ hideUnresolved: true }).filters?.existingOnly, false)
  assert.equal(settingsPatchFromGraphJson({ hideUnresolved: false }).filters?.existingOnly, true)
})

test('maps Obsidian display and force keys', () => {
  const patch = settingsPatchFromGraphJson({
    showArrow: true,
    textFadeMultiplier: -1.2,
    nodeSizeMultiplier: 0.7,
    lineSizeMultiplier: 1.8,
    centerStrength: 0.518713248970312,
    repelStrength: 18,
    linkStrength: 0.6,
    linkDistance: 400,
  })
  assert.deepEqual(patch.display, { arrows: true, textFade: -1.2, nodeScale: 0.7, linkWidth: 1.8 })
  assert.equal(patch.forces?.center, 0.1)
  assert.equal(patch.forces?.repel, 18)
  assert.equal(patch.forces?.link, 0.6)
  assert.equal(patch.forces?.linkDistance, 400)
})

test('reads colour groups from Obsidian integer colours', () => {
  const patch = settingsPatchFromGraphJson({
    colorGroups: [
      { query: 'tag:#work', color: { a: 1, rgb: 0xff8800 } },
      { query: ' ', color: { a: 1, rgb: 0 } },
      { query: 'broken' },
    ],
  })
  assert.deepEqual(patch.groups, [{ query: 'tag:#work', color: '#ff8800' }])
})

test('ignores documents that are not JSON objects', () => {
  assert.deepEqual(settingsPatchFromGraphJson(null), {})
  assert.deepEqual(settingsPatchFromGraphJson('graph'), {})
  assert.deepEqual(settingsPatchFromGraphJson([1]), {})
})

test('converts colours both ways', () => {
  assert.equal(hexToRgb('#00ff88'), 0x00ff88)
  assert.equal(hexToRgb('00ff88'), 0x00ff88)
  assert.equal(hexToRgb('#00ff8'), undefined)
  assert.equal(hexToRgb('nope'), undefined)
  assert.equal(rgbToHex(0x00ff88), '#00ff88')
  assert.equal(rgbToHex(0xffffffff), '#ffffff')
})

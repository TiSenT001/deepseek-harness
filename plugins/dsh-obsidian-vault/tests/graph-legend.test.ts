/**
 * Graph legend buckets: grouped by folder or first tag, largest first, root
 * files omitted, and explicit group colours reflected in the chip colour.
 * @module dsh-obsidian-vault/tests/graph-legend
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { GraphNodeDto } from '../src/protocol.ts'
import { legendEntries } from '../src/client/graph/legend.ts'
import { DEFAULT_GRAPH_SETTINGS, type GraphSettings } from '../src/client/graph/settings.ts'

/** Build one note node. */
function note(path: string, tags: readonly string[] = []): GraphNodeDto {
  return { path, title: path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''), kind: 'note', depth: 1, tags }
}

/** Settings with optional groups and mode. */
function settingsOf(patch: Partial<GraphSettings['display']> = {}, groups: GraphSettings['groups'] = []): GraphSettings {
  return { ...DEFAULT_GRAPH_SETTINGS, groups, display: { ...DEFAULT_GRAPH_SETTINGS.display, ...patch } }
}

test('groups notes by top-level folder and sorts by count', () => {
  const nodes = [
    note('工具链/a.md'), note('工具链/b.md'), note('工具链/c.md'),
    note('美学/d.md'),
    note('e.md'),
  ]
  const entries = legendEntries(nodes, settingsOf())
  assert.deepEqual(entries.map(entry => [entry.key, entry.count]), [['工具链', 3], ['美学', 1]])
})

test('tag mode groups by the first tag with a folder fallback for untagged notes', () => {
  const nodes = [note('工具链/a.md', ['性能']), note('工具链/b.md', ['性能']), note('工具链/c.md')]
  const entries = legendEntries(nodes, settingsOf({ colorBy: 'tag' }))
  assert.deepEqual(entries.map(entry => [entry.key, entry.count]), [['性能', 2], ['工具链', 1]])
})

test('uniform mode renders no legend', () => {
  assert.deepEqual(legendEntries([note('工具链/a.md')], settingsOf({ colorBy: 'uniform' })), [])
})

test('an explicit group colour wins over the automatic hue', () => {
  const entries = legendEntries([note('工具链/a.md')], settingsOf({}, [{ query: 'path:工具链', color: '#ff0000' }]))
  assert.equal(entries[0]?.color, '#ff0000')
})

test('non-note nodes do not create buckets', () => {
  const tagNode: GraphNodeDto = { path: '#性能', title: '#性能', kind: 'tag', depth: 1 }
  const entries = legendEntries([tagNode, note('工具链/a.md')], settingsOf())
  assert.deepEqual(entries.map(entry => entry.key), ['工具链'])
})

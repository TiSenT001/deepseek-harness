/**
 * Group colour matching: the panel writes prefixed queries (`path:`, `file:`,
 * `tag:`), so those prefixes must resolve as scopes; plain text stays a
 * substring match over title and path, and declaration order wins.
 * @module dsh-obsidian-vault/tests/graph-group-color
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupColorOf } from '../src/client/graph/render/group-color.ts'
import { DEFAULT_GRAPH_SETTINGS, type GraphSettings } from '../src/client/graph/settings.ts'

/** Settings with one group. */
function withGroup(query: string, color = '#ff0000'): GraphSettings {
  return { ...DEFAULT_GRAPH_SETTINGS, groups: [{ query, color }] }
}

test('plain queries match title or path substrings', () => {
  assert.equal(groupColorOf(withGroup('工具链'), '总纲', '工具链/总纲.md'), '#ff0000')
  assert.equal(groupColorOf(withGroup('总纲'), '总纲', '工具链/总纲.md'), '#ff0000')
  assert.equal(groupColorOf(withGroup('美学'), '总纲', '工具链/总纲.md'), undefined)
})

test('path: scopes the match to the whole path', () => {
  assert.equal(groupColorOf(withGroup('path:工具链'), '总纲', '工具链/总纲.md'), '#ff0000')
  assert.equal(groupColorOf(withGroup('path:美学'), '总纲', '工具链/总纲.md'), undefined)
})

test('file: scopes the match to the file name', () => {
  assert.equal(groupColorOf(withGroup('file:总纲'), '总纲', '工具链/总纲.md'), '#ff0000')
  assert.equal(groupColorOf(withGroup('file:工具链'), '总纲', '工具链/总纲.md'), undefined)
})

test('tag: matches notes carrying the tag, with or without #', () => {
  assert.equal(groupColorOf(withGroup('tag:性能'), 'x', 'a.md', ['性能']), '#ff0000')
  assert.equal(groupColorOf(withGroup('tag:#性能'), 'x', 'a.md', ['性能']), '#ff0000')
  assert.equal(groupColorOf(withGroup('tag:性能'), 'x', 'a.md', ['美学']), undefined)
})

test('quoted scope values are unquoted', () => {
  assert.equal(groupColorOf(withGroup('path:"工具链 研究"'), 'x', '工具链 研究/x.md'), '#ff0000')
})

test('the first matching group wins and empty queries are skipped', () => {
  const settings: GraphSettings = {
    ...DEFAULT_GRAPH_SETTINGS,
    groups: [{ query: '   ', color: '#111111' }, { query: 'path:工具', color: '#222222' }, { query: '工具链', color: '#333333' }],
  }
  assert.equal(groupColorOf(settings, 'x', '工具链/x.md'), '#222222')
})

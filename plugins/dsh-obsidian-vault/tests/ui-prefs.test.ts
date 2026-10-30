import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clampPane, DEFAULT_WIDTHS, parseWidths, serializeWidths,
} from '../src/client/ui/layoutPrefs.ts'
import { textStats, vaultName } from '../src/client/ui/stats.ts'
import { DEFAULT_INLINE_BACKLINKS, parseInlineBacklinks, serializeInlineBacklinks } from '../src/client/ui/notePrefs.ts'
import { buildSearchQuery, DEFAULT_SEARCH_OPTIONS, orderSearchHits, parseSearchOptions, serializeSearchOptions } from '../src/client/ui/searchPrefs.ts'

test('clampPane keeps widths inside the docked range', () => {
  assert.equal(clampPane('left', 100), 220)
  assert.equal(clampPane('left', 900), 480)
  assert.equal(clampPane('right', 100), 240)
  assert.equal(clampPane('right', 900), 520)
  assert.equal(clampPane('left', 300.4), 300)
})

test('clampPane rejects non-finite widths', () => {
  assert.equal(clampPane('left', Number.NaN), DEFAULT_WIDTHS.left)
  assert.equal(clampPane('right', Number.POSITIVE_INFINITY), DEFAULT_WIDTHS.right)
})

test('parseWidths falls back per column', () => {
  assert.deepEqual(parseWidths(null), DEFAULT_WIDTHS)
  assert.deepEqual(parseWidths('{"left":300}'), { left: 300, right: DEFAULT_WIDTHS.right })
  assert.deepEqual(parseWidths('{"left":"wide"}'), DEFAULT_WIDTHS)
  assert.deepEqual(parseWidths('{"left":9999,"right":1}'), { left: 480, right: 240 })
})

test('parseWidths survives malformed JSON', () => {
  assert.deepEqual(parseWidths('{"left":'), DEFAULT_WIDTHS)
})

test('serializeWidths clamps before writing', () => {
  assert.equal(serializeWidths({ left: 10, right: 900 }), '{"left":220,"right":520}')
})

test('textStats counts CJK characters and Latin words', () => {
  assert.deepEqual(textStats('你好 world'), { words: 3, chars: 8, lines: 1 })
  assert.deepEqual(textStats('a b\nc'), { words: 3, chars: 5, lines: 2 })
  assert.deepEqual(textStats(''), { words: 0, chars: 0, lines: 0 })
})

test('textStats keeps contractions as one word', () => {
  assert.equal(textStats("don't stop").words, 2)
})

test('vaultName reads the last segment of either separator style', () => {
  assert.equal(vaultName('G:\\个人知识库'), '个人知识库')
  assert.equal(vaultName('/home/user/vault/'), 'vault')
  assert.equal(vaultName('vault'), 'vault')
})

test('inline backlinks default on and survive a round-trip', () => {
  assert.equal(DEFAULT_INLINE_BACKLINKS, true)
  assert.equal(parseInlineBacklinks(null), true)
  assert.equal(parseInlineBacklinks('1'), true)
  assert.equal(parseInlineBacklinks('0'), false)
  assert.equal(serializeInlineBacklinks(true), '1')
  assert.equal(serializeInlineBacklinks(false), '0')
  assert.equal(parseInlineBacklinks(serializeInlineBacklinks(false)), false)
})

test('buildSearchQuery composes the palette toggles into Host syntax', () => {
  assert.equal(buildSearchQuery('  ', DEFAULT_SEARCH_OPTIONS), '')
  assert.equal(buildSearchQuery('foo bar', DEFAULT_SEARCH_OPTIONS), 'foo bar')
  assert.equal(buildSearchQuery('foo bar', { ...DEFAULT_SEARCH_OPTIONS, matchCase: true }), 'match-case:(foo bar)')
  assert.equal(buildSearchQuery('foo.*', { ...DEFAULT_SEARCH_OPTIONS, regex: true }), '/foo.*/')
  assert.equal(buildSearchQuery('foo.*', { ...DEFAULT_SEARCH_OPTIONS, matchCase: true, regex: true }), 'match-case:(/foo.*/)')
})

test('search options round-trip and fall back on a broken entry', () => {
  assert.deepEqual(parseSearchOptions(null), DEFAULT_SEARCH_OPTIONS)
  assert.deepEqual(parseSearchOptions('not json'), DEFAULT_SEARCH_OPTIONS)
  const once = { ...DEFAULT_SEARCH_OPTIONS, matchCase: true }
  assert.deepEqual(parseSearchOptions(serializeSearchOptions(once)), once)
})

test('orderSearchHits keeps ranking or sorts by title', () => {
  const hits = [
    { path: 'b.md', title: 'Bravo', kind: 'title' as const, score: 1 },
    { path: 'a.md', title: 'Alpha', kind: 'title' as const, score: 0.5 },
  ]
  assert.deepEqual(orderSearchHits(hits, 'relevance').map(hit => hit.path), ['b.md', 'a.md'])
  assert.deepEqual(orderSearchHits(hits, 'name').map(hit => hit.path), ['a.md', 'b.md'])
})

test('search options carry the new sort and compact fields', () => {
  const options = { ...DEFAULT_SEARCH_OPTIONS, sort: 'name' as const, compact: true }
  assert.deepEqual(parseSearchOptions(serializeSearchOptions(options)), options)
  assert.equal(parseSearchOptions('{}').sort, 'relevance')
  assert.equal(parseSearchOptions('{}').compact, false)
})

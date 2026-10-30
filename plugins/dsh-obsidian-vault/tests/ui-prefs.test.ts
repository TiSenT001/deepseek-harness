import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clampPane, DEFAULT_WIDTHS, parseWidths, serializeWidths,
} from '../src/client/ui/layoutPrefs.ts'
import { textStats, vaultName } from '../src/client/ui/stats.ts'
import { DEFAULT_INLINE_BACKLINKS, parseInlineBacklinks, serializeInlineBacklinks } from '../src/client/ui/notePrefs.ts'

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

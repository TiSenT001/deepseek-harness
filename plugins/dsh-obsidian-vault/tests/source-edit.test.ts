/**
 * Pure editor operations: find, replace, indentation, wrapping and newline
 * continuation. These decide cursor placement, so they are tested directly.
 * @module dsh-obsidian-vault/tests/source-edit
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  findMatches,
  indentLines,
  newlineContinuation,
  outdentLines,
  replaceAll,
  replaceMatch,
  wrapSelection,
} from '../src/client/ui/editor/source-edit.ts'

test('findMatches is literal, wrapping and case-aware on demand', () => {
  assert.deepEqual(findMatches('aXa', 'a'), [{ start: 0, end: 1 }, { start: 2, end: 3 }])
  assert.deepEqual(findMatches('aAa', 'A', true), [{ start: 1, end: 2 }])
  assert.deepEqual(findMatches('aAa', 'A', true), [{ start: 1, end: 2 }])
  assert.equal(findMatches('aAa', 'A').length, 3)
  assert.deepEqual(findMatches('abc', ''), [])
  assert.deepEqual(findMatches('aaaa', 'aa'), [{ start: 0, end: 2 }, { start: 2, end: 4 }])
})

test('replaceMatch keeps the caret after the inserted text', () => {
  assert.deepEqual(replaceMatch('one two', { start: 4, end: 7 }, 'three'), { text: 'one three', start: 9, end: 9 })
})

test('replaceAll reports the number of replacements', () => {
  assert.deepEqual(replaceAll('a b a', 'a', 'xy'), { text: 'xy b xy', start: 0, end: 0, count: 2 })
  assert.deepEqual(replaceAll('a', 'z', 'q').count, 0)
})

test('indentLines indents every selected line and keeps the selection', () => {
  const result = indentLines('a\nb\nc', 0, 3)
  assert.equal(result.text, '  a\n  b\nc')
  assert.equal(result.start, 2)
})

test('outdentLines removes one unit and clamps at the line start', () => {
  const result = outdentLines('  a\n  b', 0, 7)
  assert.equal(result.text, 'a\nb')
  assert.equal(result.start, 0)
})

test('wrapSelection wraps the selection or inserts an empty pair', () => {
  assert.deepEqual(wrapSelection('hello', 0, 5, '**', '**'), { text: '**hello**', start: 2, end: 7 })
  assert.deepEqual(wrapSelection('', 0, 0, '[', ']()'), { text: '[]()', start: 1, end: 1 })
})

test('newlineContinuation continues lists, tasks, quotes and indentation', () => {
  assert.equal(newlineContinuation('- item', 6), '\n- ')
  assert.equal(newlineContinuation('- [x] done', 10), '\n- [ ] ')
  assert.equal(newlineContinuation('1. first', 8), '\n2. ')
  assert.equal(newlineContinuation('  9) nine', 9), '\n  10) ')
  assert.equal(newlineContinuation('> quote', 7), '\n> ')
  assert.equal(newlineContinuation('  indented', 10), '\n  ')
  assert.equal(newlineContinuation('plain', 5), null)
  assert.equal(newlineContinuation('', 0), null)
})

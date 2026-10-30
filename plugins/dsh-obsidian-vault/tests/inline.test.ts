import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitHighlights, stripComments } from '../src/client/markdown/inline.ts'

test('strips single-line and multi-line comments', () => {
  assert.equal(stripComments('a %%gone%% b'), 'a  b')
  assert.equal(stripComments('a %%gone\nstill gone\ndone%% b'), 'a \n\n b')
})

test('keeps comments inside fenced code', () => {
  const source = ['```', '%%keep%%', '```'].join('\n')
  assert.equal(stripComments(source), source)
})

test('splits highlights out of one text run', () => {
  assert.deepEqual(splitHighlights('a ==b== c'), [
    { text: 'a ', highlight: false },
    { text: 'b', highlight: true },
    { text: ' c', highlight: false },
  ])
})

test('leaves text without highlights as one run', () => {
  assert.deepEqual(splitHighlights('plain'), [{ text: 'plain', highlight: false }])
  assert.deepEqual(splitHighlights('==unclosed'), [{ text: '==unclosed', highlight: false }])
})

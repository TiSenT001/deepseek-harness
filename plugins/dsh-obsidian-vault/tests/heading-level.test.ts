import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clampHeadingShift, shiftedHeadings, shiftHeadingLevel } from '../src/vault/heading-level.ts'

const HEADINGS = [
  { level: 1, line: 1 },
  { level: 2, line: 3 },
  { level: 3, line: 5 },
  { level: 2, line: 7 },
  { level: 1, line: 9 },
]

test('shiftedHeadings carries the deeper subtree and stops at the next peer', () => {
  assert.deepEqual(shiftedHeadings(HEADINGS, 3).map(h => h.line), [3, 5])
  assert.deepEqual(shiftedHeadings(HEADINGS, 1).map(h => h.line), [1, 3, 5, 7])
  assert.deepEqual(shiftedHeadings(HEADINGS, 7).map(h => h.line), [7])
  assert.deepEqual(shiftedHeadings(HEADINGS, 99), [])
})

test('clampHeadingShift keeps every carried level inside 1..6', () => {
  assert.equal(clampHeadingShift(HEADINGS, 3, 1), 1)
  assert.equal(clampHeadingShift(HEADINGS, 3, -1), -1)
  // The H1 child of the dragged H1 caps promotion at 0.
  assert.equal(clampHeadingShift(HEADINGS, 1, -2), 0)
  // The H3 child caps demotion of the H2 at line 3 to +3.
  assert.equal(clampHeadingShift(HEADINGS, 3, 9), 3)
  assert.equal(clampHeadingShift(HEADINGS, 5, -5), -2)
  assert.equal(clampHeadingShift(HEADINGS, 99, 1), 0)
})

test('shiftHeadingLevel rewrites the target and its subtree', () => {
  const source = ['# One', '', '## Two', '', '### Three', '', '## Four', '', '# Five', ''].join('\n')
  const next = shiftHeadingLevel(source, 3, 1)
  assert.equal(next, ['# One', '', '### Two', '', '#### Three', '', '## Four', '', '# Five', ''].join('\n'))
  const back = shiftHeadingLevel(source, 3, -1)
  assert.equal(back, ['# One', '', '# Two', '', '## Three', '', '## Four', '', '# Five', ''].join('\n'))
})

test('shiftHeadingLevel preserves indentation, trailing hashes, and CRLF', () => {
  const source = '##  Closed ##\r\n\r\ntext\r\n'
  const next = shiftHeadingLevel(source, 1, 2)
  assert.equal(next, '####  Closed ##\r\n\r\ntext\r\n')
})

test('shiftHeadingLevel skips frontmatter and fenced code', () => {
  const source = ['---', 'title: x', '---', '# Real', '', '```', '# fake', '```', '## Sub', ''].join('\n')
  // Body line 1 is `# Real`; its subtree is the trailing H2, not the fence text.
  const next = shiftHeadingLevel(source, 1, 1)
  assert.equal(next, ['---', 'title: x', '---', '## Real', '', '```', '# fake', '```', '### Sub', ''].join('\n'))
})

test('shiftHeadingLevel refuses no-ops and stale lines', () => {
  const source = '# Only\n\ntext\n'
  assert.equal(shiftHeadingLevel(source, 1, 0), undefined)
  assert.equal(shiftHeadingLevel(source, 1, -1), undefined)
  assert.equal(shiftHeadingLevel(source, 3, 1), undefined)
  assert.equal(shiftHeadingLevel(source, 2, 1), undefined)
})

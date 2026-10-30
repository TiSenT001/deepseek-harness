import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseFrontmatter } from '../src/vault/frontmatter.ts'

test('reads scalars, quoted strings, booleans, numbers, and inline arrays', () => {
  const source = [
    '---',
    'title: Note',
    'draft: false',
    'order: 3',
    'tags: [alpha, "beta"]',
    'alias: "The Note"',
    '---',
    'body line',
  ].join('\n')
  const parsed = parseFrontmatter(source)
  assert.deepEqual(parsed.values, {
    title: 'Note',
    draft: false,
    order: 3,
    tags: ['alpha', 'beta'],
    alias: 'The Note',
  })
  assert.equal(parsed.body, 'body line')
})

test('reads block lists', () => {
  const source = ['---', 'aliases:', '  - one', '  - two', '---', 'x'].join('\n')
  assert.deepEqual(parseFrontmatter(source).values['aliases'], ['one', 'two'])
})

test('leaves source untouched without a frontmatter block', () => {
  const source = '# Title\n\ntext'
  assert.deepEqual(parseFrontmatter(source), { values: {}, body: source })
})

test('rejects an unterminated block', () => {
  const source = '---\ntitle: broken\nstill inside'
  assert.deepEqual(parseFrontmatter(source), { values: {}, body: '' })
})

test('strips a byte-order mark before reading the block', () => {
  const parsed = parseFrontmatter('\uFEFF---\ntitle: x\n---\nbody')
  assert.equal(parsed.values['title'], 'x')
  assert.equal(parsed.body, 'body')
})

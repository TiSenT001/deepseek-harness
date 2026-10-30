import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { NoteDto } from '../src/protocol.ts'
import { sliceBlock, sliceSection } from '../src/client/markdown/blocks.ts'
import { scanBlockIds } from '../src/vault/syntax.ts'

const body = [
  '# Target',
  '',
  '第一段内容 ^blk1',
  '',
  '## Section Two',
  '',
  '第二节内容',
  '',
  '### Deeper',
  '',
  '更深的内容',
  '',
  '## Section Three',
  '',
  '第三节内容',
].join('\n')

const note: NoteDto = {
  path: 'notes/target.md',
  title: 'Target',
  content: body,
  frontmatter: {},
  tags: [],
  headings: [
    { level: 1, text: 'Target', line: 1 },
    { level: 2, text: 'Section Two', line: 5 },
    { level: 3, text: 'Deeper', line: 9 },
    { level: 2, text: 'Section Three', line: 13 },
  ],
  links: [],
  blocks: { blk1: 3 },
}

test('finds block ids with their 1-based line', () => {
  const ids = scanBlockIds(body)
  assert.equal(ids.get('blk1'), 3)
  assert.equal(ids.size, 1)
})

test('ignores block ids inside fenced code', () => {
  const fenced = ['```md', 'example ^nope', '```', 'real ^yes'].join('\n')
  const ids = scanBlockIds(fenced)
  assert.equal(ids.has('nope'), false)
  assert.equal(ids.get('yes'), 4)
})

test('slices a heading section up to the next same-or-higher heading', () => {
  const section = sliceSection(note, 'Section Two')
  assert.ok(section !== undefined)
  assert.ok(section.includes('第二节内容'))
  assert.ok(section.includes('### Deeper'))
  assert.equal(section.includes('第三节内容'), false)
  assert.equal(section.includes('第一段内容'), false)
})

test('slices a heading section case-insensitively', () => {
  assert.ok(sliceSection(note, 'section two')?.includes('第二节内容'))
})

test('returns undefined for a missing heading', () => {
  assert.equal(sliceSection(note, 'Nope'), undefined)
})

test('slices one block paragraph', () => {
  assert.equal(sliceBlock(note, 'blk1'), '第一段内容 ^blk1')
})

test('returns undefined for a missing block id', () => {
  assert.equal(sliceBlock(note, 'nope'), undefined)
})

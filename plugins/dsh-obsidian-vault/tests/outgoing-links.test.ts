import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { NoteLinkDto } from '../src/protocol.ts'
import { uniqueLinks } from '../src/client/ui/panels/outgoing-links.ts'

function link(overrides: Partial<NoteLinkDto>): NoteLinkDto {
  return {
    raw: '[[x]]', target: 'x', embed: false, line: 1, status: 'resolved', path: 'x.md',
    ...overrides,
  }
}

test('outgoing links deduplicate by destination and split resolved/unresolved', () => {
  const links = [
    link({ target: 'A', path: 'A.md', line: 2 }),
    link({ target: 'A', path: 'A.md', line: 9 }),
    link({ target: 'B', status: 'unresolved', path: undefined }),
    link({ target: 'B', status: 'unresolved', path: undefined, line: 5 }),
    link({ target: 'pic.png', embed: true, path: 'pic.png' }),
  ]
  const { resolved, unresolved } = uniqueLinks(links)
  assert.deepEqual(resolved.map(item => item.path), ['A.md'])
  assert.deepEqual(unresolved.map(item => item.target), ['B'])
})

test('aliases label the outgoing row', () => {
  const { resolved } = uniqueLinks([link({ target: 'A', alias: '首字母', path: 'A.md' })])
  assert.equal(resolved[0]?.label, '首字母')
})

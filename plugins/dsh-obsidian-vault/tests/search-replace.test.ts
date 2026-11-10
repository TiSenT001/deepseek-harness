import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildReplacePattern, contentHitPaths, countMatches, isReplaceableQuery, replaceMatches } from '../src/client/ui/searchReplace.ts'
import { DEFAULT_SEARCH_OPTIONS } from '../src/client/ui/searchPrefs.ts'

test('plain queries are escaped and replace every occurrence', () => {
  const pattern = buildReplacePattern('a.b', DEFAULT_SEARCH_OPTIONS)
  assert.ok(pattern)
  const result = replaceMatches('a.b axb A.B', pattern, 'ok')
  assert.equal(result.count, 2)
  assert.equal(result.text, 'ok axb ok')
})

test('case and regex toggles change the pattern', () => {
  const cased = buildReplacePattern('Note', { ...DEFAULT_SEARCH_OPTIONS, matchCase: true })
  assert.ok(cased)
  assert.equal(countMatches('Note note', cased), 1)
  const regex = buildReplacePattern('n(\\d+)', { ...DEFAULT_SEARCH_OPTIONS, regex: true })
  assert.ok(regex)
  assert.equal(replaceMatches('n1 n2', regex, 'x').text, 'x x')
})

test('field-operator queries cannot be replaced', () => {
  assert.equal(isReplaceableQuery('tag:游戏'), false)
  assert.equal(isReplaceableQuery('foo path:bar'), false)
  assert.equal(isReplaceableQuery('普通 文本'), true)
})

test('content hits collapse to unique note paths', () => {
  const hits = [
    { path: 'A.md', title: 'A', kind: 'content' as const },
    { path: 'A.md', title: 'A', kind: 'content' as const },
    { path: 'B.md', title: 'B', kind: 'title' as const },
    { path: 'C.md', title: 'C', kind: 'content' as const },
  ]
  assert.deepEqual(contentHitPaths(hits), ['A.md', 'C.md'])
})

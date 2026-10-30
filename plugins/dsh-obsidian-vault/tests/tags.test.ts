import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSentinel, rewriteTags, tagUrlFor } from '../src/client/markdown/rewrite.ts'

const tagUrl = (tag: string): string => `https://tags.test/${tag}`

test('rewrites inline tags into sentinel links', () => {
  assert.equal(
    rewriteTags('a #alpha and #nested/beta end', tagUrl),
    'a [#alpha](https://tags.test/alpha) and [#nested/beta](https://tags.test/nested/beta) end',
  )
})

test('leaves tags inside code and wikilinks alone', () => {
  const source = ['`#inline`', '```', '#fenced', '```', '[[Note#Heading]]'].join('\n')
  assert.equal(rewriteTags(source, tagUrl), source)
})

test('does not treat a URL fragment as a tag', () => {
  assert.equal(rewriteTags('see https://example.com/#section', tagUrl), 'see https://example.com/#section')
})

test('headings are not tags', () => {
  assert.equal(rewriteTags('# Heading\n## Section', tagUrl), '# Heading\n## Section')
})

test('parseSentinel decodes tag clicks', () => {
  assert.deepEqual(parseSentinel(tagUrlFor('nested/beta')), { kind: 'tag', tag: 'nested/beta' })
})

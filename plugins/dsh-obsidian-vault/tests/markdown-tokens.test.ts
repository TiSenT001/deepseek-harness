/**
 * Markdown source colours: the ranges must cover the markers the editor paints
 * and must never overlap, because the renderer walks them in order.
 * @module dsh-obsidian-vault/tests/markdown-tokens
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markdownTokens, tokenClass } from '../src/client/ui/editor/markdown-tokens.ts'

/** Tokens for one text, as `kind:text` pairs. */
function kinds(text: string): string[] {
  return markdownTokens(text).map(token => `${token.kind}:${text.slice(token.start, token.end)}`)
}

test('colours headings, list markers and quotes at line start', () => {
  assert.deepEqual(kinds('## Title\n- item\n> quote'), ['heading:## ', 'list:- ', 'quote:> '])
})

test('colours inline constructs without touching the surrounding text', () => {
  assert.deepEqual(kinds('a **bold** and `code` and [[note]]'), [
    'bold:**bold**',
    'inline-code:`code`',
    'link:[[note]]',
  ])
})

test('colours markdown links and tags', () => {
  assert.deepEqual(kinds('see [docs](https://x.dev) and #topic'), [
    'link:[docs](https://x.dev)',
    'tag:#topic',
  ])
})

test('treats a leading --- block as frontmatter', () => {
  const text = '---\ntitle: x\n---\n# Body\n'
  assert.deepEqual(kinds(text), [
    'frontmatter:---',
    'frontmatter:title: x',
    'frontmatter:---',
    'heading:# ',
  ])
})

test('colours a fenced block until its closing fence', () => {
  const text = 'before\n```js\nconst x = 1\n```\nafter **bold**'
  assert.deepEqual(kinds(text), [
    'code:```js',
    'code:const x = 1',
    'code:```',
    'bold:**bold**',
  ])
})

test('tokens are sorted and never overlap', () => {
  const text = '# **bold** `code` [[x]] #tag\n- item [a](b)\n'
  const tokens = markdownTokens(text)
  let previous = -1
  for (const token of tokens) {
    assert.ok(token.start >= previous, `overlap at ${token.start}`)
    assert.ok(token.end > token.start)
    previous = token.end
  }
})

test('class names are stable', () => {
  assert.equal(tokenClass('heading'), 'ov-md-heading')
  assert.equal(tokenClass('inline-code'), 'ov-md-inline-code')
})

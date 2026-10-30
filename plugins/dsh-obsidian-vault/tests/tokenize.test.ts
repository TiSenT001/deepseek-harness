import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tokenize, tokenizeLines, type Token, type TokenKind } from '../src/client/ui/files/tokenize.ts'

/** Kinds of every token whose text equals `needle`. */
function kindsOf(tokens: readonly Token[], needle: string): TokenKind[] {
  return tokens.filter(token => token.text === needle).map(token => token.kind)
}

test('plain text stays one uncoloured token', () => {
  assert.deepEqual(tokenize('const x = 1', undefined), [{ kind: 'plain', text: 'const x = 1' }])
  assert.deepEqual(tokenize('a,b\n1,2', 'csv'), [{ kind: 'plain', text: 'a,b\n1,2' }])
})

test('classifies JavaScript keywords, comments, strings, numbers, and calls', () => {
  const tokens = tokenize("const n = 42\n// note\nsay('hi')", 'javascript')
  assert.deepEqual(kindsOf(tokens, 'const'), ['keyword'])
  assert.deepEqual(kindsOf(tokens, '42'), ['number'])
  assert.deepEqual(kindsOf(tokens, '// note'), ['comment'])
  assert.deepEqual(kindsOf(tokens, "'hi'"), ['string'])
  assert.deepEqual(kindsOf(tokens, 'say'), ['function'])
})

test('reads Python # comments and block comments', () => {
  const tokens = tokenize('# heading\ndef f():\n    return True', 'python')
  assert.deepEqual(kindsOf(tokens, '# heading'), ['comment'])
  assert.deepEqual(kindsOf(tokens, 'def'), ['keyword'])
  assert.deepEqual(kindsOf(tokens, 'True'), ['literal'])
  const block = tokenize('/* upper\ncase */', 'javascript')
  assert.deepEqual(kindsOf(block, '/* upper\ncase */'), ['comment'])
})

test('stylesheets treat // as text and name: as an attribute', () => {
  const tokens = tokenize('// not a comment\ncolor: red;', 'css')
  assert.equal(tokens.some(token => token.kind === 'comment'), false)
  assert.deepEqual(kindsOf(tokens, 'color'), ['attr'])
  assert.deepEqual(kindsOf(tokens, 'red'), ['plain'])
})

test('markup separates tags, attributes, and quoted values', () => {
  const tokens = tokenize('<!-- note --><a href="x">link</a>', 'html')
  assert.deepEqual(kindsOf(tokens, '<!-- note -->'), ['comment'])
  assert.deepEqual(kindsOf(tokens, 'a'), ['tag', 'tag'])
  assert.deepEqual(kindsOf(tokens, 'href'), ['attr'])
  assert.deepEqual(kindsOf(tokens, '"x"'), ['string'])
})

test('markdown marks headings, fences, and wikilinks', () => {
  const tokens = tokenize('# Title\n\n```js\nconst a = 1\n```\n\nSee [[Other]] and `x`.', 'markdown')
  assert.deepEqual(kindsOf(tokens, '# Title'), ['keyword'])
  assert.deepEqual(kindsOf(tokens, 'const a = 1'), ['string'])
  assert.deepEqual(kindsOf(tokens, '[[Other]]'), ['attr'])
  assert.deepEqual(kindsOf(tokens, '`x`'), ['string'])
})

test('tokenizeLines keeps one array per line and the token kinds', () => {
  const lines = tokenizeLines('const a = 1\n// tail', 'javascript')
  assert.equal(lines.length, 2)
  assert.equal(lines[0]!.map(token => token.text).join(''), 'const a = 1')
  assert.ok(lines[0]!.some(token => token.kind === 'keyword'))
  assert.ok(lines[0]!.some(token => token.kind === 'number'))
  assert.deepEqual(lines[1]!.map(token => token.kind), ['comment'])
  assert.equal(lines[1]!.map(token => token.text).join(''), '// tail')
})

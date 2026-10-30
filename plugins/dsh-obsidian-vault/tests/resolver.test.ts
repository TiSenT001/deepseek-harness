import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LinkResolver } from '../src/vault/resolver.ts'

const notes = [
  { path: 'Alpha.md', title: 'Alpha', aliases: [] },
  { path: 'folder/Alpha.md', title: 'Alpha', aliases: [] },
  { path: 'folder/Beta.md', title: 'Beta', aliases: ['bee'] },
  { path: 'deep/nested/Gamma.md', title: 'Gamma', aliases: [] },
  { path: 'Gamma.md', title: 'Gamma2', aliases: [] },
]

test('resolves an exact path before a basename', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('folder/Alpha'), { status: 'resolved', path: 'folder/Alpha.md' })
})

test('resolves a unique basename', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('Beta'), { status: 'resolved', path: 'folder/Beta.md' })
})

test('prefers the shortest path when basenames collide', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('Alpha'), { status: 'resolved', path: 'Alpha.md' })
})

test('reports ambiguity when equally short candidates collide', () => {
  const resolver = new LinkResolver([
    { path: 'one/Same.md', title: 'Same', aliases: [] },
    { path: 'two/Same.md', title: 'Same', aliases: [] },
  ])
  assert.deepEqual(resolver.resolve('Same'), { status: 'ambiguous', candidates: ['one/Same.md', 'two/Same.md'] })
})

test('resolves frontmatter aliases case-insensitively', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('BEE'), { status: 'resolved', path: 'folder/Beta.md' })
})

test('treats unknown targets and empty targets as unresolved', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('Missing'), { status: 'unresolved' })
  assert.deepEqual(resolver.resolve('   '), { status: 'unresolved' })
})

test('accepts authored .md suffix, backslashes, and leading slash', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('folder\\Beta.md'), { status: 'resolved', path: 'folder/Beta.md' })
  assert.deepEqual(resolver.resolve('/folder/Beta'), { status: 'resolved', path: 'folder/Beta.md' })
})

test('resolves ./ and ../ against the source folder', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(
    resolver.resolve('../Beta', 'folder/sub/Note.md'),
    { status: 'resolved', path: 'folder/Beta.md' },
  )
  assert.deepEqual(
    resolver.resolve('./Alpha', 'folder/Note.md'),
    { status: 'resolved', path: 'folder/Alpha.md' },
  )
})

test('prefers candidates near the source folder over shorter paths', () => {
  const resolver = new LinkResolver([
    { path: 'a/Same.md', title: 'Same', aliases: [] },
    { path: 'b/deep/Same.md', title: 'Same', aliases: [] },
  ])
  assert.deepEqual(
    resolver.resolve('Same', 'b/deep/Note.md'),
    { status: 'resolved', path: 'b/deep/Same.md' },
  )
})

test('a root-anchored target has no suffix fallback', () => {
  const resolver = new LinkResolver(notes)
  assert.deepEqual(resolver.resolve('/Beta', 'folder/Note.md'), { status: 'unresolved' })
})

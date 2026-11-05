/**
 * Parsed-document cache: a reopened canvas must not be re-read and re-parsed when
 * the file on disk has not changed.
 * @module dsh-obsidian-vault/tests/pur-doc-cache
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DocumentCache, DOCUMENT_CACHE_LIMIT } from '../src/client/pur/doc-cache.ts'

test('a matching stamp returns the parsed document', () => {
  const cache = new DocumentCache<string>()
  cache.set('a.purstudio', { size: 10, mtime: 100 }, 'doc-a')
  assert.equal(cache.get('a.purstudio', { size: 10, mtime: 100 }), 'doc-a')
})

test('a rewritten file invalidates the entry', () => {
  const cache = new DocumentCache<string>()
  cache.set('a.purstudio', { size: 10, mtime: 100 }, 'doc-a')
  assert.equal(cache.get('a.purstudio', { size: 10, mtime: 101 }), undefined)
  assert.equal(cache.size, 0, 'stale entry should be dropped')
})

test('a size difference alone keeps the entry, since the time is the version', () => {
  const cache = new DocumentCache<string>()
  cache.set('a.purstudio', { size: 10, mtime: 100 }, 'doc-a')
  assert.equal(cache.get('a.purstudio', { size: 11, mtime: 100 }), 'doc-a')
})

test('deleting an entry models this client writing the file', () => {
  const cache = new DocumentCache<string>()
  cache.set('a.purstudio', { size: 10, mtime: 100 }, 'doc-a')
  cache.delete('a.purstudio')
  assert.equal(cache.get('a.purstudio', { size: 10, mtime: 100 }), undefined)
})

test('the cache stays bounded and drops the oldest entry', () => {
  const cache = new DocumentCache<string>(2)
  cache.set('a', { size: 1, mtime: 1 }, 'a')
  cache.set('b', { size: 1, mtime: 1 }, 'b')
  cache.set('c', { size: 1, mtime: 1 }, 'c')
  assert.equal(cache.size, 2)
  assert.equal(cache.get('a', { size: 1, mtime: 1 }), undefined)
  assert.equal(cache.get('c', { size: 1, mtime: 1 }), 'c')
})

test('reading refreshes recency', () => {
  const cache = new DocumentCache<string>(2)
  cache.set('a', { size: 1, mtime: 1 }, 'a')
  cache.set('b', { size: 1, mtime: 1 }, 'b')
  cache.get('a', { size: 1, mtime: 1 })
  cache.set('c', { size: 1, mtime: 1 }, 'c')
  assert.equal(cache.get('a', { size: 1, mtime: 1 }), 'a')
  assert.equal(cache.get('b', { size: 1, mtime: 1 }), undefined)
})

test('the default limit matches the exported constant', () => {
  const cache = new DocumentCache<string>()
  for (let index = 0; index < DOCUMENT_CACHE_LIMIT + 2; index++) {
    cache.set(`doc-${index}`, { size: 1, mtime: 1 }, `doc-${index}`)
  }
  assert.equal(cache.size, DOCUMENT_CACHE_LIMIT)
})

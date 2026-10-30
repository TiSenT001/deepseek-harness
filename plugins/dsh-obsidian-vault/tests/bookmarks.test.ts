import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bookmarkEntries, withBookmark } from '../src/client/ui/bookmarks.ts'

test('an absent document has no bookmarks', () => {
  assert.deepEqual(bookmarkEntries(undefined), [])
  assert.deepEqual(bookmarkEntries({}), [])
  assert.deepEqual(bookmarkEntries({ items: 'nope' }), [])
})

test('only file entries are surfaced, in stored order and de-duplicated', () => {
  const entries = bookmarkEntries({
    items: [
      { type: 'file', path: 'a.md', title: 'Alpha' },
      { type: 'folder', path: 'Daily' },
      { type: 'group', path: 'Reading', items: [] },
      { type: 'file', path: 'b.md' },
      { type: 'file', path: 'a.md' },
      { type: 'file', path: '' },
      { type: 'file', path: 42 },
    ],
  })
  assert.deepEqual(entries, [{ path: 'a.md', title: 'Alpha' }, { path: 'b.md' }])
})

test('adding a bookmark appends one file entry and keeps unrelated keys', () => {
  const stored = { items: [{ type: 'folder', path: 'Daily' }], extra: 'keep' }
  assert.deepEqual(withBookmark(stored, 'a.md', true), {
    items: [{ type: 'folder', path: 'Daily' }, { type: 'file', path: 'a.md' }],
    extra: 'keep',
  })
})

test('adding twice is idempotent, including for stored documents', () => {
  const once = withBookmark(undefined, 'a.md', true)
  assert.deepEqual(withBookmark(once, 'a.md', true), once)
  assert.deepEqual(bookmarkEntries(once), [{ path: 'a.md' }])
})

test('removing drops the file entry and leaves folder and group entries', () => {
  const stored = {
    items: [
      { type: 'file', path: 'a.md' },
      { type: 'folder', path: 'Daily' },
      { type: 'group', path: 'Reading', items: [{ type: 'file', path: 'a.md' }] },
    ],
  }
  assert.deepEqual(withBookmark(stored, 'a.md', false).items, [
    { type: 'folder', path: 'Daily' },
    { type: 'group', path: 'Reading', items: [{ type: 'file', path: 'a.md' }] },
  ])
  assert.deepEqual(bookmarkEntries(withBookmark(stored, 'a.md', false)), [])
})

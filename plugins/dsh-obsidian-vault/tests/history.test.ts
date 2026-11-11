import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSnapshotId } from '../src/history-store.ts'

test('snapshot ids carry the note key and capture time', () => {
  const parsed = parseSnapshotId('abc123.1700000000000-deadbeef.md', 'abc123')
  assert.deepEqual(parsed, { savedAt: 1700000000000 })
})

test('foreign or malformed snapshot ids are rejected', () => {
  assert.equal(parseSnapshotId('other.1700000000000-deadbeef.md', 'abc123'), undefined)
  assert.equal(parseSnapshotId('abc123.1700000000000.md', 'abc123'), undefined)
  assert.equal(parseSnapshotId('abc123.notatime-deadbeef.md', 'abc123'), undefined)
  assert.equal(parseSnapshotId('abc123.1700000000000-deadbeef.txt', 'abc123'), undefined)
})

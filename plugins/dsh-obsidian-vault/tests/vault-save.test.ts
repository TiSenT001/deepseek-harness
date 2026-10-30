import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { VaultIndex } from '../src/vault/index.ts'
import { NodeFs } from './helpers/node-fs.ts'

const roots: string[] = []
let root: string
let vault: VaultIndex

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-save-'))
  roots.push(root)
  await writeFile(join(root, 'note.md'), '# Note\n\nbody\n')
  vault = new VaultIndex(new NodeFs(root), {
    root,
    ignore: ['.obsidian'],
    maxFileBytes: 1024,
    maxIndexBytes: 1024 * 1024,
    maxDepth: 6,
  })
  await vault.refresh()
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

test('writes the note and reports the fresh modification time', async () => {
  const before = await vault.file('note.md')
  assert.ok(before?.mtime !== undefined)
  const result = await vault.saveNote('note.md', '# Changed\n')
  assert.equal(result.ok, true)
  assert.ok(result.ok && result.mtime > 0)
  assert.equal(await readFile(join(root, 'note.md'), 'utf8'), '# Changed\n')
  assert.equal((await vault.note('note.md'))?.content, '# Changed\n')
})

test('accepts a base time that still matches the file', async () => {
  const file = await vault.file('note.md')
  assert.ok(file?.mtime !== undefined)
  const result = await vault.saveNote('note.md', '# Same mtime\n', file.mtime)
  assert.equal(result.ok, true)
})

test('rejects a stale base time with 409 and leaves the file untouched', async () => {
  const file = await vault.file('note.md')
  assert.ok(file !== undefined)
  const stale = (file.mtime ?? 0) - 5000
  const result = await vault.saveNote('note.md', '# Should not land\n', stale)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.status, 409)
  assert.equal(await readFile(join(root, 'note.md'), 'utf8'), '# Note\n\nbody\n')
})

test('a written file invalidates the stale guard for the next save', async () => {
  const first = await vault.saveNote('note.md', '# First\n')
  assert.ok(first.ok)
  const stale = first.ok ? first.mtime - 1 : 0
  const second = await vault.saveNote('note.md', '# Second\n', stale)
  assert.equal(second.ok, false)
})

test('rejects non-Markdown paths, unindexed notes, and oversized text', async () => {
  await writeFile(join(root, 'blob.bin'), 'x')
  await vault.refresh()
  assert.deepEqual(await vault.saveNote('blob.bin', 'x'), { ok: false, status: 400, error: 'not a markdown note' })
  assert.deepEqual(await vault.saveNote('missing.md', 'x'), { ok: false, status: 404, error: 'note not found' })
  const oversized = 'x'.repeat(2048)
  const result = await vault.saveNote('note.md', oversized)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.status, 400)
})

test('keeps the modification time guard readable across a real edit', async () => {
  const file = await vault.file('note.md')
  assert.ok(file?.mtime !== undefined)
  const later = new Date(Date.now() + 60_000)
  await utimes(join(root, 'note.md'), later, later)
  const bumped = await stat(join(root, 'note.md'))
  const result = await vault.saveNote('note.md', '# Guarded\n', file.mtime)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.status, 409)
  assert.ok(result.ok === false && result.mtime !== undefined && Math.round(result.mtime) === Math.round(bumped.mtimeMs))
})

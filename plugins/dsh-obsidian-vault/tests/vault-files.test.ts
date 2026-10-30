import assert from 'node:assert/strict'
import { mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { VaultFiles, VaultPathError } from '../src/vault/files.ts'

const roots: string[] = []

async function vault(): Promise<{ files: VaultFiles; root: string }> {
  const root = await mkdtemp(join(tmpdir(), 'ov-files-'))
  roots.push(root)
  return { files: new VaultFiles(root), root }
}

after(async () => {
  const { rm } = await import('node:fs/promises')
  for (const root of roots) await rm(root, { recursive: true, force: true })
})

test('removes one file', async () => {
  const { files, root } = await vault()
  await writeFile(join(root, 'gone.md'), 'x')
  await files.remove('gone.md')
  assert.deepEqual(await readdir(root), [])
})

test('creates nested directories', async () => {
  const { files, root } = await vault()
  await files.mkdir('a/b/c')
  assert.deepEqual(await readdir(join(root, 'a', 'b')), ['c'])
})

test('reads modification time', async () => {
  const { files, root } = await vault()
  await writeFile(join(root, 't.md'), 'x')
  const mtime = await files.mtimeOf('t.md')
  assert.equal(typeof mtime, 'number')
  assert.equal(await files.mtimeOf('missing.md'), undefined)
})

test('reports file metadata and hides directories', async () => {
  const { files, root } = await vault()
  await writeFile(join(root, 'a.txt'), 'hello')
  await files.mkdir('folder')
  const info = await files.info('a.txt')
  assert.equal(info?.size, 5)
  assert.equal(typeof info?.mtime, 'number')
  assert.equal(await files.info('folder'), undefined)
  assert.equal(await files.info('missing.txt'), undefined)
})

test('reads a byte-capped prefix and reports truncation', async () => {
  const { files, root } = await vault()
  await writeFile(join(root, 'long.txt'), 'abcdefghij')
  assert.deepEqual(await files.readPrefix('long.txt', 4), { text: 'abcd', truncated: true, size: 10 })
  assert.deepEqual(await files.readPrefix('long.txt', 100), { text: 'abcdefghij', truncated: false, size: 10 })
})

test('refuses paths that escape the root', async () => {
  const { files } = await vault()
  assert.throws(() => files.absolute('../outside.md'), VaultPathError)
  assert.throws(() => files.absolute('a/../../outside.md'), VaultPathError)
})

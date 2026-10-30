import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { VaultIndex } from '../src/vault/index.ts'
import { NodeFs } from './helpers/node-fs.ts'

const roots: string[] = []
let root: string
let vault: VaultIndex

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-file-'))
  roots.push(root)
  await mkdir(join(root, 'assets'))
  await mkdir(join(root, 'empty'))
  await writeFile(join(root, 'note.md'), '# Note\n')
  await writeFile(join(root, 'assets', 'pic.png'), 'png-bytes')
  await writeFile(join(root, 'src.ts'), 'const a: number = 1\n')
  await writeFile(join(root, 'blob.bin'), Buffer.from([0, 1, 2]))
  vault = new VaultIndex(new NodeFs(root), {
    root,
    ignore: ['.obsidian'],
    maxFileBytes: 1024 * 1024,
    maxIndexBytes: 1024 * 1024,
    maxDepth: 6,
  })
  await vault.refresh()
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

test('lists attachments and empty folders in the explorer tree', () => {
  const names = vault.tree().map(node => `${node.kind}:${node.name}`)
  assert.deepEqual(names, ['dir:assets', 'dir:empty', 'file:blob.bin', 'file:note.md', 'file:src.ts'])
})

test('describes a text file with its source prefix, language, and size', async () => {
  const file = await vault.file('src.ts')
  assert.ok(file !== undefined)
  assert.equal(file.kind, 'code')
  assert.equal(file.language, 'typescript')
  assert.equal(file.text, 'const a: number = 1\n')
  assert.equal(file.truncated, false)
  assert.equal(file.size, Buffer.byteLength('const a: number = 1\n'))
  assert.equal(typeof file.mtime, 'number')
})

test('answers image and binary paths with metadata only', async () => {
  const image = await vault.file('assets/pic.png')
  assert.ok(image !== undefined)
  assert.equal(image.kind, 'image')
  assert.equal(image.mime, 'image/png')
  assert.equal(image.text, undefined)
  assert.equal(image.truncated, false)
  const binary = await vault.file('blob.bin')
  assert.equal(binary?.kind, 'binary')
  assert.equal(binary?.text, undefined)
})

test('reads markdown through the same file route', async () => {
  const file = await vault.file('note.md')
  assert.equal(file?.kind, 'markdown')
  assert.equal(file?.text, '# Note\n')
})

test('returns undefined for directories and unindexed paths', async () => {
  assert.equal(await vault.file('assets'), undefined)
  assert.equal(await vault.file('missing.png'), undefined)
  assert.equal(await vault.file('../outside.md'), undefined)
})

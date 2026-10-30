import assert from 'node:assert/strict'
import { mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { VaultIndex } from '../src/vault/index.ts'
import { NodeFs, ReadOnlyWriteFs } from './helpers/node-fs.ts'

const roots: string[] = []
let root: string
let fs: NodeFs
let vault: VaultIndex

const OPTIONS = {
  ignore: ['.obsidian'],
  maxFileBytes: 1024 * 1024,
  maxIndexBytes: 1024 * 1024,
  maxDepth: 6,
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-ops-'))
  roots.push(root)
  await writeFile(join(root, 'alpha.md'), '# Alpha\n\n[[Beta]]', 'utf8')
  await writeFile(join(root, 'beta.md'), '# Beta', 'utf8')
  fs = new NodeFs(root)
  vault = new VaultIndex(fs, { ...OPTIONS, root })
  await vault.refresh()
})

after(async () => {
  const { rm } = await import('node:fs/promises')
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

test('creates a note through the filesystem service', async () => {
  assert.equal(await vault.create('gamma.md'), true)
  assert.ok(vault.status().notes === 3)
  assert.deepEqual(await readdir(root), ['alpha.md', 'beta.md', 'gamma.md'])
})

test('creates a note through the direct-write fallback when the service denies writes', async () => {
  const denied = new VaultIndex(new ReadOnlyWriteFs(root), { ...OPTIONS, root })
  await denied.refresh()
  assert.equal(await denied.create('delta.md'), true)
  assert.deepEqual(await readdir(root), ['alpha.md', 'beta.md', 'delta.md'])
})

test('renames a note and reindexes it', async () => {
  await vault.rename('alpha.md', 'renamed.md')
  assert.deepEqual((await readdir(root)).sort(), ['beta.md', 'renamed.md', '.trash'].sort())
  assert.deepEqual(vault.tree().map(node => node.name), ['beta.md', 'renamed.md'])
})

test('renames a note and rewrites links to it', async () => {
  await writeFile(join(root, 'gamma.md'), 'see [[alpha]] and [[alpha|A]]', 'utf8')
  await vault.refresh()
  await vault.rename('alpha.md', 'renamed.md')
  const { readFile } = await import('node:fs/promises')
  const text = await readFile(join(root, 'gamma.md'), 'utf8')
  assert.equal(text, 'see [[renamed]] and [[renamed|A]]')
})

test('rename refuses to overwrite an existing note', async () => {
  await assert.rejects(() => vault.rename('alpha.md', 'beta.md'), /already exists/)
  assert.deepEqual((await readdir(root)).sort(), ['alpha.md', 'beta.md'].sort())
})

test('rename rejects names with separators or dots', async () => {
  await assert.rejects(() => vault.rename('alpha.md', '../evil.md'), /invalid name/)
  await assert.rejects(() => vault.rename('alpha.md', 'sub/b.md'), /invalid name/)
  await assert.rejects(() => vault.rename('alpha.md', '..'), /invalid name/)
})

test('moves a deleted note into .trash instead of removing it', async () => {
  const trashed = await vault.remove('alpha.md')
  assert.match(trashed, /^\.trash\//)
  assert.deepEqual((await readdir(root)).sort(), ['beta.md', '.trash'].sort())
  assert.deepEqual(vault.tree().map(node => node.name), ['beta.md'])
  const trash = await readdir(join(root, '.trash'))
  assert.equal(trash.length, 1)
  assert.match(trash[0]!, /-alpha\.md$/)
})

test('creates a folder and a note inside it', async () => {
  await vault.makeFolder('notes')
  assert.equal(await vault.create('notes/first.md'), true)
  const tree = vault.tree()
  const folder = tree.find(node => node.name === 'notes')
  assert.ok(folder !== undefined)
  assert.deepEqual(folder.children?.map(node => node.name), ['first.md'])
})

test('shows a folder with no notes in the tree', async () => {
  await vault.makeFolder('empty/nested')
  const tree = vault.tree()
  const folder = tree.find(node => node.name === 'empty')
  assert.ok(folder !== undefined)
  assert.equal(folder.kind, 'dir')
  assert.deepEqual(folder.children?.map(node => node.name), ['nested'])
  assert.equal(folder.children?.[0]?.kind, 'dir')
})

test('reports mtimes on tree files', async () => {
  const tree = vault.tree()
  const file = tree.find(node => node.name === 'alpha.md')
  assert.equal(typeof file?.mtime, 'number')
})

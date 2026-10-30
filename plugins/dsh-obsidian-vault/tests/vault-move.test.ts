import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { VaultIndex } from '../src/vault/index.ts'
import { NodeFs } from './helpers/node-fs.ts'

const roots: string[] = []
const OPTIONS = {
  ignore: ['.obsidian'],
  maxFileBytes: 1024 * 1024,
  maxIndexBytes: 1024 * 1024,
  maxDepth: 6,
}

async function vault(): Promise<{ root: string; vault: VaultIndex }> {
  const root = await mkdtemp(join(tmpdir(), 'ov-move-'))
  roots.push(root)
  await writeFile(join(root, 'target.md'), '# Target\n\nbody', 'utf8')
  await writeFile(join(root, 'ref-path.md'), 'see [[target]] and [[target#Section]]', 'utf8')
  await writeFile(join(root, 'ref-embed.md'), '![[target#^blk1]]', 'utf8')
  const instance = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await instance.refresh()
  return { root, vault: instance }
}

after(async () => {
  const { rm } = await import('node:fs/promises')
  for (const root of roots) await rm(root, { recursive: true, force: true })
})

test('moves a note and keeps resolving its links', async () => {
  const { root, vault: index } = await vault()
  const result = await index.move('target.md', 'archive/target.md')
  assert.equal(result.moved, 'archive/target.md')
  assert.equal((await readdir(join(root, 'archive'))).includes('target.md'), true)
  assert.equal((await readdir(root)).includes('target.md'), false)
  assert.ok(index.status().notes === 3)
  assert.ok(index.backlinksOf('archive/target.md').length >= 2)
})

test('writes a rollback backup into .trash', async () => {
  const { root, vault: index } = await vault()
  const result = await index.move('target.md', 'archive/target.md')
  assert.ok(result.backup !== undefined)
  assert.match(result.backup!, /^\.trash\/move-/)
  const trash = await readdir(join(root, '.trash'))
  assert.equal(trash.length, 1)
})

test('rewrites path links but leaves a unique bare title alone', async () => {
  const { root } = await vault()
  const index = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await index.refresh()
  await writeFile(join(root, 'ref-path.md'), 'see [[target]] and [[target#Section]]', 'utf8')
  await index.refresh()
  const result = await index.move('target.md', 'archive/target.md')
  assert.equal(result.rewritten.length, 0)
  const text = await readFile(join(root, 'ref-path.md'), 'utf8')
  assert.equal(text, 'see [[target]] and [[target#Section]]')
})

test('rewrites links that used the old path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ov-move-'))
  roots.push(root)
  await mkdir(join(root, 'notes'), { recursive: true })
  await writeFile(join(root, 'notes', 'target.md'), '# Target', 'utf8')
  await writeFile(join(root, 'ref-path.md'), 'see [[notes/target]]', 'utf8')
  const index = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await index.refresh()
  const result = await index.move('notes/target.md', 'archive/target.md')
  assert.equal(result.rewritten.length, 1)
  const text = await readFile(join(root, 'ref-path.md'), 'utf8')
  assert.ok(text.includes('[[archive/target]]'))
})

test('refuses to overwrite an existing target', async () => {
  const { root, vault: index } = await vault()
  await writeFile(join(root, 'archive-target.md'), 'x', 'utf8')
  await assert.rejects(() => index.move('target.md', 'archive-target.md'))
  assert.equal((await readdir(root)).includes('target.md'), true)
})

test('renaming a file rewrites bare titles too', async () => {
  const { root } = await vault()
  const index = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await index.refresh()
  const result = await index.move('target.md', 'archive/renamed.md')
  assert.ok(result.rewritten.length >= 1)
  const text = await readFile(join(root, 'ref-path.md'), 'utf8')
  assert.ok(text.includes('[[archive/renamed]]'))
})

test('moves a folder and rewrites links to notes inside it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ov-move-'))
  roots.push(root)
  await mkdir(join(root, 'proj'), { recursive: true })
  await writeFile(join(root, 'proj', 'a.md'), '# A', 'utf8')
  await writeFile(join(root, 'proj', 'b.md'), '# B', 'utf8')
  await writeFile(join(root, 'ref.md'), 'see [[proj/a]] and [[proj/b]]', 'utf8')
  const index = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await index.refresh()
  const result = await index.move('proj', 'areas/proj')
  assert.equal(result.moved, 'areas/proj')
  const text = await readFile(join(root, 'ref.md'), 'utf8')
  assert.ok(text.includes('[[areas/proj/a]]'))
  assert.ok(text.includes('[[areas/proj/b]]'))
  assert.equal(index.backlinksOf('areas/proj/a.md').length, 1)
})

test('refuses to move a folder into its own descendant', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ov-move-'))
  roots.push(root)
  await mkdir(join(root, 'a', 'b'), { recursive: true })
  await writeFile(join(root, 'a', 'n.md'), '# N', 'utf8')
  const index = new VaultIndex(new NodeFs(root), { ...OPTIONS, root })
  await index.refresh()
  await assert.rejects(() => index.move('a', 'a/b/a'), /into itself/)
  assert.deepEqual((await readdir(join(root, 'a'))).sort(), ['b', 'n.md'].sort())
})

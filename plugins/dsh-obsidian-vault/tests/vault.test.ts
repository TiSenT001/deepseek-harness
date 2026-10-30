import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { VaultIndex, type FsEntryLike, type FsLike, type FsTargetLike } from '../src/vault/index.ts'
import { MemFs } from './helpers/memfs.ts'

const ROOT = 'C:/vault'

const OPTIONS = {
  root: ROOT,
  ignore: ['.obsidian'],
  maxFileBytes: 1024 * 1024,
  maxIndexBytes: 1024 * 1024,
  maxDepth: 6,
}

function seeded(): MemFs {
  const fs = new MemFs(ROOT)
  fs.write(`${ROOT}/Alpha.md`, '# Alpha\n\n[[Beta]] and [[#Local]] and [[Missing]]\n\n#tag1')
  fs.write(`${ROOT}/folder/Beta.md`, '---\ntitle: Beta\naliases: [bee]\n---\n# Beta\n\n[[Alpha|first]]')
  fs.write(`${ROOT}/folder/Alpha.md`, 'duplicate\n\n[[beta]]')
  fs.write(`${ROOT}/notes/Deep.md`, '![[Alpha]]\n\n## Section')
  fs.write(`${ROOT}/media/pic.png`, 'png-bytes')
  fs.write(`${ROOT}/.obsidian/app.json`, '{}')
  return fs
}

let fs: MemFs
let vault: VaultIndex

beforeEach(async () => {
  fs = seeded()
  vault = new VaultIndex(fs, OPTIONS)
  await vault.refresh()
})

test('indexes markdown notes and lists attachments beside them, ignoring dot directories', () => {
  const status = vault.status()
  assert.equal(status.ready, true)
  assert.equal(status.notes, 4)
  const tree = vault.tree()
  assert.deepEqual(tree.map(node => `${node.kind}:${node.name}`), [
    'dir:folder', 'dir:media', 'dir:notes', 'file:Alpha.md',
  ])
  assert.deepEqual(tree.find(node => node.name === 'media')?.children?.map(node => node.name), ['pic.png'])
})

test('resolves links with the shortest-path rule and reports unresolved targets', async () => {
  const note = await vault.note('Alpha.md')
  assert.ok(note !== undefined)
  assert.deepEqual(note.links.map(link => [link.target, link.status, link.path]), [
    ['Beta', 'resolved', 'folder/Beta.md'],
    ['', 'unresolved', undefined],
    ['Missing', 'unresolved', undefined],
  ])
})

test('resolves image embeds to attachment paths without backlinks', async () => {
  fs.write(`${ROOT}/notes/Picture.md`, '![[pic.png]]')
  await vault.refresh()
  const note = await vault.note('notes/Picture.md')
  assert.deepEqual(note?.links.map(link => [link.target, link.status, link.path]), [
    ['pic.png', 'resolved', 'media/pic.png'],
  ])
  assert.deepEqual(vault.backlinksOf('media/pic.png'), [])
})

test('records backlinks with source line context', () => {
  const backlinks = vault.backlinksOf('folder/Beta.md')
  assert.deepEqual(backlinks.map(item => item.path).sort(), ['Alpha.md', 'folder/Alpha.md'])
  const fromAlpha = backlinks.find(item => item.path === 'Alpha.md')
  assert.ok(fromAlpha !== undefined)
  assert.match(fromAlpha.context, /\[\[Beta\]\]/)
})

test('finds unlinked mentions but not wikilinks', async () => {
  fs.write(`${ROOT}/notes/Mention.md`, 'Reading about Beta yesterday.\n\nAlso [[Alpha]] is linked.')
  await vault.refresh()
  const hits = vault.unlinkedMentions('folder/Beta.md')
  assert.deepEqual(hits.map(item => item.path), ['notes/Mention.md'])
  assert.match(hits[0]!.context, /Beta yesterday/)
})

test('counts tags from the body and from frontmatter', () => {
  assert.deepEqual(vault.tags(), [{ tag: 'tag1', count: 1 }])
})

test('searches titles before content', () => {
  const hits = vault.search('alpha')
  assert.ok(hits.length >= 2)
  assert.equal(hits[0]!.path, 'Alpha.md')
  assert.ok(hits.some(hit => hit.kind === 'title'))
})

test('builds a centered graph with edges in both directions', () => {
  const graph = vault.graph('folder/Beta.md', 1)
  const paths = graph.nodes.map(node => node.path).sort()
  assert.deepEqual(paths, ['Alpha.md', 'folder/Alpha.md', 'folder/Beta.md'])
  assert.ok(graph.edges.length >= 2)
})

test('creates a missing note and reports it after the rescan', async () => {
  const ok = await vault.create('New note.md')
  assert.equal(ok, true)
  assert.equal(vault.status().notes, 5)
  const note = await vault.note('New note.md')
  assert.equal(note?.content, '')
})

test('rescans only when content changed', async () => {
  const before = vault.version
  await vault.refresh()
  assert.equal(vault.version, before, 'an unchanged vault keeps its revision')
  fs.write(`${ROOT}/notes/Deep.md`, '![[Alpha]]\n\n## Section\n\n#fresh')
  await vault.refresh()
  assert.equal(vault.version, before + 1)
  assert.deepEqual(vault.tags().map(tag => tag.tag), ['fresh', 'tag1'])
})

test('honors the byte cap for in-memory content', async () => {
  const small = new VaultIndex(fs, { ...OPTIONS, maxIndexBytes: 1 })
  await small.refresh()
  const note = await small.note('Alpha.md')
  assert.equal(note?.content, '# Alpha\n\n[[Beta]] and [[#Local]] and [[Missing]]\n\n#tag1')
})

test('runs rescans one at a time so a stale snapshot cannot publish last', async () => {
  const slow = new SlowRootFs(fs, 8)
  const index = new VaultIndex(slow, OPTIONS)
  await index.refresh()
  fs.write(`${ROOT}/Late.md`, 'late')
  await Promise.all([index.refresh(), index.refresh()])
  assert.equal(slow.peak, 1, 'two scans listed the root at the same time')
  assert.notEqual(await index.note('Late.md'), undefined)
})

/** MemFs wrapper whose vault-root listings take time and record overlap. */
class SlowRootFs implements FsLike {
  /** Most root listings that ran at the same time. */
  peak = 0
  private active = 0
  private readonly inner: MemFs
  private readonly delayMs: number

  /**
   * @param inner - filesystem holding the vault.
   * @param delayMs - time each root listing takes.
   */
  constructor(inner: MemFs, delayMs: number) {
    this.inner = inner
    this.delayMs = delayMs
  }

  resolve(path: string): Promise<FsTargetLike> {
    return this.inner.resolve(path)
  }

  async listDir(target: FsTargetLike): Promise<readonly FsEntryLike[]> {
    if (target.displayPath === ROOT) {
      this.active += 1
      this.peak = Math.max(this.peak, this.active)
      await new Promise(resolve => setTimeout(resolve, this.delayMs))
      this.active -= 1
    }
    return this.inner.listDir(target)
  }

  readText(target: FsTargetLike): Promise<string> {
    return this.inner.readText(target)
  }

  writeText(target: FsTargetLike, content: string): Promise<unknown> {
    return this.inner.writeText(target, content)
  }

  contains(parent: FsTargetLike, child: FsTargetLike): boolean {
    return this.inner.contains(parent, child)
  }
}

import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TreeNodeDto } from '../src/protocol.ts'
import { markdownPaths, mergeNoteBodies } from '../src/client/ui/note-merge.ts'

test('merging appends the source under a level-two heading', () => {
  const merged = mergeNoteBodies('# Target\n\nbody', { title: 'Source', content: '# Source\n\nother' })
  assert.equal(merged, '# Target\n\nbody\n\n## Source\n\n# Source\n\nother\n')
})

test('merging into an empty note keeps only the section', () => {
  const merged = mergeNoteBodies('', { title: 'Source', content: 'text' })
  assert.equal(merged, '## Source\n\ntext\n')
})

test('an empty source still gets a heading', () => {
  const merged = mergeNoteBodies('target', { title: 'Source', content: '   ' })
  assert.equal(merged, 'target\n\n## Source\n')
})

test('markdown paths exclude the target and sort by path', () => {
  const tree: TreeNodeDto[] = [
    { name: 'b', path: 'b.md', kind: 'file' },
    { name: 'folder', path: 'folder', kind: 'dir', children: [
      { name: 'a', path: 'folder/a.md', kind: 'file' },
      { name: 'image', path: 'folder/a.png', kind: 'file' },
    ] },
  ]
  assert.deepEqual(markdownPaths(tree, 'b.md'), ['folder/a.md'])
})

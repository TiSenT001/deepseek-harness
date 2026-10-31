import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assetUrlFor, newUrlFor, openUrlFor, parseSentinel, rewriteMarkdown, SIZE_MARK } from '../src/client/markdown/rewrite.ts'
import { appendReferences, selectedImageReferences } from '../src/pur-kernel/embed-note.ts'

const openUrl = (path: string, options?: { anchor?: string; ambiguous?: boolean }): string => openUrlFor(path, options)

test('resolved wikilinks become sentinel open links with the alias label', () => {
  const rendered = rewriteMarkdown('See [[Alpha|first]] and [[Alpha]].', {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'resolved', path: 'Notes/Alpha.md' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.equal(rendered, 'See [first](https://dsh-obsidian.invalid/open?p=Notes%2FAlpha.md) and [Alpha](https://dsh-obsidian.invalid/open?p=Notes%2FAlpha.md).')
})

test('anchors ride the open link and same-file links target the current note', () => {
  const rendered = rewriteMarkdown('[[Alpha#Part]] and [[#Local]]', {
    selfPath: 'Self.md',
    resolve: target => (target === ''
      ? { status: 'unresolved' }
      : { status: 'resolved', path: 'Alpha.md' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.match(rendered, /open\?p=Alpha\.md&h=Part/)
  assert.match(rendered, /open\?p=Self\.md&h=Local/)
})

test('unresolved targets become create links', () => {
  const rendered = rewriteMarkdown('[[Missing]]', {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'unresolved' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.equal(rendered, '[Missing](https://dsh-obsidian.invalid/new?t=Missing)')
})

test('ambiguous resolution opens the first candidate and marks the link', () => {
  const rendered = rewriteMarkdown('[[Same]]', {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'ambiguous', candidates: ['one/Same.md', 'two/Same.md'] }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.match(rendered, /open\?p=one%2FSame\.md&a=1/)
})

test('image embeds use the asset route and note embeds transclude as quotes', () => {
  const rendered = rewriteMarkdown('![[picture.png]]\n\n![[Alpha]]', {
    selfPath: 'Self.md',
    resolve: target => ({ status: 'resolved', path: target === 'picture.png' ? 'media/picture.png' : 'Alpha.md' }),
    embeds: new Map([['Alpha.md', 'body line']]),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.match(rendered, /!\[\]\(\/obsidian\/api\/asset\?path=media%2Fpicture\.png\)/)
  assert.match(rendered, /> \*\*Alpha\*\*/)
  assert.match(rendered, /> body line/)
})

test('code fences and inline code keep their brackets', () => {
  const source = ['```', '[[Alpha]]', '```', 'inline `[[Alpha]]` text'].join('\n')
  const rendered = rewriteMarkdown(source, {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'resolved', path: 'Alpha.md' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.equal(rendered, source)
})

test('image embeds carry the authored size as an alt marker', () => {
  const context = {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'resolved' as const, path: 'media/picture.png' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  }
  const asset = '/obsidian/api/asset?path=media%2Fpicture.png'
  assert.equal(rewriteMarkdown('![[picture.png|300]]', context), `![${SIZE_MARK}300](${asset})`)
  assert.equal(rewriteMarkdown('![[picture.png|caption|300x200]]', context), `![caption ${SIZE_MARK}300x200](${asset})`)
  assert.equal(rewriteMarkdown('![[picture.png|caption]]', context), `![caption](${asset})`)
})

test('parseSentinel decodes open and create actions and ignores foreign links', () => {
  assert.deepEqual(parseSentinel('https://dsh-obsidian.invalid/open?p=A%2FB.md&h=Part&a=1'), {
    kind: 'open', path: 'A/B.md', anchor: 'Part', ambiguous: true,
  })
  assert.deepEqual(parseSentinel('https://dsh-obsidian.invalid/new?t=Missing'), { kind: 'new', target: 'Missing' })
  assert.deepEqual(parseSentinel('https://example.com/x'), { kind: 'none' })
  assert.deepEqual(parseSentinel('not a url'), { kind: 'none' })
})

test('pur.studio image references resolve through the canvas, not the network', () => {
  const rendered = rewriteMarkdown('![图](https://pur.studio/%E7%94%BB%E5%B8%83/pic%201.png)', {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'unresolved' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
    purImageUrl: (canvas, file) => `https://host.invalid/api/pur/image?canvas=${encodeURIComponent(canvas)}&file=${encodeURIComponent(file)}`,
  })
  assert.equal(
    rendered,
    '[![图](https://host.invalid/api/pur/image?canvas=%E7%94%BB%E5%B8%83&file=pic%201.png)](https://dsh-obsidian.invalid/open?p=Pur%E7%94%BB%E5%B8%83%2F%E7%94%BB%E5%B8%83.PurStudio)',
  )
})

test('without a resolver the authored pur.studio reference is left alone', () => {
  const source = '![图](https://pur.studio/canvas/pic.png)'
  const rendered = rewriteMarkdown(source, {
    selfPath: 'Self.md',
    resolve: () => ({ status: 'unresolved' }),
    openUrl,
    newUrl: newUrlFor,
    assetUrl: assetUrlFor,
  })
  assert.equal(rendered, source)
})

test('selected images become pur.studio references in canvas order', () => {
  const elements = [
    { id: 'i1', type: 'image', x: 0, y: 0, w: 10, h: 10, original: '附件/a b.png' },
    { id: 'g1', type: 'group', x: 0, y: 0, w: 10, h: 10, children: [
      { id: 'i2', type: 'image', x: 0, y: 0, w: 10, h: 10, original: '附件/二.png' },
    ] },
    { id: 'i3', type: 'image', x: 0, y: 0, w: 10, h: 10, original: '附件/c.png' },
  ]
  const references = selectedImageReferences(elements as never, new Set(['i1', 'i2']), '方案')
  assert.deepEqual(references, [
    '![a b.png](https://pur.studio/%E6%96%B9%E6%A1%88/a%20b.png)',
    '![二.png](https://pur.studio/%E6%96%B9%E6%A1%88/%E4%BA%8C.png)',
  ])
})

test('appending references keeps one blank line and a trailing newline', () => {
  assert.equal(appendReferences('body\n', ['![a](u)']), 'body\n\n![a](u)\n')
  assert.equal(appendReferences('', ['![a](u)']), '![a](u)\n')
  assert.equal(appendReferences('body', []), 'body')
})

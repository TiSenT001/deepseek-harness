import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rewriteMoveLinks } from '../src/vault/links.ts'

const resolveTo = (target: string): string | undefined =>
  target.toLowerCase() === 'alpha' || target.toLowerCase() === 'notes/alpha'
    ? 'notes/Alpha.md'
    : undefined

const base = { resolve: resolveTo, titleStillUnique: true, titleChanged: false }

test('a bare title that stays unique is left alone', () => {
  const source = 'see [[Alpha]] and [[alpha]]'
  const result = rewriteMoveLinks(source, 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.equal(result.changed, 0)
  assert.equal(result.text, source)
})

test('a path link is retargeted and keeps its alias', () => {
  const result = rewriteMoveLinks('[[notes/Alpha|alias]]', 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.equal(result.changed, 1)
  assert.equal(result.text, '[[archive/Alpha|alias]]')
})

test('heading anchors and block ids survive the rewrite', () => {
  const result = rewriteMoveLinks('[[Alpha#Section]]', 'notes/Alpha.md', 'archive/Alpha.md', {
    ...base,
    titleStillUnique: false,
  })
  assert.equal(result.text, '[[archive/Alpha#Section]]')
})

test('block references survive the rewrite', () => {
  const result = rewriteMoveLinks('[[Alpha#^blk1]]', 'notes/Alpha.md', 'archive/Alpha.md', {
    ...base,
    titleStillUnique: false,
  })
  assert.equal(result.text, '[[archive/Alpha#^blk1]]')
})

test('embeds keep the bang prefix', () => {
  const result = rewriteMoveLinks('![[notes/Alpha]]', 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.equal(result.text, '![[archive/Alpha]]')
})

test('links to other notes are untouched', () => {
  const source = '[[Beta]] and [[notes/Alpha]]'
  const result = rewriteMoveLinks(source, 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.equal(result.changed, 1)
  assert.equal(result.text, '[[Beta]] and [[archive/Alpha]]')
})

test('links inside fenced code are untouched', () => {
  const source = '```md\n[[notes/Alpha]]\n```\n[[notes/Alpha]]'
  const result = rewriteMoveLinks(source, 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.equal(result.changed, 1)
  assert.ok(result.text.includes('```md\n[[notes/Alpha]]\n```'))
})

test('a renamed file rewrites even bare titles', () => {
  const result = rewriteMoveLinks('[[Alpha]]', 'notes/Alpha.md', 'archive/Renamed.md', {
    ...base,
    titleChanged: true,
  })
  assert.equal(result.text, '[[archive/Renamed]]')
})

test('frontmatter text is preserved verbatim', () => {
  const source = '---\ntags: [x]\n---\n\n[[notes/Alpha]]\n'
  const result = rewriteMoveLinks(source, 'notes/Alpha.md', 'archive/Alpha.md', base)
  assert.ok(result.text.startsWith('---\ntags: [x]\n---\n'))
})

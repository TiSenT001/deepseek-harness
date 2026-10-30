import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitCallouts } from '../src/client/markdown/callouts.ts'

test('splits a callout out of surrounding Markdown', () => {
  const segments = splitCallouts(['before', '> [!note] Title', '> body line', 'after'].join('\n'))
  assert.equal(segments.length, 3)
  assert.deepEqual(segments[0], { kind: 'markdown', text: 'before' })
  assert.deepEqual(segments[1], {
    kind: 'callout', type: 'note', title: 'Title', foldable: false, folded: false, body: 'body line',
  })
  assert.deepEqual(segments[2], { kind: 'markdown', text: 'after' })
})

test('reads the fold marker and the default title', () => {
  const folded = splitCallouts('> [!warning]- Collapsed\n> hidden')
  assert.deepEqual(folded[0], {
    kind: 'callout', type: 'warning', title: 'Collapsed', foldable: true, folded: true, body: 'hidden',
  })
  const open = splitCallouts('> [!tip]+ Kept open\n> visible')
  assert.equal((open[0] as { folded: boolean }).folded, false)
  const untitled = splitCallouts('> [!info]\n> text')
  assert.equal((untitled[0] as { title: string }).title, '')
})

test('unknown callout kinds fall back to note', () => {
  const segments = splitCallouts('> [!mystery] X\n> y')
  assert.equal((segments[0] as { type: string }).type, 'note')
})

test('leaves fenced code and plain quotes alone', () => {
  const fenced = ['```', '> [!note] not a callout', '```'].join('\n')
  assert.deepEqual(splitCallouts(fenced), [{ kind: 'markdown', text: fenced }])
  const quote = ['> just a quote', '> second line'].join('\n')
  assert.deepEqual(splitCallouts(quote), [{ kind: 'markdown', text: quote }])
})

test('keeps blank lines inside the callout body when they are quoted', () => {
  const segments = splitCallouts(['> [!example] Demo', '> one', '>', '> two'].join('\n'))
  assert.equal(segments.length, 1)
  assert.equal((segments[0] as { body: string }).body, 'one\n\ntwo')
})

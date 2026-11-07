/**
 * `@笔记` composer references: candidate mapping and the bounded Markdown block
 * carried into the prompt when a note reference is submitted.
 * @module dsh-obsidian-vault/tests/note-reference
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatNoteReference,
  MAX_NOTE_CHARS,
  noteCandidates,
} from '../src/client/composer/note-reference.ts'
import { createNoteTriggerSource, NOTE_SOURCE } from '../src/client/composer/note-trigger.ts'

test('search hits become composer candidates with folder descriptions', () => {
  const candidates = noteCandidates([
    { path: '工具链/研究/总纲.md', title: '总纲' },
    { path: '根笔记.md', title: '根笔记' },
  ])
  assert.deepEqual(candidates, [
    {
      name: '工具链/研究/总纲.md',
      label: '总纲',
      description: '工具链/研究',
      icon: 'file',
      value: '工具链/研究/总纲.md',
    },
    {
      name: '根笔记.md',
      label: '根笔记',
      description: undefined,
      icon: 'file',
      value: '根笔记.md',
    },
  ])
})

test('at most twelve candidates reach the menu', () => {
  const hits = Array.from({ length: 20 }, (_, index) => ({ path: `n${index}.md`, title: `n${index}` }))
  assert.equal(noteCandidates(hits).length, 12)
})

test('a note reference becomes a bounded obsidian-note block', () => {
  const block = formatNoteReference({ path: 'a/b.md', title: 'b', vault: 'G:\\vault', text: '# b\n\nbody\n\n' })
  assert.equal(block, '<obsidian-note path="a/b.md" title="b" vault="G:\\vault">\n# b\n\nbody\n</obsidian-note>')
})

test('oversized notes are truncated with the full size and location', () => {
  const block = formatNoteReference({ path: 'big.md', title: 'big', vault: '/v', text: 'x'.repeat(MAX_NOTE_CHARS + 50), maxChars: 100 })
  assert.ok(block.includes('x'.repeat(100)))
  assert.ok(block.includes('已截断'))
  assert.ok(block.includes('/v\\big.md'))
})

test('a picked candidate inserts a reference chip with a wikilink clipboard form', () => {
  const source = createNoteTriggerSource({
    search: async () => [],
    file: async () => ({ text: '# note' }),
    vaultRoot: async () => 'G:\\vault',
  })
  assert.equal(source.trigger, '@')
  assert.equal(source.name, NOTE_SOURCE)
  const outcome = source.onPick({ candidate: { name: 'a/b.md', label: 'b', value: 'a/b.md' } })
  assert.deepEqual(outcome, {
    insert: {
      source: NOTE_SOURCE,
      ref: 'a/b.md',
      label: 'b',
      appearance: 'file',
      clipboardText: '@[[a/b.md]]',
    },
  })
})

test('serialization fetches the note and carries its Markdown', async () => {
  const source = createNoteTriggerSource({
    search: async () => [],
    file: async () => ({ text: '# 内容' }),
    vaultRoot: async () => 'G:\\vault',
  })
  const text = await source.codec.serialize('a/b.md', new AbortController().signal)
  assert.ok(text.includes('path="a/b.md"'))
  assert.ok(text.includes('vault="G:\\vault"'))
  assert.ok(text.includes('# 内容'))
})

test('candidates short-circuit when the request aborts', async () => {
  const source = createNoteTriggerSource({
    search: async () => [],
    file: async () => ({}),
    vaultRoot: async () => '',
  })
  const controller = new AbortController()
  controller.abort()
  assert.deepEqual(await source.candidates({ sessionId: 's' }, { query: 'x', signal: controller.signal }), [])
})

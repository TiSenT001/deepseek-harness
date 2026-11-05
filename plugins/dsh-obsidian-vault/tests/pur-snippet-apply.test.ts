/**
 * Snippet helpers: inserting a saved snippet must not duplicate pins or clobber a
 * title the user already typed, and saving must refuse blank entries.
 * @module dsh-obsidian-vault/tests/pur-snippet-apply
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applySnippet, snippetOf, suggestedSnippetTitle } from '../src/client/pur/snippet-apply.ts'
import type { SnippetDraft } from '../src/client/pur/snippet-apply.ts'
import type { CodeSnippetDto } from '../src/client/api.ts'

/** A saved snippet with one input and one output. */
const SNIPPET: CodeSnippetDto = {
  id: 's1',
  title: '最大值',
  code: 'function process(inputs) { return Math.max(inputs.a, inputs.b); }',
  inputs: [{ id: 'ia', label: 'a' }, { id: 'ib', label: 'b' }],
  outputs: [{ id: 'oa', label: 'result' }],
}

/**
 * Build a draft.
 * @param overrides - fields to replace.
 * @returns the draft.
 */
function draftOf(overrides: Partial<SnippetDraft> = {}): SnippetDraft {
  return { title: '', body: '', inputs: [], outputs: [], ...overrides }
}

test('inserting into an empty draft fills it', () => {
  const next = applySnippet(draftOf(), SNIPPET)
  assert.equal(next.body, SNIPPET.code)
  assert.equal(next.title, '最大值')
  assert.deepEqual(next.inputs.map((pin) => pin.label), ['a', 'b'])
  assert.deepEqual(next.outputs.map((pin) => pin.label), ['result'])
})

test('inserting into a body keeps the existing text above the snippet', () => {
  const next = applySnippet(draftOf({ body: 'notes' }), SNIPPET)
  assert.equal(next.body, `notes\n\n${SNIPPET.code}`)
})

test('a title the user typed wins over the snippet title', () => {
  const next = applySnippet(draftOf({ title: '我的节点' }), SNIPPET)
  assert.equal(next.title, '我的节点')
})

test('existing pins are not duplicated by an insert', () => {
  const next = applySnippet(draftOf({ inputs: [{ id: 'x', label: 'x' }] }), SNIPPET)
  assert.deepEqual(next.inputs.map((pin) => pin.label), ['x'])
  // The empty output list is filled, since it carries no meaning yet.
  assert.deepEqual(next.outputs.map((pin) => pin.label), ['result'])
})

test('shaping a draft drops blank pins and keeps the id source', () => {
  let counter = 0
  const snippet = snippetOf(
    draftOf({ title: 'x', body: 'code', inputs: [{ id: '', label: 'a' }, { id: 'keep', label: '' }], outputs: [] }),
    '  名字  ',
    () => `id${++counter}`,
  )
  assert.equal(snippet.title, '名字')
  assert.equal(snippet.inputs.length, 1)
  assert.equal(snippet.inputs[0]?.label, 'a')
  // The snippet takes the first id, so its pin takes the next one.\n  assert.equal(snippet.inputs[0]?.id, 'id2')
})

test('a suggested title comes from the first non-empty line', () => {
  assert.equal(suggestedSnippetTitle(draftOf({ body: '\n  const x = 1\nconst y = 2' }), 'fallback'), 'const x = 1')
  assert.equal(suggestedSnippetTitle(draftOf({ body: '   ' }), 'fallback'), 'fallback')
  assert.equal(suggestedSnippetTitle(draftOf({ title: 'Given' }), 'fallback'), 'Given')
})

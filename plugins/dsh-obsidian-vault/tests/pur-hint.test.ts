/**
 * Hover hint copy: the line must name the gesture the card actually supports.
 * @module dsh-obsidian-vault/tests/pur-hint
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canvasHintFor } from '../src/client/pur/hint.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import type { Translate } from '../src/client/i18n.ts'

/** A translator that echoes the key, so the assertion names the chosen label. */
const t = ((key: string) => key) as Translate

/**
 * Build one element of the given type.
 * @param type - element type.
 * @param extra - extra fields.
 * @returns the element.
 */
function elementOf(type: PurElement['type'], extra: Record<string, unknown> = {}): PurElement {
  const base = { id: 'e', type, x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, ...extra }
  if (type === 'text') return { ...base, type: 'text', content: '' } as PurElement
  if (type === 'image') return { ...base, type: 'image', original: 'pur-asset:a.png' } as PurElement
  if (type === 'group') return { ...base, type: 'group', content: '', children: [] } as PurElement
  return base as PurElement
}

test('empty canvas offers the add-text gesture', () => {
  assert.equal(canvasHintFor(null, t), 'canvasHintNew')
})

test('a text card offers editing', () => {
  assert.equal(canvasHintFor(elementOf('text'), t), 'canvasHintEdit')
})

test('a group offers group editing', () => {
  assert.equal(canvasHintFor(elementOf('group'), t), 'canvasHintGroup')
})

test('an image without a link offers the preview', () => {
  assert.equal(canvasHintFor(elementOf('image'), t), 'canvasHintPreview')
})

test('an image with a link offers opening the link', () => {
  assert.equal(canvasHintFor(elementOf('image', { link: 'https://example.com' }), t), 'canvasHintLink')
})

test('a note link offers opening the link', () => {
  assert.equal(canvasHintFor(elementOf('note-link', { link: 'note.md' }), t), 'canvasHintLink')
})

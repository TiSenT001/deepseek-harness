/**
 * Frontmatter property edits preserve every line they do not own, add missing
 * keys inside the existing block, and remove a key when the value is cleared.
 * @module dsh-obsidian-vault/tests/frontmatter-edit
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setFrontmatterProperty, yamlTextOf } from '../src/client/markdown/frontmatter-edit.ts'

const NOTE = ['---', 'title: old', '# keep this comment', 'tags: [a, b]', 'draft: false', '---', '# Body', '', 'text'].join('\n')

test('replaces one value and keeps every other line', () => {
  const edit = setFrontmatterProperty(NOTE, 'title', 'new')
  assert.equal(edit.value, 'new')
  assert.equal(edit.text, ['---', 'title: new', '# keep this comment', 'tags: [a, b]', 'draft: false', '---', '# Body', '', 'text'].join('\n'))
})

test('adds a missing key inside the existing block', () => {
  const edit = setFrontmatterProperty(NOTE, 'count', '7')
  assert.match(edit.text, /\ndraft: false\ncount: 7\n---\n/)
  assert.ok(edit.text.endsWith('# Body\n\ntext'))
})

test('removes a key when the value is cleared', () => {
  const edit = setFrontmatterProperty(NOTE, 'draft', '   ')
  assert.equal(edit.value, null)
  assert.ok(!edit.text.includes('draft: false'))
  assert.ok(edit.text.includes('tags: [a, b]'))
})

test('drops the fences when the last property is removed', () => {
  const edit = setFrontmatterProperty('---\ntitle: x\n---\nbody', 'title', '')
  assert.equal(edit.text, 'body')
})

test('creates a block when the note has none', () => {
  const edit = setFrontmatterProperty('# Title\n\nbody', 'topic', 'audit')
  assert.equal(edit.text, '---\ntopic: audit\n---\n# Title\n\nbody')
})

test('renders parsed values back to editable YAML text', () => {
  assert.equal(yamlTextOf('text'), 'text')
  assert.equal(yamlTextOf(42), '42')
  assert.equal(yamlTextOf(false), 'false')
  assert.equal(yamlTextOf(['a', 'b']), '[a, b]')
  assert.equal(yamlTextOf({ a: 1 }), '{"a":1}')
  assert.equal(yamlTextOf(null), '')
})

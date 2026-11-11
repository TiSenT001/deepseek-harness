import assert from 'node:assert/strict'
import { test } from 'node:test'
import { notePreview } from '../src/client/pur/loader.ts'

test('a note without a heading gets its title prefixed for the card', () => {
  const preview = notePreview({ path: 'a.md', title: '标题', content: '正文' })
  assert.equal(preview, '# 标题\n\n正文')
})

test('a note heading is kept as the card title', () => {
  const preview = notePreview({ path: 'a.md', title: '标题', content: '# 正文标题\n\n正文' })
  assert.equal(preview, '# 正文标题\n\n正文')
})

test('the preview is bounded so a canvas sidecar cannot swallow the note', () => {
  const preview = notePreview({ path: 'a.md', title: '标题', content: 'x'.repeat(4000) })
  assert.ok(preview.length <= 1600)
  assert.ok(preview.endsWith('…'))
})

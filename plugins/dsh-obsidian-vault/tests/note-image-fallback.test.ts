/**
 * Reading-view image fallback: a failed image stops showing the browser's
 * broken-image icon and becomes a quiet, localized placeholder that keeps the
 * space the image occupied. This package runs its specs on plain Node with no
 * DOM, so the specs pin the parts the browser path is assembled from: the
 * class pair, the stylesheet rules, the localized copy, and the reading view's
 * capture-phase wiring.
 * @module dsh-obsidian-vault/tests/note-image-fallback
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createT } from '../src/client/i18n.ts'
import { css } from '../src/client/ui/kit/classes.ts'
import { CONTENT_STYLE } from '../src/client/ui/kit/styles/content.ts'

/** Reading-view source, checked for the DOM wiring that needs a browser to run. */
const NOTE_VIEW = readFileSync(new URL('../src/client/ui/NoteView.tsx', import.meta.url), 'utf8')

/**
 * Declarations of the stylesheet rule written for one selector.
 * @param selector - selector exactly as the stylesheet spells it.
 * @returns the declarations between the braces.
 */
function ruleBody(selector: string): string {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(CONTENT_STYLE)
  if (match === null) assert.fail(`no stylesheet rule for ${selector}`)
  return match[1] ?? ''
}

test('the reading view owns a class pair for a failed image', () => {
  assert.equal(css.noteImageFailed, 'ov-note-image-failed')
  assert.equal(css.noteImagePlaceholder, 'ov-note-image-placeholder')
})

test('the stylesheet hides the failed image behind a dashed placeholder', () => {
  assert.match(ruleBody(`.ov-document img.${css.noteImageFailed}`), /display:\s*none/)
  const placeholder = ruleBody(`.ov-document .${css.noteImagePlaceholder}`)
  assert.match(placeholder, /border:\s*1px dashed/)
  assert.match(placeholder, /align-items:\s*center/)
  assert.match(placeholder, /justify-content:\s*center/)
  assert.doesNotMatch(placeholder, /display:\s*none/, 'the placeholder must stay visible')
})

test('both dictionaries name the placeholder copy', () => {
  assert.equal(createT('zh')('noteImageFailed'), '图片不可用')
  assert.equal(createT('en')('noteImageFailed'), 'Image unavailable')
})

test('the reading view listens for image errors in the capture phase', () => {
  assert.match(NOTE_VIEW, /addEventListener\('error'[^)]*, true\)/)
  assert.match(NOTE_VIEW, /t\('noteImageFailed'\)/)
  assert.ok(NOTE_VIEW.includes('css.noteImageFailed'), 'the failed-image class is never applied')
  assert.ok(NOTE_VIEW.includes('css.noteImagePlaceholder'), 'the placeholder class is never applied')
})

test('the reading view falls back to a 160x100 placeholder', () => {
  assert.match(NOTE_VIEW, /FALLBACK_IMAGE\s*=\s*\{\s*width:\s*160,\s*height:\s*100\s*\}/)
  assert.match(NOTE_VIEW, /Math\.round\(box\.width\) \|\| FALLBACK_IMAGE\.width/)
  assert.match(NOTE_VIEW, /Math\.round\(box\.height\) \|\| FALLBACK_IMAGE\.height/)
})

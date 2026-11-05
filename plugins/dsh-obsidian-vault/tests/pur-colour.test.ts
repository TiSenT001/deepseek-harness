/**
 * Colour decoding: Qt writes colours as `#AARRGGBB`, the canvas wants `#RRGGBBAA`,
 * and the importer must not hand a malformed value to the renderer.
 * @module dsh-obsidian-vault/tests/pur-colour
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { qtColorToCss } from '../src/vault/pur-sqlite.ts'

test('an eight digit Qt colour moves its alpha pair to the end', () => {
  assert.equal(qtColorToCss('#00111111'), '#11111100')
  // The digits keep the case they arrived in.\n  assert.equal(qtColorToCss('#FF112233'), '#112233FF')
})

test('a six digit colour is already in CSS order', () => {
  assert.equal(qtColorToCss('#112233'), '#112233')
})

test('a named colour and a functional value pass through', () => {
  assert.equal(qtColorToCss('red'), 'red')
  assert.equal(qtColorToCss('rgba(10,10,10,0.5)'), 'rgba(10,10,10,0.5)')
  assert.equal(qtColorToCss('hsl(200 40% 50%)'), 'hsl(200 40% 50%)')
})

test('empty and malformed values yield nothing', () => {
  assert.equal(qtColorToCss(''), undefined)
  assert.equal(qtColorToCss('   '), undefined)
  assert.equal(qtColorToCss('#12'), undefined)
  assert.equal(qtColorToCss('not a colour!'), undefined)
})

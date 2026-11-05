/**
 * Note rich text: the body's bold flag and font size are the only text attributes
 * the canvas can show, and they must survive the conversion.
 * @module dsh-obsidian-vault/tests/pur-note-style
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { richTextStyle } from '../src/vault/pur-sqlite.ts'

test('a bold paragraph is detected', () => {
  assert.equal(richTextStyle('<p><b>标题</b> 正文</p>').bold, true)
  assert.equal(richTextStyle('<span style="font-weight: 700">粗</span>').bold, true)
})

test('a plain paragraph carries no bold flag', () => {
  assert.equal(richTextStyle('<p>普通文字</p>').bold, undefined)
})

test('a point size becomes pixels', () => {
  // 12pt is 16px.
  assert.equal(richTextStyle('<p style="font-size: 12pt">正文</p>').fontSize, 16)
  assert.equal(richTextStyle('<p style="font-size:18px">正文</p>').fontSize, 18)
})

test('sizes outside a readable range are ignored', () => {
  assert.equal(richTextStyle('<p style="font-size: 2pt">太小</p>').fontSize, undefined)
  assert.equal(richTextStyle('<p style="font-size: 400px">太大</p>').fontSize, undefined)
})

test('the style scanner tolerates the doctype and head Qt writes', () => {
  const html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0//EN"><head><style>p{}</style></head><body><p><b>x</b></p></body>'
  assert.equal(richTextStyle(html).bold, true)
  assert.equal(richTextStyle(html).fontSize, undefined)
})

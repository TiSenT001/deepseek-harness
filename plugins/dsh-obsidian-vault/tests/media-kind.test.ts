import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mediaKindOf, mediaNameOf } from '../src/client/markdown/media.ts'

test('mediaKindOf classifies PDF, audio and video attachments', () => {
  assert.equal(mediaKindOf('附件/方案.pdf'), 'pdf')
  assert.equal(mediaKindOf('audio/纪要.MP3'), 'audio')
  assert.equal(mediaKindOf('audio/talk.m4a'), 'audio')
  assert.equal(mediaKindOf('video/演示.mp4'), 'video')
  assert.equal(mediaKindOf('video/演示.mov'), 'video')
  assert.equal(mediaKindOf('图片/截图.png'), undefined)
  assert.equal(mediaKindOf('笔记/正文.md'), undefined)
})

test('mediaNameOf returns the last path segment', () => {
  assert.equal(mediaNameOf('附件/方案.pdf'), '方案.pdf')
  assert.equal(mediaNameOf('方案.pdf'), '方案.pdf')
})

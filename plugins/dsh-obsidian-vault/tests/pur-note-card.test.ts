/**
 * Note-link cards are labels: they show the note's title and never paint the body,
 * which used to spill past the card edge after the card was edited.
 * @module dsh-obsidian-vault/tests/pur-note-card
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drawScene } from '../src/pur-kernel/index.ts'
import type { PurElement, PurScene } from '../src/pur-kernel/index.ts'
import { RenderRecorder } from './helpers/pur-render-recorder.ts'

/** A note-link card whose cached body is much taller than the card. */
const CARD: PurElement = {
  id: 'n1',
  type: 'note-link',
  x: 0,
  y: 0,
  w: 220,
  h: 90,
  content: '笔记编写规范',
  link: '个人知识库/笔记编写规范.md',
  note: '第一行正文\n第二行正文\n第三行正文\n第四行正文\n第五行正文\n第六行正文',
  cardColor: 'rgba(72, 54, 153, 0.95)',
  rotation: 0,
  opacity: 1,
}

/**
 * Render a scene with one card.
 * @param element - the card to draw.
 * @returns the recorder and the frame calls.
 */
function render(element: PurElement): RenderRecorder {
  const scene: PurScene = {
    elements: [element],
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 800,
    height: 600,
    preferences: { backgroundColor: '#000', gridColor: '#111', showGrid: false },
    labels: { imageLoading: 'loading', codeNodeFallbackTitle: 'node', codeNodeBadge: 'node', noteLinkFallback: '链接', codeCardPrefix: '' },
  }
  const recorder = new RenderRecorder({ roundRect: true })
  drawScene(recorder, scene)
  return recorder
}

test('the card draws its title', () => {
  const recorder = render(CARD)
  assert.ok(recorder.calls.some((call) => call.startsWith('fillText("笔记编写规范"')), 'the title was not drawn')
})

test('the card never draws the cached note body', () => {
  const recorder = render(CARD)
  const bodyCalls = recorder.calls.filter((call) => call.startsWith('fillText(') && /正文/.test(call))
  assert.deepEqual(bodyCalls, [], 'the note body leaked onto the card')
})

test('the card clips its text to its own rectangle', () => {
  const recorder = render(CARD)
  assert.ok(recorder.calls.includes('clip()'), 'the card did not clip its content')
})

test('a very long title is clipped instead of overflowing', () => {
  const long: PurElement = { ...CARD, content: '标题'.repeat(40) }
  const recorder = render(long)
  const drawn = recorder.calls.filter((call) => call.startsWith('fillText(')).length
  // The card is 90 units tall: only a few lines fit, so the loop must stop early.
  assert.ok(drawn <= 4, `drew ${drawn} title lines past the card bottom`)
})
test('a stale body whose first line is a markdown heading shows the heading text only', () => {
  const stale: PurElement = { ...CARD, content: '# 笔记编写规范\n规范 Obsidian 工作流\n更多正文' }
  const recorder = render(stale)
  assert.ok(recorder.calls.some((call) => call.startsWith('fillText("笔记编写规范"')), 'the heading text was not drawn')
  assert.ok(!recorder.calls.some((call) => call.startsWith('fillText("# ')), 'the heading marker leaked onto the card')
  assert.ok(!recorder.calls.some((call) => call.startsWith('fillText(') && /更多正文/.test(call)), 'the stale body leaked onto the card')
})

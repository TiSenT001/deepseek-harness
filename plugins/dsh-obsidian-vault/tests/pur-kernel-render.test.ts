/**
 * Render-layer tests: the kernel's per-frame canvas program must match the
 * upstream Pur Studio `draw()` call for call on the recorded golden scenes.
 * @module dsh-obsidian-vault/tests/pur-kernel-render
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drawScene } from '../src/pur-kernel/index.ts'
import type { PurRenderLabels, PurScene } from '../src/pur-kernel/index.ts'
import { GOLDEN_RENDER, RENDER_INPUTS } from './helpers/pur-render-expected.ts'
import type { RenderSceneInput } from './helpers/pur-render-expected.ts'
import { RenderRecorder } from './helpers/pur-render-recorder.ts'

/** Copy the adapter supplies in place of upstream's hardcoded strings. */
const LABELS: PurRenderLabels = {
  imageLoading: '加载中...',
  codeNodeFallbackTitle: '节点',
  codeNodeBadge: '◯ node',
  noteLinkFallback: '链接',
  codeCardPrefix: '📄 ',
}

/** Rebuild a kernel scene from a golden input record. */
function sceneOf(input: RenderSceneInput): PurScene {
  const images = new Map<string, CanvasImageSource>()
  for (const key of input.imageKeys) images.set(key, {} as CanvasImageSource)
  return {
    elements: input.elements,
    view: input.view,
    width: input.width,
    height: input.height,
    preferences: { backgroundColor: input.backgroundColor, gridColor: input.gridColor, showGrid: input.showGrid },
    labels: LABELS,
    images,
    selectedIds: new Set(input.selectedIds),
    hoveredLineId: input.hoveredLineId,
    hoverPin: input.hoverPin ?? null,
    selectionRect: input.selectionRect ?? null,
    pinDrag: input.pinDrag ?? null,
    zoomBadgeAlpha: input.zoomBadgeAlpha,
    lockPulseIds: new Set(input.lockPulseIds ?? []),
    editingIds: new Set(input.editingIds ?? []),
  }
}

/** The input record with the given name, or a failed assertion. */
function inputNamed(name: string): RenderSceneInput {
  const input = RENDER_INPUTS.find((candidate) => candidate.name === name)
  assert.ok(input !== undefined, `missing scene ${name}`)
  return input
}

/** Draw one input record and return its recorder and effects. */
function render(input: RenderSceneInput, roundRect: boolean): { recorder: RenderRecorder; loads: string[] } {
  const recorder = new RenderRecorder({ roundRect })
  const effects = drawScene(recorder, sceneOf(input))
  return { recorder, loads: [...effects.loadImages] }
}

RENDER_INPUTS.forEach((input, index) => {
  test(`draws the ${input.name} scene exactly like upstream`, () => {
    const golden = GOLDEN_RENDER[index]
    assert.ok(golden !== undefined, `missing golden trace ${index}`)
    const { recorder, loads } = render(input, true)
    assert.deepEqual(recorder.calls, golden.calls)
    assert.deepEqual(loads, golden.loads)
  })
})

test('falls back to plain rectangles without roundRect', () => {
  const { recorder } = render(inputNamed('base'), false)
  assert.ok(recorder.calls.some((call) => call.startsWith('rect(')))
  assert.ok(!recorder.calls.some((call) => call.startsWith('roundRect(')))
})

test('asks for the image key before the preloaded duplicate', () => {
  const { loads } = render(inputNamed('base'), true)
  // Cards are small, so the request names the decode width after the key.
  assert.deepEqual(loads, ['b.png#w=256', 'data:c#w=256', 'data:c'])
})

test('draws the loading placeholder over an undecoded image', () => {
  const { recorder } = render(inputNamed('base'), true)
  assert.ok(recorder.calls.includes('fillText("加载中...",10,20)'))
})

test('skips the body and pins of an element being edited', () => {
  const { recorder } = render(inputNamed('groups-editing'), true)
  assert.ok(!recorder.calls.some((call) => call.startsWith('fillText("edit"')))
})

test('applies rotation, flips and opacity around the card centre', () => {
  const base = render(inputNamed('base'), true).recorder.calls
  assert.ok(base.includes(`rotate(${String((30 * Math.PI) / 180)})`))
  assert.ok(base.includes('globalAlpha=0.8'))
  const groups = render(inputNamed('groups-editing'), true).recorder.calls
  assert.ok(groups.includes('scale(-1,1)'))
  assert.ok(groups.includes('scale(1,-1)'))
  assert.ok(groups.includes('globalAlpha=0'))
})

test('draws the lock badge only while the pulse window is open', () => {
  const pulsing = render(inputNamed('groups-editing'), true).recorder.calls
  assert.ok(pulsing.includes('strokeRect(124,105,12,10)'))
  const quiet = render(inputNamed('base'), true).recorder.calls
  assert.ok(!quiet.some((call) => call.endsWith(',12,10)')))
})

test('draws the zoom badge only when an alpha is present', () => {
  const shown = render(inputNamed('pin-modes'), true).recorder.calls
  // The badge is bare text in the contrasting ink, with no chip behind it.
  assert.ok(shown.some((call) => call.startsWith('fillText("75%",')), 'the zoom label was not drawn')
  assert.equal(shown.some((call) => call.startsWith('fillStyle=rgba(24,24,28')), false, 'a chip was drawn')
  const hidden = render(inputNamed('interaction'), true).recorder.calls
  assert.ok(!hidden.some((call) => call.startsWith('fillText("100%",')), 'the hidden badge was drawn')
})

test('honours the group title after the frame is stroked', () => {
  const calls = render(inputNamed('groups-editing'), true).recorder.calls
  const frame = calls.findIndex((call) => call === 'setLineDash([8,4])')
  const title = calls.findIndex((call) => call === 'fillText("inner",64,95)')
  assert.ok(frame >= 0 && title > frame)
})

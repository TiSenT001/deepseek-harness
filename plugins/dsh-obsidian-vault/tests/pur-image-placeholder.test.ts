/**
 * Image placeholder tests: an image card whose reference cannot be resolved
 * draws a dashed broken-image placeholder instead of a blank or perpetually
 * loading card, and the client cache remembers the failed key instead of
 * re-requesting the same broken reference on every repaint.
 * @module dsh-obsidian-vault/tests/pur-image-placeholder
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPurScene, drawScene } from '../src/pur-kernel/index.ts'
import type { PurElement, PurImageLookup, PurRenderLabels, PurRenderPreferences, PurScene } from '../src/pur-kernel/index.ts'
import { PurImageCache } from '../src/client/pur/loader.ts'
import { controllerOf } from './helpers/pur-adapter-fixtures.ts'
import { RenderRecorder } from './helpers/pur-render-recorder.ts'

/** Renderer copy; the broken-image placeholder itself draws no text. */
const LABELS: PurRenderLabels = {
  imageLoading: 'loading',
  codeNodeFallbackTitle: 'node',
  codeNodeBadge: 'node',
  noteLinkFallback: 'link',
  codeCardPrefix: 'file ',
}

/** An image card at a fixed, fully visible spot. */
function imageElement(original: string, dataURL?: string): PurElement {
  return { id: 'img', type: 'image', x: 10, y: 10, w: 100, h: 80, original, dataURL }
}

/** A scene holding the given elements and image lookup. */
function sceneOf(images: PurImageLookup | undefined, elements: readonly PurElement[]): PurScene {
  return {
    elements,
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 400,
    height: 300,
    preferences: { backgroundColor: '#1e1e1e', gridColor: '#333333', showGrid: false },
    labels: LABELS,
    images,
  }
}

/** An image lookup that reports the given keys as failed, like the client cache. */
function lookupOf(failed: readonly string[]): PurImageLookup {
  return Object.assign(new Map<string, CanvasImageSource>(), { failedKeys: new Set(failed) })
}

/** Draw one scene and return its recorder and the image loads it asked for. */
function render(images: PurImageLookup | undefined, elements: readonly PurElement[]): { recorder: RenderRecorder; loads: string[] } {
  const recorder = new RenderRecorder()
  const effects = drawScene(recorder, sceneOf(images, elements))
  return { recorder, loads: [...effects.loadImages] }
}

test('draws the broken-image placeholder for a key the cache failed', () => {
  const { recorder, loads } = render(lookupOf(['附件/坏图.png']), [imageElement('附件/坏图.png')])
  const calls = recorder.calls
  assert.ok(calls.includes('setLineDash([6,4])'), 'dashed frame missing')
  assert.ok(calls.includes('setLineDash([])'), 'dash pattern not reset')
  assert.ok(calls.includes('strokeRect(5,5,90,70)'), 'frame missing')
  assert.ok(calls.includes('rect(20,16,60,48)'), 'glyph frame missing')
  assert.ok(calls.includes('moveTo(20,64)') && calls.includes('lineTo(80,16)'), 'glyph slash missing')
  assert.ok(!calls.some((call) => call.startsWith('drawImage(')), 'drew a bitmap')
  assert.ok(!calls.includes('fillText("loading",10,20)'), 'kept the loading copy')
  assert.deepEqual(loads, [], 'requested a key the cache already failed')
})

test('draws the broken-image placeholder when the element has no source', () => {
  const { recorder, loads } = render(new Map(), [imageElement('')])
  assert.ok(recorder.calls.includes('strokeRect(5,5,90,70)'))
  assert.ok(!recorder.calls.some((call) => call.startsWith('drawImage(')))
  assert.deepEqual(loads, [])
})

test('keeps the loading placeholder while the cache still owes the decode', () => {
  const { recorder, loads } = render(new Map(), [imageElement('附件/待载入.png')])
  assert.ok(recorder.calls.includes('fillText("loading",10,20)'))
  assert.deepEqual(loads, ['附件/待载入.png'])
})

test('renders the loading card when the scene carries no image cache', () => {
  const { recorder, loads } = render(undefined, [imageElement('附件/待载入.png')])
  assert.ok(recorder.calls.includes('fillText("loading",10,20)'))
  assert.deepEqual(loads, ['附件/待载入.png'])
})

test('draws the cached bitmap instead of a placeholder', () => {
  const image = {} as CanvasImageSource
  const { recorder } = render(Object.assign(new Map([['data:ok', image]]), { failedKeys: new Set<string>() }), [imageElement('', 'data:ok')])
  assert.deepEqual(recorder.drawn, [image])
  assert.ok(recorder.calls.includes('drawImage(0,0,100,80)'))
  assert.ok(!recorder.calls.some((call) => call.startsWith('strokeRect(')))
})

/** A stand-in for the browser `Image` element. */
class FakeImage {
  /** Load callback assigned by the cache. */
  onload: (() => void) | null = null
  /** Error callback assigned by the cache. */
  onerror: (() => void) | null = null
  /** Requested source. */
  src = ''
}

/**
 * Install a recording `Image` constructor for one test.
 * @param created - collects every element the cache constructs.
 * @returns the restore function.
 */
function installFakeImage(created: FakeImage[]): () => void {
  class RecordingImage extends FakeImage {
    constructor() {
      super()
      created.push(this)
    }
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.assign(globalThis, { Image: RecordingImage })
  return (): void => {
    if (previous === undefined) Reflect.deleteProperty(globalThis, 'Image')
    else Object.defineProperty(globalThis, 'Image', previous)
  }
}

test('the cache records a failed decode and never requests that key again', () => {
  const created: FakeImage[] = []
  const restore = installFakeImage(created)
  try {
    const cache = new PurImageCache()
    const settled: string[] = []
    cache.request('附件/坏图.png', () => settled.push('first'))
    assert.equal(created.length, 1)
    assert.equal(cache.map.has('附件/坏图.png'), false)
    created[0]!.onerror?.()
    assert.equal(cache.map.failedKeys?.has('附件/坏图.png'), true)
    assert.deepEqual(settled, ['first'], 'a failure still asks for a repaint')
    cache.request('附件/坏图.png', () => settled.push('second'))
    assert.equal(created.length, 1, 'a failed key must not be requested again')
    assert.deepEqual(settled, ['first'])
  } finally {
    restore()
  }
})

test('the cache keeps a decoded image and requests it once', () => {
  const created: FakeImage[] = []
  const restore = installFakeImage(created)
  try {
    const cache = new PurImageCache()
    const settled: string[] = []
    cache.request('data:ok', () => settled.push('load'))
    assert.equal(created[0]!.src, 'data:ok')
    created[0]!.onload?.()
    assert.equal(cache.map.get('data:ok'), created[0])
    assert.equal(cache.map.failedKeys?.has('data:ok'), false)
    assert.deepEqual(settled, ['load'])
    cache.request('data:ok', () => settled.push('again'))
    assert.equal(created.length, 1)
    assert.deepEqual(settled, ['load'])
  } finally {
    restore()
  }
})

test('the cache never requests an empty key', () => {
  const created: FakeImage[] = []
  const restore = installFakeImage(created)
  try {
    const cache = new PurImageCache()
    const settled: string[] = []
    cache.request('', () => settled.push('repaint'))
    assert.equal(created.length, 0)
    assert.deepEqual(settled, [])
  } finally {
    restore()
  }
})

test('a recorded failure reaches the renderer through the scene', () => {
  const created: FakeImage[] = []
  const restore = installFakeImage(created)
  try {
    const cache = new PurImageCache()
    cache.request('附件/坏图.png', () => undefined)
    created[0]!.onerror?.()
    const preferences: PurRenderPreferences = { backgroundColor: '#1e1e1e', gridColor: '#333333', showGrid: false }
    const scene = buildPurScene(controllerOf(), { width: 400, height: 300, preferences, labels: LABELS, images: cache.map, now: () => 0 })
    assert.equal(scene.images, cache.map)
    const { recorder } = render(scene.images, [imageElement('附件/坏图.png')])
    assert.ok(recorder.calls.includes('strokeRect(5,5,90,70)'), 'placeholder did not reach the canvas')
  } finally {
    restore()
  }
})

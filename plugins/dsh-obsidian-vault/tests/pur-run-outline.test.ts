/**
 * A code node's card shows its run state: a dashed blue outline while the snippet
 * is evaluated, a red outline after a failure, and neither when the last run passed.
 * @module dsh-obsidian-vault/tests/pur-run-outline
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drawScene } from '../src/pur-kernel/index.ts'
import type { PurElement, PurScene } from '../src/pur-kernel/index.ts'
import { RenderRecorder } from './helpers/pur-render-recorder.ts'

/**
 * A code node with one output.
 * @param run - outcome to draw, if any.
 * @returns the element.
 */
function nodeOf(run: { ok: boolean; ms: number; error?: string } | undefined): PurElement {
  return {
    id: 'n',
    type: 'code-node',
    x: 0,
    y: 0,
    w: 260,
    h: 110,
    title: 'n',
    code: '',
    content: '',
    inputs: [],
    outputs: [{ id: 'o', label: 'out' }],
    ...(run === undefined ? {} : { run }),
    rotation: 0,
    opacity: 1,
  }
}

/**
 * Render one node.
 * @param element - the card.
 * @param running - ids to flag as evaluating.
 * @returns the recorded calls.
 */
function render(element: PurElement, running: readonly string[] = []): string[] {
  const scene: PurScene = {
    elements: [element],
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 800,
    height: 600,
    preferences: { backgroundColor: '#000', gridColor: '#111', showGrid: false },
    labels: { imageLoading: 'loading', codeNodeFallbackTitle: 'node', codeNodeBadge: 'node', noteLinkFallback: 'link', codeCardPrefix: '' },
    runningIds: new Set(running),
  }
  const recorder = new RenderRecorder({ roundRect: true })
  drawScene(recorder, scene)
  return recorder.calls
}

test('a failed run draws a red outline', () => {
  const calls = render(nodeOf({ ok: false, ms: 3, error: 'boom' }))
  assert.ok(calls.includes('strokeStyle=rgba(240,120,120,0.85)'), 'no failure outline')
})

test('a running node draws a dashed blue outline', () => {
  const calls = render(nodeOf({ ok: true, ms: 2 }), ['n'])
  assert.ok(calls.includes('strokeStyle=rgba(120,170,255,0.9)'), 'no running outline')
  const dash = calls.find((call) => call.startsWith('setLineDash('))
  assert.ok(dash !== undefined && dash !== 'setLineDash([])', 'the running outline is not dashed')
})

test('a successful, idle node draws no run outline', () => {
  const calls = render(nodeOf({ ok: true, ms: 2 }))
  assert.equal(calls.some((call) => call.startsWith('strokeStyle=rgba(240,120,120')), false)
  assert.equal(calls.some((call) => call.startsWith('strokeStyle=rgba(120,170,255')), false)
})

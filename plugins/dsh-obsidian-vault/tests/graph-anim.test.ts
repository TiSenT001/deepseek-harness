import assert from 'node:assert/strict'
import { test } from 'node:test'
import { damp, dampColor, parseColor } from '../src/client/graph/render/anim.ts'
import { GraphStage } from '../src/client/graph/render/stage.ts'
import { labelAlpha, labelThreshold } from '../src/client/graph/render/labels.ts'
import { curveFor, sliderToValue, valueToSlider } from '../src/client/graph/schema.ts'

test('damp approaches the target and never overshoots', () => {
  let value = 0
  for (let i = 0; i < 60; i += 1) value = damp(value, 1)
  assert.ok(value > 0.99 && value <= 1)
  assert.equal(damp(1, 1), 1)
})

test('parseColor reads hex and rgb, rejects unknown formats', () => {
  assert.deepEqual(parseColor('#4d6bfe'), [77, 107, 254])
  assert.deepEqual(parseColor('#fff'), [255, 255, 255])
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), [1, 2, 3])
  assert.equal(parseColor('color-mix(in srgb, red, blue)'), null)
})

test('dampColor interpolates per channel and snaps at the target', () => {
  const mid = dampColor('#000000', '#ffffff')
  assert.equal(mid, 'rgb(25.5, 25.5, 25.5)')
  assert.equal(dampColor('#ffffff', '#ffffff'), '#ffffff')
  assert.equal(dampColor('nonsense', '#fff'), '#fff')
})

test('stage fades new nodes in and glides dim toward the hover target', () => {
  const stage = new GraphStage()
  const first = stage.node('a', { dim: 0.2, lift: 0, tint: '#000000' })
  assert.ok(Math.abs(first.fade - 0.1) < 1e-9)
  let last = first
  for (let i = 0; i < 90; i += 1) last = stage.node('a', { dim: 0.2, lift: 15, tint: '#ffffff' })
  assert.equal(last.fade, 1)
  assert.equal(last.dim, 0.2)
  assert.equal(last.lift, 15)
  assert.equal(last.tint, '#ffffff')
})

test('stage prunes entries for nodes that left the graph', () => {
  const stage = new GraphStage()
  for (let i = 0; i < 100; i += 1) stage.node(`gone-${i}`, { dim: 1, lift: 0, tint: '#000' })
  stage.node('kept', { dim: 1, lift: 0, tint: '#000' })
  stage.prune(new Set(['kept']), new Set())
  const again = stage.node('gone-1', { dim: 1, lift: 0, tint: '#000' })
  assert.ok(Math.abs(again.fade - 0.1) < 1e-9)
  const kept = stage.node('kept', { dim: 1, lift: 0, tint: '#000' })
  assert.ok(kept.fade > 0.1)
})

test('labelAlpha follows Obsidian: clamp(log2(zoom) + 1 - textFade, 0, 1)', () => {
  assert.equal(labelAlpha(1, 0), 1)
  assert.equal(labelAlpha(2, 0), 1)
  assert.equal(labelAlpha(0.5, 0), 0)
  assert.ok(Math.abs(labelAlpha(Math.SQRT1_2, 0) - 0.5) < 1e-9)
  assert.equal(labelAlpha(1, 0.5), 0.5)
  assert.equal(labelThreshold(0), 0.5)
})

test('slider SJ/MJ roundtrip and curveFor lands the default mid-track', () => {
  const curve = curveFor(0.4737)
  const atMid = sliderToValue(0.5, curve)
  assert.ok(Math.abs(atMid - 0.4737) < 0.01)
  for (const v of [0.05, 0.3, 0.5, 0.8, 0.95]) {
    assert.ok(Math.abs(sliderToValue(valueToSlider(v, curve), curve) - v) < 1e-9)
  }
})

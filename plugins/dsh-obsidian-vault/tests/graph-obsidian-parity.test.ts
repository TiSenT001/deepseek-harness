import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  OBSIDIAN_GRAPH, obsidianArrowAlpha, obsidianArrowScale, obsidianCharge, obsidianLabelAlpha, obsidianLinkBias, obsidianLinkStrength, obsidianNodeRadius, obsidianSliderForce,
} from '../src/client/graph/obsidian-graph.ts'

test('node radius follows the extracted Obsidian getSize formula', () => {
  assert.equal(obsidianNodeRadius(0), 8)
  assert.equal(obsidianNodeRadius(8), 9)
  assert.equal(obsidianNodeRadius(99), 30)
})

test('link strength and bias follow d3 degree weighting', () => {
  assert.equal(obsidianLinkStrength(2, 6), 0.5)
  assert.equal(obsidianLinkBias(2, 6), 0.25)
})

test('worker constants match the extracted values', () => {
  assert.equal(OBSIDIAN_GRAPH.centerStrength, 0.1)
  assert.equal(OBSIDIAN_GRAPH.chargeStrength, -1000)
  assert.equal(OBSIDIAN_GRAPH.linkDistance, 250)
  assert.equal(OBSIDIAN_GRAPH.collideRadius, 60)
  assert.equal(OBSIDIAN_GRAPH.collideStrength, 0.5)
  assert.equal(OBSIDIAN_GRAPH.linkAlpha, 0.2)
  assert.equal(OBSIDIAN_GRAPH.linkHighlightAlpha, 1)
  assert.equal(OBSIDIAN_GRAPH.velocityDecay, 0.6)
  assert.equal(OBSIDIAN_GRAPH.theta, 0.9)
  assert.equal(OBSIDIAN_GRAPH.distanceMin, 30)
  assert.ok(Math.abs(OBSIDIAN_GRAPH.alphaDecay - (1 - Math.pow(0.001, 1 / 300))) < 1e-15)
})

test('label alpha keeps the Obsidian zoom fade curve', () => {
  assert.equal(obsidianLabelAlpha(1, 0), 1)
  assert.equal(obsidianLabelAlpha(0.25, 0), 0)
  assert.ok(Math.abs(obsidianLabelAlpha(1, 0.9) - 0.1) < 1e-12)
})
test('arrow alpha fades out below zoom 0.3 and keeps the edge alpha', () => {
  assert.equal(obsidianArrowAlpha(1, 0.2), 0)
  assert.equal(obsidianArrowAlpha(1, 0.8), 1)
  assert.equal(obsidianArrowAlpha(0.5, 1), 0.5)
})

test('arrow scale follows 2 * sqrt(line size) / zoom', () => {
  assert.equal(obsidianArrowScale(1, 1), 2)
  assert.equal(obsidianArrowScale(2, 2), Math.sqrt(2))
})
test('slider positions convert through Obsidian MJ and calibrated charge', () => {
  assert.ok(Math.abs(obsidianSliderForce(0.518713248970312) - 0.1) < 1e-12)
  assert.ok(Math.abs(obsidianSliderForce(0.05) - 0.0026154081999410854) < 1e-12)
  assert.equal(obsidianSliderForce(1), 1)
  assert.equal(obsidianCharge(10), 10)
  assert.equal(obsidianCharge(20), 80)
})

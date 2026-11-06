/**
 * Code-node evaluation runs in the host, inside a fresh vm context with a hard
 * timeout: a typo reports the error, a runaway loop stops, and the inputs the
 * canvas sent are never mutated.
 * @module dsh-obsidian-vault/tests/pur-run-code
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_CODE_CHARS, runCodeSnippet } from '../src/vault/run-code.ts'

test('a preset snippet receives its inputs and returns labelled outputs', () => {
  const result = runCodeSnippet('function process(inputs) { const { a, b } = inputs; return { sum: a + b } }', { a: 2, b: 3 })
  assert.equal(result.ok, true)
  assert.deepEqual(result.values, { sum: '5' })
  assert.ok(result.ms >= 0)
})

test('a syntax error is reported instead of thrown', () => {
  const result = runCodeSnippet('function process(inputs) { return {', {})
  assert.equal(result.ok, false)
  assert.ok((result.error ?? '').length > 0)
})

test('code that never defines process is rejected', () => {
  const result = runCodeSnippet('({})', {})
  assert.equal(result.ok, false)
  assert.match(result.error ?? '', /process/)
})

test('an endless loop is stopped by the timeout', () => {
  const result = runCodeSnippet('function process(inputs) { while (true) {} }', {}, 100)
  assert.equal(result.ok, false)
  assert.match(result.error ?? '', /timed out|timeout/i)
})

test('a primitive result is stored under a single result key', () => {
  const result = runCodeSnippet('function process(inputs) { return 42 }', {})
  assert.equal(result.ok, true)
  assert.deepEqual(result.values, { result: '42' })
})

test('the snippet cannot mutate the inputs the canvas sent', () => {
  const inputs = { a: 1, nested: { b: 2 } }
  runCodeSnippet('function process(inputs) { inputs.a = 99; inputs.nested.b = 99; return inputs }', inputs)
  assert.deepEqual(inputs, { a: 1, nested: { b: 2 } })
})

test('oversized code is rejected before evaluation', () => {
  const result = runCodeSnippet(`function process() { return "${'x'.repeat(MAX_CODE_CHARS)}" }`, {})
  assert.equal(result.ok, false)
  assert.match(result.error ?? '', /exceeds/)
})

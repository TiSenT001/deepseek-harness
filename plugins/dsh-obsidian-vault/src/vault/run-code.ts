/**
 * Evaluate a code node's snippet for the canvas: a `function process(inputs)` body
 * runs inside a fresh `node:vm` context with a hard timeout, so a typo throws and a
 * runaway loop is stopped instead of freezing the canvas.
 * @module dsh-obsidian-vault/vault/run-code
 */
import vm from 'node:vm'
import { serializeRunValues } from '../pur-kernel/controller-run.ts'

/** Longest snippet accepted, in characters. */
export const MAX_CODE_CHARS = 64 * 1024

/** Wall-clock limit for one evaluation, in milliseconds. */
export const RUN_TIMEOUT_MS = 1500

/** What the client receives. */
export interface PurRunOutcome {
  /** Whether the snippet returned without throwing. */
  ok: boolean
  /** Serialized values keyed by output label. */
  values: Record<string, string>
  /** Failure message, present when `ok` is false. */
  error?: string
  /** Evaluation time in milliseconds. */
  ms: number
}

/**
 * Copy the inputs into a plain value tree the sandbox may read.
 * @param inputs - request payload.
 * @returns a JSON-cloned object; invalid payloads become an empty object.
 */
function copyInputs(inputs: unknown): Record<string, unknown> {
  if (inputs === null || typeof inputs !== 'object' || Array.isArray(inputs)) return {}
  try {
    return JSON.parse(JSON.stringify(inputs)) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Evaluate one snippet.
 * @param code - function declaration text, such as `function process(inputs) {...}`.
 * @param inputs - values the connected input pins carry.
 * @param timeoutMs - evaluation limit; defaults to {@link RUN_TIMEOUT_MS}.
 * @returns the serialized outputs and the outcome.
 */
export function runCodeSnippet(code: string, inputs: unknown, timeoutMs: number = RUN_TIMEOUT_MS): PurRunOutcome {
  const started = Date.now()
  const fail = (error: string): PurRunOutcome => ({ ok: false, values: {}, error, ms: Date.now() - started })
  if (typeof code !== 'string' || code.trim() === '') return fail('code is empty')
  if (code.length > MAX_CODE_CHARS) return fail(`code exceeds ${MAX_CODE_CHARS} characters`)
  const source = `(function () {
  const process = (${code});
  if (typeof process !== 'function') throw new Error('code must define function process(inputs)');
  return process(inputs);
})()`
  try {
    const result = vm.runInNewContext(source, { inputs: copyInputs(inputs) }, { timeout: timeoutMs, displayErrors: true })
    return { ok: true, values: serializeRunValues(result), ms: Date.now() - started }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return fail(message)
  }
}

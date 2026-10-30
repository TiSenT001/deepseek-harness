/**
 * Note-to-card hydration: upstream repeats the same frontmatter pin parsing,
 * code extraction and height rule at four drop/paste/add sites with small
 * variations. This module implements the rule once and parameterizes the
 * variations.
 * @module dsh-obsidian-vault/pur-kernel/note-raw
 */
import type { PurNoteLinkElement, PurPin } from './types.ts'

/**
 * Parse one frontmatter pin list such as `a=1, b=2`: the label precedes `=`,
 * the id follows it, and a segment without `=` uses its label as id.
 * @param raw - the text after `inputs:` or `outputs:`.
 * @returns the pins, in list order.
 */
export function parseFmPinList(raw: string): PurPin[] {
  return raw.split(',').map((segment) => {
    const parts = segment.trim().split('=')
    const label = parts[0] ?? ''
    const id = parts[1]
    return { id: id || label, label }
  })
}

/**
 * Extract executable code from note text: drop the frontmatter block, then
 * unwrap the first `js` fenced block when one exists.
 * @param raw - full note text.
 * @returns the extracted code, trimmed.
 */
export function extractNoteCode(raw: string): string {
  let code = raw.replace(/^---[\s\S]*?---\n*/, '').trim()
  const block = code.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/)
  if (block !== null && block[1] !== undefined) code = block[1]
  return code
}

/** The first `:`-separated key of a return-object entry. */
function returnKey(entry: string): string {
  return (entry.trim().split(':')[0] ?? '').trim()
}

/** The name of a destructured input entry, before any `= default`. */
function inputName(entry: string): string {
  return (entry.trim().split('=')[0] ?? '').trim()
}

/**
 * Extract the keys of a `return { ... }` object literal.
 * @param source - code to scan.
 * @returns the keys, or undefined when no return object exists.
 */
export function codeOutputKeys(source: string): string[] | undefined {
  const match = source.match(/return\s*\{([^}]+)\}/)
  if (match === null || match[1] === undefined) return undefined
  return match[1].split(',').map(returnKey).filter(Boolean)
}

/**
 * Extract the names of a `const { ... } = inputs` destructure.
 * @param source - code to scan.
 * @returns the names, or undefined when no destructure exists.
 */
export function codeInputNames(source: string): string[] | undefined {
  const match = source.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/)
  if (match === null || match[1] === undefined) return undefined
  return match[1].split(',').map(inputName).filter(Boolean)
}

/**
 * Extract output pins from a `return { ... }` object literal. Labels are
 * uppercased and ids keep the key, exactly like upstream's note hydration.
 * @param source - code to scan.
 * @returns the pins, or undefined when no return object exists.
 */
export function regexOutputPins(source: string): PurPin[] | undefined {
  return codeOutputKeys(source)?.map((key) => ({ id: key, label: key.toUpperCase() }))
}

/**
 * Extract input pins from a `const { ... } = inputs` destructure, with the
 * same uppercased-label rule as {@link regexOutputPins}.
 * @param source - code to scan.
 * @returns the pins, or undefined when no destructure exists.
 */
export function regexInputPins(source: string): PurPin[] | undefined {
  return codeInputNames(source)?.map((key) => ({ id: key, label: key.toUpperCase() }))
}

/** How one upstream call site varies the hydration rule. */
export interface PurNoteRawOptions {
  /**
   * Marker the extracted code must contain (besides `return {`) for the code
   * to replace the card content: `'function process'` for the Obsidian URI
   * drop and the picker, `'function'` for the path drop, null to keep the
   * content untouched.
   */
  contentMarker: 'function process' | 'function' | null
  /**
   * When the regex pin fallback runs and which text it scans, or null when
   * the call site never falls back. `'no-fm-pins'` matches the drops that
   * track a `hasPins` flag; `'no-pins'` matches the picker's
   * `!el.inputs && !el.outputs` test.
   */
  regexFallback: { when: 'no-fm-pins' | 'no-pins'; source: 'raw' | 'code' } | null
}

/** Options matching the `obsidian://open?file=` drop. */
export const NOTE_RAW_OBSIDIAN_URI: PurNoteRawOptions = { contentMarker: 'function process', regexFallback: { when: 'no-fm-pins', source: 'raw' } }

/** Options matching the `.md`/`.PurStudio` path drop (no regex fallback). */
export const NOTE_RAW_PATH: PurNoteRawOptions = { contentMarker: 'function', regexFallback: null }

/** Options matching the `[[wikilink]]` drop (pins and height only). */
export const NOTE_RAW_WIKI: PurNoteRawOptions = { contentMarker: null, regexFallback: { when: 'no-fm-pins', source: 'raw' } }

/** Options matching the note picker (`addNoteLink`). */
export const NOTE_RAW_PICKER: PurNoteRawOptions = { contentMarker: 'function process', regexFallback: { when: 'no-pins', source: 'code' } }

/**
 * Hydrate a note-link card from raw note text: frontmatter pins first, an
 * optional regex fallback, the code content gate, and the pin-row height.
 * @param element - the card to hydrate; mutated in place.
 * @param raw - full note text.
 * @param options - which upstream call-site variant to apply.
 */
export function applyNoteRaw(element: PurNoteLinkElement, raw: string, options: PurNoteRawOptions): void {
  const code = extractNoteCode(raw)
  if (options.contentMarker !== null && (code.includes(options.contentMarker) || code.includes('return {'))) element.content = code
  let hasFmPins = false
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (fm !== null && fm[1] !== undefined) {
    const fmInputs = fm[1].match(/^inputs:\s*(.+)$/m)
    const fmOutputs = fm[1].match(/^outputs:\s*(.+)$/m)
    if (fmInputs !== null && fmInputs[1] !== undefined) { element.inputs = parseFmPinList(fmInputs[1]); hasFmPins = true }
    if (fmOutputs !== null && fmOutputs[1] !== undefined) { element.outputs = parseFmPinList(fmOutputs[1]); hasFmPins = true }
  }
  const fallback = options.regexFallback
  if (fallback !== null) {
    const run = fallback.when === 'no-fm-pins' ? !hasFmPins : element.inputs === undefined && element.outputs === undefined
    if (run) {
      const source = fallback.source === 'raw' ? raw : code
      const outputs = regexOutputPins(source)
      if (outputs !== undefined) element.outputs = outputs
      const inputs = regexInputPins(source)
      if (inputs !== undefined) element.inputs = inputs
    }
  }
  element.h = 60 + Math.max(element.inputs?.length ?? 0, element.outputs?.length ?? 0, 1) * 28 + 40
}

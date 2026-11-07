/**
 * Pure text operations behind the Markdown editor: find, replace, indentation,
 * wrapping and newline continuation. They return the next text plus the selection
 * to restore, so the React component stays a thin shell and the behaviour is
 * unit-tested without a DOM.
 * @module dsh-obsidian-vault/client/ui/editor/source-edit
 */

/** Text plus the selection that should follow an edit. */
export interface EditResult {
  readonly text: string
  readonly start: number
  readonly end: number
}

/** One match of a search term. */
export interface Match {
  readonly start: number
  readonly end: number
}

/** Indentation unit inserted by Tab and removed by Shift+Tab. */
export const INDENT_UNIT = '  '

/**
 * All matches of a literal term, optionally case-sensitive.
 * @param text - haystack.
 * @param term - literal needle.
 * @param caseSensitive - whether case must match.
 * @returns the matches in ascending order; empty for an empty term.
 */
export function findMatches(text: string, term: string, caseSensitive = false): Match[] {
  if (term.length === 0) return []
  const haystack = caseSensitive ? text : text.toLowerCase()
  const needle = caseSensitive ? term : term.toLowerCase()
  const matches: Match[] = []
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    matches.push({ start: index, end: index + term.length })
    index = haystack.indexOf(needle, index + Math.max(1, term.length))
  }
  return matches
}

/**
 * Replace one match and keep the caret after the replacement.
 * @param text - current text.
 * @param match - range to replace.
 * @param replacement - new text for the range.
 * @returns the edited text and caret position.
 */
export function replaceMatch(text: string, match: Match, replacement: string): EditResult {
  const next = text.slice(0, match.start) + replacement + text.slice(match.end)
  const caret = match.start + replacement.length
  return { text: next, start: caret, end: caret }
}

/**
 * Replace every match.
 * @param text - current text.
 * @param term - literal needle.
 * @param replacement - replacement text.
 * @param caseSensitive - whether case must match.
 * @returns the edited text and the number of replacements.
 */
export function replaceAll(text: string, term: string, replacement: string, caseSensitive = false): EditResult & { readonly count: number } {
  const matches = findMatches(text, term, caseSensitive)
  if (matches.length === 0) return { text, start: 0, end: 0, count: 0 }
  let out = ''
  let cursor = 0
  for (const match of matches) {
    out += text.slice(cursor, match.start) + replacement
    cursor = match.end
  }
  out += text.slice(cursor)
  return { text: out, start: 0, end: 0, count: matches.length }
}

/**
 * Expand a collapsed selection to whole lines.
 * @param text - current text.
 * @param start - selection start.
 * @param end - selection end.
 * @returns the line-aligned range.
 */
export function lineRange(text: string, start: number, end: number): { start: number; end: number } {
  const from = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const nextBreak = text.indexOf('\n', end)
  return { start: from, end: nextBreak === -1 ? text.length : nextBreak }
}

/**
 * Indent every line of the selection by one unit.
 * @param text - current text.
 * @param start - selection start.
 * @param end - selection end.
 * @returns the edited text and the adjusted selection.
 */
export function indentLines(text: string, start: number, end: number): EditResult {
  const range = lineRange(text, start, end)
  const lines = text.slice(range.start, range.end).split('\n')
  const next = lines.map(line => INDENT_UNIT + line).join('\n')
  return {
    text: text.slice(0, range.start) + next + text.slice(range.end),
    start: start + INDENT_UNIT.length,
    end: end + INDENT_UNIT.length * lines.length,
  }
}

/**
 * Remove one indentation unit per line of the selection, leaving unindented lines.
 * @param text - current text.
 * @param start - selection start.
 * @param end - selection end.
 * @returns the edited text and the adjusted selection.
 */
export function outdentLines(text: string, start: number, end: number): EditResult {
  const range = lineRange(text, start, end)
  const lines = text.slice(range.start, range.end).split('\n')
  let removed = 0
  const next = lines.map((line) => {
    if (line.startsWith(INDENT_UNIT)) {
      removed += INDENT_UNIT.length
      return line.slice(INDENT_UNIT.length)
    }
    if (line.startsWith('\t')) {
      removed += 1
      return line.slice(1)
    }
    return line
  }).join('\n')
  return {
    text: text.slice(0, range.start) + next + text.slice(range.end),
    start: Math.max(range.start, start - INDENT_UNIT.length),
    end: Math.max(range.start, end - removed),
  }
}

/**
 * Wrap the selection with a marker pair, or insert the pair and place the caret
 * between the markers when the selection is collapsed.
 * @param text - current text.
 * @param start - selection start.
 * @param end - selection end.
 * @param before - opening marker.
 * @param after - closing marker.
 * @returns the edited text and selection.
 */
export function wrapSelection(text: string, start: number, end: number, before: string, after: string): EditResult {
  const selected = text.slice(start, end)
  const next = text.slice(0, start) + before + selected + after + text.slice(end)
  return selected.length === 0
    ? { text: next, start: start + before.length, end: start + before.length }
    : { text: next, start: start + before.length, end: end + before.length }
}

/**
 * Text to insert when Enter is pressed: a new line plus the current line's
 * indentation and list/quote marker, with ordered-list numbers advanced.
 * @param text - current text.
 * @param caret - caret position.
 * @returns the insertion, or null when plain Enter suffices.
 */
export function newlineContinuation(text: string, caret: number): string | null {
  const lineStart = text.lastIndexOf('\n', Math.max(0, caret - 1)) + 1
  const line = text.slice(lineStart, caret)
  const indent = /^\s*/.exec(line)?.[0] ?? ''
  const body = line.slice(indent.length)

  const task = /^([-*+])\s+\[[ xX]\]\s+/.exec(body)
  if (task !== null) return `\n${indent}${task[1]} [ ] `
  const bullet = /^([-*+])\s+/.exec(body)
  if (bullet !== null) return `\n${indent}${bullet[1]} `
  const ordered = /^(\d+)([.)])\s+/.exec(body)
  if (ordered !== null) return `\n${indent}${Number(ordered[1]) + 1}${ordered[2]} `
  const quote = /^(>\s?)/.exec(body)
  if (quote !== null) return `\n${indent}${quote[1]}`
  if (body.trim().length === 0 && indent.length > 0) return null
  return indent.length > 0 ? `\n${indent}` : null
}

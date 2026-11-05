/**
 * Snippet handling shared by the text and code editors: dropping a saved snippet
 * into a draft, and shaping a draft into a snippet that can be saved back.
 * @module dsh-obsidian-vault/client/pur/snippet-apply
 */
import type { CodeSnippetDto } from '../api.ts'

/** The editable parts of a text card or code node. */
export interface SnippetDraft {
  /** Card title. */
  title: string
  /** Body or code. */
  body: string
  /** Input pins, as `{id,label}` pairs. */
  inputs: { id: string; label: string }[]
  /** Output pins, as `{id,label}` pairs. */
  outputs: { id: string; label: string }[]
}

/**
 * Append a snippet's code to a draft.
 * @param draft - the draft to extend.
 * @param snippet - the snippet to insert.
 * @returns the new draft; the caller keeps its own state.
 */
export function applySnippet(draft: SnippetDraft, snippet: CodeSnippetDto): SnippetDraft {
  const body = draft.body.trim() === '' ? snippet.code : `${draft.body.replace(/\s+$/, '')}\n\n${snippet.code}`
  // Pins only make sense on a code node, and replacing an empty pin list is less
  // surprising than appending the same labels twice.
  const inputs = draft.inputs.length === 0 ? snippet.inputs.map((pin) => ({ id: '', label: pin.label })) : draft.inputs
  const outputs = draft.outputs.length === 0 ? snippet.outputs.map((pin) => ({ id: '', label: pin.label })) : draft.outputs
  return {
    title: draft.title.trim() === '' ? snippet.title : draft.title,
    body,
    inputs,
    outputs,
  }
}

/**
 * Shape a draft into a snippet body.
 * @param draft - the editor draft.
 * @param title - the name to save under.
 * @param makeId - id source, injectable for tests.
 * @returns the snippet to store.
 */
export function snippetOf(draft: SnippetDraft, title: string, makeId: () => string): CodeSnippetDto {
  return {
    id: makeId(),
    title: title.trim(),
    code: draft.body,
    inputs: draft.inputs.filter((pin) => pin.label.trim() !== '').map((pin) => ({ id: pin.id === '' ? makeId() : pin.id, label: pin.label })),
    outputs: draft.outputs.filter((pin) => pin.label.trim() !== '').map((pin) => ({ id: pin.id === '' ? makeId() : pin.id, label: pin.label })),
  }
}

/**
 * A name for a snippet taken from its first meaningful line.
 * @param draft - the editor draft.
 * @param fallback - text used when the body has no usable line.
 * @returns a short title.
 */
export function suggestedSnippetTitle(draft: SnippetDraft, fallback: string): string {
  if (draft.title.trim() !== '') return draft.title.trim()
  const line = draft.body.split('\n').map((text) => text.trim()).find((text) => text !== '')
  if (line === undefined) return fallback
  return line.length > 24 ? `${line.slice(0, 24)}…` : line
}

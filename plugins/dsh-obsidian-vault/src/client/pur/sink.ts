/**
 * The pane's effect sink: kernel effects become React overlay state, canvas
 * repaints, debounced saves and vault/URL navigation. The pane keeps the
 * callbacks fresh behind a getter so language switches never go stale.
 * @module dsh-obsidian-vault/client/pur/sink
 */
import { noteOpen } from '../api.ts'
import type { PurEffectSink } from '../../pur-kernel/index.ts'

/** Which element editor overlay a kernel edit effect opens. */
export type PurEditorKind = 'text' | 'group' | 'line' | 'note-link'

/** What the sink needs from the pane. */
export interface PurSinkDeps {
  /** Mark the next animation frame for repaint. */
  readonly markDirty: () => void
  /** Schedule a debounced document save. */
  readonly scheduleSave: () => void
  /** Show a transient notice. */
  readonly notice: (text: string) => void
  /** Set the canvas CSS cursor. */
  readonly setCursor: (cursor: string) => void
  /** Open an editor overlay for one element. */
  readonly openEditor: (kind: PurEditorKind, id: string) => void
  /** Open the context menu at a viewport point. */
  readonly openMenu: (clientX: number, clientY: number) => void
  /** Run the selected-text export flow. */
  readonly exportText: () => void
  /** Navigate the workspace to a vault path; absent when the pane cannot navigate. */
  readonly openPath?: (path: string) => void
  /** Evaluate a code node's snippet and report the outcome to the controller. */
  readonly runCode: (id: string, code: string, inputs: Record<string, unknown>) => void
}

/**
 * Open a link target: URLs in a new browser tab, vault paths through the
 * client's note-open reporting.
 * @param target - vault path or URL.
 */
export function openPurLink(target: string, openPath?: (path: string) => void): void {
  if (/^https?:/i.test(target)) {
    window.open(target, '_blank', 'noopener')
    return
  }
  // A vault path navigates in the workspace; reporting it is the fallback for
  // surfaces that cannot navigate.
  if (openPath !== undefined) openPath(target)
  else void noteOpen(target)
}

/**
 * Create the pane's effect sink.
 * @param deps - pane callbacks, read at effect time.
 * @returns the sink `executeEffects` drains into.
 */
export function createPurSink(deps: () => PurSinkDeps): PurEffectSink {
  return {
    render: () => deps().markDirty(),
    save: () => deps().scheduleSave(),
    notice: (text) => deps().notice(text),
    setCursor: (cursor) => deps().setCursor(cursor),
    openLink: (target) => deps().openPath === undefined ? openPurLink(target) : openPurLink(target, deps().openPath),
    editText: (id) => deps().openEditor('text', id),
    editGroup: (id) => deps().openEditor('group', id),
    editLine: (id) => deps().openEditor('line', id),
    editNoteLink: (id) => deps().openEditor('note-link', id),
    showContextMenu: (clientX, clientY) => deps().openMenu(clientX, clientY),
    exportText: () => deps().exportText(),
    runCode: (id, code, inputs) => deps().runCode(id, code, inputs),
  }
}

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
}

/**
 * Open a link target: URLs in a new browser tab, vault paths through the
 * client's note-open reporting.
 * @param target - vault path or URL.
 */
export function openPurLink(target: string): void {
  if (/^https?:/i.test(target)) window.open(target, '_blank', 'noopener')
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
    openLink: (target) => openPurLink(target),
    editText: (id) => deps().openEditor('text', id),
    editGroup: (id) => deps().openEditor('group', id),
    editLine: (id) => deps().openEditor('line', id),
    editNoteLink: (id) => deps().openEditor('note-link', id),
    showContextMenu: (clientX, clientY) => deps().openMenu(clientX, clientY),
    exportText: () => deps().exportText(),
  }
}

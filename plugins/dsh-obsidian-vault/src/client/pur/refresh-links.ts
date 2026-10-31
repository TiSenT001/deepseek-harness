/**
 * Refresh the text a canvas caches for its note links. A note-link card stores
 * the target note's text at the moment it was created or last edited, so the
 * card drifts once the note changes on disk. Re-reading on focus keeps the card
 * honest without watching the vault from the client.
 * @module dsh-obsidian-vault/client/pur/refresh-links
 */
import type { PurController, PurElement } from '../../pur-kernel/index.ts'
import { resolveNoteLink } from './loader.ts'

/** Outcome of one refresh pass. */
export interface NoteLinkRefresh {
  /** Cards whose cached text was replaced. */
  readonly updated: number
  /** Links that no longer resolve, so their card keeps the previous text. */
  readonly unresolved: number
}

/**
 * Whether a link names something outside the vault.
 * @param link - the element's link value.
 * @returns true for `http(s)` and other schemes.
 */
function isExternal(link: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(link)
}

/**
 * Walk the element tree and collect note-link cards that point into the vault.
 * @param elements - the canvas element tree.
 * @returns the cards, groups included.
 */
function linkCards(elements: readonly PurElement[]): readonly Extract<PurElement, { type: 'note-link' }>[] {
  const out: Extract<PurElement, { type: 'note-link' }>[] = []
  const visit = (nodes: readonly PurElement[]): void => {
    for (const element of nodes) {
      if (element.type === 'note-link' && element.link !== '' && !isExternal(element.link)) out.push(element)
      if (element.type === 'group') visit(element.children)
    }
  }
  visit(elements)
  return out
}

/**
 * Re-read every linked note and patch cards whose cached text is stale.
 * @param controller - the canvas controller.
 * @returns how many cards changed and how many links stopped resolving.
 */
export async function refreshNoteLinks(controller: PurController): Promise<NoteLinkRefresh> {
  let updated = 0
  let unresolved = 0
  for (const card of linkCards(controller.state.elements)) {
    const summary = await resolveNoteLink(card.link)
    if (summary === null) {
      unresolved += 1
      continue
    }
    if (summary.content === card.content) continue
    controller.updateElement(card.id, { content: summary.content })
    updated += 1
  }
  return { updated, unresolved }
}

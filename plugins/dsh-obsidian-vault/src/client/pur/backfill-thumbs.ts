/**
 * Backfill for canvases drawn before thumbnails existed: every image card that
 * has no small copy gets one, so a zoomed-out board shows pictures instead of
 * grey tiles. Runs on demand from the palette and saves once at the end.
 * @module dsh-obsidian-vault/client/pur/backfill-thumbs
 */
import type { PurController, PurElement } from '../../pur-kernel/index.ts'
import { assetUrl, purAssetUrl } from '../api.ts'
import { storeImage } from '../api.ts'
import { thumbnailOf } from './loader.ts'

/** How one backfill pass ended. */
export interface ThumbBackfillResult {
  /** Cards that received a thumbnail. */
  readonly updated: number
  /** Cards skipped because they already had one. */
  readonly skipped: number
  /** Cards whose picture could not be loaded or stored. */
  readonly failed: number
}

/**
 * The URL a card's picture can be fetched from.
 * @param element - an image element.
 * @returns the URL, or undefined when the card points at nothing.
 */
export function thumbnailSource(element: Extract<PurElement, { type: 'image' }>): string | undefined {
  const inline = element.dataURL
  if (inline !== undefined && inline !== '') return inline
  const original = element.original
  if (original === '') return undefined
  if (original.startsWith('pur-asset:')) return purAssetUrl(original)
  if (/^https?:/i.test(original) || original.startsWith('data:')) return original
  return assetUrl(original)
}

/**
 * Collect the image cards that still need a thumbnail.
 * @param elements - the canvas element tree.
 * @returns the cards and their source URLs.
 */
export function cardsNeedingThumbnails(
  elements: readonly PurElement[],
): readonly { element: Extract<PurElement, { type: 'image' }>; source: string }[] {
  const out: { element: Extract<PurElement, { type: 'image' }>; source: string }[] = []
  const visit = (nodes: readonly PurElement[]): void => {
    for (const element of nodes) {
      if (element.type === 'group') {
        visit(element.children)
        continue
      }
      if (element.type !== 'image') continue
      if (element.thumb !== undefined && element.thumb !== '') continue
      const source = thumbnailSource(element)
      if (source !== undefined) out.push({ element, source })
    }
  }
  visit(elements)
  return out
}

/**
 * Generate and store a thumbnail for every card that lacks one.
 * @param controller - the canvas controller.
 * @param onProgress - called with the number of cards handled so far.
 * @returns how many cards were updated, skipped and failed.
 */
export async function backfillThumbnails(
  controller: PurController,
  onProgress?: (done: number, total: number) => void,
): Promise<ThumbBackfillResult> {
  const cards = cardsNeedingThumbnails(controller.state.elements)
  let updated = 0
  let failed = 0
  for (const [index, card] of cards.entries()) {
    const thumbData = await thumbnailOf(card.source).catch(() => null)
    if (thumbData === null) {
      failed += 1
      onProgress?.(index + 1, cards.length)
      continue
    }
    const name = `${card.element.id}-thumb`
    const ref = await storeImage(name, thumbData).catch(() => '')
    if (ref === '') {
      failed += 1
      onProgress?.(index + 1, cards.length)
      continue
    }
    controller.updateElement(card.element.id, { thumb: ref })
    updated += 1
    onProgress?.(index + 1, cards.length)
  }
  return { updated, skipped: 0, failed }
}

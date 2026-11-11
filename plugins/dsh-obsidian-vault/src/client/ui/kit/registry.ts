/**
 * UI surface registry: one list per mount point. Adding or removing a surface is
 * a one-line change here; replacing a look is a variant, not a component edit.
 * @module dsh-obsidian-vault/client/ui/kit/registry
 */
import type { Translate } from '../../i18n.ts'

/** Any key the translator accepts. */
type I18nKey = Parameters<Translate>[0]

/** Rail panels the page can show. */
export type RailId = 'outline' | 'backlinks' | 'outgoing' | 'bookmarks'

/** A right-rail panel. */
export interface RailSurface {
  readonly id: RailId
  readonly label: I18nKey
}

/** A top-level view the page can show. */
export interface ViewSurface {
  readonly id: 'note' | 'graph'
  readonly label: I18nKey
}

/** Rail panels, in tab order. Properties render in the note head; tags live in the explorer. */
export const RAIL_SURFACES: readonly RailSurface[] = [
  { id: 'outline', label: 'outline' },
  { id: 'backlinks', label: 'backlinks' },
  { id: 'outgoing', label: 'linksOut' },
  { id: 'bookmarks', label: 'bookmarks' },
]

/** Top-level views. `note` has no tab; search lives in the quick switcher. */
export const VIEW_SURFACES: readonly ViewSurface[] = [
  { id: 'graph', label: 'graph' },
]

/**
 * Look up a rail surface by id.
 * @param id - surface id.
 */
export function railSurface(id: string): RailSurface | undefined {
  return RAIL_SURFACES.find(surface => surface.id === id)
}

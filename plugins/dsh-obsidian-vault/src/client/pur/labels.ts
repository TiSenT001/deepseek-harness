/**
 * Locale glue for the React Pur pane: derive every kernel label bundle from
 * the workspace translator, plus the flat reader dialog fields use.
 * @module dsh-obsidian-vault/client/pur/labels
 */
import type { Dict, Translate } from '../i18n.ts'
import { buildPurLabels } from '../i18n/pur-labels.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'

/**
 * Build the flat `pur.*` reader over the workspace translator.
 * @param t - the workspace translator.
 * @returns the reader; unknown keys resolve to the key itself.
 */
export function purReader(t: Translate): (key: string) => string {
  return (key) => t(key as keyof Dict)
}

/**
 * Build every kernel label bundle from the workspace translator.
 * @param t - the workspace translator.
 * @returns controller, renderer, codegen, export and menu-title copy.
 */
export function purBundles(t: Translate): PurLabelBundles {
  return buildPurLabels(purReader(t))
}

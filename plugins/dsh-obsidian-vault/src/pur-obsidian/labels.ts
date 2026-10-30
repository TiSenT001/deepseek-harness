/**
 * Locale glue for the Obsidian adapter: pick the `pur.*` dictionary by
 * language, expose the flat reader, and derive every kernel label bundle
 * through the shared builder.
 * @module dsh-obsidian-vault/pur-obsidian/labels
 */
import { PUR_EN } from '../client/i18n/pur-en.ts'
import { PUR_ZH } from '../client/i18n/pur-zh.ts'
import { buildPurLabels } from '../client/i18n/pur-labels.ts'
import type { PurLabelBundles } from '../client/i18n/pur-labels.ts'

/** Languages the adapter ships. */
export type PurLang = 'zh' | 'en'

/** The dictionary one language resolves to. */
const DICTS: Record<PurLang, Record<string, string>> = { zh: PUR_ZH, en: PUR_EN }

/**
 * Build the flat dictionary reader for a language. Unknown keys resolve to
 * the key itself, so a missing translation is visible instead of crashing.
 * @param lang - the language.
 * @returns the reader.
 */
export function readerFor(lang: PurLang): (key: string) => string {
  const dict = DICTS[lang]
  return (key) => dict[key] ?? key
}

/**
 * Build every kernel label bundle for a language.
 * @param lang - the language.
 * @returns controller, renderer, codegen, export and menu-title copy.
 */
export function labelsFor(lang: PurLang): PurLabelBundles {
  return buildPurLabels(readerFor(lang))
}

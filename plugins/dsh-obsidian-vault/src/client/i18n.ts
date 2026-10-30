/**
 * The plugin's own copy, in both shipped UI languages. Language follows the
 * page's `<html lang>` so the vault workspace tracks the DSH locale switch.
 * @module dsh-obsidian-vault/client/i18n
 */
import { EN } from './i18n/en.ts'
import { ZH } from './i18n/zh.ts'

/** Supported UI languages. */
export type Lang = 'zh' | 'en'

/** Every copy key, shared by both languages. */
export type Dict = { readonly [Key in keyof typeof ZH]: string }

/** Translation function over the key set both dictionaries share. */
export type Translate = (key: keyof Dict) => string

/**
 * Build the translator for one language.
 * @param lang - active language.
 */
export function createT(lang: Lang): Translate {
  const dict = lang === 'zh' ? ZH : EN
  return key => dict[key]
}

/**
 * Read the page language.
 * @returns `zh` for any Chinese tag, `en` otherwise.
 */
export function detectLang(): Lang {
  if (typeof document !== 'undefined' && document.documentElement.lang.startsWith('zh')) return 'zh'
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) return 'zh'
  return 'en'
}

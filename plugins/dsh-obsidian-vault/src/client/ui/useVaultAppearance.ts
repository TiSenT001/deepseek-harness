/**
 * Page appearance: the UI language, which follows the document's `lang`
 * attribute, and the persisted visual variant applied to the root element.
 * @module dsh-obsidian-vault/client/ui/useVaultAppearance
 */
import { useEffect, useState } from 'react'
import { detectLang, type Lang } from '../i18n.ts'
import { applyVariant, readVariant, type Variant } from './kit/index.ts'

/** Values the page reads while rendering. */
export interface VaultAppearance {
  readonly lang: Lang
  readonly variant: Variant
  /** Apply and persist a new variant. */
  readonly setVariant: (variant: Variant) => void
}

/**
 * Track the shell's language and apply the stored variant.
 * @param root - the page root the variant styles.
 * @returns the active language and variant.
 */
export function useVaultAppearance(root: { readonly current: HTMLElement | null }): VaultAppearance {
  const [lang, setLang] = useState<Lang>(detectLang)
  const [variant, setVariant] = useState<Variant>(readVariant)

  useEffect(() => {
    applyVariant(root.current, variant)
  }, [root, variant])

  useEffect(() => {
    const observer = new MutationObserver(() => setLang(detectLang()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [])

  return { lang, variant, setVariant }
}

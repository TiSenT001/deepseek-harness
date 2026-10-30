/**
 * Surface variants: one attribute on the plugin root retunes spacing, row
 * height, and type size for the whole UI.
 * @module dsh-obsidian-vault/client/ui/kit/variants
 */

/** Supported looks. */
export type Variant = 'comfortable' | 'compact'

/** Storage key for the chosen variant. */
const STORAGE_KEY = 'dsh.obsidian.variant'

/** Class the plugin root carries so variant rules can target it. */
export const VARIANT_ATTRIBUTE = 'data-ov-variant'

/** Stylesheet overrides per variant; only differences from the base are listed. */
export const VARIANT_CSS = `[${VARIANT_ATTRIBUTE}='compact'] {
  --ov-space-xs: 2px;
  --ov-space-sm: 4px;
  --ov-space-md: 6px;
  --ov-space-lg: 8px;
  --ov-space-xl: 12px;
  --ov-page-padding: 20px;
  --ov-line-width: 760px;
}
[${VARIANT_ATTRIBUTE}='compact'] .ov-item { padding: 3px 6px; font-size: 12px; }
[${VARIANT_ATTRIBUTE}='compact'] .ov-doctab { padding: 3px 8px; }
[${VARIANT_ATTRIBUTE}='compact'] .ov-explorer-tools { gap: 2px; }
[${VARIANT_ATTRIBUTE}='compact'] .ov-note-head { padding-bottom: 4px; }
[${VARIANT_ATTRIBUTE}='comfortable'] .ov-item { padding: 7px 10px; font-size: 13px; }
`

/** Read the persisted variant. */
export function readVariant(): Variant {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

/**
 * Apply a variant to one root element and persist the choice.
 * @param root - the plugin's root element.
 * @param variant - the look to apply.
 */
export function applyVariant(root: HTMLElement | null, variant: Variant): void {
  root?.setAttribute(VARIANT_ATTRIBUTE, variant)
  try {
    window.localStorage.setItem(STORAGE_KEY, variant)
  } catch {
    // A blocked storage keeps the choice for this visit only.
  }
}

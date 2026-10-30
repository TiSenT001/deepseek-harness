/**
 * In-document backlinks preference as a hook: reads the stored flag once and
 * writes it back on every toggle. Kept out of the reading view so the component
 * stays within the file budget.
 * @module dsh-obsidian-vault/client/ui/useInlineBacklinks
 */
import { useCallback, useState } from 'react'
import {
  DEFAULT_INLINE_BACKLINKS, INLINE_BACKLINKS_KEY, parseInlineBacklinks, serializeInlineBacklinks,
} from './notePrefs.ts'

/**
 * Read and toggle the in-document backlinks flag.
 * @returns the current visibility and a toggle callback.
 */
export function useInlineBacklinks(): readonly [boolean, () => void] {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return parseInlineBacklinks(window.localStorage.getItem(INLINE_BACKLINKS_KEY))
    } catch {
      // Storage can be unavailable (private mode, disabled cookies).
      return DEFAULT_INLINE_BACKLINKS
    }
  })

  const toggle = useCallback((): void => {
    setVisible((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(INLINE_BACKLINKS_KEY, serializeInlineBacklinks(next))
      } catch {
        // Persisting is best-effort; the toggle still works for this mount.
      }
      return next
    })
  }, [])

  return [visible, toggle] as const
}

/**
 * Bookmark state for the rail: reads `bookmarks.json` for the active vault and
 * writes one entry at a time, so the panel and the file menu share one source.
 * @module dsh-obsidian-vault/client/ui/useVaultBookmarks
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { readObsidianConfig, writeObsidianConfig } from '../api.ts'
import { BOOKMARKS_CONFIG, bookmarkEntries, withBookmark, type BookmarkEntry } from './bookmarks.ts'

/** Everything the bookmark hook needs from the page. */
export interface VaultBookmarkInput {
  /** Active index root; the file is re-read when the vault changes. */
  readonly root: string | undefined
  readonly setError: (message: string | undefined) => void
}

/** Bookmark state and the mutations the rail and menus call. */
export interface VaultBookmarks {
  readonly entries: readonly BookmarkEntry[]
  readonly has: (path: string) => boolean
  readonly toggle: (path: string) => void
  readonly remove: (path: string) => void
}

const message = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause))

/**
 * Track the active vault's bookmarks.
 * @param input - the active root and the page's error reporter.
 * @returns the entries plus the toggle and remove actions.
 */
export function useVaultBookmarks(input: VaultBookmarkInput): VaultBookmarks {
  const { root, setError } = input
  const [entries, setEntries] = useState<readonly BookmarkEntry[]>([])
  const [document, setDocument] = useState<unknown>()

  useEffect(() => {
    let cancelled = false
    void readObsidianConfig(BOOKMARKS_CONFIG)
      .then((stored) => {
        if (cancelled) return
        setDocument(stored.value)
        setEntries(bookmarkEntries(stored.value))
      })
      .catch(() => {
        // A vault without bookmarks simply starts empty.
        if (!cancelled) {
          setDocument(undefined)
          setEntries([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [root])

  const apply = useCallback((path: string, add: boolean): void => {
    void writeObsidianConfig(BOOKMARKS_CONFIG, withBookmark(document, path, add))
      .then((saved) => {
        setDocument(saved.value)
        setEntries(bookmarkEntries(saved.value))
      })
      .catch((cause: unknown) => setError(message(cause)))
  }, [document, setError])

  const toggle = useCallback((path: string): void => {
    apply(path, !entries.some(entry => entry.path === path))
  }, [apply, entries])

  const remove = useCallback((path: string): void => {
    apply(path, false)
  }, [apply])

  const has = useCallback((path: string): boolean => entries.some(entry => entry.path === path), [entries])

  return useMemo(() => ({ entries, has, toggle, remove }), [entries, has, remove, toggle])
}

/**
 * One pane's note bundle: the parsed note, its backlinks, and its unlinked
 * mentions for a Markdown path. Non-Markdown and absent paths stay empty.
 * @module dsh-obsidian-vault/client/ui/useNoteBundle
 */
import { useEffect, useState } from 'react'
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import { fileTypeOf } from '../../filetypes.ts'
import { fetchBacklinks, fetchNote, fetchUnlinked } from '../api.ts'

/** The reading view's data for one path. */
export interface NoteBundle {
  readonly note: NoteDto | undefined
  readonly backlinks: readonly BacklinkDto[]
  readonly unlinked: readonly BacklinkDto[]
}

const EMPTY: NoteBundle = { note: undefined, backlinks: [], unlinked: [] }

/**
 * Load one path's note bundle and keep it fresh across index versions.
 * @param path - vault-relative path, or undefined for no fetch.
 * @param version - index version; a bump refetches.
 * @param onError - fetch failure sink; omit to swallow errors (inactive panes).
 */
export function useNoteBundle(
  path: string | undefined,
  version: number | undefined,
  onError?: (message: string | undefined) => void,
): NoteBundle {
  const [bundle, setBundle] = useState<NoteBundle>(EMPTY)

  useEffect(() => {
    if (path === undefined || fileTypeOf(path).kind !== 'markdown') {
      setBundle(EMPTY)
      onError?.(undefined)
      return
    }
    let cancelled = false
    void Promise.all([fetchNote(path), fetchBacklinks(path), fetchUnlinked(path)])
      .then(([note, backlinks, unlinked]) => {
        if (cancelled) return
        setBundle({ note, backlinks, unlinked })
        onError?.(undefined)
      })
      .catch((cause: unknown) => {
        if (!cancelled) onError?.(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [path, version, onError])

  return path !== undefined && fileTypeOf(path).kind === 'markdown' ? bundle : EMPTY
}

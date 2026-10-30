/**
 * Vault data layer: index status, tree, tags, the open note, its backlinks and
 * unlinked mentions, plus polling and manual reload.
 * @module dsh-obsidian-vault/client/ui/useVaultData
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { BacklinkDto, NoteDto, StatusDto, TagCountDto, TreeNodeDto } from '../../protocol.ts'
import { fetchStatus, fetchTags, fetchTree } from '../api.ts'
import { useNoteBundle } from './useNoteBundle.ts'

const POLL_MS = 8000

/** Everything the page reads from the vault. */
export interface VaultData {
  readonly status: StatusDto | undefined
  readonly tree: readonly TreeNodeDto[]
  readonly tags: readonly TagCountDto[]
  readonly note: NoteDto | undefined
  readonly backlinks: readonly BacklinkDto[]
  readonly unlinked: readonly BacklinkDto[]
  readonly error: string | undefined
  readonly setError: (message: string | undefined) => void
  readonly reload: () => Promise<void>
}

/**
 * Load and keep the vault data fresh.
 * @param path - active note path, or undefined when no tab is open.
 */
export function useVaultData(path: string | undefined): VaultData {
  const [status, setStatus] = useState<StatusDto | undefined>()
  const [tree, setTree] = useState<readonly TreeNodeDto[]>([])
  const [tags, setTags] = useState<readonly TagCountDto[]>([])
  const [error, setError] = useState<string | undefined>()
  const versionRef = useRef<number | undefined>()
  const { note, backlinks, unlinked } = useNoteBundle(path, status?.version, setError)

  const reload = useCallback(async () => {
    try {
      const [nextStatus, nextTree, nextTags] = await Promise.all([fetchStatus(), fetchTree(), fetchTags()])
      versionRef.current = nextStatus.version
      setStatus(nextStatus)
      setTree(nextTree)
      setTags(nextTags)
      setError(nextStatus.error)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void fetchStatus()
        .then((next) => {
          // A version bump needs the full tree/tags reload; otherwise just keep
          // the status line fresh. Compared through a ref so the check stays
          // out of the state updater.
          if (versionRef.current !== undefined && versionRef.current !== next.version) void reload()
          else {
            versionRef.current = next.version
            setStatus(next)
          }
        })
        .catch(() => undefined)
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [reload])

  return { status, tree, tags, note, backlinks, unlinked, error, setError, reload }
}

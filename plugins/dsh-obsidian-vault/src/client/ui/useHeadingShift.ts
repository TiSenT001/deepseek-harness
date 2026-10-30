/**
 * Heading level shifts from the outline panel: read the raw file, rewrite the
 * heading markers, save through the conflict-checked note route, and reload.
 * @module dsh-obsidian-vault/client/ui/useHeadingShift
 */
import { useCallback } from 'react'
import { ApiError, fetchFile, saveNote } from '../api.ts'
import { shiftHeadingLevel } from '../../vault/heading-level.ts'

/** Inputs for {@link useHeadingShift}. */
export interface HeadingShiftInput {
  /** Active note path; undefined disables the action. */
  readonly path: string | undefined
  /** Re-read the index after a successful write. */
  readonly reload: () => Promise<void>
  /** Surface a failure to the page banner. */
  readonly setError: (message: string | undefined) => void
}

/**
 * Build the outline's shift action.
 * @param input - the active path, reload, and error sink.
 * @returns a callback applying one clamped level shift to a body line.
 */
export function useHeadingShift(
  { path, reload, setError }: HeadingShiftInput,
): (line: number, delta: number) => void {
  return useCallback((line: number, delta: number) => {
    if (path === undefined) return
    void (async () => {
      const file = await fetchFile(path)
      const text = file.text ?? ''
      const next = shiftHeadingLevel(text, line, delta)
      if (next === undefined || next === text) return
      await saveNote(path, next, file.mtime)
      await reload()
    })().catch((cause: unknown) => {
      // A 409 means the file moved on disk under the panel: reload so the
      // outline shows the truth, and report the conflict like a save failure.
      if (cause instanceof ApiError && cause.status === 409) void reload()
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [path, reload, setError])
}

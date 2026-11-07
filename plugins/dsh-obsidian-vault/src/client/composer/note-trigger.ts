/**
 * The `@笔记` trigger source for the conversation composer: typing `@` lists
 * vault notes, and a pick inserts a reference chip whose submit-time
 * serialization carries the note's Markdown into the prompt. It talks to the
 * plugin's own HTTP API, so it needs no Host-side integration.
 * @module dsh-obsidian-vault/client/composer/note-trigger
 */
import { fetchFile, fetchSearch } from '../api-vault.ts'
import {
  formatNoteReference,
  noteCandidates,
  type SearchHit,
  type TriggerCandidate,
} from './note-reference.ts'

/** Structured reference the composer turns into a chip. */
export interface ReferenceInsert {
  readonly source: string
  readonly ref: string
  readonly label: string
  readonly appearance?: 'session' | 'file' | 'folder'
  readonly clipboardText: string
}

/** Result a pick returns to the pipeline. */
export type PickOutcome = { readonly insert: ReferenceInsert } | { readonly text: string } | undefined

/** Session projection handed to every source callback. */
export interface ClientSessionContext {
  readonly sessionId: string
}

/** Source name used as the reference `source` identity. */
export const NOTE_SOURCE = 'obsidian-notes'

/** The structural slice of the input-trigger source the composer consumes. */
export interface NoteTriggerSource {
  readonly trigger: '@'
  readonly name: string
  readonly order: number
  readonly showGroupTitle: boolean
  candidates(session: ClientSessionContext, request: { readonly query: string; readonly signal: AbortSignal }): Promise<readonly TriggerCandidate[]>
  onPick(pick: { readonly candidate: TriggerCandidate }): PickOutcome
  readonly codec: {
    clipboardText(ref: string): string
    serialize(ref: string, signal: AbortSignal): Promise<string>
  }
}

/** Dependencies the source reads, injectable for tests. */
export interface NoteTriggerDeps {
  readonly search: (query: string) => Promise<readonly SearchHit[]>
  readonly file: (path: string) => Promise<{ text?: string }>
  readonly vaultRoot: () => Promise<string>
}

/** Read the active vault root from the status route. */
async function fetchStatusRoot(): Promise<string> {
  try {
    const response = await fetch('/obsidian/api/status', { headers: { accept: 'application/json' } })
    if (!response.ok) return ''
    const body = await response.json() as { root?: unknown }
    return typeof body.root === 'string' ? body.root : ''
  } catch {
    return ''
  }
}

/** Default dependencies: the plugin's own HTTP API. */
function defaultDeps(): NoteTriggerDeps {
  return {
    search: query => fetchSearch(query),
    file: path => fetchFile(path),
    vaultRoot: fetchStatusRoot,
  }
}

/**
 * Build the `@` note source.
 * @param deps - search/file/root readers; defaults to the plugin API.
 * @returns the source to register with `ctx.inputTriggers`.
 */
export function createNoteTriggerSource(deps: NoteTriggerDeps = defaultDeps()): NoteTriggerSource {
  return {
    trigger: '@',
    name: NOTE_SOURCE,
    order: 10,
    showGroupTitle: false,
    async candidates(_session, request) {
      const query = request.query.trim()
      if (request.signal.aborted) return []
      const hits = await deps.search(query).catch(() => [])
      if (request.signal.aborted) return []
      return noteCandidates(hits)
    },
    onPick(pick) {
      const path = pick.candidate.value ?? pick.candidate.name
      return {
        insert: {
          source: NOTE_SOURCE,
          ref: path,
          label: pick.candidate.label ?? path,
          appearance: 'file',
          clipboardText: `@[[${path}]]`,
        },
      }
    },
    codec: {
      clipboardText: ref => `@[[${ref}]]`,
      async serialize(ref, signal) {
        if (signal.aborted) throw new Error('submission aborted')
        const [file, vault] = await Promise.all([deps.file(ref), deps.vaultRoot()])
        if (signal.aborted) throw new Error('submission aborted')
        return formatNoteReference({
          path: ref,
          title: ref.slice(ref.lastIndexOf('/') + 1).replace(/\.md$/, ''),
          vault,
          text: file.text ?? '',
        })
      },
    },
  }
}

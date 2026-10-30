/**
 * Note and folder moves: rewrites links that pointed at the old path so
 * existing `[[links]]` keep resolving, then moves the entry on disk.
 * @module dsh-obsidian-vault/vault/move
 */
import type { BacklinkDto } from '../protocol.ts'
import type { NoteEntry } from './entry.ts'
import type { VaultFiles } from './files.ts'
import { rewriteMoveLinks } from './links.ts'
import type { LinkResolver } from './resolver.ts'
import { baseName } from './tree.ts'

const MARKDOWN = /\.md$/i

/** Index slices a move reads while planning link rewrites. */
export interface MoveState {
  readonly files: VaultFiles
  readonly notes: ReadonlyMap<string, NoteEntry>
  readonly backlinks: ReadonlyMap<string, readonly BacklinkDto[]>
  readonly resolver: LinkResolver | undefined
}

/** Outcome of one move: destination, rewritten notes, and the trash backup. */
export interface MoveOutcome {
  readonly moved: string
  readonly rewritten: ReadonlyArray<{ readonly path: string; readonly count: number }>
  readonly backup: string | undefined
}

/**
 * Move a note or folder, rewriting links that pointed at the old path. A
 * folder move rewrites links to every descendant note as well. The caller
 * rescans afterwards.
 * @param state - index slices the move reads.
 * @param from - current vault-relative path.
 * @param to - destination vault-relative path.
 * @returns the moved path, rewritten notes, and the trash backup.
 */
export async function moveEntry(state: MoveState, from: string, to: string): Promise<MoveOutcome> {
  if (from === to) return { moved: to, rewritten: [], backup: undefined }
  if (to.startsWith(`${from}/`)) throw new Error(`cannot move a folder into itself: ${to}`)
  if (await state.files.exists(to)) throw new Error(`target already exists: ${to}`)

  // One mapping for a moved note; every descendant note joins a folder move.
  const mappings = [...state.notes.keys()]
    .filter(path => path === from || path.startsWith(`${from}/`))
    .map(path => ({ from: path, to: path === from ? to : `${to}/${path.slice(from.length + 1)}` }))
  const moving = new Set(mappings.map(mapping => mapping.from))

  const counts = new Map<string, number>()
  for (const [path, note] of state.notes) {
    if (moving.has(path)) continue
    counts.set(note.title, (counts.get(note.title) ?? 0) + 1)
  }
  const facts = mappings.map((mapping) => {
    const entry = state.notes.get(mapping.from)
    return {
      ...mapping,
      titleChanged: entry !== undefined && entry.title !== baseName(mapping.to).replace(MARKDOWN, ''),
      titleStillUnique: (counts.get(baseName(mapping.to).replace(MARKDOWN, '')) ?? 0) === 0,
    }
  })

  const affected = new Set<string>()
  for (const mapping of mappings) {
    for (const item of state.backlinks.get(mapping.from) ?? []) affected.add(item.path)
  }
  const resolver = state.resolver
  const rewrites: Array<{ path: string; before: string; after: string; count: number }> = []
  for (const path of affected) {
    let raw: string
    try {
      raw = await state.files.readText(path)
    } catch {
      continue
    }
    let text = raw
    let count = 0
    for (const mapping of facts) {
      const result = rewriteMoveLinks(text, mapping.from, mapping.to, {
        resolve: (target: string) => {
          const resolution = resolver?.resolve(target, path)
          return resolution?.status === 'resolved' ? resolution.path : undefined
        },
        titleStillUnique: mapping.titleStillUnique,
        titleChanged: mapping.titleChanged,
      })
      text = result.text
      count += result.changed
    }
    if (count > 0) rewrites.push({ path, before: raw, after: text, count })
  }

  const backup = state.notes.has(from) ? await state.files.backup(from, `move-${Date.now()}`) : undefined
  const written: string[] = []
  try {
    for (const rewrite of rewrites) {
      await state.files.writeText(rewrite.path, rewrite.after)
      written.push(rewrite.path)
    }
    await state.files.move(from, to)
  } catch (error) {
    for (const path of written) {
      const rewrite = rewrites.find(item => item.path === path)
      if (rewrite !== undefined) await state.files.writeText(path, rewrite.before).catch(() => undefined)
    }
    throw error
  }
  return {
    moved: to,
    rewritten: rewrites.map(item => ({ path: item.path, count: item.count })),
    backup,
  }
}

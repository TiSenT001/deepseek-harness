/**
 * Obsidian link resolution, mirroring `getLinkpathDest`: case-insensitive
 * exact path first, then `./`/`../` against the source folder, root-anchored
 * leading `/`, then path-suffix and basename candidates ordered by proximity
 * to the source folder and ascending path length. Frontmatter aliases are a
 * last-resort extension (the Obsidian app resolves them only in suggestions,
 * never here). Ambiguity is reported only when the top bucket ties exactly.
 * @module dsh-obsidian-vault/vault/resolver
 */
import type { LinkStatus } from '../protocol.ts'

/** The identity one note contributes to link resolution. */
export interface NoteIdentity {
  /** Vault-relative path with `/` separators and a leading no slash. */
  readonly path: string
  readonly title: string
  readonly aliases: readonly string[]
}

/** Outcome of resolving one authored link target. */
export interface Resolution {
  readonly status: LinkStatus
  readonly path?: string
  readonly candidates?: readonly string[]
}

/** Normalize an authored target for lookup. */
export function normalizeTarget(target: string): string {
  let text = target.trim().replace(/\\/g, '/')
  while (text.startsWith('./')) text = text.slice(2)
  text = text.replace(/^\/+/, '')
  text = text.replace(/\.md$/i, '')
  return text.toLowerCase()
}

/**
 * Resolution index over the current vault, rebuilt whenever the vault changes.
 */
export class LinkResolver {
  private readonly byPath = new Map<string, NoteIdentity>()
  private readonly byBasename = new Map<string, NoteIdentity[]>()
  private readonly byAlias = new Map<string, NoteIdentity[]>()

  /** @param notes - every note currently indexed. */
  constructor(notes: readonly NoteIdentity[]) {
    for (const note of notes) {
      this.byPath.set(normalizeTarget(note.path), note)
      push(this.byBasename, normalizeTarget(basenameOf(note.path)), note)
      for (const alias of note.aliases) {
        const key = normalizeTarget(alias)
        if (key.length > 0) push(this.byAlias, key, note)
      }
    }
  }

  /**
   * Resolve one authored target.
   * @param target - link text with alias, anchor, and `.md` already removed.
   * @param from - vault-relative path of the note the link is written in.
   * @returns the winning note, an ambiguity, or an unresolved marker.
   */
  resolve(target: string, from?: string): Resolution {
    const cleaned = target.trim().replace(/\\/g, '/')
    if (cleaned.length === 0) return { status: 'unresolved' }
    const folder = from === undefined ? '' : folderOf(from).toLowerCase()
    let key: string
    if (cleaned.startsWith('./') || cleaned.startsWith('../')) {
      key = normalizeTarget(joinRelative(folder, cleaned))
      const exact = this.byPath.get(key)
      if (exact !== undefined) return { status: 'resolved', path: exact.path }
    } else if (cleaned.startsWith('/')) {
      const exact = this.byPath.get(normalizeTarget(cleaned))
      // A root-anchored target matches exactly or not at all.
      return exact === undefined
        ? { status: 'unresolved' }
        : { status: 'resolved', path: exact.path }
    } else {
      key = normalizeTarget(cleaned)
      const exact = this.byPath.get(key)
      if (exact !== undefined) return { status: 'resolved', path: exact.path }
    }
    for (const pool of [
      this.suffixMatches(key),
      this.byBasename.get(key) ?? [],
      this.byAlias.get(key) ?? [],
    ]) {
      const chosen = decide(rank(pool, folder), folder)
      if (chosen.kind === 'resolved') return { status: 'resolved', path: chosen.path }
      if (chosen.kind === 'ambiguous') return { status: 'ambiguous', candidates: chosen.paths }
    }
    return { status: 'unresolved' }
  }

  private suffixMatches(key: string): NoteIdentity[] {
    const matches: NoteIdentity[] = []
    for (const [path, note] of this.byPath) {
      if (path.endsWith(`/${key}`)) matches.push(note)
    }
    return matches
  }
}

type Pick = { kind: 'resolved'; path: string } | { kind: 'ambiguous'; paths: string[] } | { kind: 'none' }

/** Order candidates: source folder first, then ascending path length. */
function rank(candidates: readonly NoteIdentity[], folder: string): NoteIdentity[] {
  const prefix = folder.length === 0 ? '' : `${folder}/`
  return [...candidates].sort((left, right) => {
    const nearLeft = left.path.toLowerCase().startsWith(prefix) ? 0 : 1
    const nearRight = right.path.toLowerCase().startsWith(prefix) ? 0 : 1
    if (nearLeft !== nearRight) return nearLeft - nearRight
    return left.path.length - right.path.length
  })
}

/** The first candidate wins; only a same-bucket equal-length tie is ambiguous. */
function decide(ordered: readonly NoteIdentity[], folder: string): Pick {
  const first = ordered[0]
  if (first === undefined) return { kind: 'none' }
  const tied = ordered.filter(candidate => (
    candidate.path.length === first.path.length && isNear(candidate, folder) === isNear(first, folder)
  ))
  if (tied.length === 1) return { kind: 'resolved', path: first.path }
  return { kind: 'ambiguous', paths: tied.map(candidate => candidate.path) }
}

/** True when the candidate lives under the source folder. */
function isNear(candidate: NoteIdentity, folder: string): boolean {
  return folder.length === 0 || candidate.path.toLowerCase().startsWith(`${folder}/`)
}

/** Join a `./`/`../` target onto the source folder. */
function joinRelative(folder: string, target: string): string {
  const parts = folder.length === 0 ? [] : folder.split('/')
  for (const segment of target.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      parts.pop()
      continue
    }
    parts.push(segment)
  }
  return parts.join('/')
}

function push(map: Map<string, NoteIdentity[]>, key: string, note: NoteIdentity): void {
  const list = map.get(key)
  if (list === undefined) map.set(key, [note])
  else list.push(note)
}

function folderOf(path: string): string {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

function basenameOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.replace(/\.md$/i, '')
}

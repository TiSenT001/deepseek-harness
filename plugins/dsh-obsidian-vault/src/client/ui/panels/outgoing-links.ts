/**
 * Pure grouping for the outgoing-links panel: dedupe authored links by
 * destination and split them into resolved and unresolved targets.
 * @module dsh-obsidian-vault/client/ui/panels/outgoing-links
 */
import type { NoteLinkDto } from '../../../protocol.ts'

/** One unique outgoing link, keeping its first authored spelling. */
export interface OutgoingLink {
  readonly label: string
  readonly path?: string
  readonly target: string
  readonly line: number
}

/**
 * Deduplicate links by destination; repeated mentions stay one row.
 * @param links - parsed links from the active note.
 * @returns resolved and unresolved rows in authored order.
 */
export function uniqueLinks(links: readonly NoteLinkDto[]): {
  readonly resolved: readonly OutgoingLink[]
  readonly unresolved: readonly OutgoingLink[]
} {
  const seen = new Set<string>()
  const resolved: OutgoingLink[] = []
  const unresolved: OutgoingLink[] = []
  for (const link of links) {
    if (link.embed) continue
    const key = link.status === 'resolved' ? `p:${link.path ?? link.target}` : `t:${link.target}`
    if (seen.has(key)) continue
    seen.add(key)
    const label = link.alias ?? link.target
    if (link.status === 'resolved' && link.path !== undefined) {
      resolved.push({ label, path: link.path, target: link.target, line: link.line })
    } else {
      unresolved.push({ label, target: link.target, line: link.line })
    }
  }
  return { resolved, unresolved }
}

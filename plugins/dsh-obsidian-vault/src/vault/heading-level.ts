/**
 * Heading level shifts for the outline panel: promote or demote one heading
 * together with the subtree of deeper headings below it, keeping every level
 * inside 1..6. Pure text transforms shared by the client preview and the save
 * path, unit-tested without a vault.
 * @module dsh-obsidian-vault/vault/heading-level
 */
import { parseFrontmatter } from './frontmatter.ts'
import { scanHeadings } from './syntax.ts'

/** The heading fields a shift needs. */
export interface HeadingLike {
  readonly level: number
  /** 1-based line in the note body (frontmatter excluded). */
  readonly line: number
}

/** A heading marker at the start of a line: up to three spaces, then 1-6 `#`. */
const HEADING_PREFIX = /^(\s{0,3})#{1,6}(?=[ \t])/

/**
 * Collect the headings a shift carries along: the target itself plus every
 * following heading deeper than it, stopping at the first peer.
 * @param headings - note headings in source order.
 * @param bodyLine - 1-based body line of the dragged heading.
 * @returns the affected headings, empty when no heading sits on that line.
 */
export function shiftedHeadings(
  headings: readonly HeadingLike[],
  bodyLine: number,
): readonly HeadingLike[] {
  const index = headings.findIndex(heading => heading.line === bodyLine)
  const target = headings[index]
  if (target === undefined) return []
  const affected = [target]
  for (const heading of headings.slice(index + 1)) {
    if (heading.level <= target.level) break
    affected.push(heading)
  }
  return affected
}

/**
 * Clamp a requested shift so every carried heading keeps a level inside 1..6.
 * @param headings - note headings in source order.
 * @param bodyLine - 1-based body line of the dragged heading.
 * @param delta - requested levels; negative promotes, positive demotes.
 * @returns the applicable shift, 0 when nothing can move that way.
 */
export function clampHeadingShift(
  headings: readonly HeadingLike[],
  bodyLine: number,
  delta: number,
): number {
  const affected = shiftedHeadings(headings, bodyLine)
  if (affected.length === 0 || delta === 0) return 0
  const levels = affected.map(heading => heading.level)
  return Math.max(1 - Math.min(...levels), Math.min(delta, 6 - Math.max(...levels)))
}

/**
 * Rewrite the heading markers of one heading and its subtree in raw note text.
 * @param source - complete file text, frontmatter included.
 * @param bodyLine - 1-based body line of the dragged heading.
 * @param delta - requested levels; the applied shift is clamped like
 *   {@link clampHeadingShift}.
 * @returns the rewritten text, or undefined when the line holds no heading or
 *   the requested direction cannot move at all.
 */
export function shiftHeadingLevel(source: string, bodyLine: number, delta: number): string | undefined {
  if (delta === 0) return undefined
  const frontmatter = parseFrontmatter(source)
  const lines = source.split('\n')
  const offset = lines.length - frontmatter.body.split('\n').length
  const affected = shiftedHeadings(scanHeadings(frontmatter.body), bodyLine)
  if (affected.length === 0) return undefined
  const levels = affected.map(heading => heading.level)
  const applied = Math.max(1 - Math.min(...levels), Math.min(delta, 6 - Math.max(...levels)))
  if (applied === 0) return undefined
  const next = [...lines]
  for (const heading of affected) {
    const at = offset + heading.line - 1
    const line = next[at]
    if (line === undefined || !HEADING_PREFIX.test(line)) return undefined
    next[at] = line.replace(HEADING_PREFIX, `$1${'#'.repeat(heading.level + applied)}`)
  }
  return next.join('\n')
}

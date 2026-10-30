/**
 * Token shapes and the one regex the syntax scanners share. Kept apart so the
 * scanners, the link parser and the rewriter can depend on the shapes without
 * depending on each other.
 * @module dsh-obsidian-vault/vault/syntax-shared
 */

/** One `[[target#anchor|alias]]` occurrence in a note. */
export interface WikiLinkToken {
  /** Authored text, including the brackets and a leading `!` for embeds. */
  readonly raw: string
  /** Link target with alias, anchor, block reference, and `.md` removed. */
  readonly target: string
  readonly alias?: string
  readonly anchor?: string
  readonly block?: string
  readonly embed: boolean
  /** 1-based source line. */
  readonly line: number
}

/** One heading. */
export interface HeadingToken {
  readonly level: number
  readonly text: string
  /** 1-based source line. */
  readonly line: number
}

/** One inline tag occurrence on a line. */
export interface TagSpan {
  readonly tag: string
  /** Index of the leading `#`. */
  readonly start: number
  /** Index just past the tag name. */
  readonly end: number
}

/** A fence opener or closer: three or more backticks or tildes. */
export const FENCE = /^\s*(`{3,}|~{3,})/

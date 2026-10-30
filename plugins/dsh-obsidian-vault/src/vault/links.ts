/**
 * Link rewriting for a moved note: every wikilink whose target resolved to the
 * moved path is retargeted, preserving alias, heading anchor, block id, and the
 * embed `!` prefix.
 * @module dsh-obsidian-vault/vault/links
 */
import { replaceWikiLinks } from './syntax.ts'

/** One rewritten source. */
export interface MoveRewrite {
  readonly text: string
  readonly changed: number
}

/** Extra facts the rewrite needs about the destination. */
export interface MoveRewriteOptions {
  /** Resolve one authored target to a vault path, if it resolves. */
  resolve(target: string): string | undefined
  /** True when `[[Title]]` still resolves to the moved note afterwards. */
  readonly titleStillUnique: boolean
  /** True when the file name (title) changes. */
  readonly titleChanged: boolean
}

/**
 * Retarget links that point at `from` so they point at `to`.
 * @param source - full note text, frontmatter included.
 * @param from - old vault-relative path.
 * @param to - new vault-relative path.
 * @param options - resolution and title facts.
 */
export function rewriteMoveLinks(
  source: string,
  from: string,
  to: string,
  options: MoveRewriteOptions,
): MoveRewrite {
  const target = to.replace(/\.md$/i, '')
  let changed = 0
  const text = replaceWikiLinks(source, (token) => {
    if (options.resolve(token.target) !== from) return token.raw
    const bare = !token.target.includes('/')
    // A bare title that stays unique and unchanged keeps resolving after the move.
    if (bare && options.titleStillUnique && !options.titleChanged) return token.raw
    const anchor = token.anchor === undefined || token.anchor.length === 0 ? '' : `#${token.anchor}`
    // `[[note#^id]]` has an empty anchor and a block id, so the caret needs its own `#`.
    const block = token.block === undefined
      ? ''
      : anchor.length > 0 ? `^${token.block}` : `#^${token.block}`
    const alias = token.alias === undefined ? '' : `|${token.alias}`
    changed += 1
    return `${token.embed ? '!' : ''}[[${target}${anchor}${block}${alias}]]`
  })
  return { text, changed }
}

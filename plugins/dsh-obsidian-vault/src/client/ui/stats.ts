/**
 * Text measures for the status bar. Counting stays allocation-light because it
 * runs on every note switch, including notes far past the reading view's size.
 * @module dsh-obsidian-vault/client/ui/stats
 */

/** Measures shown in the status bar. */
export interface TextStats {
  readonly words: number
  readonly chars: number
  readonly lines: number
}

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/g
const LATIN_WORD = /[A-Za-z0-9\u00c0-\u024f]+(?:['’-][A-Za-z0-9\u00c0-\u024f]+)*/g

/**
 * Count words, characters, and lines of one note body.
 *
 * A CJK character counts as one word, matching how Chinese and Japanese text is
 * counted; a run of Latin letters, digits, or accents counts as one word.
 * @param content - the raw note text.
 * @returns the three measures; an empty body reports zero lines.
 */
export function textStats(content: string): TextStats {
  if (content.length === 0) return { words: 0, chars: 0, lines: 0 }
  const cjk = content.match(CJK)?.length ?? 0
  const latin = content.replace(CJK, ' ').match(LATIN_WORD)?.length ?? 0
  return {
    words: cjk + latin,
    chars: content.length,
    lines: content.split('\n').length,
  }
}

/**
 * Last path segment of a vault root, for display.
 * @param root - absolute vault root as the host reported it.
 */
export function vaultName(root: string): string {
  const trimmed = root.replace(/[\\/]+$/, '')
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  const name = cut === -1 ? trimmed : trimmed.slice(cut + 1)
  return name.length === 0 ? root : name
}

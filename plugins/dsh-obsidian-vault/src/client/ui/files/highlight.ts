/**
 * Bridge from the tokenizer to the DOM: the code view renders tokens itself,
 * and fenced code blocks inside a rendered note are decorated in place so they
 * share one highlighter.
 * @module dsh-obsidian-vault/client/ui/files/highlight
 */
import { normalizeLanguage } from '../../../filetypes.ts'
import { css } from '../theme.ts'
import { tokenize, type TokenKind } from './tokenize.ts'

const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  plain: css.tkPlain,
  comment: css.tkComment,
  string: css.tkString,
  number: css.tkNumber,
  keyword: css.tkKeyword,
  literal: css.tkLiteral,
  function: css.tkFunction,
  attr: css.tkAttr,
  tag: css.tkTag,
  punct: css.tkPunct,
}

/** Source text last decorated per block, so a re-render of the same note is a no-op. */
const DECORATED = new WeakMap<HTMLElement, string>()

/**
 * Stylesheet class for one token kind.
 * @param kind - token classification.
 */
export function tokenClass(kind: TokenKind): string {
  return TOKEN_CLASS[kind]
}

/**
 * Decorate every fenced code block of a rendered note, once.
 * @param container - element holding the rendered Markdown.
 */
export function highlightDocument(container: HTMLElement | null): void {
  if (container === null) return
  for (const block of container.querySelectorAll('pre > code')) {
    if (!(block instanceof HTMLElement)) continue
    const source = block.textContent ?? ''
    if (DECORATED.get(block) === source) continue
    const fragment = document.createDocumentFragment()
    for (const token of tokenize(source, normalizeLanguage(languageOf(block)))) {
      if (token.kind === 'plain') {
        fragment.append(document.createTextNode(token.text))
        continue
      }
      const span = document.createElement('span')
      span.className = tokenClass(token.kind)
      span.textContent = token.text
      fragment.append(span)
    }
    block.replaceChildren(fragment)
    DECORATED.set(block, source)
  }
}

/** Language name a fence declared, from `language-x`, `lang-x`, or data attributes. */
function languageOf(block: HTMLElement): string | undefined {
  const declared = block.dataset['language'] ?? block.parentElement?.dataset['language']
  if (declared !== undefined) return declared
  for (const value of [block.className, block.parentElement?.className ?? '']) {
    const match = /(?:^|\s)(?:language|lang)-([\w+#.-]+)/.exec(value)
    if (match !== null) return match[1]
  }
  return undefined
}

/**
 * Post-render highlight decoration: wrap `==marked==` runs in `<mark>`, leaving
 * code spans and fenced blocks alone.
 * @module dsh-obsidian-vault/client/ui/note/enhanceHighlights
 */
import { splitHighlights } from '../../markdown/inline.ts'
import { css } from '../theme.ts'

/**
 * Wrap every `==marked==` run under `container` in a `<mark>` element.
 * @param container - the rendered document root, or null before mount.
 */
export function enhanceHighlights(container: HTMLElement | null): void {
  if (container === null) return
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const targets: Text[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    if (!text.data.includes('==')) continue
    const parent = text.parentElement
    if (parent === null || parent.closest('code, pre')) continue
    targets.push(text)
  }
  for (const text of targets) {
    const runs = splitHighlights(text.data)
    if (!runs.some(run => run.highlight)) continue
    const fragment = document.createDocumentFragment()
    for (const run of runs) {
      if (!run.highlight) {
        fragment.append(document.createTextNode(run.text))
        continue
      }
      const mark = document.createElement('mark')
      mark.className = css.highlight
      mark.textContent = run.text
      fragment.append(mark)
    }
    text.replaceWith(fragment)
  }
}

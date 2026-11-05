/**
 * Hover hint: one line telling the user what a double click would do on whatever
 * sits under the pointer. The canvas has no other way to advertise the gesture.
 * @module dsh-obsidian-vault/client/pur/hint
 */
import type { PurElement } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'

/**
 * Copy for the gesture a card supports.
 * @param element - element under the pointer, or null over empty canvas.
 * @param t - translator.
 * @returns the hint text.
 */
export function canvasHintFor(element: PurElement | null, t: Translate): string {
  if (element === null) return t('canvasHintNew')
  if (element.type === 'text' || element.type === 'code-node') return t('canvasHintEdit')
  if (element.type === 'group') return t('canvasHintGroup')
  if (element.type === 'line') return t('canvasHintLine')
  if (element.type === 'note-link') return t('canvasHintLink')
  if (element.type === 'image') {
    const link = element.link
    return link !== undefined && link !== '' ? t('canvasHintLink') : t('canvasHintPreview')
  }
  return t('canvasHintEdit')
}

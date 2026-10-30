/**
 * Effect execution: turn the kernel's effect list into sink calls, in order.
 * @module dsh-obsidian-vault/pur-kernel/adapter-effects
 */
import type { PurControllerEffect } from './controller-types.ts'
import type { PurEffectSink } from './adapter-types.ts'

/**
 * Perform every effect in order.
 * @param effects - kernel-reported effects.
 * @param sink - the adapter's handlers.
 */
export function executeEffects(effects: readonly PurControllerEffect[], sink: PurEffectSink): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'render':
        sink.render()
        break
      case 'save':
        sink.save()
        break
      case 'notice':
        sink.notice(effect.text)
        break
      case 'cursor':
        sink.setCursor(effect.cursor)
        break
      case 'open-link':
        sink.openLink(effect.target)
        break
      case 'edit-text':
        sink.editText(effect.id)
        break
      case 'edit-group':
        sink.editGroup(effect.id)
        break
      case 'edit-line':
        sink.editLine(effect.id)
        break
      case 'edit-note-link':
        sink.editNoteLink(effect.id)
        break
      case 'context-menu':
        sink.showContextMenu(effect.clientX, effect.clientY)
        break
      case 'export-text':
        sink.exportText()
        break
      default:
        assertNever(effect)
    }
  }
}

/** Exhaustiveness guard for the effect union. */
function assertNever(value: never): never {
  throw new Error(`unhandled pur effect: ${JSON.stringify(value)}`)
}

/**
 * React-to-kernel event conversion for the Pur pane: the DOM event carries the
 * canvas origin, which the kernel needs to map client coordinates into world
 * space.
 * @module dsh-obsidian-vault/client/pur/pane-events
 */
import type React from 'react'
import type { PurPointerEvent } from '../../pur-kernel/index.ts'

/**
 * The kernel pointer event for a React mouse event, with the canvas origin
 * resolved.
 * @param event - the React mouse event on the canvas element.
 * @returns the kernel pointer event.
 */
export function pointerEventOf(event: React.MouseEvent<HTMLCanvasElement>): PurPointerEvent {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    rectLeft: rect.left,
    rectTop: rect.top,
    button: event.button,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  }
}

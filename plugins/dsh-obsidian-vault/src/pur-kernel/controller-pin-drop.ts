/**
 * Pin drops on empty canvas: the connection is remembered until the user picks a
 * node kind, then a card is created under the drop and wired to the source pin.
 * @module dsh-obsidian-vault/pur-kernel/controller-pin-drop
 */
import { codeNodeMinHeight } from './code-node-layout.ts'
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurCodeNodeElement, PurTextElement } from './types.ts'

/** Width a card created from a dropped connection gets, in world units. */
const DROP_TEXT_WIDTH = 220

/** Height a text card created from a dropped connection gets, in world units. */
const DROP_TEXT_HEIGHT = 90

/** Width a code node created from a dropped connection gets, in world units. */
const DROP_CODE_WIDTH = 260

/** Label of the input pin a dropped card receives. */
const DROP_PIN_LABEL = 'in'

/** Kinds the drop menu can create. */
export type PurDropKind = 'text' | 'code'

/**
 * Clear a pending drop.
 * @param tools - shared controller tools.
 * @returns the render effect, empty when nothing was pending.
 */
export function cancelPinDrop(tools: PurControllerTools): PurControllerEffect[] {
  if (tools.state.pinDrop === null) return []
  tools.state.pinDrop = null
  return [{ type: 'render' }]
}

/**
 * Create the chosen card at the drop point and connect it to the source pin.
 * @param tools - shared controller tools.
 * @param kind - text card or code node.
 * @returns the commit effects, empty when no drop is pending.
 */
export function completePinDrop(tools: PurControllerTools, kind: PurDropKind): PurControllerEffect[] {
  const { state, env, labels } = tools
  const drop = state.pinDrop
  if (drop === null) return []
  state.pinDrop = null
  const pinId = env.createId()
  const height = kind === 'code' ? codeNodeMinHeight(1) : DROP_TEXT_HEIGHT
  const width = kind === 'code' ? DROP_CODE_WIDTH : DROP_TEXT_WIDTH
  // The card is placed so its input pin lands where the pointer let go.
  const x = drop.worldX + 8
  const y = drop.worldY - height / 2
  const id = env.createId()
  if (kind === 'code') {
    const node: PurCodeNodeElement = {
      id,
      type: 'code-node',
      x,
      y,
      w: width,
      h: height,
      title: '',
      code: 'function process(inputs) {\n  return {};\n}',
      content: '',
      inputs: [{ id: pinId, label: DROP_PIN_LABEL }],
      outputs: [],
      rotation: 0,
      opacity: 1,
    }
    state.elements.push(node)
  } else {
    const card: PurTextElement = {
      id,
      type: 'text',
      x,
      y,
      w: width,
      h: height,
      content: '',
      title: '',
      inputs: [{ id: pinId, label: DROP_PIN_LABEL }],
      outputs: [],
      rotation: 0,
      opacity: 1,
    }
    state.elements.push(card)
  }
  state.elements.push({
    id: env.createId(),
    type: 'line',
    from: drop.nodeId,
    fromPin: drop.pinId,
    to: id,
    toPin: pinId,
    content: '',
    arrow: false,
  })
  state.selectedIds.clear()
  state.selectedIds.add(id)
  pushHistory(tools.history, state.elements)
  return [{ type: 'save' }, { type: 'notice', text: labels.lineCreated }, { type: 'render' }]
}

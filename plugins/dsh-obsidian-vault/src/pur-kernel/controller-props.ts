/**
 * Property patches: the one command the adapter's editor dialogs call to apply
 * their committed fields to a single element.
 * @module dsh-obsidian-vault/pur-kernel/controller-props
 */
import { findElement } from './geometry.ts'
import { commit } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurLineStyle } from './types.ts'

/**
 * The fields the adapter's editor dialogs may patch, all optional. Each
 * element kind applies only the fields its own model carries; the rest are
 * ignored, so one dialog draft can be passed whole.
 */
export interface PurElementPatch {
  /** Body or label text. */
  content?: string
  /** Card heading. */
  title?: string
  /** Element colour. */
  color?: string
  /** Card fill. */
  bgColor?: string
  /** Label colour, for lines. */
  textColor?: string
  /** Text size in px. */
  fontSize?: number
  /** CSS font family. */
  fontFamily?: string
  /** Bold body, for text cards. */
  bold?: boolean
  /** Body fill alpha, for text cards. */
  bgOpacity?: number
  /** Secondary note text, for note-link cards. */
  note?: string
  /** Note text size in px, for note-link cards. */
  noteFontSize?: number
  /** Note text font family, for note-link cards. */
  noteFontFamily?: string
  /** Card fill, for note-link cards. */
  cardColor?: string
  /** Vault path or URL the element opens. */
  link?: string
  /** Frame stroke, for groups. */
  borderColor?: string
  /** Stroke pattern, for lines. */
  style?: PurLineStyle
  /** Arrowhead toggle, for lines. */
  arrow?: boolean
}

/**
 * Apply an editor dialog's committed fields to one element, restricted to the
 * fields its kind carries, then save history and report save and render.
 * @param tools - shared controller tools.
 * @param elementId - the element being patched.
 * @param patch - the committed fields.
 * @returns the commit effects, empty when the element is absent.
 */
export function updateElementProps(tools: PurControllerTools, elementId: string, patch: PurElementPatch): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null) return []
  const element = site.element
  switch (element.type) {
    case 'text':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.title !== undefined) element.title = patch.title
      if (patch.color !== undefined) element.color = patch.color
      if (patch.bgColor !== undefined) element.bgColor = patch.bgColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.bold !== undefined) element.bold = patch.bold
      if (patch.bgOpacity !== undefined) element.bgOpacity = patch.bgOpacity
      break
    case 'code-node':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.title !== undefined) element.title = patch.title
      if (patch.color !== undefined) element.color = patch.color
      if (patch.bgColor !== undefined) element.bgColor = patch.bgColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      break
    case 'note-link':
      if (patch.note !== undefined) element.note = patch.note
      if (patch.noteFontSize !== undefined) element.noteFontSize = patch.noteFontSize
      if (patch.noteFontFamily !== undefined) element.noteFontFamily = patch.noteFontFamily
      if (patch.cardColor !== undefined) element.cardColor = patch.cardColor
      if (patch.link !== undefined) element.link = patch.link
      break
    case 'group':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.color !== undefined) element.color = patch.color
      if (patch.borderColor !== undefined) element.borderColor = patch.borderColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.link !== undefined) element.link = patch.link
      break
    case 'line':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.color !== undefined) element.color = patch.color
      if (patch.textColor !== undefined) element.textColor = patch.textColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.style !== undefined) element.style = patch.style
      if (patch.arrow !== undefined) element.arrow = patch.arrow
      break
    case 'image':
      if (patch.link !== undefined) element.link = patch.link
      break
  }
  return commit(tools)
}

/**
 * The context menu as a data model: which entries appear for a blank canvas
 * or a selection, in upstream order with upstream conditions. The adapter
 * renders the model with localized titles and dispatches the entry ids.
 * @module dsh-obsidian-vault/pur-kernel/controller-menu
 */
import { screenToWorld } from './geometry.ts'
import { elementAt } from './hit-test.ts'
import { PUR_CODE_PRESETS } from './presets.ts'
import type { PurControllerEffect, PurControllerState, PurMenuContext, PurMenuEntry, PurMenuModel } from './controller-types.ts'
import type { PurElement, PurNodeElement } from './types.ts'

/** The save/export submenu, shared by the blank and element menus. */
function saveExportEntries(): PurMenuEntry[] {
  return [
    { id: 'save-pur', icon: 'save', labelKey: 'saveAsPur' },
    { id: 'export-md', icon: 'document', labelKey: 'exportMd' },
    {
      id: 'gen-code',
      icon: 'code',
      labelKey: 'genCode',
      children: [
        { id: 'gen-js', icon: 'file-code', labelKey: 'genCodeJs' },
        { id: 'gen-py', icon: 'file-code', labelKey: 'genCodePy' },
      ],
      separatorAfter: true,
    },
    { id: 'export-png', icon: 'image', labelKey: 'exportPng' },
    { id: 'export-jpg', icon: 'image', labelKey: 'exportJpg' },
    { id: 'export-canvas', icon: 'layout-dashboard', labelKey: 'exportCanvas' },
  ]
}

/** The trailing popout and pin entries, omitted when the host cannot honour them. */
function windowEntries(context: PurMenuContext): PurMenuEntry[] {
  const entries: PurMenuEntry[] = []
  if (context.supportsPopout) {
    entries.push({ id: 'popout', icon: context.isPopout ? 'minimize' : 'external-link', labelKey: context.isPopout ? 'mergeToMain' : 'popOut' })
  }
  if (context.supportsPinTop) {
    entries.push({ id: 'pin-top', icon: 'pin', labelKey: context.isPinned ? 'unpinTop' : 'pinTop' })
  }
  return entries
}

/** The blank-canvas menu (upstream `showContextMenu` with no hit element). */
function blankMenu(context: PurMenuContext): PurMenuEntry[] {
  const categories = new Map<string, PurMenuEntry[]>()
  for (const preset of PUR_CODE_PRESETS) {
    const list = categories.get(preset.category) ?? []
    list.push({ id: `preset:${preset.id}`, icon: 'code', labelKey: `preset.${preset.id}` })
    categories.set(preset.category, list)
  }
  const codeChildren: PurMenuEntry[] = [...categories.entries()].map(([category, children]) => ({
    id: `preset-cat:${category}`,
    icon: '',
    labelKey: `presetCategory.${category}`,
    children,
  }))
  return [
    { id: 'new-canvas', icon: 'plus', labelKey: 'newCanvas' },
    { id: 'new-text', icon: 'file-text', labelKey: 'newText' },
    { id: 'add-note-link', icon: 'link', labelKey: 'addNoteLink' },
    { id: 'code-node-root', icon: 'terminal', labelKey: 'addCodeNodes', children: codeChildren, separatorAfter: true },
    {
      id: 'import',
      icon: 'download',
      labelKey: 'import',
      children: [
        { id: 'import-local', icon: 'image', labelKey: 'importLocal' },
        { id: 'import-ir', icon: 'code', labelKey: 'importIr' },
        { id: 'import-canvas', icon: 'layout-dashboard', labelKey: 'importCanvas' },
        { id: 'import-net', icon: 'link', labelKey: 'importNet' },
      ],
    },
    { id: 'save-export', icon: 'folder', labelKey: 'saveExport', children: saveExportEntries(), separatorAfter: true },
    { id: 'fit-view', icon: 'maximize', labelKey: 'fitViewF' },
    ...windowEntries(context),
  ]
}

/** The pin submenu entries for `del-in-pin` / `del-out-pin`. */
function pinEntries(element: PurNodeElement, prefix: 'del-in-pin' | 'del-out-pin'): PurMenuEntry[] {
  const pins = prefix === 'del-in-pin' ? element.inputs ?? [] : element.outputs ?? []
  const fallbackKey = prefix === 'del-in-pin' ? 'pinInputN' : 'pinOutputN'
  return pins.map((pin, index) => ({ id: `${prefix}:${pin.id}`, icon: '', label: pin.label !== '' ? pin.label : undefined, labelKey: pin.label !== '' ? undefined : fallbackKey, value: index + 1 }))
}

/** The element menu (upstream `showContextMenu` with a hit element). */
function elementMenu(state: PurControllerState, context: PurMenuContext, hitLocked: boolean): PurMenuEntry[] {
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(state.elements)
  const hasText = selected.some((el) => el.type === 'text')
  const hasImage = selected.some((el) => el.type === 'image')
  const hasNoteLink = selected.some((el) => el.type === 'note-link')
  const hasGroup = selected.some((el) => el.type === 'group')
  const hasLine = selected.some((el) => el.type === 'line')
  const hasCodeNode = selected.some((el) => el.type === 'code-node')
  const nonLine = selected.filter((el) => el.type !== 'line')
  const entries: PurMenuEntry[] = []

  // Opening and linking are one subject, so they collapse into two submenus and
  // leave the top level for the commands that are used constantly.
  if (hasNoteLink || hasImage) {
    const openChildren: PurMenuEntry[] = [
      { id: 'open', icon: 'external-link', labelKey: 'open' },
      { id: 'open-new-tab', icon: 'file-plus', labelKey: 'openNewTab' },
      { id: 'open-right', icon: 'split', labelKey: 'openRight' },
    ]
    if (hasImage) {
      openChildren.push({ id: 'open-linked', icon: 'link', labelKey: 'openLinkedNote' })
      openChildren.push({ id: 'open-embedded', icon: 'file-text', labelKey: 'openEmbeddedNote' })
    }
    entries.push({ id: 'open-group', icon: 'external-link', labelKey: 'open', children: openChildren })

    const image = selected.find((el) => el.type === 'image')
    const group = selected.find((el) => el.type === 'group')
    const linked = (image !== undefined && image.type === 'image' && image.link !== undefined)
      || (group !== undefined && group.type === 'group' && group.link !== undefined)
    const linkChildren: PurMenuEntry[] = linked
      ? [
        { id: 'mod-link-note', icon: 'link', labelKey: 'modLinkNote' },
        { id: 'unlink-note', icon: 'unlink', labelKey: 'unlinkNote' },
      ]
      : [{ id: 'link-note', icon: 'link', labelKey: 'linkNote' }]
    if (context.activeFileIsMarkdown && hasImage) {
      linkChildren.push({ id: 'embed-note', icon: 'image-up', labelKey: 'embedNote' })
    }
    // A group with a single child is just noise: keep the plain entry then.
    entries.push(linkChildren.length === 1
      ? { id: 'link-note', icon: 'link', labelKey: 'linkNote', separatorAfter: true }
      : { id: 'link-group', icon: 'link', labelKey: 'linkNote', children: linkChildren, separatorAfter: true })
  }
  if (hasText || hasCodeNode || hasNoteLink) {
    const editable = selected.find((el) => el.type === 'text' || el.type === 'code-node' || el.type === 'note-link')
    entries.push({ id: hasNoteLink ? 'edit-note-link' : 'edit', icon: 'pencil', labelKey: hasNoteLink ? 'editNoteLink' : 'edit' })
    const pinChildren: PurMenuEntry[] = [
      { id: 'add-in-pin', icon: 'git-commit', labelKey: 'addInPin' },
      { id: 'add-out-pin', icon: 'git-commit', labelKey: 'addOutPin' },
    ]
    if (editable !== undefined && (editable.inputs?.length ?? 0) > 0) pinChildren.push({ id: 'del-in-pin', icon: 'minus', labelKey: 'delInPin', children: pinEntries(editable, 'del-in-pin') })
    if (editable !== undefined && (editable.outputs?.length ?? 0) > 0) pinChildren.push({ id: 'del-out-pin', icon: 'minus', labelKey: 'delOutPin', children: pinEntries(editable, 'del-out-pin') })
    entries.push({ id: 'pin-group', icon: 'git-commit', labelKey: 'pinGroup', children: pinChildren, separatorAfter: true })
  }

  if (hasGroup) {
    const group = selected.find((el) => el.type === 'group')
    entries.push({ id: 'edit-label', icon: 'pencil', labelKey: 'editLabel' })
    if (group !== undefined && group.type === 'group' && group.link !== undefined) {
      entries.push({ id: 'mod-link-note', icon: 'link', labelKey: 'modLinkNote' }, { id: 'unlink-note', icon: 'unlink', labelKey: 'unlinkNote', separatorAfter: true })
    } else {
      entries.push({ id: 'link-note', icon: 'link', labelKey: 'linkNote', separatorAfter: true })
    }
  }

  if (hasLine) entries.push({ id: 'edit-line', icon: 'pencil', labelKey: 'editLine', separatorAfter: true })

  entries.push(
    { id: 'copy', icon: 'copy', labelKey: 'copy' },
    { id: 'duplicate', icon: 'plus-circle', labelKey: 'duplicate' },
    { id: 'delete', icon: 'trash', labelKey: 'delete', separatorAfter: true },
  )

  if (hasGroup) entries.push({ id: 'ungroup', icon: 'ungroup', labelKey: 'ungroup', separatorAfter: true })
  if (state.selectedIds.size === 2 && nonLine.length === 2) entries.push({ id: 'connect', icon: 'link', labelKey: 'line', separatorAfter: true })
  if (state.selectedIds.size >= 2 && nonLine.length >= 2) entries.push({ id: 'group', icon: 'group', labelKey: 'group', separatorAfter: true })

  if (nonLine.length >= 2) {
    entries.push({
      id: 'arrange',
      icon: 'layout-grid',
      labelKey: 'arrange',
      children: [
        { id: 'arrange-auto', icon: '', labelKey: 'arrange', separatorAfter: true },
        { id: 'align-top', icon: '', labelKey: 'alignTop' },
        { id: 'align-left', icon: '', labelKey: 'alignLeft' },
        { id: 'align-center', icon: '', labelKey: 'alignCenter' },
        { id: 'dist-h', icon: '', labelKey: 'distH' },
      ],
    })
    entries.push({
      id: 'scale-uni',
      icon: 'scaling',
      labelKey: 'scaleUni',
      children: [
        { id: 'same-height', icon: '', labelKey: 'sameHeight' },
        { id: 'same-width', icon: '', labelKey: 'sameWidth' },
      ],
    })
  }

  if (nonLine.length > 0) {
    entries.push({
      id: 'layer',
      icon: 'layers',
      labelKey: 'layer',
      children: [
        { id: 'bring-to-front', icon: 'arrow-up-to-line', labelKey: 'bringToFront' },
        { id: 'bring-forward', icon: 'arrow-up', labelKey: 'moveUp' },
        { id: 'send-backward', icon: 'arrow-down', labelKey: 'moveDown' },
        { id: 'send-to-back', icon: 'arrow-down-to-line', labelKey: 'sendToBack' },
      ],
    })
  }

  const anyLocked = nonLine.some((el) => el.locked === true)
  const appearance: PurMenuEntry[] = []
  if (nonLine.length > 0 && !hasGroup) {
    appearance.push({ id: 'opacity', icon: 'droplet', labelKey: 'opacity', value: selected[0]?.opacity ?? 1 })
  }
  appearance.push({ id: 'toggle-lock', icon: hitLocked ? 'unlock' : 'lock', labelKey: anyLocked ? 'unlockPosition' : 'lockPosition' })
  appearance.push({ id: 'fit-view', icon: 'maximize', labelKey: 'fitViewF' })
  entries.push({ id: 'appearance', icon: 'droplet', labelKey: 'appearance', children: appearance, separatorAfter: true })

  if (hasNoteLink || hasImage) {
    entries.push({ id: 'copy-link', icon: 'link', labelKey: 'copyLink' })
    if (context.supportsReveal) entries.push({ id: 'reveal', icon: 'folder-search', labelKey: 'revealExplorer' })
    entries[entries.length - 1] = { ...entries[entries.length - 1] as PurMenuEntry, separatorAfter: true }
  }

  entries.push(
    { id: 'save-export', icon: 'folder', labelKey: 'saveExport', children: saveExportEntries() },
    ...windowEntries(context),
  )
  return entries
}

/**
 * Build the context menu model for a canvas point. When the hit element is
 * not yet selected, the selection moves to it first, like upstream.
 * @param state - controller state.
 * @param canvasX - menu x in canvas pixels.
 * @param canvasY - menu y in canvas pixels.
 * @param context - host facts the menu branches on.
 * @returns the model, plus a render effect when the selection moved.
 */
export function contextMenuModel(
  state: PurControllerState,
  canvasX: number,
  canvasY: number,
  context: PurMenuContext,
): { model: PurMenuModel; effects: PurControllerEffect[] } {
  const world = screenToWorld(state.view, canvasX, canvasY)
  const element = elementAt(state.elements, world.x, world.y, state.view.scale)
  if (element === null) return { model: { entries: blankMenu(context) }, effects: [] }
  const effects: PurControllerEffect[] = []
  if (!state.selectedIds.has(element.id)) {
    state.selectedIds.clear()
    state.selectedIds.add(element.id)
    effects.push({ type: 'render' })
  }
  return { model: { entries: elementMenu(state, context, element.locked === true) }, effects }
}

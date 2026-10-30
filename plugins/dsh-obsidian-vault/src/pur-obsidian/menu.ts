/**
 * Render the kernel's {@link PurMenuModel} as a native Obsidian `Menu`:
 * entries become rows, `children` become submenus, `separatorAfter` becomes a
 * separator, and the `opacity` row opens a small slider overlay that previews
 * on input and commits on change.
 * @module dsh-obsidian-vault/pur-obsidian/menu
 */
import { Menu } from 'obsidian'
import { executeEffects, runMenuAction } from '../pur-kernel/index.ts'
import type { PurController, PurEffectSink, PurMenuEntry, PurMenuHost, PurMenuModel, PurMenuPoint } from '../pur-kernel/index.ts'
import type { PurLabelBundles } from '../client/i18n/pur-labels.ts'

/** Everything a menu rendering needs beyond the model. */
export interface PurMenuOptions {
  /** The canvas controller. */
  controller: PurController
  /** Host operations for menu ids the kernel cannot perform. */
  host: PurMenuHost
  /** Effect sink the dispatched actions drain into. */
  sink: PurEffectSink
  /** Localized label bundles, for entry titles. */
  labels: PurLabelBundles
  /** Menu origin in world coordinates, for creation commands. */
  world: PurMenuPoint
  /** Element the menu was opened on, when there is one. */
  targetId?: string
  /** Element the opacity slider overlay is appended to. */
  parentEl: HTMLElement
}

/**
 * Show the menu model at a viewport point.
 * @param model - the kernel menu model.
 * @param clientX - viewport x.
 * @param clientY - viewport y.
 * @param options - dispatch context.
 */
export function showPurMenu(model: PurMenuModel, clientX: number, clientY: number, options: PurMenuOptions): void {
  const menu = new Menu()
  renderEntries(menu, model.entries, options)
  menu.showAtPosition({ x: clientX, y: clientY })
}

/**
 * Dispatch one entry through the kernel router and drain the effects.
 * @param entry - the clicked entry.
 * @param options - dispatch context.
 * @param value - committed slider value, for the opacity entry.
 */
function dispatch(entry: PurMenuEntry, options: PurMenuOptions, value?: number): void {
  const action: { id: string; world: PurMenuPoint; targetId?: string; value?: number } = { id: entry.id, world: options.world }
  if (options.targetId !== undefined) action.targetId = options.targetId
  if (value !== undefined) action.value = value
  executeEffects(runMenuAction(options.controller, options.host, action), options.sink)
}

/**
 * Append entries to a menu, recursing into submenus.
 * @param menu - the menu being built.
 * @param entries - the model entries.
 * @param options - dispatch context.
 */
function renderEntries(menu: Menu, entries: readonly PurMenuEntry[], options: PurMenuOptions): void {
  for (const entry of entries) {
    menu.addItem((item) => {
      item.setTitle(options.labels.menuTitle(entry))
      if (entry.icon !== '') item.setIcon(entry.icon)
      if (entry.children !== undefined) {
        const submenu = new Menu()
        renderEntries(submenu, entry.children, options)
        item.setSubmenu(submenu)
        return
      }
      if (entry.id === 'opacity') item.onClick((evt) => openOpacitySlider(evt, entry, options))
      else item.onClick(() => dispatch(entry, options))
    })
    if (entry.separatorAfter === true) menu.addSeparator()
  }
}

/**
 * Open the opacity slider overlay next to the clicked row: `input` previews,
 * `change` commits through the menu router.
 * @param evt - the click event.
 * @param entry - the opacity entry, carrying the current value.
 * @param options - dispatch context.
 */
function openOpacitySlider(evt: MouseEvent, entry: PurMenuEntry, options: PurMenuOptions): void {
  const doc = options.parentEl.ownerDocument
  doc.getElementById('pur-opacity-overlay')?.remove()
  const overlay = doc.createElement('div')
  overlay.id = 'pur-opacity-overlay'
  overlay.style.cssText =
    'position:absolute; z-index:100000; background:var(--background-primary, #1e1e1e); border:1px solid var(--background-modifier-border, #444); border-radius:6px; padding:8px 12px; box-shadow:0 4px 16px rgba(0,0,0,0.4);'
  const slider = doc.createElement('input')
  slider.type = 'range'
  slider.min = '0'
  slider.max = '1'
  slider.step = '0.05'
  slider.value = String(entry.value ?? 1)
  slider.style.width = '140px'
  overlay.appendChild(slider)
  const rect = options.parentEl.getBoundingClientRect()
  overlay.style.left = `${evt.clientX - rect.left}px`
  overlay.style.top = `${evt.clientY - rect.top}px`
  options.parentEl.appendChild(overlay)
  const close = (): void => {
    overlay.remove()
    doc.removeEventListener('mousedown', outside)
  }
  slider.addEventListener('input', () => {
    executeEffects(options.controller.setOpacity(Number(slider.value), 'preview'), options.sink)
  })
  slider.addEventListener('change', () => {
    dispatch(entry, options, Number(slider.value))
    close()
  })
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
    event.stopPropagation()
  })
  const outside = (event: MouseEvent): void => {
    if (!overlay.contains(event.target as Node)) close()
  }
  setTimeout(() => doc.addEventListener('mousedown', outside), 50)
  slider.focus()
}

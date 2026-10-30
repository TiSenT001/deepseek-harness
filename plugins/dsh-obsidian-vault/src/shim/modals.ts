/**
 * The frame-rendered pieces of Obsidian's UI kit: Notice toasts, Modal and
 * FuzzySuggestModal overlays, and the context Menu. Everything renders into
 * the frame's own document; the host page is never touched.
 * @module dsh-obsidian-vault/shim/modals
 */

const ICONS = new Map<string, string>()

/**
 * Register one SVG icon, like Obsidian's `addIcon`. Stored for controls that
 * reference icons by id; no host ribbon consumes them yet.
 * @param id - icon id.
 * @param svg - the SVG markup.
 */
export function addIcon(id: string, svg: string): void {
  ICONS.set(id, svg)
}

/** Obsidian's toast notification. */
export class Notice {
  private readonly element: HTMLElement
  private readonly timer: ReturnType<typeof setTimeout> | undefined

  /**
   * @param message - the notice text.
   * @param timeout - auto-hide delay in milliseconds; 0 keeps it visible.
   */
  constructor(message: string, timeout = 5000) {
    this.element = document.createElement('div')
    this.element.className = 'ov-shim-notice'
    this.element.textContent = message
    document.body.appendChild(this.element)
    if (timeout > 0) {
      this.timer = setTimeout(() => this.hide(), timeout)
    }
  }

  /** Dismiss the notice. */
  hide(): void {
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.element.remove()
  }
}

/** Obsidian's modal dialog, rendered as a frame-local overlay. */
export class Modal {
  protected readonly app: unknown
  readonly containerEl: HTMLElement
  readonly titleEl: HTMLElement
  readonly contentEl: HTMLElement
  private open_ = false

  /** @param app - the shim app. */
  constructor(app: unknown) {
    this.app = app
    this.containerEl = document.createElement('div')
    this.containerEl.className = 'ov-shim-modal-layer'
    const modal = document.createElement('div')
    modal.className = 'ov-shim-modal'
    this.titleEl = document.createElement('div')
    this.titleEl.className = 'ov-shim-modal-title'
    this.contentEl = document.createElement('div')
    this.contentEl.className = 'ov-shim-modal-content'
    modal.appendChild(this.titleEl)
    modal.appendChild(this.contentEl)
    this.containerEl.appendChild(modal)
    this.containerEl.addEventListener('mousedown', event => {
      if (event.target === this.containerEl) this.close()
    })
  }

  /** Show the modal. */
  open(): void {
    if (this.open_) return
    this.open_ = true
    document.body.appendChild(this.containerEl)
    this.onOpen()
  }

  /** Hide the modal. */
  close(): void {
    if (!this.open_) return
    this.open_ = false
    this.containerEl.remove()
    this.onClose()
  }

  /** Called after the modal opens. */
  onOpen(): void {}

  /** Called after the modal closes. */
  onClose(): void {}
}

/** Obsidian's fuzzy picker: filter input plus a clickable result list. */
export abstract class FuzzySuggestModal<T> extends Modal {
  private readonly input: HTMLInputElement
  private readonly list: HTMLElement
  private active = 0

  /** @param app - the shim app. */
  constructor(app: unknown) {
    super(app)
    this.input = document.createElement('input')
    this.input.className = 'ov-shim-fuzzy-input'
    this.list = document.createElement('div')
    this.list.className = 'ov-shim-fuzzy-list'
    this.contentEl.appendChild(this.input)
    this.contentEl.appendChild(this.list)
    this.input.addEventListener('input', () => {
      this.active = 0
      this.renderItems()
    })
    this.input.addEventListener('keydown', event => {
      const items = this.filtered()
      if (event.key === 'ArrowDown') this.active = Math.min(this.active + 1, items.length - 1)
      else if (event.key === 'ArrowUp') this.active = Math.max(this.active - 1, 0)
      else if (event.key === 'Enter') {
        const chosen = items[this.active]
        if (chosen === undefined) return
        this.choose(chosen)
      } else return
      event.preventDefault()
      this.renderItems()
    })
  }

  /** The full item set. */
  abstract getItems(): T[]

  /**
   * The display text for one item.
   * @param item - the item.
   */
  abstract getItemText(item: T): string

  /**
   * Called with the chosen item.
   * @param item - the chosen item.
   */
  abstract onChooseItem(item: T): void

  /** Show the picker and focus its input. */
  override onOpen(): void {
    this.renderItems()
    this.input.focus()
  }

  private filtered(): T[] {
    const query = this.input.value.trim().toLowerCase()
    const items = this.getItems()
    return query === '' ? items : items.filter(item => this.getItemText(item).toLowerCase().includes(query))
  }

  private renderItems(): void {
    this.list.textContent = ''
    this.filtered().forEach((item, index) => {
      const row = document.createElement('div')
      row.className = index === this.active ? 'ov-shim-fuzzy-item ov-shim-fuzzy-active' : 'ov-shim-fuzzy-item'
      row.textContent = this.getItemText(item)
      row.addEventListener('click', () => this.choose(item))
      this.list.appendChild(row)
    })
  }

  private choose(item: T): void {
    this.close()
    this.onChooseItem(item)
  }
}

/** One menu item's mutable builder state. */
interface MenuItemState {
  title: string
  icon: string | undefined
  disabled: boolean
  onClick: (() => void) | undefined
}

/** Obsidian's context menu, rendered into the frame at the pointer. */
export class Menu {
  private readonly items: ({ kind: 'item'; state: MenuItemState } | { kind: 'separator' })[] = []
  private layer: HTMLElement | undefined

  /**
   * Add one item; the callback receives its builder.
   * @param build - configures the item.
   * @returns this, for chaining.
   */
  addItem(build: (item: {
    setTitle: (title: string) => void
    setIcon: (icon: string) => void
    setDisabled: (disabled: boolean) => void
    onClick: (callback: () => void) => void
  }) => void): this {
    const state: MenuItemState = { title: '', icon: undefined, disabled: false, onClick: undefined }
    build({
      setTitle: title => {
        state.title = title
      },
      setIcon: icon => {
        state.icon = icon
      },
      setDisabled: disabled => {
        state.disabled = disabled
      },
      onClick: callback => {
        state.onClick = callback
      },
    })
    this.items.push({ kind: 'item', state })
    return this
  }

  /** Add a separator; @returns this, for chaining. */
  addSeparator(): this {
    this.items.push({ kind: 'separator' })
    return this
  }

  /**
   * Show the menu at one position.
   * @param position - page coordinates.
   */
  showAtPosition(position: { readonly x: number; readonly y: number }): void {
    this.hide()
    const layer = document.createElement('div')
    layer.className = 'ov-shim-menu'
    layer.style.left = `${position.x}px`
    layer.style.top = `${position.y}px`
    for (const entry of this.items) {
      if (entry.kind === 'separator') {
        const separator = document.createElement('div')
        separator.className = 'ov-shim-menu-separator'
        layer.appendChild(separator)
        continue
      }
      const row = document.createElement('div')
      row.className = entry.state.disabled ? 'ov-shim-menu-item ov-shim-menu-disabled' : 'ov-shim-menu-item'
      row.textContent = entry.state.title
      if (!entry.state.disabled) {
        const onClick = entry.state.onClick
        row.addEventListener('click', () => {
          this.hide()
          onClick?.()
        })
      }
      layer.appendChild(row)
    }
    document.body.appendChild(layer)
    this.layer = layer
    const dismiss = (event: Event): void => {
      if (event.target instanceof Node && layer.contains(event.target)) return
      this.hide()
      document.removeEventListener('pointerdown', dismiss, true)
    }
    document.addEventListener('pointerdown', dismiss, true)
  }

  /**
   * Show the menu at a mouse event's position.
   * @param event - the triggering mouse event.
   */
  showAtMouseEvent(event: MouseEvent): void {
    event.preventDefault()
    this.showAtPosition({ x: event.clientX, y: event.clientY })
  }

  /** Dismiss the menu. */
  hide(): void {
    this.layer?.remove()
    this.layer = undefined
  }
}

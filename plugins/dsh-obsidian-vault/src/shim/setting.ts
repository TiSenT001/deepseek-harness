/**
 * The frame's `Setting` row builder and `PluginSettingTab` shell. The tab is
 * stored by the plugin but has no host surface yet; `Setting` renders rows
 * into whatever container the plugin gives it, so modals can use it today.
 * @module dsh-obsidian-vault/shim/setting
 */

interface TextControl {
  setValue: (value: string) => TextControl
  setPlaceholder: (value: string) => TextControl
  onChange: (callback: (value: string) => void) => TextControl
}

interface ToggleControl {
  setValue: (value: boolean) => ToggleControl
  onChange: (callback: (value: boolean) => void) => ToggleControl
}

interface DropdownControl {
  addOption: (value: string, label: string) => DropdownControl
  setValue: (value: string) => DropdownControl
  onChange: (callback: (value: string) => void) => DropdownControl
}

interface ButtonControl {
  setButtonText: (label: string) => ButtonControl
  setCta: () => ButtonControl
  onClick: (callback: () => void) => ButtonControl
}

interface SliderControl {
  setLimits: (min: number, max: number, step: number) => SliderControl
  setValue: (value: number) => SliderControl
  setDynamicTooltip: () => SliderControl
  onChange: (callback: (value: number) => void) => SliderControl
}

/** Obsidian's settings row: name, description, and chainable controls. */
export class Setting {
  private readonly row: HTMLElement
  private readonly info: HTMLElement
  private readonly controls: HTMLElement

  /** @param container - the element rows append to. */
  constructor(container: HTMLElement) {
    this.row = document.createElement('div')
    this.row.className = 'ov-shim-setting'
    this.info = document.createElement('div')
    this.info.className = 'ov-shim-setting-info'
    this.controls = document.createElement('div')
    this.controls.className = 'ov-shim-setting-controls'
    this.row.appendChild(this.info)
    this.row.appendChild(this.controls)
    container.appendChild(this.row)
  }

  /**
   * Set the row name; @param name - the label. @returns this, for chaining.
   */
  setName(name: string): this {
    const element = document.createElement('div')
    element.className = 'ov-shim-setting-name'
    element.textContent = name
    this.info.appendChild(element)
    return this
  }

  /**
   * Set the row description; @param text - the description. @returns this.
   */
  setDesc(text: string): this {
    const element = document.createElement('div')
    element.className = 'ov-shim-setting-desc'
    element.textContent = text
    this.info.appendChild(element)
    return this
  }

  /** Add a text input; @param build - configures the control. @returns this. */
  addText(build: (control: TextControl) => void): this {
    const input = document.createElement('input')
    input.type = 'text'
    this.controls.appendChild(input)
    const control: TextControl = {
      setValue: value => {
        input.value = value
        return control
      },
      setPlaceholder: value => {
        input.placeholder = value
        return control
      },
      onChange: callback => {
        input.addEventListener('input', () => callback(input.value))
        return control
      },
    }
    build(control)
    return this
  }

  /** Add a toggle; @param build - configures the control. @returns this. */
  addToggle(build: (control: ToggleControl) => void): this {
    const input = document.createElement('input')
    input.type = 'checkbox'
    this.controls.appendChild(input)
    const control: ToggleControl = {
      setValue: value => {
        input.checked = value
        return control
      },
      onChange: callback => {
        input.addEventListener('change', () => callback(input.checked))
        return control
      },
    }
    build(control)
    return this
  }

  /** Add a dropdown; @param build - configures the control. @returns this. */
  addDropdown(build: (control: DropdownControl) => void): this {
    const select = document.createElement('select')
    this.controls.appendChild(select)
    const control: DropdownControl = {
      addOption: (value, label) => {
        const option = document.createElement('option')
        option.value = value
        option.textContent = label
        select.appendChild(option)
        return control
      },
      setValue: value => {
        select.value = value
        return control
      },
      onChange: callback => {
        select.addEventListener('change', () => callback(select.value))
        return control
      },
    }
    build(control)
    return this
  }

  /** Add a button; @param build - configures the control. @returns this. */
  addButton(build: (control: ButtonControl) => void): this {
    const button = document.createElement('button')
    button.type = 'button'
    this.controls.appendChild(button)
    const control: ButtonControl = {
      setButtonText: label => {
        button.textContent = label
        return control
      },
      setCta: () => {
        button.classList.add('ov-shim-cta')
        return control
      },
      onClick: callback => {
        button.addEventListener('click', () => callback())
        return control
      },
    }
    build(control)
    return this
  }

  /** Add a slider; @param build - configures the control. @returns this. */
  addSlider(build: (control: SliderControl) => void): this {
    const input = document.createElement('input')
    input.type = 'range'
    this.controls.appendChild(input)
    const control: SliderControl = {
      setLimits: (min, max, step) => {
        input.min = String(min)
        input.max = String(max)
        input.step = String(step)
        return control
      },
      setValue: value => {
        input.value = String(value)
        return control
      },
      setDynamicTooltip: () => control,
      onChange: callback => {
        input.addEventListener('input', () => callback(Number(input.value)))
        return control
      },
    }
    build(control)
    return this
  }
}

/** Obsidian's `PluginSettingTab`: stored by the plugin, not yet surfaced. */
export abstract class PluginSettingTab {
  protected readonly app: unknown
  protected readonly plugin: unknown
  readonly containerEl: HTMLElement

  /**
   * @param app - the shim app.
   * @param plugin - the owning plugin.
   */
  constructor(app: unknown, plugin: unknown) {
    this.app = app
    this.plugin = plugin
    this.containerEl = document.createElement('div')
    this.containerEl.className = 'ov-shim-setting-tab'
  }

  /** Render the tab's content. */
  abstract display(): void

  /** Clear the tab's content. */
  hide(): void {
    this.containerEl.textContent = ''
  }
}

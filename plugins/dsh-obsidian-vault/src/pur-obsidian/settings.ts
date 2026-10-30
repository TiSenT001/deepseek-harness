/**
 * Plugin settings for the Obsidian adapter: the persisted shape, defaults
 * matching upstream, and the settings tab that edits them through localized
 * `Setting` rows.
 * @module dsh-obsidian-vault/pur-obsidian/settings
 */
import { PluginSettingTab, Setting } from 'obsidian'
import type { App, Plugin } from 'obsidian'
import type { PurStudioDocument } from '../pur-kernel/index.ts'
import { readerFor } from './labels.ts'
import type { PurLang } from './labels.ts'

/** Canvas appearance and language preferences. */
export interface PurPreferences {
  /** Canvas fill; `obsidian` follows the theme, `transparent` stays unpainted. */
  backgroundColor: string
  /** Grid stroke colour. */
  gridColor: string
  /** Whether the grid is drawn. */
  showGrid: boolean
  /** UI language. */
  lang: PurLang
}

/** The persisted plugin data. */
export interface PurSettings {
  /** Appearance and language preferences. */
  preferences: PurPreferences
  /** Fileless canvas document, upstream's fallback persistence. */
  canvasData?: PurStudioDocument
}

/** Upstream defaults for a fresh install. */
export const DEFAULT_PUR_SETTINGS: PurSettings = {
  preferences: { backgroundColor: 'obsidian', gridColor: '#333333', showGrid: true, lang: 'zh' },
}

/** What the settings tab needs from the plugin. */
export interface PurSettingsHost {
  /** Current settings, mutated in place. */
  settings: PurSettings
  /** Persist the mutated settings. @returns completion. */
  saveSettings(): Promise<void>
}

/**
 * Merge persisted data over the defaults.
 * @param data - the raw `loadData` value.
 * @returns a complete settings object.
 */
export function resolvePurSettings(data: unknown): PurSettings {
  const root = typeof data === 'object' && data !== null ? (data as Partial<PurSettings>) : {}
  const preferences = typeof root.preferences === 'object' && root.preferences !== null ? root.preferences : {}
  return {
    preferences: { ...DEFAULT_PUR_SETTINGS.preferences, ...preferences },
    ...(root.canvasData === undefined ? {} : { canvasData: root.canvasData }),
  }
}

/** The Pur Studio settings tab. */
export class PurStudioSettingTab extends PluginSettingTab {
  private readonly host: PurSettingsHost

  /**
   * Create the tab.
   * @param app - the application.
   * @param host - settings owner and persister; the plugin instance.
   */
  public constructor(app: App, host: Plugin & PurSettingsHost) {
    super(app, host)
    this.host = host
  }

  /** Render the four preference rows with localized copy. */
  public display(): void {
    const { containerEl, host } = this
    containerEl.replaceChildren()
    const read = readerFor(host.settings.preferences.lang)
    const persist = (): Promise<void> => host.saveSettings()
    const heading = containerEl.ownerDocument.createElement('h2')
    heading.textContent = read('pur.settingsTitle')
    containerEl.appendChild(heading)
    new Setting(containerEl)
      .setName(read('pur.lang'))
      .setDesc('中文 / English')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('zh', '中文')
          .addOption('en', 'English')
          .setValue(host.settings.preferences.lang)
          .onChange((value) => {
            host.settings.preferences.lang = value === 'en' ? 'en' : 'zh'
            void persist().then(() => this.display())
          }),
      )
    new Setting(containerEl)
      .setName(read('pur.bgColor'))
      .setDesc(read('pur.bgColorDesc'))
      .addText((text) =>
        text.setValue(host.settings.preferences.backgroundColor).onChange((value) => {
          host.settings.preferences.backgroundColor = value
          void persist()
        }),
      )
    new Setting(containerEl)
      .setName(read('pur.gridColor'))
      .setDesc(read('pur.gridColorDesc'))
      .addText((text) =>
        text.setValue(host.settings.preferences.gridColor).onChange((value) => {
          host.settings.preferences.gridColor = value
          void persist()
        }),
      )
    new Setting(containerEl)
      .setName(read('pur.showGrid'))
      .addToggle((toggle) =>
        toggle.setValue(host.settings.preferences.showGrid).onChange((value) => {
          host.settings.preferences.showGrid = value
          void persist()
        }),
      )
  }
}

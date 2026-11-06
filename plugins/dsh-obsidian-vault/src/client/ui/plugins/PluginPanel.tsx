/**
 * Plugin section of the settings dialog: the DSH-adapted plugin folder
 * (global, inside the plugin package) and the vault's built-in plugin
 * switches. The community list stays read-only here; obsidian plugin bridging
 * was removed, so `community` is not rendered. Expanding the canvas plugin shows
 * its own settings, so they live with the plugin instead of floating above the list.
 * @module dsh-obsidian-vault/client/ui/plugins/PluginPanel
 */
import { useCallback, useEffect, useState } from 'react'
import type { CorePluginDto, PluginDto, PluginsDto } from '../../../protocol.ts'
import { fetchPlugins, revealPluginsFolder, togglePlugin } from '../../api.ts'
import { fetchPurClientSettings, savePurClientSettings } from '../../api-vault.ts'
import type { PurClientSettingsDto, PurSettingsPatch } from '../../api-vault.ts'
import type { Translate } from '../../i18n.ts'
import { Icon } from '../Icon.tsx'
import { css, Toggle } from '../kit/index.ts'

/** Props for {@link PluginPanel}. */
export interface PluginPanelProps {
  readonly t: Translate
}

/** Bytes in one megabyte, used by the two size fields. */
const MB = 1024 * 1024

/** Draft of the canvas settings form; numbers stay as text while editing. */
interface CanvasSettingsDraft {
  runTimeoutMs: string
  allowCodeExecution: boolean
  saveDelayMs: string
  largeCanvasHintMb: string
  showGrid: boolean
  vault: string
  ignoreText: string
  maxFileBytesMb: string
  maxIndexBytesMb: string
  maxDepth: string
  exportScale: string
  exportTransparent: boolean
  exportJpgQuality: string
}

/**
 * Build the form draft from the Host payload.
 * @param dto - effective settings.
 * @returns the draft.
 */
function draftOf(dto: PurClientSettingsDto): CanvasSettingsDraft {
  return {
    runTimeoutMs: String(dto.runTimeoutMs),
    allowCodeExecution: dto.allowCodeExecution,
    saveDelayMs: String(dto.saveDelayMs),
    largeCanvasHintMb: String(dto.largeCanvasHintMb),
    showGrid: dto.showGrid,
    // An older Host may not send the vault/index fields yet; fall back to the
    // documented defaults instead of rendering an empty form.
    vault: dto.vault ?? '',
    ignoreText: (dto.ignore ?? []).join('\n'),
    maxFileBytesMb: dto.maxFileBytes === undefined ? '2' : String(Math.round((dto.maxFileBytes / MB) * 10) / 10),
    maxIndexBytesMb: dto.maxIndexBytes === undefined ? '64' : String(Math.round(dto.maxIndexBytes / MB)),
    maxDepth: dto.maxDepth === undefined ? '12' : String(dto.maxDepth),
    exportScale: dto.exportScale === undefined ? '1' : String(dto.exportScale),
    exportTransparent: dto.exportTransparent ?? true,
    exportJpgQuality: dto.exportJpgQuality === undefined ? '0.9' : String(dto.exportJpgQuality),
  }
}

/**
 * Turn the draft back into the patch the Host stores.
 * @param draft - edited values.
 * @returns the patch; sizes are converted back to bytes.
 */
function patchOf(draft: CanvasSettingsDraft): PurSettingsPatch {
  return {
    runTimeoutMs: Number(draft.runTimeoutMs),
    allowCodeExecution: draft.allowCodeExecution,
    saveDelayMs: Number(draft.saveDelayMs),
    largeCanvasHintMb: Number(draft.largeCanvasHintMb),
    showGrid: draft.showGrid,
    vault: draft.vault.trim(),
    ignore: draft.ignoreText.split(/[\n,]/).map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    maxFileBytes: Math.round(Number(draft.maxFileBytesMb) * MB),
    maxIndexBytes: Math.round(Number(draft.maxIndexBytesMb) * MB),
    maxDepth: Number(draft.maxDepth),
    exportScale: Number(draft.exportScale),
    exportTransparent: draft.exportTransparent,
    exportJpgQuality: Number(draft.exportJpgQuality),
  }
}

/**
 * Render the plugin section.
 * @param props - translator.
 */
export function PluginPanel({ t }: PluginPanelProps): JSX.Element {
  const [data, setData] = useState<PluginsDto | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [pending, setPending] = useState<string | undefined>()

  const load = useCallback((announce: boolean) => {
    setPending('list')
    void fetchPlugins()
      .then((next) => {
        setData(next)
        if (announce) setError(undefined)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('pluginsLoadFailed')))
      .finally(() => setPending(undefined))
  }, [t])

  useEffect(() => {
    load(false)
  }, [load])

  const flip = useCallback((id: string, enabled: boolean) => {
    setPending(id)
    setError(undefined)
    void togglePlugin(id, enabled)
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('pluginsToggleFailed')))
      .finally(() => setPending(undefined))
  }, [t])


  const reveal = useCallback(() => {
    setPending('reveal')
    setError(undefined)
    // Success opens the OS file manager; the panel itself has nothing to patch.
    void revealPluginsFolder()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('revealFailed')))
      .finally(() => setPending(undefined))
  }, [t])

  return (
    <>
      <div className={css.pluginTools}>
        <button
          type="button"
          className={css.iconButton}
          aria-label={t('pluginRefresh')}
          title={t('pluginRefresh')}
          disabled={pending === 'list'}
          onClick={() => load(true)}
        >
          <Icon name="refresh" size={13} />
        </button>
        <button
          type="button"
          className={css.iconButton}
          aria-label={t('openPluginFolder')}
          title={t('openPluginFolder')}
          disabled={pending !== undefined}
          onClick={reveal}
        >
          <Icon name="newFolder" size={13} />
        </button>
      </div>
      {error === undefined ? null : <div className={css.dialogError}>{error}</div>}
      {data === undefined
        ? <div className={css.empty}>{t('loadingVaults')}</div>
        : (
          <>
            <div className={css.sectionTitle}>{t('dshPlugins')} · {data.dsh.length}</div>
            <div className={css.dialogConfirmPath} title={data.dshFolder}>{data.dshFolder}</div>
            <div className={css.emptyHint}>{t('dshPluginsHint')}</div>
            {data.dsh.length === 0
              ? <div className={css.empty}>{t('dshPluginsEmpty')}</div>
              : data.dsh.map(plugin => <PluginRow key={plugin.id} t={t} plugin={plugin} />)}
            <div className={css.sectionTitle}>{t('corePlugins')} · {data.core.length}</div>
            {data.core.map(plugin => (
              <CoreRow
                key={plugin.id}
                plugin={plugin}
                disabled={pending !== undefined}
                onToggle={enabled => flip(plugin.id, enabled)}
              />
            ))}
          </>
        )}
    </>
  )
}

/**
 * One DSH-adapted plugin row: manifest metadata plus an expandable detail. The
 * canvas plugin adds its own settings section inside that detail.
 * @param props - translator and the plugin metadata.
 */
function PluginRow({ t, plugin }: { readonly t: Translate; readonly plugin: PluginDto }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className={css.pluginRow} data-plugin={plugin.id}>
      <div className={css.pluginLine}>
        <button
          type="button"
          className={css.pluginInfo}
          aria-expanded={open}
          title={t('pluginDetail')}
          onClick={() => setOpen(value => !value)}
        >
          <span className={css.pluginName}>
            <span className={css.pluginChevron} data-open={open}>▸</span>
            {plugin.name}
            {plugin.version === undefined ? null : <span className={css.pluginVersion}>{plugin.version}</span>}
          </span>
          {plugin.author === undefined ? null : <span className={css.pluginMeta}>{plugin.author}</span>}
          {plugin.description === undefined ? null : <span className={css.pluginDesc}>{plugin.description}</span>}
        </button>
      </div>
      {open
        ? (
          <div className={css.pluginDetail}>
            <div className={css.pluginDetailRow}>
              <span className={css.pluginDetailLabel}>ID</span>
              <span>{plugin.id}</span>
            </div>
            {plugin.id === 'pur-studio' ? <CanvasSettingsSection t={t} /> : null}
          </div>
        )
        : null}
    </div>
  )
}

/**
 * The canvas plugin's own settings, rendered inside its plugin detail: runtime,
 * saving/display, and the vault/index fields that apply after a restart.
 * @param props - translator.
 */
function CanvasSettingsSection({ t }: { readonly t: Translate }): JSX.Element | null {
  const [draft, setDraft] = useState<CanvasSettingsDraft | undefined>()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | undefined>()
  const [unavailable, setUnavailable] = useState(false)

  const load = useCallback(() => {
    setUnavailable(false)
    void fetchPurClientSettings()
      .then((next) => setDraft(draftOf(next)))
      .catch(() => setUnavailable(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(() => {
    if (draft === undefined) return
    setPending(true)
    setNotice(undefined)
    void savePurClientSettings(patchOf(draft))
      .then((next) => {
        setDraft(draftOf(next))
        setNotice(t('canvasSettingsSaved'))
      })
      .catch(() => setNotice(t('canvasSettingsFailed')))
      .finally(() => setPending(false))
  }, [draft, t])

  if (draft === undefined) {
    if (!unavailable) return null
    return (
      <>
        <div className={css.dialogError}>{t('canvasSettingsLoadFailed')}</div>
        <div className={css.settingsActions}>
          <button type="button" className={css.iconButton} style={{ width: 'auto', padding: '4px 12px' }} onClick={load}>
            {t('pluginRefresh')}
          </button>
        </div>
      </>
    )
  }
  return (
    <div className={css.settings}>
      <div className={css.sectionTitle}>{t('canvasSettings')}</div>
      <div className={css.settingsGroup}>{t('settingsGroupRun')}</div>
      <SettingsRow label={t('settingRunTimeout')} hint={t('settingRunTimeoutHint')} unit="ms">
        <input className={css.settingsInput} type="number" min={200} max={10000} value={draft.runTimeoutMs} onChange={(event) => setDraft({ ...draft, runTimeoutMs: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingAllowRun')} hint={t('settingAllowRunHint')}>
        <Toggle checked={draft.allowCodeExecution} label="" ariaLabel={t('settingAllowRun')} onChange={(allowCodeExecution) => setDraft({ ...draft, allowCodeExecution })} />
      </SettingsRow>

      <div className={css.settingsGroup}>{t('settingsGroupSaving')}</div>
      <SettingsRow label={t('settingSaveDelay')} hint={t('settingSaveDelayHint')} unit="ms">
        <input className={css.settingsInput} type="number" min={100} max={5000} value={draft.saveDelayMs} onChange={(event) => setDraft({ ...draft, saveDelayMs: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingLargeHint')} hint={t('settingLargeHintHint')} unit="MB">
        <input className={css.settingsInput} type="number" min={1} max={500} value={draft.largeCanvasHintMb} onChange={(event) => setDraft({ ...draft, largeCanvasHintMb: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingShowGrid')} hint={t('settingShowGridHint')}>
        <Toggle checked={draft.showGrid} label="" ariaLabel={t('settingShowGrid')} onChange={(showGrid) => setDraft({ ...draft, showGrid })} />
      </SettingsRow>

      <div className={css.settingsGroup}>{t('settingsGroupExport')}</div>
      <SettingsRow label={t('settingExportScale')} hint={t('settingExportScaleHint')} unit="×">
        <input className={css.settingsInput} type="number" min={1} max={3} step={1} value={draft.exportScale} onChange={(event) => setDraft({ ...draft, exportScale: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingExportTransparent')} hint={t('settingExportTransparentHint')}>
        <Toggle checked={draft.exportTransparent} label="" ariaLabel={t('settingExportTransparent')} onChange={(exportTransparent) => setDraft({ ...draft, exportTransparent })} />
      </SettingsRow>
      <SettingsRow label={t('settingJpgQuality')} hint={t('settingJpgQualityHint')}>
        <input className={css.settingsInput} type="number" min={0.4} max={1} step={0.05} value={draft.exportJpgQuality} onChange={(event) => setDraft({ ...draft, exportJpgQuality: event.target.value })} />
      </SettingsRow>

      <div className={css.settingsGroup}>{t('settingsGroupIndex')}</div>
      <SettingsRow label={t('settingVault')} hint={t('settingVaultHint')}>
        <input className={css.settingsInput} style={{ maxWidth: '100%' }} placeholder={t('settingVaultAuto')} value={draft.vault} onChange={(event) => setDraft({ ...draft, vault: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingIgnore')} hint={t('settingIgnoreHint')}>
        <textarea className={css.settingsTextarea} rows={3} value={draft.ignoreText} onChange={(event) => setDraft({ ...draft, ignoreText: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingMaxFile')} hint={t('settingMaxFileHint')} unit="MB">
        <input className={css.settingsInput} type="number" min={0.1} max={512} step={0.1} value={draft.maxFileBytesMb} onChange={(event) => setDraft({ ...draft, maxFileBytesMb: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingMaxIndex')} hint={t('settingMaxIndexHint')} unit="MB">
        <input className={css.settingsInput} type="number" min={1} max={8192} value={draft.maxIndexBytesMb} onChange={(event) => setDraft({ ...draft, maxIndexBytesMb: event.target.value })} />
      </SettingsRow>
      <SettingsRow label={t('settingMaxDepth')} hint={t('settingMaxDepthHint')}>
        <input className={css.settingsInput} type="number" min={1} max={64} value={draft.maxDepth} onChange={(event) => setDraft({ ...draft, maxDepth: event.target.value })} />
      </SettingsRow>
      <div className={css.settingsHint}>{t('settingsRestartHint')}</div>

      <div className={css.settingsActions}>
        <button type="button" className={css.iconButton} style={{ width: 'auto', padding: '4px 14px' }} disabled={pending} onClick={save}>
          {t('save')}
        </button>
        {notice === undefined ? null : <span className={css.settingsHint}>{notice}</span>}
      </div>
    </div>
  )
}

/**
 * One settings row: a fixed label column and the control with an optional unit.
 * @param props - label, hint, unit suffix and the control.
 */
function SettingsRow(props: { readonly label: string; readonly hint?: string; readonly unit?: string; readonly children: JSX.Element }): JSX.Element {
  return (
    <div className={css.settingsRow}>
      <span className={css.settingsLabel} title={props.hint}>{props.label}</span>
      <div className={css.settingsControl}>
        {props.children}
        {props.unit === undefined ? null : <span className={css.settingsUnit}>{props.unit}</span>}
      </div>
    </div>
  )
}

interface CoreRowProps {
  readonly plugin: CorePluginDto
  readonly disabled: boolean
  readonly onToggle: (enabled: boolean) => void
}


function CoreRow({ plugin, disabled, onToggle }: CoreRowProps): JSX.Element {
  return (
    <div className={css.pluginRow} data-plugin={plugin.id}>
      <div className={css.pluginLine}>
        <div className={css.pluginInfo}>
          <span className={css.pluginName}>{plugin.id}</span>
        </div>
        <div className={css.pluginToggle}>
          <Toggle
            checked={plugin.enabled}
            label=""
            ariaLabel={plugin.id}
            onChange={disabled ? () => {} : onToggle}
          />
        </div>
      </div>
    </div>
  )
}

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
import type { Translate } from '../../i18n.ts'
import { Icon } from '../Icon.tsx'
import { css, Toggle } from '../kit/index.ts'

/** Props for {@link PluginPanel}. */
export interface PluginPanelProps {
  readonly t: Translate
}

/** Draft of the canvas settings form. */
interface CanvasSettingsDraft {
  runTimeoutMs: string
  allowCodeExecution: boolean
  saveDelayMs: string
  largeCanvasHintMb: string
  showGrid: boolean
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
 * The canvas plugin's own settings, rendered inside its plugin detail.
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
      .then((next) => setDraft({
        runTimeoutMs: String(next.runTimeoutMs),
        allowCodeExecution: next.allowCodeExecution,
        saveDelayMs: String(next.saveDelayMs),
        largeCanvasHintMb: String(next.largeCanvasHintMb),
        showGrid: next.showGrid,
      }))
      .catch(() => setUnavailable(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(() => {
    if (draft === undefined) return
    setPending(true)
    setNotice(undefined)
    void savePurClientSettings({
      runTimeoutMs: Number(draft.runTimeoutMs),
      allowCodeExecution: draft.allowCodeExecution,
      saveDelayMs: Number(draft.saveDelayMs),
      largeCanvasHintMb: Number(draft.largeCanvasHintMb),
      showGrid: draft.showGrid,
    })
      .then(() => setNotice(t('canvasSettingsSaved')))
      .catch(() => setNotice(t('canvasSettingsFailed')))
      .finally(() => setPending(false))
  }, [draft, t])

  if (draft === undefined) {
    if (!unavailable) return null
    return (
      <>
        <div className={css.dialogError}>{t('canvasSettingsLoadFailed')}</div>
        <div className={css.pluginDetailRow}>
          <button type="button" className={css.iconButton} style={{ width: 'auto', padding: '4px 12px' }} onClick={load}>
            {t('pluginRefresh')}
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      <div className={css.sectionTitle}>{t('canvasSettings')}</div>
      <CanvasField label={t('settingRunTimeout')} hint={t('settingRunTimeoutHint')}>
        <input className={css.dialogInput} type="number" min={200} max={10000} value={draft.runTimeoutMs} onChange={(event) => setDraft({ ...draft, runTimeoutMs: event.target.value })} />
      </CanvasField>
      <CanvasField label={t('settingAllowRun')} hint={t('settingAllowRunHint')}>
        <Toggle checked={draft.allowCodeExecution} label="" ariaLabel={t('settingAllowRun')} onChange={(allowCodeExecution) => setDraft({ ...draft, allowCodeExecution })} />
      </CanvasField>
      <CanvasField label={t('settingSaveDelay')} hint={t('settingSaveDelayHint')}>
        <input className={css.dialogInput} type="number" min={100} max={5000} value={draft.saveDelayMs} onChange={(event) => setDraft({ ...draft, saveDelayMs: event.target.value })} />
      </CanvasField>
      <CanvasField label={t('settingLargeHint')} hint={t('settingLargeHintHint')}>
        <input className={css.dialogInput} type="number" min={1} max={500} value={draft.largeCanvasHintMb} onChange={(event) => setDraft({ ...draft, largeCanvasHintMb: event.target.value })} />
      </CanvasField>
      <CanvasField label={t('settingShowGrid')} hint={t('settingShowGridHint')}>
        <Toggle checked={draft.showGrid} label="" ariaLabel={t('settingShowGrid')} onChange={(showGrid) => setDraft({ ...draft, showGrid })} />
      </CanvasField>
      <div className={css.pluginDetailRow}>
        <button type="button" className={css.iconButton} style={{ width: 'auto', padding: '4px 12px' }} disabled={pending} onClick={save}>
          {t('save')}
        </button>
        {notice === undefined ? null : <span className={css.emptyHint}>{notice}</span>}
      </div>
    </>
  )
}

/**
 * One labelled settings row.
 * @param props - label, hint and the control.
 */
function CanvasField(props: { readonly label: string; readonly hint: string; readonly children: JSX.Element }): JSX.Element {
  return (
    <div className={css.pluginDetailRow}>
      <span className={css.pluginDetailLabel} title={props.hint}>{props.label}</span>
      {props.children}
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

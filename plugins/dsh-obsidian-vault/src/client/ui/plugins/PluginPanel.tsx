/**
 * Plugin section of the settings dialog: the DSH-adapted plugin folder
 * (global, inside the plugin package) and the vault's built-in plugin
 * switches. The community list stays read-only here; obsidian plugin bridging
 * was removed, so `community` is not rendered.
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

/**
 * Render the plugin section.
 * @param props - translator.
 */
export function PluginPanel({ t }: PluginPanelProps): JSX.Element {
  const [data, setData] = useState<PluginsDto | undefined>()
  const [canvas, setCanvas] = useState<CanvasSettings | undefined>()
  const [canvasPending, setCanvasPending] = useState(false)
  const [canvasNotice, setCanvasNotice] = useState<string | undefined>()
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

  useEffect(() => {
    void fetchPurClientSettings()
      .then((next) => setCanvas({
        runTimeoutMs: String(next.runTimeoutMs),
        allowCodeExecution: next.allowCodeExecution,
        saveDelayMs: String(next.saveDelayMs),
        largeCanvasHintMb: String(next.largeCanvasHintMb),
        showGrid: next.showGrid,
      }))
      .catch(() => undefined)
  }, [])

  const saveCanvas = useCallback(() => {
    if (canvas === undefined) return
    setCanvasPending(true)
    setCanvasNotice(undefined)
    void savePurClientSettings({
      runTimeoutMs: Number(canvas.runTimeoutMs),
      allowCodeExecution: canvas.allowCodeExecution,
      saveDelayMs: Number(canvas.saveDelayMs),
      largeCanvasHintMb: Number(canvas.largeCanvasHintMb),
      showGrid: canvas.showGrid,
    })
      .then(() => setCanvasNotice(t('canvasSettingsSaved')))
      .catch(() => setCanvasNotice(t('canvasSettingsFailed')))
      .finally(() => setCanvasPending(false))
  }, [canvas, t])

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
      <div className={css.sectionTitle}>{t('canvasSettings')}</div>
      {canvas === undefined
        ? <div className={css.emptyHint}>{t('loadingVaults')}</div>
        : (
          <div className={css.pluginRow}>
            <CanvasField label={t('settingRunTimeout')} hint={t('settingRunTimeoutHint')}>
              <input className={css.dialogInput} type="number" min={200} max={10000} value={canvas.runTimeoutMs} onChange={(event) => setCanvas({ ...canvas, runTimeoutMs: event.target.value })} />
            </CanvasField>
            <CanvasField label={t('settingAllowRun')} hint={t('settingAllowRunHint')}>
              <Toggle checked={canvas.allowCodeExecution} label="" ariaLabel={t('settingAllowRun')} onChange={(allowCodeExecution) => setCanvas({ ...canvas, allowCodeExecution })} />
            </CanvasField>
            <CanvasField label={t('settingSaveDelay')} hint={t('settingSaveDelayHint')}>
              <input className={css.dialogInput} type="number" min={100} max={5000} value={canvas.saveDelayMs} onChange={(event) => setCanvas({ ...canvas, saveDelayMs: event.target.value })} />
            </CanvasField>
            <CanvasField label={t('settingLargeHint')} hint={t('settingLargeHintHint')}>
              <input className={css.dialogInput} type="number" min={1} max={500} value={canvas.largeCanvasHintMb} onChange={(event) => setCanvas({ ...canvas, largeCanvasHintMb: event.target.value })} />
            </CanvasField>
            <CanvasField label={t('settingShowGrid')} hint={t('settingShowGridHint')}>
              <Toggle checked={canvas.showGrid} label="" ariaLabel={t('settingShowGrid')} onChange={(showGrid) => setCanvas({ ...canvas, showGrid })} />
            </CanvasField>
            <div className={css.pluginDetailRow}>
              <button type="button" className={css.iconButton} style={{ width: 'auto', padding: '4px 12px' }} disabled={canvasPending} onClick={saveCanvas}>
                {t('save')}
              </button>
              {canvasNotice === undefined ? null : <span className={css.emptyHint}>{canvasNotice}</span>}
            </div>
          </div>
        )}
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
 * One DSH-adapted plugin row: manifest metadata plus an expandable detail with
 * the bridge placeholder. DSH rows have no enablement switch.
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
          </div>
        )
        : null}
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

/** Draft of the canvas settings form. */
interface CanvasSettings {
  runTimeoutMs: string
  allowCodeExecution: boolean
  saveDelayMs: string
  largeCanvasHintMb: string
  showGrid: boolean
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

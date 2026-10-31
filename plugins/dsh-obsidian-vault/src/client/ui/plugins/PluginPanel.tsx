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

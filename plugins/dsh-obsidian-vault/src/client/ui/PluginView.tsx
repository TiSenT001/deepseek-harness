/**
 * The main-view host for one bridged plugin: a header with the plugin name and
 * a close button, then the sandboxed iframe when the plugin is whitelisted, or
 * a hint pointing at the settings dialog when it is not. The frame runs the
 * plugin's own code; the bridge answers its vault calls over postMessage and
 * merges its registered commands into the palette.
 * @module dsh-obsidian-vault/client/ui/PluginView
 */
import { useEffect, useRef, useState } from 'react'
import { fetchPlugins, pluginFrameUrl } from '../api.ts'
import { attachPluginBridge, BRIDGE_API_DEPS, type PluginBridgeHandle } from '../bridge.ts'
import { registerBridgedCommands, setCommandRunner } from '../bridge-commands.ts'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { EmptyState, LoadingState } from './kit/index.ts'
import { css } from './theme.ts'

/** Props for {@link PluginView}. */
export interface PluginViewProps {
  readonly t: Translate
  /** Whitelisted plugin id the frame loads. */
  readonly pluginId: string
  /** Display name for the header. */
  readonly title: string
  /** The pane's active note path; answers the frame's `getActiveFile`. */
  readonly activePath: string | undefined
  /** Open a vault path in the reading view, replacing the plugin view. */
  readonly onOpenPath: (path: string) => void
  /** Leave the plugin view for the reading view. */
  readonly onClose: () => void
  /** Open the settings dialog so the user can enable the bridge. */
  readonly onOpenSettings: () => void
}

/**
 * Render the bridged plugin surface.
 * @param props - translator, plugin identity, and view callbacks.
 */
export function PluginView({ t, pluginId, title, activePath, onOpenPath, onClose, onOpenSettings }: PluginViewProps): JSX.Element {
  const [bridged, setBridged] = useState<boolean | undefined>()
  const [frameError, setFrameError] = useState<string | undefined>()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const handleRef = useRef<PluginBridgeHandle | undefined>(undefined)
  const activePathRef = useRef(activePath)
  activePathRef.current = activePath
  // The bridge effect must not re-run when the parent's inline callback gets a
  // new reference: re-attaching wipes the frame's registered commands (the
  // registration event does not repeat), so the latest callback goes through a ref.
  const onOpenPathRef = useRef(onOpenPath)
  onOpenPathRef.current = onOpenPath

  useEffect(() => {
    let alive = true
    setBridged(undefined)
    void fetchPlugins()
      .then(list => {
        if (alive) setBridged(list.bridge.includes(pluginId))
      })
      .catch(() => {
        if (alive) setBridged(false)
      })
    return () => {
      alive = false
    }
  }, [pluginId])

  useEffect(() => {
    const frame = frameRef.current
    if (bridged !== true || frame === null) return undefined
    let unregisterCommands: (() => void) | undefined
    const handle = attachPluginBridge(frame, pluginId, (event, params) => {
      if (event === 'frame.error') {
        const message = params?.['message']
        setFrameError(typeof message === 'string' ? message : 'unknown error')
        return
      }
      if (event === 'commands.register') {
        const list = params?.['commands']
        if (!Array.isArray(list)) return
        const commands = list.filter(
          (entry): entry is { readonly id: string; readonly name: string } =>
            typeof entry === 'object' && entry !== null
            && typeof (entry as { id?: unknown }).id === 'string'
            && typeof (entry as { name?: unknown }).name === 'string',
        )
        unregisterCommands?.()
        unregisterCommands = registerBridgedCommands(pluginId, title, commands)
      }
    }, {
      ...BRIDGE_API_DEPS,
      activeFile: () => activePathRef.current ?? null,
      openLink: path => onOpenPathRef.current(path),
    })
    const removeRunner = setCommandRunner(pluginId, id => handle.notify('command.run', { id }))
    handleRef.current = handle
    return () => {
      handleRef.current = undefined
      removeRunner()
      unregisterCommands?.()
      handle.dispose()
    }
  }, [bridged, pluginId, title])

  // The frame's `getActiveFile` is synchronous and answers from a snapshot;
  // each host-side change pushes the new path so the snapshot stays current.
  useEffect(() => {
    handleRef.current?.notify('file.open', { path: activePath ?? null })
  }, [activePath])

  return (
    <div className={css.pluginView} data-plugin={pluginId}>
      <div className={css.pluginViewHead}>
        <span className={css.pluginViewTitle}><Icon name="plugin" size={13} /> {title}</span>
        <button
          type="button"
          className={css.iconButton}
          aria-label={t('close')}
          title={t('close')}
          onClick={onClose}
        >
          <Icon name="close" size={13} />
        </button>
      </div>
      {bridged === undefined
        ? <LoadingState label={t('pluginLoading')} />
        : bridged
        ? (
          <>
            <iframe
              ref={frameRef}
              className={css.pluginFrame}
              sandbox="allow-scripts"
              src={pluginFrameUrl(pluginId)}
              title={title}
            />
            {frameError === undefined
              ? null
              : <div className={css.pluginFrameError} role="alert">{t('pluginFrameFailed')}: {frameError}</div>}
          </>
        )
        : (
          <EmptyState
            title={t('pluginNotBridged')}
            hint={t('pluginNotBridgedHint')}
            icon="plugin"
            action={{ label: t('openSettings'), onSelect: onOpenSettings }}
          />
        )}
    </div>
  )
}

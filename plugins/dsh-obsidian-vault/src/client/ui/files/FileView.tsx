/**
 * File view: routes one vault path to the image, PDF, code, or download card
 * its extension registry entry names, keeps Markdown source mode here so the
 * reading view stays unaware of it, and hands `.PurStudio` documents to the
 * Pur canvas pane. Every read-only surface offers the file menu on right-click.
 * @module dsh-obsidian-vault/client/ui/files/FileView
 */
import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'
import type { FileDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { assetUrl, fetchFile } from '../../api.ts'
import { ErrorState, LoadingState } from '../kit/index.ts'
import type { MenuScene } from '../menu/registry.ts'
import { css } from '../theme.ts'
import { PurStudioLazy } from '../../pur/lazy.tsx'
import { AssetView } from './AssetView.tsx'
import { CodeView, formatBytes } from './CodeView.tsx'
import { SourceEditor } from '../editor/SourceEditor.tsx'

/** Props for {@link FileView}. */
export interface FileViewProps {
  readonly t: Translate
  readonly path: string
  /** Present when the file is Markdown shown as source; returns to reading. */
  readonly onReading?: () => void
  /** Called after the Markdown editor writes the file. */
  readonly onSaved?: () => void
  /** Open another vault path; the Pur pane navigates to freshly saved canvases. */
  readonly onOpenPath?: (path: string, destination?: 'current' | 'new-tab' | 'right') => void
  /** Open the explorer's file menu; the read-only views show the file they render. */
  readonly onMenu?: (scene: MenuScene, x: number, y: number) => void
}

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly file: FileDto }
  | { readonly status: 'error'; readonly message: string }

/**
 * Build the right-click handler that opens the file menu for the path a
 * read-only view renders. The embedded PDF frame owns its context menu, so
 * there only the surrounding header reaches this handler.
 * @param path - the vault path the view shows.
 * @param onMenu - the page's menu opener; `undefined` leaves right-click native.
 * @returns the handler, or `undefined` when the page offers no menu.
 */
function fileContextMenu(
  path: string,
  onMenu: FileViewProps['onMenu'],
): ((event: ReactMouseEvent<HTMLDivElement>) => void) | undefined {
  if (onMenu === undefined) return undefined
  return (event) => {
    event.preventDefault()
    onMenu({ kind: 'tree-file', path }, event.clientX, event.clientY)
  }
}

/**
 * Render one non-note file.
 * @param props - the path and the language dictionary.
 */
export function FileView({ t, path, onReading, onSaved, onOpenPath, onMenu }: FileViewProps): JSX.Element {
  const isPur = /\.(purstudio|canvas)$/i.test(path)
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (isPur) return
    let cancelled = false
    setState({ status: 'loading' })
    void fetchFile(path)
      .then((file) => {
        if (!cancelled) setState({ status: 'ready', file })
      })
      .catch((cause: unknown) => {
        if (!cancelled) setState({ status: 'error', message: cause instanceof Error ? cause.message : String(cause) })
      })
    return () => {
      cancelled = true
    }
  }, [path, attempt, isPur])

  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const contextMenu = fileContextMenu(path, onMenu)

  if (isPur) return <PurStudioLazy t={t} path={path} {...(onOpenPath === undefined ? {} : { onOpenPath })} />
  // A plugin asset is not a vault file: it has its own preview pane.
  if (path.startsWith('pur-asset:')) return <AssetView t={t} path={path} {...(onMenu === undefined ? {} : { onMenu })} />
  if (state.status === 'loading') return <LoadingState label={t('loadingFile')} />
  if (state.status === 'error') {
    return <ErrorState message={`${t('loadFailed')}: ${state.message}`} retryLabel={t('refresh')} onRetry={retry} />
  }

  const file = state.file
  if (file.kind === 'image') {
    return (
      <div className={css.fileView} onContextMenu={contextMenu}>
        <div className={css.codeHead}>
          <span className={css.codeLang}>{file.ext.toUpperCase()}</span>
          <span className={css.codeMeta}>{file.name} · {formatBytes(file.size)}</span>
        </div>
        <div className={css.fileMedia}>
          <img className={css.fileImage} src={assetUrl(file.path)} alt={file.name} />
        </div>
      </div>
    )
  }
  if (file.kind === 'pdf') {
    return (
      <div className={css.fileView} onContextMenu={contextMenu}>
        <div className={css.codeHead}>
          <span className={css.codeLang}>PDF</span>
          <span className={css.codeMeta}>{file.name} · {formatBytes(file.size)}</span>
        </div>
        <iframe className={css.fileFrame} src={assetUrl(file.path)} title={file.name} />
      </div>
    )
  }

  if (file.kind === 'binary') {
    return (
      <div className={css.fileView} onContextMenu={contextMenu}>
        <div className={css.fileInfo}>
          <div className={css.fileInfoRow}>
            <span className={css.fileInfoKey}>{t('fileMetaName')}</span>
            <span>{file.name}</span>
          </div>
          <div className={css.fileInfoRow}>
            <span className={css.fileInfoKey}>{t('fileMetaType')}</span>
            <span>{file.ext.length === 0 ? file.mime : `.${file.ext}`}</span>
          </div>
          <div className={css.fileInfoRow}>
            <span className={css.fileInfoKey}>{t('fileMetaSize')}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          {file.mtime === undefined ? null : (
            <div className={css.fileInfoRow}>
              <span className={css.fileInfoKey}>{t('fileMetaModified')}</span>
              <span>{new Date(file.mtime).toLocaleString()}</span>
            </div>
          )}
          <div className={css.codeMeta}>{t('fileBinaryHint')}</div>
          <a
            className={css.fileDownload}
            href={assetUrl(file.path, true)}
            download={file.name}
          >
            {t('download')}
          </a>
        </div>
      </div>
    )
  }

  if (file.kind === 'markdown' && onReading !== undefined && !file.truncated) {
    return (
      <SourceEditor
        key={file.path}
        t={t}
        path={file.path}
        text={file.text ?? ''}
        mtime={file.mtime}
        onReading={onReading}
        {...(onSaved === undefined ? {} : { onSaved })}
      />
    )
  }

  return (
    <div className={css.fileView} onContextMenu={contextMenu}>
      <CodeView
        t={t}
        text={file.text ?? ''}
        language={file.language}
        truncated={file.truncated}
        {...(file.kind === 'markdown' && onReading !== undefined
          ? {
            action: (
              <button type="button" className={css.button} onClick={onReading} aria-label={t('reading')}>
                {t('reading')}
              </button>
            ),
          }
          : {})}
      />
    </div>
  )
}

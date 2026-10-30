/**
 * File view: routes one vault path to the image, PDF, code, or download card
 * its extension registry entry names, keeps Markdown source mode here so the
 * reading view stays unaware of it, and hands `.PurStudio` documents to the
 * Pur canvas pane.
 * @module dsh-obsidian-vault/client/ui/files/FileView
 */
import { useCallback, useEffect, useState } from 'react'
import type { FileDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { assetUrl, fetchFile } from '../../api.ts'
import { ErrorState, LoadingState } from '../kit/index.ts'
import { css } from '../theme.ts'
import { PurStudioPane } from '../../pur/PurStudioPane.tsx'
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
  readonly onOpenPath?: (path: string) => void
}

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly file: FileDto }
  | { readonly status: 'error'; readonly message: string }

/**
 * Render one non-note file.
 * @param props - the path and the language dictionary.
 */
export function FileView({ t, path, onReading, onSaved, onOpenPath }: FileViewProps): JSX.Element {
  const isPur = /\.purstudio$/i.test(path)
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

  if (isPur) return <PurStudioPane t={t} path={path} {...(onOpenPath === undefined ? {} : { onOpenPath })} />
  if (state.status === 'loading') return <LoadingState label={t('loadingFile')} />
  if (state.status === 'error') {
    return <ErrorState message={`${t('loadFailed')}: ${state.message}`} retryLabel={t('refresh')} onRetry={retry} />
  }

  const file = state.file
  if (file.kind === 'image') {
    return (
      <div className={css.fileView}>
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
      <div className={css.fileView}>
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
      <div className={css.fileView}>
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
  )
}

/**
 * Where a pasted image should live: a plain vault attachment, a brand-new Pur
 * Studio canvas, or an existing canvas the user picks. Choosing a canvas makes
 * the note embed a `pur.studio` reference instead of a wikilink.
 * @module dsh-obsidian-vault/client/ui/ImageInsertDialog
 */
import { useEffect, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { listCanvases, type CanvasOption } from './canvas-link.ts'
import { Icon } from './Icon.tsx'
import { Select } from './kit/select.tsx'
import { css } from './theme.ts'

/** What the editor should do with the pasted images. */
export type ImageInsertMode =
  | { readonly kind: 'file' }
  | { readonly kind: 'new-canvas'; readonly name: string }
  | { readonly kind: 'canvas'; readonly path: string }

/** Props for {@link ImageInsertDialog}. */
export interface ImageInsertDialogProps {
  readonly t: Translate
  /** Number of images waiting; shown in the description. */
  readonly count: number
  /** Canvas name offered for the new-canvas choice. */
  readonly defaultName: string
  readonly onCancel: () => void
  readonly onConfirm: (mode: ImageInsertMode) => void
}

/**
 * Render the placement dialog.
 * @param props - translator, image count, default canvas name, and the outcomes.
 */
export function ImageInsertDialog({ t, count, defaultName, onCancel, onConfirm }: ImageInsertDialogProps): JSX.Element {
  const [choice, setChoice] = useState<'file' | 'new' | 'canvas'>('file')
  const [name, setName] = useState(defaultName)
  const [canvases, setCanvases] = useState<readonly CanvasOption[] | undefined>()
  const [picked, setPicked] = useState('')

  useEffect(() => {
    if (choice !== 'canvas' || canvases !== undefined) return
    void listCanvases()
      .then((items) => {
        setCanvases(items)
        setPicked(items[0]?.path ?? '')
      })
      .catch(() => setCanvases([]))
  }, [choice, canvases])

  const confirm = (): void => {
    if (choice === 'file') {
      onConfirm({ kind: 'file' })
      return
    }
    if (choice === 'new') {
      onConfirm({ kind: 'new-canvas', name: name.trim() })
      return
    }
    if (picked.length > 0) onConfirm({ kind: 'canvas', path: picked })
  }

  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <div
        className={`${css.dialog} ${css.settingsDialog}`}
        role="dialog"
        aria-label={t('imageInsertTitle')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('imageInsertTitle')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onCancel}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.settingsHint}>{t('imageInsertCount').replace('{count}', String(count))}</div>
          <label className={css.imageChoice}>
            <input type="radio" name="image-insert" checked={choice === 'file'} onChange={() => setChoice('file')} />
            <span>{t('imageInsertFile')}</span>
          </label>
          <label className={css.imageChoice}>
            <input type="radio" name="image-insert" checked={choice === 'new'} onChange={() => setChoice('new')} />
            <span>{t('imageInsertNewCanvas')}</span>
          </label>
          {choice === 'new'
            ? (
              <input
                className={css.settingsInput}
                value={name}
                aria-label={t('imageInsertCanvasName')}
                placeholder={t('imageInsertCanvasName')}
                onChange={(event) => setName(event.target.value)}
              />
            )
            : null}
          <label className={css.imageChoice}>
            <input type="radio" name="image-insert" checked={choice === 'canvas'} onChange={() => setChoice('canvas')} />
            <span>{t('imageInsertCanvas')}</span>
          </label>
          {choice === 'canvas'
            ? (canvases === undefined
                ? <div className={css.settingsHint}>{t('loadingVaults')}</div>
                : canvases.length === 0
                  ? <div className={css.settingsHint}>{t('imageInsertNoCanvas')}</div>
                  : (
                    <Select
                      value={picked}
                      options={canvases.map(canvas => ({ value: canvas.path, label: canvas.name }))}
                      ariaLabel={t('imageInsertCanvas')}
                      onChange={setPicked}
                    />
                  ))
            : null}
          <div className={css.settingsActions}>
            <button
              type="button"
              className={css.dialogButton}
              disabled={choice === 'canvas' && picked.length === 0}
              onClick={confirm}
            >
              {t('imageInsertConfirm')}
            </button>
            <button type="button" className={css.button} onClick={onCancel}>
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Rename-or-merge tag dialog. A dry run shows the affected file count first;
 * executing rewrites body tags and frontmatter tags through the Host route.
 * @module dsh-obsidian-vault/client/ui/TagRenameDialog
 */
import { useEffect, useState } from 'react'
import type { TagCountDto } from '../../protocol.ts'
import { previewTagRename, renameTag, type TagRenamePreview, type TagRenameResult } from '../api.ts'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link TagRenameDialog}. */
export interface TagRenameDialogProps {
  readonly t: Translate
  /** Existing tags for the datalist. */
  readonly tags: readonly TagCountDto[]
  readonly onRenamed: (result: TagRenameResult) => void
  readonly onClose: () => void
}

/**
 * Render the tag rename dialog.
 * @param props - existing tags and the completion callback.
 */
export function TagRenameDialog({ t, tags, onRenamed, onClose }: TagRenameDialogProps): JSX.Element {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<TagRenamePreview | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const reset = (): void => {
    setPreview(undefined)
    setError(undefined)
  }

  const runPreview = async (): Promise<void> => {
    if (from.trim().length === 0 || to.trim().length === 0) return
    setBusy(true)
    setError(undefined)
    try {
      setPreview(await previewTagRename(from, to))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const runRename = async (): Promise<void> => {
    if (from.trim().length === 0 || to.trim().length === 0) return
    setBusy(true)
    setError(undefined)
    try {
      const result = await renameTag(from, to)
      if (result.failures.length > 0) {
        setError(t('tagRenamePartial').replace('{count}', String(result.failures.length)))
      }
      onRenamed(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className={`${css.dialog} ${css.tagDialog}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('renameTagTitle')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('renameTagTitle')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.tagField}>
            <span className={css.tagLabel}>{t('oldTag')}</span>
            <input
              className={css.dialogInput}
              value={from}
              list="ov-tag-names"
              aria-label={t('oldTag')}
              placeholder="#标签"
              onChange={(event) => { setFrom(event.target.value); reset() }}
            />
          </div>
          <div className={css.tagField}>
            <span className={css.tagLabel}>{t('newTag')}</span>
            <input
              className={css.dialogInput}
              value={to}
              list="ov-tag-names"
              aria-label={t('newTag')}
              placeholder="#新标签"
              onChange={(event) => { setTo(event.target.value); reset() }}
            />
          </div>
          <datalist id="ov-tag-names">
            {tags.map(tag => <option key={tag.tag} value={`#${tag.tag}`} />)}
          </datalist>
          <p className={css.tagHint}>{t('tagMergeHint')}</p>
          {preview === undefined
            ? null
            : <p className={css.tagPreview}>{t('tagPreview').replace('{files}', String(preview.files)).replace('{matches}', String(preview.matches))}</p>}
          {error === undefined ? null : <p className={css.tagError}>{error}</p>}
          <div className={css.dialogActions}>
            <button type="button" className={css.dialogButton} onClick={onClose}>{t('cancel')}</button>
            <button type="button" className={css.dialogButton} disabled={busy || from.trim().length === 0 || to.trim().length === 0} onClick={() => { void runPreview() }}>
              {t('previewTag')}
            </button>
            <button
              type="button"
              className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
              disabled={busy || from.trim().length === 0 || to.trim().length === 0}
              onClick={() => { void runRename() }}
            >
              {t('renameTagAction')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

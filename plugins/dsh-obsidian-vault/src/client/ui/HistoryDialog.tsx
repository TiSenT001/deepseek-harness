/**
 * File-recovery dialog: browse the snapshots the Host kept before each save,
 * preview one, and restore it as the current body.
 * @module dsh-obsidian-vault/client/ui/HistoryDialog
 */
import { useEffect, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { fetchHistory, fetchHistorySnapshot, restoreHistory, type HistoryEntryDto } from '../api-vault.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link HistoryDialog}. */
export interface HistoryDialogProps {
  readonly t: Translate
  readonly path: string
  readonly onRestored: () => void
  readonly onClose: () => void
}

/** Compact file size. */
function sizeOf(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 102.4) / 10} KB`
}

/**
 * Render the recovery snapshots for one note.
 * @param props - the note path and close/restore callbacks.
 */
export function HistoryDialog({ t, path, onRestored, onClose }: HistoryDialogProps): JSX.Element {
  const [items, setItems] = useState<readonly HistoryEntryDto[] | undefined>(undefined)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [preview, setPreview] = useState<string | undefined>(undefined)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void fetchHistory(path).then((next) => {
      if (cancelled) return
      setItems(next)
      setSelected(next[0]?.id)
    }).catch(() => {
      if (!cancelled) setItems([])
    })
    return () => { cancelled = true }
  }, [path])

  useEffect(() => {
    if (selected === undefined) {
      setPreview(undefined)
      return undefined
    }
    let cancelled = false
    void fetchHistorySnapshot(path, selected)
      .then(content => { if (!cancelled) setPreview(content) })
      .catch(() => { if (!cancelled) setPreview(undefined) })
    return () => { cancelled = true }
  }, [path, selected])

  const restore = async (): Promise<void> => {
    if (selected === undefined) return
    if (!confirming) {
      setConfirming(true)
      setStatus(t('historyConfirm'))
      return
    }
    setBusy(true)
    try {
      await restoreHistory(path, selected)
      setStatus(t('historyRestored'))
      onRestored()
    } catch (cause) {
      setStatus(t('historyFailed').replace('{error}', cause instanceof Error ? cause.message : String(cause)))
    } finally {
      setBusy(false)
      setConfirming(false)
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
        className={`${css.dialog} ${css.historyDialog}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('fileHistory')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('fileHistory')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          {items === undefined
            ? <p className={css.historyStatus}>{t('loadingHistory')}</p>
            : items.length === 0
              ? <p className={css.historyStatus}>{t('historyEmpty')}</p>
              : (
                <div className={css.historyLayout}>
                  <ul className={css.historyList}>
                    {items.map(item => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${css.historyRow} ${item.id === selected ? css.historyRowActive : ''}`.trim()}
                          onClick={() => { setSelected(item.id); setConfirming(false); setStatus(undefined) }}
                        >
                          <span className={css.historyTime}>{new Date(item.savedAt).toLocaleString()}</span>
                          <span className={css.historySize}>{sizeOf(item.size)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <pre className={css.historyPreview}>{preview ?? t('loadingHistory')}</pre>
                </div>
              )}
          {status === undefined ? null : <p className={css.historyStatus}>{status}</p>}
          <div className={css.dialogActions}>
            <button type="button" className={css.dialogButton} onClick={onClose}>{t('close')}</button>
            <button
              type="button"
              className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
              disabled={selected === undefined || busy}
              onClick={() => { void restore() }}
            >
              {confirming ? t('historyConfirmAction') : t('historyRestore')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

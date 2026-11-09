/**
 * The named-workspace dialog. Obsidian's Workspaces core plugin saves the tab
 * and split arrangement under a name; this surface saves, applies, and removes
 * those layouts for the current vault.
 * @module dsh-obsidian-vault/client/ui/WorkspaceLayoutsDialog
 */
import { useMemo, useState } from 'react'
import type { Translate } from '../i18n.ts'
import type { WorkspaceLayout } from './viewMemory.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link WorkspaceLayoutsDialog}. */
export interface WorkspaceLayoutsDialogProps {
  readonly t: Translate
  readonly layouts: readonly WorkspaceLayout[]
  /** Save (or overwrite) the current arrangement under a name. */
  readonly onSave: (name: string) => void
  readonly onApply: (layout: WorkspaceLayout) => void
  readonly onDelete: (name: string) => void
  readonly onClose: () => void
}

/**
 * Render the saved-layout manager.
 * @param props - saved layouts and their actions.
 */
export function WorkspaceLayoutsDialog(props: WorkspaceLayoutsDialogProps): JSX.Element {
  const { t, layouts, onSave, onApply, onDelete, onClose } = props
  const [name, setName] = useState('')
  const ordered = useMemo(
    () => [...layouts].sort((left, right) => right.savedAt - left.savedAt),
    [layouts],
  )
  const trimmed = name.trim()
  const save = (): void => {
    if (trimmed.length === 0) return
    onSave(trimmed)
    setName('')
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
        className={`${css.dialog} ${css.layoutsDialog}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('workspaces')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('workspaces')}</span>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={t('close')}
            title={t('close')}
            onClick={onClose}
          >
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.layoutsForm}>
            <input
              className={css.dialogInput}
              value={name}
              placeholder={t('layoutName')}
              aria-label={t('layoutName')}
              onChange={event => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  save()
                }
              }}
            />
            <button
              type="button"
              className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
              disabled={trimmed.length === 0}
              onClick={save}
            >
              {t('saveLayout')}
            </button>
          </div>
          <p className={css.layoutHint}>{t('layoutHint')}</p>
          {ordered.length === 0
            ? <p className={css.layoutsEmpty}>{t('noLayouts')}</p>
            : (
              <ul className={css.layoutsList}>
                {ordered.map(layout => (
                  <li key={layout.name} className={css.layoutsRow}>
                    <span className={css.layoutsInfo}>
                      <span className={css.layoutsName}>{layout.name}</span>
                      <span className={css.layoutsMeta}>
                        {t('layoutSummary')
                          .replace('{panes}', String(layout.workspace.panes.length))
                          .replace('{tabs}', String(layout.workspace.panes.reduce((count, pane) => count + pane.tabs.length, 0)))}
                      </span>
                    </span>
                    <span className={css.layoutsActions}>
                      <button type="button" className={css.dialogButton} onClick={() => { onApply(layout); onClose() }}>
                        {t('applyLayout')}
                      </button>
                      <button type="button" className={css.dialogButton} onClick={() => onDelete(layout.name)}>
                        {t('delete')}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  )
}

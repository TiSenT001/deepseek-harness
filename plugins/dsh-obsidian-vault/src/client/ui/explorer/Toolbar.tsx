/**
 * Explorer toolbar: new note, new folder, collapse all.
 * @module dsh-obsidian-vault/client/ui/explorer/Toolbar
 */
import type { Translate } from '../../i18n.ts'
import { Icon } from '../Icon.tsx'
import { css } from '../theme.ts'

/** Props for {@link ExplorerToolbar}. */
export interface ExplorerToolbarProps {
  readonly t: Translate
  readonly folder: string
  readonly onCreateNote: (folder: string) => void
  readonly onCreateFolder: (folder: string) => void
  readonly onCollapseAll: () => void
  /** Whether the tree currently hides attachments. */
  readonly notesOnly: boolean
  /** Flip the notes-only display switch. */
  readonly onToggleNotesOnly: () => void
}

/**
 * Render the toolbar above the tree.
 * @param props - current folder and file actions.
 */
export function ExplorerToolbar({
  t, folder, onCreateNote, onCreateFolder, onCollapseAll, notesOnly, onToggleNotesOnly,
}: ExplorerToolbarProps): JSX.Element {
  return (
    <div className={css.explorerTools}>
      <button type="button" className={css.explorerTool} title={t('newNote')} aria-label={t('newNote')} onClick={() => onCreateNote(folder)}>
        <Icon name="newNote" size={14} />
      </button>
      <button type="button" className={css.explorerTool} title={t('newFolder')} aria-label={t('newFolder')} onClick={() => onCreateFolder(folder)}>
        <Icon name="newFolder" size={14} />
      </button>
      <button type="button" className={css.explorerTool} title={t('collapseAll')} aria-label={t('collapseAll')} onClick={onCollapseAll}>
        <Icon name="collapseAll" size={14} />
      </button>
      <button
        type="button"
        className={css.explorerTool}
        title={t('notesOnlyHint')}
        aria-label={t('notesOnly')}
        aria-pressed={notesOnly}
        data-on={notesOnly}
        onClick={onToggleNotesOnly}
      >
        <Icon name="note" size={14} />
      </button>
    </div>
  )
}

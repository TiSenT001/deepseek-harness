/**
 * The settings dialog: the plugin panel. The appearance (density variant)
 * section was removed by request.
 * @module dsh-obsidian-vault/client/ui/SettingsDialog
 */
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { PluginPanel } from './plugins/PluginPanel.tsx'
import { css } from './theme.ts'

/** Props for {@link SettingsDialog}. */
export interface SettingsDialogProps {
  readonly t: Translate
  readonly onClose: () => void
}

/**
 * Render the settings dialog.
 * @param props - translator and the close callback.
 */
export function SettingsDialog({ t, onClose }: SettingsDialogProps): JSX.Element {
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
        className={`${css.dialog} ${css.settingsDialog}`}
        role="dialog"
        aria-label={t('settings')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('settings')}</span>
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
          <div className={css.sectionTitle}>{t('plugins')}</div>
          <PluginPanel t={t} />
        </div>
      </div>
    </div>
  )
}

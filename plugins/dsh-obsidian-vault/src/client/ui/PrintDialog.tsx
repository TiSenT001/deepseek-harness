/**
 * Print settings dialog: paper, orientation and margins chosen with the kit
 * controls, then applied to the print window as an `@page` rule. The browser
 * still renders the final print sheet, so these options pre-set the page box
 * instead of restyling the native dialog.
 * @module dsh-obsidian-vault/client/ui/PrintDialog
 */
import { useState } from 'react'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { SettingsRow } from './kit/index.ts'
import { Select } from './kit/select.tsx'
import type { PrintMargins, PrintOptions, PrintOrientation, PrintPaper } from './printNote.ts'
import { css } from './theme.ts'

/** Props for {@link PrintDialog}. */
export interface PrintDialogProps {
  readonly t: Translate
  readonly onCancel: () => void
  readonly onConfirm: (action: 'print' | 'pdf', options: PrintOptions) => void
}

/**
 * Render the print options.
 * @param props - translator and the two outcomes.
 */
export function PrintDialog({ t, onCancel, onConfirm }: PrintDialogProps): JSX.Element {
  const [paper, setPaper] = useState<PrintPaper>('A4')
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait')
  const [margins, setMargins] = useState<PrintMargins>('default')
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
        aria-label={t('printTitle')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('printTitle')}</span>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={t('close')}
            title={t('close')}
            onClick={onCancel}
          >
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <SettingsRow label={t('printPaperSize')}>
            <Select
              value={paper}
              options={[{ value: 'A4', label: 'A4' }, { value: 'A3', label: 'A3' }, { value: 'Letter', label: 'Letter' }]}
              ariaLabel={t('printPaperSize')}
              onChange={(value) => setPaper(value === 'A3' || value === 'Letter' ? value : 'A4')}
            />
          </SettingsRow>
          <SettingsRow label={t('printOrientation')}>
            <Select
              value={orientation}
              options={[
                { value: 'portrait', label: t('printPortrait') },
                { value: 'landscape', label: t('printLandscape') },
              ]}
              ariaLabel={t('printOrientation')}
              onChange={(value) => setOrientation(value === 'landscape' ? 'landscape' : 'portrait')}
            />
          </SettingsRow>
          <SettingsRow label={t('printMargins')}>
            <Select
              value={margins}
              options={[
                { value: 'default', label: t('printMarginDefault') },
                { value: 'narrow', label: t('printMarginNarrow') },
                { value: 'none', label: t('printMarginNone') },
              ]}
              ariaLabel={t('printMargins')}
              onChange={(value) => setMargins(value === 'narrow' || value === 'none' ? value : 'default')}
            />
          </SettingsRow>
          <div className={css.settingsActions}>
            <button type="button" className={css.dialogButton} onClick={() => onConfirm('print', { paper, orientation, margins })}>
              {t('print')}
            </button>
            <button type="button" className={css.dialogButton} onClick={() => onConfirm('pdf', { paper, orientation, margins })}>
              {t('exportPdf')}
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

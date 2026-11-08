/**
 * Print settings dialog: page box, scale, included sections and the PDF-only
 * switches, with a live first-page preview rendered from the same document the
 * print window and the PDF route use. The browser still owns the final print
 * sheet, so these options pre-set the page instead of restyling its dialog.
 * @module dsh-obsidian-vault/client/ui/PrintDialog
 */
import { useMemo, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { SettingsRow } from './kit/index.ts'
import { Select } from './kit/select.tsx'
import type {
  PrintContentOptions, PrintMargins, PrintOptions, PrintOrientation, PrintPaper, PrintScale,
} from './printNote.ts'
import { DEFAULT_PRINT_CONTENT, printDocumentHtml, sheetSizeOf } from './printNote.ts'
import { css } from './theme.ts'

/** Width and height available to the preview, in CSS pixels. */
const PREVIEW_BOX = { width: 300, height: 380 } as const

/** What the dialog hands back. */
export type PrintAction = 'print' | 'pdf'

/** Props for {@link PrintDialog}. */
export interface PrintDialogProps {
  readonly t: Translate
  /** The rendered article the preview and the output clone. */
  readonly element: HTMLElement | null
  /** Document title, used for the preview document. */
  readonly title: string
  readonly onCancel: () => void
  readonly onConfirm: (action: PrintAction, options: PrintOptions) => void
}

/**
 * Render the print options.
 * @param props - translator, the article, and the two outcomes.
 */
export function PrintDialog({ t, element, title, onCancel, onConfirm }: PrintDialogProps): JSX.Element {
  const [paper, setPaper] = useState<PrintPaper>('A4')
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait')
  const [margins, setMargins] = useState<PrintMargins>('default')
  const [scale, setScale] = useState<PrintScale>(1)
  const [content, setContent] = useState<PrintContentOptions>(DEFAULT_PRINT_CONTENT)
  const [pageNumbers, setPageNumbers] = useState(false)
  const [backgrounds, setBackgrounds] = useState(true)

  const options: PrintOptions = { paper, orientation, margins, scale, content, pageNumbers, backgrounds }
  const html = useMemo(
    () => (element === null ? '' : printDocumentHtml(element, title, options)),
    [element, title, paper, orientation, margins, scale, content, pageNumbers, backgrounds],
  )
  const sheet = sheetSizeOf({ paper, orientation })
  const fit = Math.min(PREVIEW_BOX.width / sheet.width, PREVIEW_BOX.height / sheet.height, 1)
  const flip = (key: keyof PrintContentOptions): void => setContent(current => ({ ...current, [key]: !current[key] }))

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
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onCancel}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={`${css.dialogBody} ${css.printBody}`}>
          <div className={css.printOptions}>
            <SettingsRow label={t('printPaperSize')}>
              <Select
                value={paper}
                options={(['A4', 'A3', 'A5', 'Letter', 'Legal'] as const).map(value => ({ value, label: value }))}
                ariaLabel={t('printPaperSize')}
                onChange={(value) => setPaper(value as PrintPaper)}
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
                  { value: 'narrow', label: t('printMarginNarrow') },
                  { value: 'default', label: t('printMarginDefault') },
                  { value: 'wide', label: t('printMarginWide') },
                  { value: 'none', label: t('printMarginNone') },
                ]}
                ariaLabel={t('printMargins')}
                onChange={(value) => setMargins(value as PrintMargins)}
              />
            </SettingsRow>
            <SettingsRow label={t('printScale')}>
              <Select
                value={String(scale)}
                options={[
                  { value: '0.9', label: t('printScaleSmall') },
                  { value: '1', label: t('printScaleNormal') },
                  { value: '1.15', label: t('printScaleLarge') },
                  { value: '1.3', label: t('printScaleHuge') },
                ]}
                ariaLabel={t('printScale')}
                onChange={(value) => setScale(Number(value) as PrintScale)}
              />
            </SettingsRow>

            <div className={css.settingsGroup}>{t('printInclude')}</div>
            <label className={css.imageChoice}>
              <input type="checkbox" checked={content.properties} onChange={() => flip('properties')} />
              <span>{t('printIncludeProperties')}</span>
            </label>
            <label className={css.imageChoice}>
              <input type="checkbox" checked={content.tags} onChange={() => flip('tags')} />
              <span>{t('printIncludeTags')}</span>
            </label>
            <label className={css.imageChoice}>
              <input type="checkbox" checked={content.backlinks} onChange={() => flip('backlinks')} />
              <span>{t('printIncludeBacklinks')}</span>
            </label>

            <div className={css.settingsGroup}>{t('printPdfOnly')}</div>
            <label className={css.imageChoice}>
              <input type="checkbox" checked={pageNumbers} onChange={() => setPageNumbers(value => !value)} />
              <span>{t('printPageNumbers')}</span>
            </label>
            <label className={css.imageChoice}>
              <input type="checkbox" checked={backgrounds} onChange={() => setBackgrounds(value => !value)} />
              <span>{t('printBackgrounds')}</span>
            </label>
          </div>
          <div className={css.printPreview}>
            <div className={css.settingsHint}>{t('printPreview')}</div>
            <div
              className={css.printSheet}
              style={{ width: `${Math.round(sheet.width * fit)}px`, height: `${Math.round(sheet.height * fit)}px` }}
            >
              <iframe
                className={css.printFrame}
                title={t('printPreview')}
                srcDoc={html}
                sandbox="allow-same-origin"
                style={{
                  width: `${sheet.width}px`,
                  height: `${sheet.height}px`,
                  transform: `scale(${fit})`,
                }}
              />
            </div>
            <div className={css.settingsHint}>{t('printPreviewHint')}</div>
          </div>
        </div>
        <footer className={css.dialogFooter}>
          <button type="button" className={css.dialogButton} onClick={() => onConfirm('print', options)}>
            {t('print')}
          </button>
          <button type="button" className={css.dialogButton} onClick={() => onConfirm('pdf', options)}>
            {t('exportPdf')}
          </button>
          <button type="button" className={css.button} onClick={onCancel}>
            {t('cancel')}
          </button>
        </footer>
      </div>
    </div>
  )
}

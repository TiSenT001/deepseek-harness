/**
 * Print settings dialog: page box, scale, included sections and the PDF-only
 * switches, with a paginated preview rendered from the same document the print
 * window and the PDF route use. Sheet count comes from the chosen paper and
 * margins, so the preview matches what the browser paginates; the browser still
 * owns the final print dialog.
 * @module dsh-obsidian-vault/client/ui/PrintDialog
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { SettingsRow, Toggle } from './kit/index.ts'
import { Select } from './kit/select.tsx'
import type {
  PrintContentOptions, PrintMargins, PrintOptions, PrintOrientation, PrintPaper, PrintScale,
} from './printNote.ts'
import { DEFAULT_PRINT_CONTENT, marginPxOf, printDocumentHtml, sheetSizeOf } from './printNote.ts'
import { css } from './theme.ts'

/** Upper bound on rendered preview sheets; longer notes would stall the dialog. */
const MAX_PREVIEW_PAGES = 30

/** Remembered page box between openings. */
const OPTIONS_KEY = 'dsh-obsidian-vault:print-options'

const PAPERS: readonly PrintPaper[] = ['A4', 'A3', 'A5', 'Letter', 'Legal']
const ORIENTATIONS: readonly PrintOrientation[] = ['portrait', 'landscape']
const MARGIN_PRESETS: readonly PrintMargins[] = ['narrow', 'default', 'wide', 'none']
const SCALES: readonly PrintScale[] = [0.9, 1, 1.15, 1.3]

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

/** Every choice the form remembers between openings. */
interface PrintState extends PrintOptions {
  readonly paper: PrintPaper
  readonly orientation: PrintOrientation
  readonly margins: PrintMargins
  readonly scale: PrintScale
  readonly content: PrintContentOptions
  readonly pageNumbers: boolean
  readonly backgrounds: boolean
}

/** Defaults matching the Host's documented print choices. */
const DEFAULT_STATE: PrintState = {
  paper: 'A4',
  orientation: 'portrait',
  margins: 'default',
  scale: 1,
  content: DEFAULT_PRINT_CONTENT,
  pageNumbers: false,
  backgrounds: true,
}

/**
 * Accept a stored string only while it is still one of the offered values.
 * @param value - stored field.
 * @param allowed - values the form can render.
 * @param fallback - value used otherwise.
 * @returns a renderable choice.
 */
function storedChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== 'string') return fallback
  return (allowed as readonly string[]).includes(value) ? value as T : fallback
}

/**
 * Accept a stored boolean, falling back when the field is missing or wrong.
 * @param value - stored field.
 * @param fallback - value used otherwise.
 * @returns the switch state.
 */
function storedSwitch(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Read the remembered page box, ignoring fields the form cannot represent.
 * @returns the state to open the dialog with.
 */
function loadState(): PrintState {
  try {
    const raw = window.localStorage.getItem(OPTIONS_KEY)
    if (raw === null) return DEFAULT_STATE
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE
    const record = parsed as Readonly<Record<string, unknown>>
    const content = typeof record.content === 'object' && record.content !== null
      ? record.content as Readonly<Record<string, unknown>>
      : {}
    return {
      paper: storedChoice(record.paper, PAPERS, DEFAULT_STATE.paper),
      orientation: storedChoice(record.orientation, ORIENTATIONS, DEFAULT_STATE.orientation),
      margins: storedChoice(record.margins, MARGIN_PRESETS, DEFAULT_STATE.margins),
      scale: SCALES.find(entry => entry === record.scale) ?? DEFAULT_STATE.scale,
      content: {
        properties: storedSwitch(content.properties, DEFAULT_STATE.content.properties),
        tags: storedSwitch(content.tags, DEFAULT_STATE.content.tags),
        backlinks: storedSwitch(content.backlinks, DEFAULT_STATE.content.backlinks),
      },
      pageNumbers: storedSwitch(record.pageNumbers, DEFAULT_STATE.pageNumbers),
      backgrounds: storedSwitch(record.backgrounds, DEFAULT_STATE.backgrounds),
    }
  } catch {
    // Unreadable storage or bad JSON simply means the defaults.
    return DEFAULT_STATE
  }
}

/**
 * Persist the page box; a blocked store keeps the session value instead.
 * @param state - current choices.
 */
function saveState(state: PrintState): void {
  try {
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full store is not worth breaking the dialog.
  }
}

/**
 * Count the page-height windows the preview document fills.
 *
 * The height is measured in an offscreen frame with the sheet's content
 * dimensions, because only the rendered document knows how tall it is. Images
 * and fonts settling after the load event re-trigger the measurement.
 * @param html - preview document.
 * @param width - content box width in CSS pixels.
 * @param height - content box height in CSS pixels.
 * @returns the page count, at least one.
 */
function usePageCount(html: string, width: number, height: number): number {
  const [count, setCount] = useState(1)
  useEffect(() => {
    setCount(1)
    if (html === '') return
    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', 'allow-same-origin')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;border:0;visibility:hidden;pointer-events:none`
    let cancelled = false
    let timer: number | undefined
    let watchingImages = false
    const measure = (): void => {
      if (cancelled) return
      const doc = frame.contentDocument
      if (doc === null) return
      const total = Math.max(doc.documentElement.scrollHeight, doc.body === null ? 0 : doc.body.scrollHeight)
      setCount(Math.max(1, Math.min(MAX_PREVIEW_PAGES, Math.ceil(total / height))))
      if (!watchingImages) {
        watchingImages = true
        for (const image of [...doc.images]) image.addEventListener('load', measure)
      }
    }
    frame.addEventListener('load', () => {
      measure()
      // Web fonts settle shortly after load and change the line boxes.
      timer = window.setTimeout(measure, 300)
    })
    frame.srcdoc = html
    document.body.append(frame)
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
      frame.remove()
    }
  }, [html, width, height])
  return count
}

/**
 * Track how wide the sheet stack is so the pages shrink to fit it.
 * @param sheetWidth - one sheet's width in CSS pixels.
 * @param stack - the scrolling page container.
 * @returns the scale factor, never above 1.
 */
function useFitScale(sheetWidth: number, stack: RefObject<HTMLDivElement | null>): number {
  const [fit, setFit] = useState(1)
  useEffect(() => {
    const node = stack.current
    if (node === null) return
    const update = (): void => {
      setFit(Math.max(0.2, Math.min(1, (node.clientWidth - 40) / sheetWidth)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [sheetWidth, stack])
  return fit
}

/**
 * Render the print options and the paginated preview.
 * @param props - translator, the article, and the two outcomes.
 */
export function PrintDialog({ t, element, title, onCancel, onConfirm }: PrintDialogProps): JSX.Element {
  const [state, setState] = useState<PrintState>(loadState)
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const options: PrintOptions = useMemo(() => ({
    paper: state.paper,
    orientation: state.orientation,
    margins: state.margins,
    scale: state.scale,
    content: state.content,
    pageNumbers: state.pageNumbers,
    backgrounds: state.backgrounds,
  }), [state])

  const sheet = sheetSizeOf(options)
  const marginPx = marginPxOf(state.margins)
  const contentWidth = Math.max(160, sheet.width - marginPx * 2)
  const contentHeight = Math.max(160, sheet.height - marginPx * 2)
  const html = useMemo(
    () => (element === null ? '' : printDocumentHtml(element, title, options, { contentWidth })),
    [element, title, options, contentWidth],
  )
  const pageCount = usePageCount(html, contentWidth, contentHeight)
  const fit = useFitScale(sheet.width, stackRef)

  const flip = (key: keyof PrintContentOptions): void => {
    setState(current => ({ ...current, content: { ...current.content, [key]: !current.content[key] } }))
  }
  const reset = (): void => setState(DEFAULT_STATE)

  const orientationLabel = state.orientation === 'portrait' ? t('printPortrait') : t('printLandscape')
  const pageCountLabel = t('printPreviewPages').replace('{total}', String(pageCount))
  const sheetLabel = `${state.paper} · ${orientationLabel}`

  return (
    <div className={css.dialogLayer} role="presentation" onMouseDown={onCancel}>
      <div
        className={`${css.dialog} ${css.settingsDialog} ${css.printDialog}`}
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
          <aside className={css.printOptions}>
            <div className={css.settingsGroup}>{t('printPageGroup')}</div>
            <SettingsRow label={t('printPaperSize')}>
              <Select
                value={state.paper}
                options={PAPERS.map(value => ({ value, label: value }))}
                ariaLabel={t('printPaperSize')}
                onChange={(value) => setState(current => ({ ...current, paper: storedChoice(value, PAPERS, current.paper) }))}
              />
            </SettingsRow>
            <SettingsRow label={t('printOrientation')}>
              <Select
                value={state.orientation}
                options={[
                  { value: 'portrait', label: t('printPortrait') },
                  { value: 'landscape', label: t('printLandscape') },
                ]}
                ariaLabel={t('printOrientation')}
                onChange={(value) => setState(current => ({ ...current, orientation: storedChoice(value, ORIENTATIONS, current.orientation) }))}
              />
            </SettingsRow>
            <SettingsRow label={t('printMargins')}>
              <Select
                value={state.margins}
                options={[
                  { value: 'narrow', label: t('printMarginNarrow') },
                  { value: 'default', label: t('printMarginDefault') },
                  { value: 'wide', label: t('printMarginWide') },
                  { value: 'none', label: t('printMarginNone') },
                ]}
                ariaLabel={t('printMargins')}
                onChange={(value) => setState(current => ({ ...current, margins: storedChoice(value, MARGIN_PRESETS, current.margins) }))}
              />
            </SettingsRow>
            <SettingsRow label={t('printScale')}>
              <Select
                value={String(state.scale)}
                options={[
                  { value: '0.9', label: t('printScaleSmall') },
                  { value: '1', label: t('printScaleNormal') },
                  { value: '1.15', label: t('printScaleLarge') },
                  { value: '1.3', label: t('printScaleHuge') },
                ]}
                ariaLabel={t('printScale')}
                onChange={(value) => setState(current => ({ ...current, scale: SCALES.find(entry => String(entry) === value) ?? current.scale }))}
              />
            </SettingsRow>

            <div className={css.settingsGroup}>{t('printInclude')}</div>
            <SettingsRow label={t('printIncludeProperties')}>
              <Toggle checked={state.content.properties} label="" ariaLabel={t('printIncludeProperties')} onChange={() => flip('properties')} />
            </SettingsRow>
            <SettingsRow label={t('printIncludeTags')}>
              <Toggle checked={state.content.tags} label="" ariaLabel={t('printIncludeTags')} onChange={() => flip('tags')} />
            </SettingsRow>
            <SettingsRow label={t('printIncludeBacklinks')}>
              <Toggle checked={state.content.backlinks} label="" ariaLabel={t('printIncludeBacklinks')} onChange={() => flip('backlinks')} />
            </SettingsRow>

            <div className={css.settingsGroup}>{t('printPdfOnly')}</div>
            <SettingsRow label={t('printPageNumbers')}>
              <Toggle checked={state.pageNumbers} label="" ariaLabel={t('printPageNumbers')} onChange={() => setState(current => ({ ...current, pageNumbers: !current.pageNumbers }))} />
            </SettingsRow>
            <SettingsRow label={t('printBackgrounds')}>
              <Toggle checked={state.backgrounds} label="" ariaLabel={t('printBackgrounds')} onChange={() => setState(current => ({ ...current, backgrounds: !current.backgrounds }))} />
            </SettingsRow>

            <div className={css.settingsActions}>
              <button type="button" className={css.dialogButton} onClick={reset}>{t('printReset')}</button>
            </div>
          </aside>

          <section className={css.printPreview}>
            <div className={css.printPreviewBar}>
              <span className={css.printPreviewMeta}>{sheetLabel}</span>
              <span className={css.printPreviewMeta}>{pageCountLabel}</span>
            </div>
            <div className={css.printPages} ref={stackRef}>
              {Array.from({ length: pageCount }, (_, index) => (
                <div className={css.printPage} key={index}>
                  <div
                    className={css.printSheet}
                    style={{ width: `${Math.round(sheet.width * fit)}px`, height: `${Math.round(sheet.height * fit)}px` }}
                  >
                    <div
                      className={css.printSheetContent}
                      style={{
                        left: `${marginPx * fit}px`,
                        top: `${marginPx * fit}px`,
                        width: `${contentWidth}px`,
                        height: `${contentHeight}px`,
                        transform: `scale(${fit})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <iframe
                        className={css.printFrame}
                        title={`${t('printPreview')} ${index + 1}`}
                        srcDoc={html}
                        sandbox="allow-same-origin"
                        style={{
                          width: `${contentWidth}px`,
                          height: `${(index + 1) * contentHeight}px`,
                          transform: `translateY(-${index * contentHeight}px)`,
                        }}
                      />
                    </div>
                  </div>
                  <span className={css.printPageLabel}>{t('printPageLabel').replace('{current}', String(index + 1))}</span>
                </div>
              ))}
            </div>
            <div className={css.printPreviewFoot}>{t('printPreviewHint')}</div>
          </section>
        </div>

        <footer className={css.dialogFooter}>
          <button type="button" className={css.dialogButton} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className={css.dialogButton} disabled={element === null} onClick={() => onConfirm('pdf', options)}>
            {t('exportPdf')}
          </button>
          <button type="button" className={css.dialogButtonPrimary} disabled={element === null} onClick={() => onConfirm('print', options)}>
            {t('print')}
          </button>
        </footer>
      </div>
    </div>
  )
}

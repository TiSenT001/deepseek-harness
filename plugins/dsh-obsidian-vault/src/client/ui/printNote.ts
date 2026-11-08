/**
 * Print the reading view in its own window: the app chrome would otherwise print
 * with the note, so the note's DOM is copied into a blank document that carries
 * only reading styles. The browser's print dialog owns paper size and PDF export.
 * @module dsh-obsidian-vault/client/ui/printNote
 */

/** Reading styles for the printed document; deliberately light, paper-first. */
const PRINT_CSS = `
  :root { color-scheme: light; }
  body {
    margin: 28px auto;
    max-width: 760px;
    padding: 0 20px;
    background: #ffffff;
    color: #1a1a1a;
    font: 14px/1.75 -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.35; page-break-after: avoid; }
  pre, code { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 12px; }
  pre { padding: 10px 12px; border: 1px solid #dddddd; border-radius: 6px; overflow: auto; page-break-inside: avoid; }
  code { background: #f3f3f3; padding: 1px 4px; border-radius: 3px; }
  pre code { background: none; padding: 0; }
  img { max-width: 100%; height: auto; }
  blockquote { margin: 10px 0; padding-left: 12px; border-left: 3px solid #cccccc; color: #555555; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #dddddd; padding: 5px 8px; text-align: left; }
  .ov-callout { margin: 12px 0; padding: 8px 12px; border-left: 3px solid #888888; background: #f7f7f7; page-break-inside: avoid; }
  .ov-callout-title { font-weight: 600; }
  .ov-properties { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 14px; margin: 0 0 14px; font-size: 12px; color: #555555; }
  .ov-property-row { display: contents; }
  .ov-property-key { color: #777777; }
  .ov-tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .ov-chip { border: 1px solid #dddddd; border-radius: 10px; padding: 1px 8px; font-size: 11px; color: #555555; }
  .ov-note-head { margin-bottom: 18px; }
  .ov-breadcrumb { display: none; }
  .ov-hover-card, .ov-md-flash, script, style { display: none !important; }
  a { color: #1a4fb4; text-decoration: none; }
  .ov-backlinks { margin-top: 24px; border-top: 1px solid #dddddd; padding-top: 12px; }
`

/** Paper sizes the dialog offers; the browser understands these names. */
export type PrintPaper = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal'

/** Sheet orientation. */
export type PrintOrientation = 'portrait' | 'landscape'

/** Page margin preset. */
export type PrintMargins = 'narrow' | 'default' | 'wide' | 'none'

/** Body scale presets; 1 keeps the reading view's size. */
export type PrintScale = 0.9 | 1 | 1.15 | 1.3

/** Sections the document may include. */
export interface PrintContentOptions {
  readonly properties: boolean
  readonly tags: boolean
  readonly backlinks: boolean
}

/** Page box the dialog chooses; every field has a documented default. */
export interface PrintOptions {
  readonly paper?: PrintPaper
  readonly orientation?: PrintOrientation
  readonly margins?: PrintMargins
  readonly scale?: PrintScale
  readonly content?: PrintContentOptions
  /** PDF only: page numbers in the footer. */
  readonly pageNumbers?: boolean
  /** PDF only: paint the document background. */
  readonly backgrounds?: boolean
}

/** Margin presets in millimetres. */
const MARGIN_MM: Readonly<Record<PrintMargins, string>> = {
  default: '14mm',
  narrow: '6mm',
  wide: '22mm',
  none: '0',
}

/** Content defaults: everything the reading view shows. */
export const DEFAULT_PRINT_CONTENT: PrintContentOptions = { properties: true, tags: true, backlinks: true }

/** Paper dimensions in CSS pixels at 96 dpi, portrait. */
export const PAPER_PX: Readonly<Record<PrintPaper, { readonly width: number; readonly height: number }>> = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1587 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
}

/**
 * Page geometry in CSS pixels for one choice set, orientation applied.
 * @param options - dialog choices.
 * @returns width and height of one sheet.
 */
export function sheetSizeOf(options: PrintOptions): { readonly width: number; readonly height: number } {
  const paper = PAPER_PX[options.paper ?? 'A4']
  return options.orientation === 'landscape'
    ? { width: paper.height, height: paper.width }
    : { width: paper.width, height: paper.height }
}

/**
 * Build the `@page` rule and body scale for one choice set.
 * @param options - dialog choices.
 * @returns the CSS rules the print window appends.
 */
function pageRule(options: PrintOptions): string {
  const paper = options.paper ?? 'A4'
  const orientation = options.orientation ?? 'portrait'
  const margins = MARGIN_MM[options.margins ?? 'default'] ?? MARGIN_MM['default'] ?? '14mm'
  const scale = options.scale ?? 1
  return `@page { size: ${paper} ${orientation}; margin: ${margins}; }\nbody { zoom: ${scale}; }\n`
}

/**
 * Wait until every image in the print document has loaded and decoded.
 *
 * A clone of the reading view starts with empty image boxes: the bytes are
 * fetched after the DOM is appended. Calling `print()` right away snapshots
 * the page before that finishes, which is why "Save as PDF" came out without
 * pictures. Lazy hints are cleared too, because a background window never
 * triggers the viewport intersection that would load them.
 * @param win - the print window.
 */
async function whenImagesReady(win: Window): Promise<void> {
  const images = [...win.document.images]
  await Promise.all(images.map(async (image) => {
    image.loading = 'eager'
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }
    try {
      await image.decode()
    } catch {
      // A broken image still prints its alt text; the job must not hang on it.
    }
  }))
  try {
    await win.document.fonts.ready
  } catch {
    // Older engines expose no font set; printing without it is fine.
  }
}

/**
 * Build the standalone HTML document for one article. The Host's PDF route
 * renders this same document, so print and export cannot drift apart.
 * @param element - the rendered note article.
 * @param title - document title.
 * @param options - page box choices.
 * @returns a complete HTML document.
 */
export function printDocumentHtml(element: HTMLElement, title: string, options: PrintOptions = {}): string {
  const copy = element.cloneNode(true) as HTMLElement
  // Buttons in the reading view are chrome, not note content.
  for (const button of [...copy.querySelectorAll('button')]) button.remove()
  const content = options.content ?? DEFAULT_PRINT_CONTENT
  const omit: readonly string[] = [
    ...(content.properties ? [] : ['.ov-properties']),
    ...(content.tags ? [] : ['.ov-tag-row']),
    ...(content.backlinks ? [] : ['.ov-doc-backlinks']),
  ]
  for (const selector of omit) {
    for (const node of [...copy.querySelectorAll(selector)]) node.remove()
  }
  const escaped = title.replace(/[&<>"]/g, (character) => {
    const map: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
    return map[character] ?? character
  })
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escaped}</title><style>${PRINT_CSS}${pageRule(options)}</style></head><body>${copy.outerHTML}</body></html>`
}

/**
 * Open the print window for one element.
 * @param element - the rendered note article.
 * @param title - document title for the print job.
 * @param options - page box the dialog chose.
 * @returns false when the browser blocked the window.
 */
export function printNote(element: HTMLElement, title: string, options: PrintOptions = {}): boolean {
  const win = window.open('', '_blank', 'width=900,height=760')
  if (win === null) return false
  const base = document.createElement('base')
  base.href = document.baseURI
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title></title><style></style></head><body></body></html>')
  win.document.title = title
  win.document.head.append(base)
  const style = win.document.createElement('style')
  style.textContent = PRINT_CSS + pageRule(options)
  win.document.head.append(style)
  const copy = element.cloneNode(true) as HTMLElement
  // Buttons in the reading view are chrome, not note content.
  for (const button of [...copy.querySelectorAll('button')]) button.remove()
  win.document.body.append(copy)
  win.document.close()
  win.focus()
  // Images arrive after the DOM does; wait for them so the PDF has pictures.
  void whenImagesReady(win).then(() => {
    win.focus()
    win.print()
  })
  return true
}

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

/**
 * Open the print window for one element.
 * @param element - the rendered note article.
 * @param title - document title for the print job.
 * @returns false when the browser blocked the window.
 */
export function printNote(element: HTMLElement, title: string): boolean {
  const win = window.open('', '_blank', 'width=900,height=760')
  if (win === null) return false
  const base = document.createElement('base')
  base.href = document.baseURI
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title></title><style></style></head><body></body></html>')
  win.document.title = title
  win.document.head.append(base)
  const style = win.document.createElement('style')
  style.textContent = PRINT_CSS
  win.document.head.append(style)
  const copy = element.cloneNode(true) as HTMLElement
  // Buttons in the reading view are chrome, not note content.
  for (const button of [...copy.querySelectorAll('button')]) button.remove()
  win.document.body.append(copy)
  win.document.close()
  win.focus()
  win.print()
  return true
}

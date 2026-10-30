/**
 * Paste and drop classification: turn clipboard text and drop payloads into
 * element specs the controller inserts, leaving vault reads and fetches to
 * the adapter. Ported from upstream `onPaste`, `onDrop` and the URL dialog.
 * @module dsh-obsidian-vault/pur-kernel/paste-drop
 */

/** What clipboard text becomes, in upstream's precedence order. */
export type PurPasteSpec =
  | { kind: 'image-url'; url: string }
  | { kind: 'fetch-url'; url: string }
  | { kind: 'note-link'; link: string; content: string; w: number; h: number }
  | { kind: 'text'; content: string; w: number; h: number; bgColor: string }
  | { kind: 'clipboard-image' }
  | { kind: 'none' }

/** What a drop payload becomes, in upstream's precedence order. */
export type PurDropSpec =
  | { kind: 'obsidian-note'; fileParam: string }
  | { kind: 'path-note'; fileName: string }
  | { kind: 'wiki-note'; linkText: string }
  | { kind: 'image-url'; url: string }
  | { kind: 'video-url'; url: string }
  | { kind: 'web-url'; url: string }
  | { kind: 'text'; text: string; w: number; h: number; bgColor: string }
  | { kind: 'none' }

/** Image URL pattern without SVG, used by paste. */
const IMAGE_URL_NO_SVG = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i

/** Image URL pattern with SVG, used by drop and the URL dialog. */
const IMAGE_URL_WITH_SVG = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i

/** Any http(s) URL. */
const ANY_URL = /^https?:\/\//i

/**
 * Classify pasted plain text like upstream `onPaste`.
 * @param text - the trimmed clipboard text.
 * @param firstItemIsImage - whether the first clipboard item carries an image.
 * @returns the spec; `clipboard-image` when the text fell through and an image item exists.
 */
export function classifyPasteText(text: string, firstItemIsImage: boolean): PurPasteSpec {
  if (IMAGE_URL_NO_SVG.test(text) || text.startsWith('data:image/')) return { kind: 'image-url', url: text }
  if (ANY_URL.test(text)) return { kind: 'fetch-url', url: text }
  if (text.startsWith('[[') && text.endsWith(']]')) {
    const filename = text.replace('[[', '').replace(']]', '').trim()
    return { kind: 'note-link', link: filename, content: filename, w: 220, h: 80 }
  }
  if (!firstItemIsImage) {
    return { kind: 'text', content: text, w: 250, h: Math.max(60, text.split('\n').length * 22 + 20), bgColor: 'rgba(45,45,45,0.8)' }
  }
  return { kind: 'clipboard-image' }
}

/**
 * Classify the URL dialog's committed text: image, fetched page, or plain
 * text with the drop text sizing.
 * @param value - the trimmed dialog text.
 * @returns the spec.
 */
export function classifyUrlInput(value: string): PurDropSpec {
  if (IMAGE_URL_WITH_SVG.test(value) || value.startsWith('data:image/')) return { kind: 'image-url', url: value }
  if (ANY_URL.test(value)) return { kind: 'web-url', url: value }
  return { kind: 'text', text: value, w: 200, h: Math.max(60, value.split('\n').length * 20 + 20), bgColor: 'rgba(45, 45, 45, 0.8)' }
}

/**
 * The text sizing upstream applies to a dropped plain-text payload.
 * @param text - the dropped text.
 * @returns the text spec.
 */
export function droppedTextSpec(text: string): { w: number; h: number; bgColor: string } {
  return { w: 200, h: Math.max(60, text.split('\n').length * 20 + 20), bgColor: 'rgba(45,45,45,0.8)' }
}

/**
 * The text sizing upstream applies to a dropped text file's content.
 * @param text - the file content.
 * @returns the text spec.
 */
export function droppedFileTextSpec(text: string): { w: number; h: number; bgColor: string } {
  return { w: 480, h: Math.min(400, Math.max(80, text.split('\n').length * 22 + 20)), bgColor: 'rgba(35,35,40,0.85)' }
}

/**
 * Pull an image URL out of dropped HTML, upstream's `<img src>` extraction.
 * @param html - the `text/html` payload.
 * @returns the image URL, or null.
 */
export function imageUrlFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src="?([^"\s]+)"?\s*/i)
  const url = match?.[1]
  return url !== undefined && url !== '' ? url.replace(/&amp;/g, '&') : null
}

/**
 * Classify a drop payload after any files were handled, like upstream
 * `onDrop`: Obsidian URIs, note paths, wikilinks, image URLs, web URLs, then
 * plain text.
 * @param payload - the drop's string data.
 * @param isVideoUrl - adapter's video-URL test, checked before web links.
 * @returns the spec.
 */
export function classifyDropText(payload: { uriList: string; html: string; plainText: string }, isVideoUrl: (url: string) => boolean): PurDropSpec {
  let targetUrl = ''
  if (payload.html !== '') {
    const url = imageUrlFromHtml(payload.html)
    if (url !== null) targetUrl = url
  }
  if (targetUrl === '' && payload.uriList !== '') targetUrl = (payload.uriList.split('\n')[0] ?? '').trim()
  const rawText = payload.plainText.trim()
  const fallback = targetUrl !== '' ? targetUrl : rawText
  if (fallback === '') return { kind: 'none' }

  let decoded = fallback
  try {
    decoded = decodeURIComponent(fallback)
  } catch {
    // Upstream logs and continues with the raw string when decoding fails.
  }

  if (decoded.startsWith('obsidian://')) {
    const fileParam = new URL(decoded).searchParams.get('file')
    if (fileParam !== null) return { kind: 'obsidian-note', fileParam }
    return { kind: 'none' }
  }
  if (/\.(md|PurStudio)$/i.test(decoded)) {
    const parts = decoded.split(/[\\/]/)
    const fileName = (parts[parts.length - 1] ?? '').replace(/\.(md|PurStudio)$/i, '').trim()
    return { kind: 'path-note', fileName }
  }
  if (rawText.startsWith('[[') && rawText.endsWith(']]')) {
    return { kind: 'wiki-note', linkText: rawText.replace('[[', '').replace(']]', '').trim() }
  }
  if (IMAGE_URL_WITH_SVG.test(fallback) || fallback.startsWith('data:image/')) return { kind: 'image-url', url: fallback }
  if (ANY_URL.test(fallback)) {
    if (isVideoUrl(fallback)) return { kind: 'video-url', url: fallback }
    return { kind: 'web-url', url: fallback }
  }
  if (rawText !== '') return { kind: 'text', text: rawText, ...droppedTextSpec(rawText) }
  return { kind: 'none' }
}

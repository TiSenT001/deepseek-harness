/**
 * Client side of the Host PDF export: post the same document the print window
 * would show and save the returned bytes as a file. Falls back to the caller
 * when the Host cannot render PDFs, so print still works on such installs.
 * @module dsh-obsidian-vault/client/pdf-export
 */
import { API_BASE } from '../protocol.ts'
import { ApiError } from './api-core.ts'
import { printDocumentHtml, type PrintOptions } from './ui/printNote.ts'

/**
 * Render one article to PDF through the Host and download it.
 * @param element - the rendered note article.
 * @param title - document title; also the download file name stem.
 * @param options - page box choices.
 * @throws ApiError when the Host has no PDF renderer or rendering fails.
 */
export async function exportPdf(element: HTMLElement, title: string, options: PrintOptions = {}): Promise<void> {
  const html = printDocumentHtml(element, title, options)
  const response = await fetch(`${API_BASE}/pdf`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/pdf' },
    credentials: 'same-origin',
    body: JSON.stringify({ html, filename: title, ...options }),
  })
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}))
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as { error: unknown }).error)
      : `HTTP ${response.status}`
    throw new ApiError(message, response.status)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[\\/:*?"<>|]/g, '-')}.pdf`
  document.body.append(link)
  link.click()
  link.remove()
  // The browser keeps the blob alive until the download starts.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

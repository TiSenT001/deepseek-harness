/**
 * Render ```mermaid fences in the reading view. The Mermaid library is a
 * separate script served by the host and loaded only when a note has a diagram.
 * @module dsh-obsidian-vault/client/ui/note/enhanceMermaid
 */
import { API_BASE } from '../../../protocol.ts'

/** Renderer the standalone Mermaid bundle installs on `window`. */
interface MermaidRenderer {
  render(id: string, text: string): Promise<{ readonly svg: string }>
}

declare global {
  interface Window {
    __OV_MERMAID__?: MermaidRenderer
  }
}

/** Loaded renderer, or the script load in flight. */
let loading: Promise<MermaidRenderer | null> | null = null

/** Rendered SVG markup keyed by fence source. */
const rendered = new Map<string, string>()

/** Monotonic id source for Mermaid's temporary render elements. */
let nextId = 1

/**
 * Whether a code block declares the Mermaid language.
 * @param code - the `code` element inside a `pre`.
 * @returns true for `language-mermaid` or `lang-mermaid`.
 */
export function isMermaidFence(code: HTMLElement): boolean {
  return /(?:^|\s)(?:language|lang)-mermaid(?:\s|$)/.test(code.className)
}

/**
 * Load the standalone Mermaid script once.
 * @returns the renderer, or null when the script failed to load.
 */
async function mermaidApi(): Promise<MermaidRenderer | null> {
  if (loading === null) {
    loading = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = `${API_BASE}/mermaid.js`
      script.async = true
      script.onload = () => resolve(window.__OV_MERMAID__ ?? null)
      script.onerror = () => resolve(null)
      document.head.append(script)
    })
  }
  return loading
}

/**
 * Replace one fenced block with its diagram, or a source fallback on failure.
 * @param pre - the code block wrapper.
 * @param code - the Mermaid source holder.
 * @param failedLabel - copy shown when rendering fails.
 */
async function renderFence(target: HTMLElement, code: HTMLElement, failedLabel: string): Promise<void> {
  if (target.dataset['mermaidState'] !== undefined) return
  target.dataset['mermaidState'] = 'pending'
  const source = code.textContent ?? ''
  const host = document.createElement('div')
  host.className = 'ov-mermaid'
  host.setAttribute('data-mermaid', 'true')
  const api = await mermaidApi()
  if (api === null || source.trim().length === 0) {
    target.dataset['mermaidState'] = 'failed'
    host.classList.add('ov-mermaid-failed')
    host.textContent = `${failedLabel}\n${source}`
    target.replaceWith(host)
    return
  }
  let svg = rendered.get(source)
  if (svg === undefined) {
    try {
      const result = await api.render(`ov-mermaid-${nextId++}`, source)
      svg = result.svg
      rendered.set(source, svg)
    } catch {
      target.dataset['mermaidState'] = 'failed'
      host.classList.add('ov-mermaid-failed')
      host.textContent = `${failedLabel}\n${source}`
      if (target.isConnected) target.replaceWith(host)
      return
    }
  }
  target.dataset['mermaidState'] = 'done'
  host.innerHTML = svg
  if (target.isConnected) target.replaceWith(host)
}

/**
 * Render every Mermaid fence inside one reading-view container.
 * @param container - the rendered note body.
 * @param failedLabel - copy shown when a diagram cannot render.
 */
export function enhanceMermaid(container: HTMLElement | null, failedLabel: string): void {
  if (container === null) return
  for (const block of container.querySelectorAll<HTMLElement>('.md-code-block')) {
    const banner = block.querySelector('[data-code-block-banner]')?.textContent?.trim() ?? ''
    if (!banner.startsWith('mermaid')) continue
    const code = block.querySelector('pre > code')
    if (code instanceof HTMLElement) void renderFence(block, code, failedLabel)
  }
  for (const code of container.querySelectorAll<HTMLElement>('pre > code')) {
    if (!isMermaidFence(code)) continue
    const pre = code.parentElement
    if (pre instanceof HTMLPreElement) void renderFence(pre, code, failedLabel)
  }
}

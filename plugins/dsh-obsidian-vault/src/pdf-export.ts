/**
 * Server-side PDF rendering for the export action. The Host prints the same
 * standalone HTML the print window shows through a headless Chromium, so the
 * file carries real text, the note's fonts, and every embedded image.
 *
 * Chromium is optional: it comes from the workspace's `playwright` development
 * dependency, resolved at runtime. An install without it answers 501 and the
 * browser's own print dialog stays the export path, so the plugin never breaks
 * over a missing renderer.
 * @module dsh-obsidian-vault/pdf-export
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** Page box the dialog chose. */
export interface PdfOptions {
  readonly paper?: string
  readonly orientation?: 'portrait' | 'landscape'
  readonly margins?: 'default' | 'narrow' | 'none'
}

/** Lower-level shapes of the few Playwright members this module touches. */
interface PdfPage {
  setContent(html: string, options: { waitUntil: 'load' }): Promise<void>
  evaluate(script: () => Promise<unknown>): Promise<unknown>
  pdf(options: {
    format: string
    landscape: boolean
    printBackground: boolean
    margin: { top: string; bottom: string; left: string; right: string }
  }): Promise<Uint8Array>
}

interface BrowserContext {
  addCookies(cookies: readonly { name: string; value: string; url: string }[]): Promise<void>
  newPage(): Promise<PdfPage>
  close(): Promise<void>
}

interface Browser {
  newContext(options: { viewport: { width: number; height: number } }): Promise<BrowserContext>
  close(): Promise<void>
}

interface Launcher {
  launch(options: { args: readonly string[] }): Promise<Browser>
}

/** Margin presets in millimetres. */
const MARGIN_MM: Readonly<Record<string, string>> = { default: '14mm', narrow: '6mm', none: '0' }

/** Bases to resolve Playwright from: the plugin, then the workspace root. */
function resolutionBases(): readonly string[] {
  const here = dirname(fileURLToPath(import.meta.url))
  // `lib/` and `src/` both sit one directory below the package root; three
  // levels up is the workspace root holding `apps/web`.
  const root = join(here, '..', '..', '..')
  return [join(here, 'package.json'), join(root, 'package.json'), join(root, 'apps', 'web', 'package.json')]
}

/**
 * Resolve the Playwright launcher, tolerating its absence.
 * @returns the Chromium launcher, or undefined when the package is not installed.
 */
async function loadChromium(): Promise<Launcher | undefined> {
  for (const base of resolutionBases()) {
    try {
      const require = createRequire(base)
      const entry = require.resolve('playwright')
      // Playwright is CommonJS: the launcher sits on the namespace or its
      // default export depending on the interop the engine applies.
      const module = await import(pathToFileURL(entry).href) as {
        readonly chromium?: Launcher
        readonly default?: { readonly chromium?: Launcher }
      }
      const launcher = module.chromium ?? module.default?.chromium
      if (launcher !== undefined) return launcher
    } catch {
      // Not resolvable from this base; the next candidate may be.
    }
  }
  return undefined
}

/**
 * Split a Cookie header into Playwright cookies for one origin.
 * @param header - raw `Cookie` header.
 * @param url - origin the renderer loads images from.
 * @returns cookie descriptors; empty when the header is absent.
 */
function cookiesOf(header: string | undefined, url: string): readonly { name: string; value: string; url: string }[] {
  if (header === undefined || header.length === 0) return []
  const cookies: { name: string; value: string; url: string }[] = []
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator <= 0) continue
    cookies.push({ name: part.slice(0, separator).trim(), value: part.slice(separator + 1).trim(), url })
  }
  return cookies
}

/** Wait until every image in the rendered page has finished loading. */
async function waitForImages(page: PdfPage): Promise<void> {
  await page.evaluate(() => Promise.all([...document.images].map(image => (image.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => resolve(), { once: true })
    })))))
}

/**
 * Render one standalone HTML document to PDF bytes.
 * @param html - complete HTML document, already carrying the print styles.
 * @param cookie - the caller's `Cookie` header, passed to the renderer so the
 *   embedded images pass the same trust gate the browser does.
 * @param origin - origin of the running Web server, used as the cookie URL.
 * @param options - page box choices.
 * @returns the PDF bytes, or undefined when no renderer is available.
 */
export async function renderPdf(
  html: string,
  cookie: string | undefined,
  origin: string,
  options: PdfOptions = {},
): Promise<Buffer | undefined> {
  const chromium = await loadChromium()
  if (chromium === undefined) return undefined
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    try {
      const cookies = cookiesOf(cookie, origin)
      if (cookies.length > 0) await context.addCookies(cookies)
      const page = await context.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      await waitForImages(page)
      const margins = MARGIN_MM[options.margins ?? 'default'] ?? MARGIN_MM['default'] ?? '14mm'
      const pdf = await page.pdf({
        format: options.paper ?? 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: { top: margins, bottom: margins, left: margins, right: margins },
      })
      return Buffer.from(pdf)
    } finally {
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

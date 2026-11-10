/**
 * Obsidian syntax to standard Markdown: wikilinks, embeds, and the sentinel
 * URLs the reading view intercepts. Pure functions over the shared scanner.
 * @module dsh-obsidian-vault/client/markdown/rewrite
 */
import { API_BASE, type LinkStatus } from '../../protocol.ts'
import { replaceWikiLinks, tagSpans } from '../../vault/syntax.ts'
import { mediaKindOf, mediaNameOf } from './media.ts'

/** Origin reserved for in-page navigation; never resolved by the browser. */
export const SENTINEL = 'https://dsh-obsidian.invalid'

const IMAGE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i

/** Alt marker prefix the reading view turns into `width`/`height` attributes. */
export const SIZE_MARK = '\uE000'

/** An authored `|300` / `|300x200` tail, split at the last pipe like Obsidian. */
const EMBED_SIZE = /(?:^|\|)\s*(\d+)\s*(?:x\s*(\d+)\s*)?$/

/** Resolution result the rewrite step needs for one authored target. */
export interface LinkResolution {
  readonly status: LinkStatus
  readonly path?: string
  readonly candidates?: readonly string[]
}

/** Everything the rewrite needs beyond the source text. */
export interface RewriteContext {
  /** The note being rendered; a same-file `[[#Heading]]` navigates here. */
  readonly selfPath: string
  resolve(target: string): LinkResolution
  /** Raw content of transcluded notes, keyed by vault path. */
  readonly embeds?: ReadonlyMap<string, string>
  openUrl(path: string, options?: { readonly anchor?: string; readonly ambiguous?: boolean }): string
  newUrl(target: string): string
  assetUrl(path: string): string
  /** Resolves a `https://pur.studio/<canvas>/<file>` image; hosts without it keep the URL. */
  readonly purImageUrl?: (canvas: string, file: string) => string
}

/** Build the sentinel URL that opens one note. */
export function openUrlFor(
  path: string,
  options: { readonly anchor?: string; readonly ambiguous?: boolean } = {},
): string {
  const url = new URL('/open', SENTINEL)
  url.searchParams.set('p', path)
  if (options.anchor !== undefined && options.anchor.length > 0) url.searchParams.set('h', options.anchor)
  if (options.ambiguous === true) url.searchParams.set('a', '1')
  return url.toString()
}

/** Build the sentinel URL that creates a note on click. */
export function newUrlFor(target: string): string {
  const url = new URL('/new', SENTINEL)
  url.searchParams.set('t', target)
  return url.toString()
}

/** Build the asset URL for one vault attachment. */
export function assetUrlFor(path: string): string {
  const relative = `${API_BASE}/asset?path=${encodeURIComponent(path)}`
  // The shared Markdown renderer only paints absolute http(s) image sources.
  return typeof location === 'undefined' ? relative : new URL(relative, location.origin).href
}

/**
 * Build the URL that resolves one `pur.studio` image reference through the
 * canvas document instead of the network.
 * @param canvas - canvas name from the reference.
 * @param file - image file name from the reference.
 * @returns the absolute URL the renderer should load.
 */
export function purImageUrlFor(canvas: string, file: string): string {
  const relative = `${API_BASE}/pur/image?canvas=${encodeURIComponent(canvas)}&file=${encodeURIComponent(file)}`
  return typeof location === 'undefined' ? relative : new URL(relative, location.origin).href
}

/** What a sentinel click asked for. */
export type SentinelAction =
  | { readonly kind: 'open'; readonly path: string; readonly anchor?: string; readonly ambiguous: boolean }
  | { readonly kind: 'new'; readonly target: string }
  | { readonly kind: 'tag'; readonly tag: string }
  | { readonly kind: 'none' }

/**
 * Decode a clicked href.
 * @param href - destination handed to the Markdown delegate.
 */
export function parseSentinel(href: string): SentinelAction {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { kind: 'none' }
  }
  if (url.hostname !== 'dsh-obsidian.invalid') return { kind: 'none' }
  if (url.pathname === '/open') {
    const path = url.searchParams.get('p')
    if (path === null || path.length === 0) return { kind: 'none' }
    const anchor = url.searchParams.get('h')
    return {
      kind: 'open',
      path,
      ...(anchor === null || anchor.length === 0 ? {} : { anchor }),
      ambiguous: url.searchParams.get('a') === '1',
    }
  }
  if (url.pathname === '/new') {
    const target = url.searchParams.get('t')
    if (target === null || target.length === 0) return { kind: 'none' }
    return { kind: 'new', target }
  }
  if (url.pathname === '/tag') {
    const tag = url.searchParams.get('t')
    if (tag === null || tag.length === 0) return { kind: 'none' }
    return { kind: 'tag', tag }
  }
  return { kind: 'none' }
}

/** Build the sentinel URL that filters by one tag. */
export function tagUrlFor(tag: string): string {
  const url = new URL('/tag', SENTINEL)
  url.searchParams.set('t', tag)
  return url.toString()
}

/**
 * Turn inline `#tags` into sentinel links, leaving code and wikilinks alone.
 * @param source - markdown source with wikilinks already rewritten.
 * @param tagUrl - URL builder for one tag.
 * @returns the rewritten source.
 */
export function rewriteTags(source: string, tagUrl: (tag: string) => string): string {
  const lines = source.split(/\r?\n/)
  let fence: string | null = null
  const out: string[] = []
  for (const line of lines) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fence !== null) {
      out.push(line)
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]
        && fenceMatch[1]!.length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      out.push(line)
      continue
    }
    const spans = tagSpans(line)
    if (spans.length === 0) {
      out.push(line)
      continue
    }
    let next = ''
    let cursor = 0
    for (const span of spans) {
      next += line.slice(cursor, span.start)
      next += `[#${span.tag}](${tagUrl(span.tag)})`
      cursor = span.end
    }
    out.push(next + line.slice(cursor))
  }
  return out.join('\n')
}

/**
 * Rewrite one note body for the GFM renderer.
 * @param source - note body without frontmatter.
 * @param context - resolution, transclusion content, and URL builders.
 * @returns markdown with every wikilink replaced.
 */
export function rewriteMarkdown(source: string, context: RewriteContext): string {
  return rewritePurImages(replaceWikiLinks(source, token => {
    const resolution = context.resolve(token.target)
    const label = escapeLabel(token.alias ?? (token.target.length > 0 ? token.target : token.anchor ?? ''))
    // `[[note#^id]]` carries the id in `block`; both anchors navigate the same way.
    const anchor = token.anchor ?? (token.block === undefined ? undefined : `^${token.block}`)
    if (token.embed) {
      const path = resolution.status === 'resolved' ? resolution.path : undefined
      if (path !== undefined && IMAGE.test(path)) return image(context.assetUrl(path), token.alias)
      if (path !== undefined && mediaKindOf(path) !== undefined) {
        return mediaLink(path, token.alias, context.assetUrl(path))
      }
      // A heading-scoped embed (`![[note#Heading]]`) uses the pre-sliced section.
      const section = path === undefined || anchor === undefined
        ? undefined
        : context.embeds?.get(`${path}#${anchor}`)
      const embedded = section ?? (path === undefined ? undefined : context.embeds?.get(path))
      if (embedded !== undefined) return transclude(label, embedded)
    }
    if (resolution.status === 'resolved' && resolution.path !== undefined) {
      return `[${label}](${context.openUrl(resolution.path, anchor === undefined ? {} : { anchor })})`
    }
    if (resolution.status === 'ambiguous') {
      const first = resolution.candidates?.[0]
      if (first !== undefined) {
        return `[${label}](${context.openUrl(first, { ...(anchor === undefined ? {} : { anchor }), ambiguous: true })})`
      }
    }
    if (token.target.length === 0) {
      return `[${label}](${context.openUrl(context.selfPath, anchor === undefined ? {} : { anchor })})`
    }
    return `[${label}](${context.newUrl(token.target)})`
  }), context)
}

/** `![alt](https://pur.studio/<canvas>/<file>)`, the reference the exporter writes. */
const PUR_IMAGE = /(!\[[^\]]*\]\()https:\/\/pur\.studio\/([^/)\s]+)\/([^)\s]+)(\))/g

/** Folder the embed and export commands name in their references. */
const CANVAS_DIR = 'Pur画布'

/**
 * Point `pur.studio` image references at the canvas document, so an exported
 * outline paints the picture instead of requesting a domain that does not serve
 * it, and wrap each one in a link back to its canvas. Hosts without a resolver
 * keep the authored URL.
 */
function rewritePurImages(markdown: string, context: RewriteContext): string {
  const build = context.purImageUrl
  if (build === undefined) return markdown
  return markdown.replace(PUR_IMAGE, (_match, head: string, canvas: string, file: string, tail: string) => {
    const name = safeDecode(canvas)
    const src = `${head}${build(name, safeDecode(file))}${tail}`
    return `[${src}](${context.openUrl(`${CANVAS_DIR}/${name}.PurStudio`)})`
  })
}

/** Decode one URL segment, leaving a malformed escape as authored. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function transclude(label: string, content: string): string {
  const lines = content.split('\n').map(line => `> ${line}`)
  return `\n\n> **${label}**\n>\n${lines.join('\n')}\n\n`
}

/** Render one image embed; the authored size rides the alt as a SIZE_MARK tail. */
function image(url: string, alias: string | undefined): string {
  const text = alias ?? ''
  const size = EMBED_SIZE.exec(text)
  const alt = escapeLabel(size === null ? text : text.slice(0, size.index).trim())
  const mark = size === null
    ? ''
    : `${SIZE_MARK}${size[1]!}${size[2] === undefined || size[2] === '0' ? '' : `x${size[2]}`}`
  const label = mark.length === 0 ? alt : alt.length === 0 ? mark : `${alt} ${mark}`
  return `![${label}](${url})`
}

/** Render one PDF/audio/video embed as a media link the reading view upgrades. */
function mediaLink(path: string, alias: string | undefined, url: string): string {
  const name = mediaNameOf(path)
  const text = alias ?? name
  const size = EMBED_SIZE.exec(text)
  const base = escapeLabel((size === null ? text : text.slice(0, size.index).trim()) || name)
  const mark = size === null
    ? ''
    : `${SIZE_MARK}${size[1]!}${size[2] === undefined || size[2] === '0' ? '' : `x${size[2]}`}`
  return `[${base}${mark.length === 0 ? '' : ` ${mark}`}](${url})`
}

function escapeLabel(label: string): string {
  return label.replace(/([[\]])/g, '\\$1')
}

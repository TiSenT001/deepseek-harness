/**
 * Reading view: note header, properties, tags, callouts, and the rewritten
 * Markdown document. Wikilinks, tags, embeds, and creation links all resolve
 * here, and a hovered note link shows a small preview card.
 * @module dsh-obsidian-vault/client/ui/NoteView
 */
import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import { fetchNote } from '../api.ts'
import type { Translate } from '../i18n.ts'
import { annotateBlocks, annotateImages, findBlock, sliceBlock, sliceSection } from '../markdown/blocks.ts'
import { splitCallouts, type CalloutSegment } from '../markdown/callouts.ts'
import { splitHighlights, stripComments } from '../markdown/inline.ts'
import {
  assetUrlFor, newUrlFor, openUrlFor, parseSentinel, rewriteMarkdown, rewriteTags, tagUrlFor,
} from '../markdown/rewrite.ts'
import { MarkdownDelegateProvider, MarkdownText, type MarkdownLabels } from '../primitives.ts'
import { HoverPreviewCard } from './HoverPreviewCard.tsx'
import { NoteHeader } from './note/NoteHeader.tsx'
import { NoteMeta } from './note/NoteMeta.tsx'
import { highlightDocument } from './files/highlight.ts'
import type { MenuScene } from './menu/registry.ts'
import { useHoverPreview } from './useHoverPreview.ts'
import { headingAnchor } from '../../vault/syntax.ts'
import { Callout } from './Callout.tsx'
import { css } from './theme.ts'

/** A ref object without depending on a specific React typings generation. */
export interface ElementRef<T> {
  readonly current: T | null
}

/** Props for {@link NoteView}. */
export interface NoteViewProps {
  readonly t: Translate
  readonly labels: MarkdownLabels
  readonly note: NoteDto
  readonly scrollRef: ElementRef<HTMLDivElement>
  /** Heading text the navigation asked to reveal, when the link carried one. */
  readonly anchor?: string
  readonly onOpen: (path: string, anchor?: string) => void
  readonly onCreate: (target: string) => void
  readonly onTag: (tag: string) => void
  /** Filter the explorer to one folder when a breadcrumb segment is clicked. */
  readonly onPathFilter: (prefix: string) => void
  /** Backlinks listed below the document. */
  readonly backlinks?: readonly BacklinkDto[]
  /** Ask the page to open the shared context menu for the reading view. */
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  /** Switch the same Markdown file to its source view. */
  readonly onSource?: () => void
}

type Rendered =
  | { readonly kind: 'markdown'; readonly text: string }
  | { readonly kind: 'callout'; readonly segment: CalloutSegment; readonly children: readonly Rendered[] }

const EMBED_LIMIT = 6
const IMAGE_EMBED = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i

/**
 * Render one note.
 * @param props - the note, its labels, and navigation callbacks.
 */
export function NoteView({
  t, labels, note, scrollRef, anchor, onOpen, onCreate, onTag, onPathFilter, backlinks = [],
  onMenu, onSource,
}: NoteViewProps): JSX.Element {
  const [embeds, setEmbeds] = useState<ReadonlyMap<string, string>>(new Map())
  const bodyRef = useRef<HTMLDivElement>(null)
  const { preview, show: showPreview, hide: hidePreview } = useHoverPreview()

  useEffect(() => {
    const requests = note.links
      // Image embeds render from the asset route; only note embeds get prefetched.
      .filter(link => link.embed && link.status === 'resolved' && typeof link.path === 'string' && !IMAGE_EMBED.test(link.path))
      .map(link => ({
        path: link.path as string,
        // `![[note#^id]]` puts the id in `block`; both anchors slice the same way.
        anchor: link.anchor ?? (link.block === undefined ? undefined : `^${link.block}`),
      }))
    const paths = [...new Set(requests.map(request => request.path))].slice(0, EMBED_LIMIT)
    if (paths.length === 0) {
      setEmbeds(new Map())
      return
    }
    let cancelled = false
    void Promise.all(paths.map(path => fetchNote(path).catch(() => undefined)))
      .then((docs) => {
        if (cancelled) return
        const next = new Map<string, string>()
        for (const doc of docs) {
          if (doc === undefined) continue
          next.set(doc.path, doc.content)
          for (const request of requests) {
            if (request.path !== doc.path || request.anchor === undefined) continue
            const section = request.anchor.startsWith('^')
              ? sliceBlock(doc, request.anchor.slice(1))
              : sliceSection(doc, request.anchor)
            if (section !== undefined) next.set(`${doc.path}#${request.anchor}`, section)
          }
        }
        setEmbeds(next)
      })
    return () => {
      cancelled = true
    }
  }, [note])

  const rendered = useMemo<Rendered[]>(() => {
    const context = {
      selfPath: note.path,
      resolve: (target: string) => {
        const needle = target.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.md$/i, '').toLowerCase()
        const link = note.links.find(candidate => candidate.target.toLowerCase() === needle)
        if (link === undefined) return { status: 'unresolved' as const }
        return {
          status: link.status,
          ...(link.path === undefined ? {} : { path: link.path }),
          ...(link.candidates === undefined ? {} : { candidates: link.candidates }),
        }
      },
      embeds,
      openUrl: openUrlFor,
      newUrl: newUrlFor,
      assetUrl: assetUrlFor,
    }
    const convert = (text: string): string => rewriteMarkdown(rewriteTags(stripComments(text), tagUrlFor), context)
    // Nested callouts lose one `>` level per split, so each level re-splits its body.
    const segments = (source: string): Rendered[] => splitCallouts(source).map(segment => segment.kind === 'markdown'
      ? { kind: 'markdown' as const, text: convert(segment.text) }
      : { kind: 'callout' as const, segment, children: segments(segment.body) })
    return segments(note.content)
  }, [note, embeds])

  useEffect(() => {
    const container = bodyRef.current
    if (container === null) return
    for (const link of container.querySelectorAll('a[href^="https://dsh-obsidian.invalid/"]')) {
      const action = parseSentinel(link.getAttribute('href') ?? '')
      if (action.kind === 'new') {
        link.classList.add(css.unresolved)
        link.setAttribute('title', t('unresolved'))
      } else if (action.kind === 'open' && action.ambiguous) {
        link.classList.add(css.ambiguous)
        link.setAttribute('title', t('ambiguous'))
      }
    }
  }, [rendered, t])

  useEffect(() => {
    enhanceHighlights(bodyRef.current)
    if (bodyRef.current !== null) {
      annotateBlocks(bodyRef.current)
      annotateImages(bodyRef.current)
    }
    highlightDocument(bodyRef.current)
  }, [rendered])

  useEffect(() => {
    if (anchor === undefined) return
    const container = bodyRef.current
    if (container === null) return
    if (anchor.startsWith('^')) {
      const block = findBlock(container, anchor.slice(1))
      if (block !== undefined) {
        block.scrollIntoView({ block: 'center', behavior: 'smooth' })
        block.classList.add(css.flash)
        window.setTimeout(() => block.classList.remove(css.flash), 1600)
        return
      }
    }
    const wanted = headingAnchor(anchor)
    for (const heading of container.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      if (headingAnchor(heading.textContent ?? '') === wanted) {
        heading.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
    }
  }, [anchor, rendered])

  return (
    <article className={css.note}>
      <NoteHeader
        t={t}
        note={note}
        onPathFilter={onPathFilter}
        {...(onSource === undefined ? {} : { onSource })}
      />
      <div className={css.scroll} ref={scrollRef as unknown as Ref<HTMLDivElement>}>
        <div
          ref={bodyRef}
          className={css.document}
          onMouseOver={(event) => {
            const anchorElement = (event.target as HTMLElement | null)?.closest?.('a[href^="https://dsh-obsidian.invalid/open"]')
            if (!(anchorElement instanceof HTMLElement)) {
              hidePreview()
              return
            }
            const action = parseSentinel(anchorElement.getAttribute('href') ?? '')
            if (action.kind !== 'open' || action.path === note.path) return
            showPreview(action.path, event.clientX, event.clientY)
          }}
          onMouseLeave={hidePreview}
          onContextMenu={(event) => {
            event.preventDefault()
            const selection = window.getSelection()?.toString() ?? ''
            onMenu({ kind: 'editor', path: note.path, selection }, event.clientX, event.clientY)
          }}
        >
          <NoteMeta t={t} note={note} onTag={onTag} />
          <MarkdownDelegateProvider
            openExternalLink={(href) => {
              const action = parseSentinel(href)
              if (action.kind === 'open') onOpen(action.path, action.anchor)
              else if (action.kind === 'new') onCreate(action.target)
              else if (action.kind === 'tag') onTag(action.tag)
              else if (/^https?:/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
            }}
          >
            <Segments items={rendered} labels={labels} prefix="" />
          </MarkdownDelegateProvider>
          {backlinks.length === 0
            ? null
            : (
              <section className={css.docBacklinks}>
                <div className={css.docBacklinksTitle}>{t('backlinks')} · {backlinks.length}</div>
                {backlinks.map(link => (
                  <button
                    key={`${link.path}:${link.line}`}
                    type="button"
                    className={css.docBacklinkRow}
                    onClick={() => onOpen(link.path)}
                  >
                    <span className={css.docBacklinkTitle}>{link.title}</span>
                    <span className={css.docBacklinkContext}>{link.context}</span>
                  </button>
                ))}
              </section>
            )}
        </div>
      </div>
      <HoverPreviewCard preview={preview} />
    </article>
  )
}

/** Render one segment list, recursing into nested callout bodies. */
function Segments({
  items, labels, prefix,
}: { readonly items: readonly Rendered[]; readonly labels: MarkdownLabels; readonly prefix: string }): JSX.Element {
  return (
    <>
      {items.map((item, index) => (item.kind === 'markdown'
        ? <MarkdownText key={`${prefix}${index}`} text={item.text} labels={labels} />
        : (
          <Callout
            key={`${prefix}${index}`}
            type={item.segment.type}
            title={item.segment.title}
            foldable={item.segment.foldable}
            folded={item.segment.folded}
          >
            <Segments items={item.children} labels={labels} prefix={`${prefix}${index}.`} />
          </Callout>
        )))}
    </>
  )
}

/** Wrap `==marked==` runs in this document in `<mark>`, leaving code alone. */
function enhanceHighlights(container: HTMLElement | null): void {
  if (container === null) return
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const targets: Text[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    if (!text.data.includes('==')) continue
    const parent = text.parentElement
    if (parent === null || parent.closest('code, pre')) continue
    targets.push(text)
  }
  for (const text of targets) {
    const runs = splitHighlights(text.data)
    if (!runs.some(run => run.highlight)) continue
    const fragment = document.createDocumentFragment()
    for (const run of runs) {
      if (!run.highlight) {
        fragment.append(document.createTextNode(run.text))
        continue
      }
      const mark = document.createElement('mark')
      mark.className = css.highlight
      mark.textContent = run.text
      fragment.append(mark)
    }
    text.replaceWith(fragment)
  }
}

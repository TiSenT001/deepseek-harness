/**
 * Turn media embeds into real players: the Markdown renderer only paints links,
 * so the reading view replaces each PDF/audio/video link with an iframe or a
 * native player after rendering.
 * @module dsh-obsidian-vault/client/ui/note/enhanceMedia
 */
import { mediaKindOf, mediaNameOf } from '../../markdown/media.ts'
import { SIZE_MARK } from '../../markdown/rewrite.ts'

/** Localized caption for the "open original" link. */
export interface MediaLabels {
  readonly open: string
}

const SIZE = new RegExp(`${SIZE_MARK}(\\d+)(?:x(\\d+))?`)
const ASSET = '/obsidian/api/asset?'

/**
 * Upgrade every media link inside a rendered note.
 * @param container - rendered note body.
 * @param labels - localized copy for the caption link.
 */
export function enhanceMediaEmbeds(container: HTMLElement | null, labels: MediaLabels): void {
  if (container === null) return
  for (const anchor of [...container.querySelectorAll<HTMLAnchorElement>(`a[href*="${ASSET}"]:not(.ov-media-open)`)]) {
    if (anchor.dataset.mediaReady === '1') continue
    if (anchor.closest('.ov-media-embed') !== null) continue
    let path = ''
    try {
      path = new URL(anchor.getAttribute('href') ?? '', window.location.origin).searchParams.get('path') ?? ''
    } catch {
      continue
    }
    const kind = mediaKindOf(path)
    if (kind === undefined) continue
    const size = SIZE.exec(anchor.textContent ?? '')
    const width = size === null ? 0 : Number(size[1])
    anchor.dataset.mediaReady = '1'
    const href = anchor.getAttribute('href') ?? ''
    const name = mediaNameOf(path)

    const figure = document.createElement('figure')
    figure.className = 'ov-media-embed'
    figure.dataset.mediaKind = kind
    if (Number.isFinite(width) && width > 0) figure.style.width = `${width}px`

    let media: HTMLElement
    if (kind === 'pdf') {
      const frame = document.createElement('iframe')
      frame.className = 'ov-media-frame'
      frame.src = href
      frame.title = name
      frame.loading = 'lazy'
      media = frame
    } else if (kind === 'audio') {
      const audio = document.createElement('audio')
      audio.className = 'ov-media-audio'
      audio.controls = true
      audio.preload = 'metadata'
      audio.src = href
      media = audio
    } else {
      const video = document.createElement('video')
      video.className = 'ov-media-video'
      video.controls = true
      video.preload = 'metadata'
      video.src = href
      media = video
    }
    figure.append(media)

    const caption = document.createElement('figcaption')
    caption.className = 'ov-media-caption'
    const open = document.createElement('a')
    open.className = 'ov-media-open'
    open.dataset.mediaReady = '1'
    open.href = href
    open.target = '_blank'
    open.rel = 'noreferrer'
    open.textContent = labels.open
    caption.append(open)
    figure.append(caption)
    anchor.replaceWith(figure)
  }
}

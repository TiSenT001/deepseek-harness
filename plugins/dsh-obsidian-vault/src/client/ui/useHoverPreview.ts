/**
 * Hover preview state for note links: debounced lookup, per-path cache, and the
 * card coordinates.
 * @module dsh-obsidian-vault/client/ui/useHoverPreview
 */
import { useEffect, useRef, useState } from 'react'
import { fetchNote } from '../api.ts'

/** One preview card and where it sits. */
export interface PreviewCard {
  readonly x: number
  readonly y: number
  readonly title: string
  readonly excerpt: string
}

const PREVIEW_DELAY_MS = 180

/** Hover preview controls returned by {@link useHoverPreview}. */
export interface HoverPreviewControls {
  readonly preview: PreviewCard | undefined
  readonly show: (path: string, x: number, y: number) => void
  readonly hide: () => void
}

/** Debounced note preview for links under the pointer. */
export function useHoverPreview(): HoverPreviewControls {
  const [preview, setPreview] = useState<PreviewCard | undefined>()
  const cache = useRef(new Map<string, { title: string; excerpt: string }>())
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => {
    if (timer.current !== undefined) clearTimeout(timer.current)
  }, [])

  const show = (path: string, x: number, y: number): void => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const place = (title: string, excerpt: string): void => {
        setPreview({
          x: Math.min(x + 14, window.innerWidth - 380),
          y: Math.min(y + 18, window.innerHeight - 190),
          title,
          excerpt,
        })
      }
      const cached = cache.current.get(path)
      if (cached !== undefined) {
        place(cached.title, cached.excerpt)
        return
      }
      void fetchNote(path)
        .then((doc) => {
          const entry = { title: doc.title, excerpt: excerptOf(doc.content) }
          cache.current.set(path, entry)
          place(entry.title, entry.excerpt)
        })
        .catch(() => undefined)
    }, PREVIEW_DELAY_MS)
  }

  const hide = (): void => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = undefined
    setPreview(undefined)
  }

  return { preview, show, hide }
}

/** Condense note content into the hover card's plain-text excerpt. */
function excerptOf(content: string, limit = 260): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, alias?: string) => alias ?? target)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .split('\n')
    .filter(line => !/^\s*\|?[\s:|-]+\|?\s*$/.test(line))
    .join('\n')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
}

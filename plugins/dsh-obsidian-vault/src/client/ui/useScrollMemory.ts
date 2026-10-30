/**
 * Per-tab scroll memory and the reading-view heading tracker: remembers each
 * note's scroll offset, restores it after a tab switch, reports the heading in
 * view, and scrolls to a heading the outline selected.
 * @module dsh-obsidian-vault/client/ui/useScrollMemory
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react'

/** Input for {@link useScrollMemory}. */
export interface ScrollMemoryInput {
  readonly scrollRef: RefObject<HTMLDivElement>
  /** Path whose note owns the scroll container. */
  readonly path: string | undefined
  /** Note that is currently rendered; restore waits for it. */
  readonly noteLoaded: boolean
  readonly onActiveHeading: (text: string | undefined) => void
}

/** Callbacks the reading view and outline use. */
export interface ScrollMemory {
  /** Scroll the container to the heading with this exact text. */
  readonly onHeading: (text: string) => void
  /** Forget every remembered offset, e.g. after a vault switch. */
  readonly clear: () => void
}

/**
 * Track scroll offsets per note path.
 * @param input - scroll container, current path, and the heading sink.
 * @returns the outline callback plus a reset for vault switches.
 */
export function useScrollMemory({ scrollRef, path, noteLoaded, onActiveHeading }: ScrollMemoryInput): ScrollMemory {
  const positions = useRef(new Map<string, number>())
  const restoring = useRef(false)

  useEffect(() => {
    const element = scrollRef.current
    if (element === null || path === undefined) return
    const remember = (): void => {
      if (restoring.current) return
      positions.current.set(path, element.scrollTop)
    }
    element.addEventListener('scroll', remember, { passive: true })
    return () => element.removeEventListener('scroll', remember)
  }, [path, scrollRef])

  useEffect(() => {
    if (path === undefined || !noteLoaded) return
    const top = positions.current.get(path) ?? 0
    restoring.current = true
    const apply = (): void => {
      const element = scrollRef.current
      if (element !== null) element.scrollTop = top
    }
    // Markdown layout settles over a few frames; keep re-applying so an early
    // clamp by a shorter document does not win.
    const frames = [0, 120, 320].map(delay => window.setTimeout(apply, delay))
    const release = window.setTimeout(() => {
      restoring.current = false
    }, 500)
    return () => {
      for (const frame of frames) clearTimeout(frame)
      clearTimeout(release)
      restoring.current = false
    }
  }, [path, noteLoaded, scrollRef])

  useEffect(() => {
    const container = scrollRef.current
    if (container === null || !noteLoaded) return
    const headings = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    if (headings.length === 0) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
      if (visible !== undefined) onActiveHeading(visible.target.textContent?.trim())
    }, { root: container, rootMargin: '0px 0px -70% 0px', threshold: 0 })
    for (const heading of headings) observer.observe(heading)
    return () => observer.disconnect()
  }, [noteLoaded, onActiveHeading, scrollRef])

  const onHeading = useCallback((text: string) => {
    const container = scrollRef.current
    if (container === null) return
    for (const heading of container.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      if (heading.textContent?.trim() === text) {
        heading.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
    }
  }, [scrollRef])

  const clear = useCallback(() => {
    positions.current.clear()
  }, [])

  return { onHeading, clear }
}

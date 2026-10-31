/**
 * Bounded decoded-image cache. A canvas can reference thousands of pictures, and
 * every decoded bitmap holds its pixels until released, so the cache keeps the
 * most recently used ones under a byte budget and lets the rest be decoded again
 * when they scroll back into view.
 * @module dsh-obsidian-vault/client/pur/image-lru
 */

/** Default budget for decoded pixels: 256 MB, roughly 60 full-HD bitmaps. */
export const DEFAULT_IMAGE_BUDGET = 256 * 1024 * 1024

/** One cache entry: the value plus what it costs. */
interface Entry<V> {
  readonly value: V
  readonly bytes: number
  /** Monotonic access stamp; the smallest is evicted first. */
  touched: number
}

/**
 * A map with a byte budget and least-recently-used eviction.
 * `get` and `has` count as use, so a picture on screen is never evicted before
 * one that has not been drawn for a while.
 */
export class BoundedImageMap<V> {
  private readonly entries = new Map<string, Entry<V>>()
  private readonly budget: number
  private used = 0
  private stamp = 0

  /** @param budget - decoded bytes to keep; the oldest entries go first past it. */
  constructor(budget: number = DEFAULT_IMAGE_BUDGET) {
    this.budget = Math.max(1, budget)
  }

  /** Decoded bytes currently held. */
  get bytes(): number {
    return this.used
  }

  /** Number of cached images. */
  get size(): number {
    return this.entries.size
  }

  /**
   * Look one image up, marking it as recently used.
   * @param key - image key.
   * @returns the decoded image, or undefined when it is not cached.
   */
  get(key: string): V | undefined {
    const entry = this.entries.get(key)
    if (entry === undefined) return undefined
    entry.touched = ++this.stamp
    return entry.value
  }

  /**
   * Whether one image is cached, marking it as recently used.
   * @param key - image key.
   * @returns true when present.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Cache one image, evicting the least recently used entries past the budget.
   * @param key - image key.
   * @param value - decoded image.
   * @param bytes - decoded size in bytes.
   */
  set(key: string, value: V, bytes: number): void {
    const existing = this.entries.get(key)
    if (existing !== undefined) this.used -= existing.bytes
    const cost = Math.max(0, bytes)
    this.entries.set(key, { value, bytes: cost, touched: ++this.stamp })
    this.used += cost
    this.evict()
  }

  /**
   * Drop one image.
   * @param key - image key.
   * @returns true when it was cached.
   */
  delete(key: string): boolean {
    const entry = this.entries.get(key)
    if (entry === undefined) return false
    this.used -= entry.bytes
    return this.entries.delete(key)
  }

  /** Every cached key, most recently used last. @returns the keys. */
  keys(): string[] {
    return [...this.entries.entries()].sort((a, b) => a[1].touched - b[1].touched).map(([key]) => key)
  }

  /** Evict until the budget holds, never dropping the newest entry. */
  private evict(): void {
    while (this.used > this.budget && this.entries.size > 1) {
      let oldestKey: string | undefined
      let oldestStamp = Infinity
      for (const [key, entry] of this.entries) {
        if (entry.touched < oldestStamp) {
          oldestStamp = entry.touched
          oldestKey = key
        }
      }
      if (oldestKey === undefined) return
      const entry = this.entries.get(oldestKey)
      if (entry === undefined) return
      this.used -= entry.bytes
      this.entries.delete(oldestKey)
    }
  }
}

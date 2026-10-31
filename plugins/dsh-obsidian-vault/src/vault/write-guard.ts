/**
 * Stale-write guard for the bridge's text writes: a caller that reports the
 * version it loaded gets its write rejected when the file moved underneath it,
 * so two surfaces editing the same file cannot silently clobber each other.
 * @module dsh-obsidian-vault/vault/write-guard
 */

/**
 * Tolerance for comparing reported modification times. File systems report
 * milliseconds with differing precision, so a difference of one millisecond is
 * treated as the same version.
 */
const MTIME_TOLERANCE_MS = 1

/**
 * Whether a write should be refused because the file changed after the caller
 * read it.
 * @param current - modification time on disk right now; undefined when the
 *   platform cannot report one.
 * @param expected - modification time the caller loaded; undefined when the
 *   caller does not track versions.
 * @returns true when both are known and differ by more than the tolerance.
 */
export function isStaleWrite(current: number | undefined, expected: number | undefined): boolean {
  if (current === undefined || expected === undefined) return false
  return Math.abs(current - expected) > MTIME_TOLERANCE_MS
}

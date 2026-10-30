/**
 * Element id generation, matching upstream's 9-character base-36 suffix.
 * @module dsh-obsidian-vault/pur-kernel/ids
 */

/** Length of the base-36 suffix upstream keeps. */
const ID_LENGTH = 9

/**
 * Create an element id. The random source is injectable so tests can pin it.
 * @param random - returns a number in `[0, 1)`; defaults to `Math.random`.
 * @returns nine base-36 characters.
 */
export function createElementId(random: () => number = Math.random): string {
  return random()
    .toString(36)
    .slice(2, 2 + ID_LENGTH)
}

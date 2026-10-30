/**
 * Merging raw persisted properties onto typed kernel values.
 * @module dsh-obsidian-vault/pur-kernel/merge
 */

/**
 * Copy properties the kernel does not model onto a typed object, so a round
 * trip keeps data written by other tools. Keys the object already has win,
 * because those hold the values read code normalised.
 * @param target - the normalised object.
 * @param raw - properties read from the document.
 * @returns the target, mutated with the extra properties.
 */
export function mergeExtras<T extends object>(target: T, raw: Record<string, unknown>): T {
  for (const [key, value] of Object.entries(raw)) {
    if (!Object.hasOwn(target, key)) Reflect.set(target, key, value)
  }
  return target
}

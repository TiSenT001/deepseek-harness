/**
 * Shared panel helpers.
 * @module dsh-obsidian-vault/client/ui/panels/shared
 */

/**
 * Turn one mention's context into plain text.
 * @param context - raw source line.
 */
export function plainContext(context: string): string {
  return context
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, alias?: string) => alias ?? target)
    .replace(/^[-*>]\s*/, '')
}

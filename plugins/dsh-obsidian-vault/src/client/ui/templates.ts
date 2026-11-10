/**
 * Obsidian-style templates: notes under a `模板/` folder supply the body for a
 * new note, with the usual `{{title}}`, `{{date}}`, `{{time}}`, and
 * `{{date:FORMAT}}` placeholders expanded at creation time.
 * @module dsh-obsidian-vault/client/ui/templates
 */
import type { TreeNodeDto } from '../../protocol.ts'

/** One template note found in the tree. */
export interface TemplateNote {
  readonly path: string
  readonly name: string
}

/** Folder whose Markdown files are offered as templates. */
export const TEMPLATE_FOLDER = '模板'

/** Values available to a template. */
export interface TemplateVars {
  readonly title: string
  readonly date: Date
}

/**
 * Read the folder named by `.obsidian/templates.json`.
 * @param value - parsed configuration, or unknown input.
 * @returns a normalized folder, or undefined when the field is absent.
 */
export function parseTemplateFolder(value: unknown): string | undefined {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const folder = record['folder']
  if (typeof folder !== 'string' || folder.trim().length === 0) return undefined
  return folder.trim().replace(/^[\\/]+|[\\/]+$/g, '').replace(/\\/g, '/') || undefined
}

/**
 * Collect Markdown files under a template folder (or any folder named like it).
 * @param nodes - tree level to walk; top level by default.
 * @param folder - template folder from `templates.json`, `模板` by default.
 * @param inTemplates - whether an ancestor is the template folder.
 * @returns templates sorted by path.
 */
export function templateNotes(
  nodes: readonly TreeNodeDto[],
  folder = TEMPLATE_FOLDER,
  inTemplates = false,
): TemplateNote[] {
  const found: TemplateNote[] = []
  for (const node of nodes) {
    const inside = inTemplates
      || (node.kind === 'dir' && (node.name === folder || node.path === folder))
    if (node.kind === 'dir') {
      found.push(...templateNotes(node.children ?? [], folder, inside))
      continue
    }
    if (!inside || !/\.md$/i.test(node.path)) continue
    found.push({ path: node.path, name: node.name.replace(/\.md$/i, '') })
  }
  return found.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
}

/**
 * Replace template placeholders.
 * @param source - template body.
 * @param vars - title and clock used for expansion.
 * @returns the rendered body.
 */
export function applyTemplate(source: string, vars: TemplateVars): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const format = (pattern: string): string => pattern.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, token => {
    switch (token) {
      case 'YYYY': return String(vars.date.getFullYear())
      case 'YY': return String(vars.date.getFullYear()).slice(-2)
      case 'MM': return pad(vars.date.getMonth() + 1)
      case 'DD': return pad(vars.date.getDate())
      case 'HH': return pad(vars.date.getHours())
      case 'mm': return pad(vars.date.getMinutes())
      case 'ss': return pad(vars.date.getSeconds())
      default: return token
    }
  })
  return source
    .replace(/\{\{title\}\}/gi, vars.title)
    .replace(/\{\{date(?::([^}]+))?\}\}/gi, (_match, pattern: string | undefined) =>
      format(pattern ?? 'YYYY-MM-DD'))
    .replace(/\{\{time(?::([^}]+))?\}\}/gi, (_match, pattern: string | undefined) =>
      format(pattern ?? 'HH:mm'))
}

/**
 * Vault path for a new note created from a template.
 * @param title - author-entered note name, without `.md`.
 * @param folder - folder the note lands in; `收件箱` by default.
 * @returns the normalized path.
 */
export function templateTargetPath(title: string, folder = '收件箱'): string {
  const name = title.trim().replace(/\.md$/i, '').replace(/[\\/]+/g, '-')
  return `${folder}/${name}.md`
}

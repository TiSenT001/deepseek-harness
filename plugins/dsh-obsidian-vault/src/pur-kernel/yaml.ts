/**
 * Minimal YAML reader for the UAsset IR interchange format. Supports nested
 * block mappings, `- ` list items, comments and scalar typing, which is all the
 * IR format uses.
 * @module dsh-obsidian-vault/pur-kernel/yaml
 */

/** Scalar conversion applied to every parsed value. */
const INTEGER = /^-?\d+\.?\d*$/

/**
 * One block of the document being parsed.
 */
interface PurYamlFrame {
  /** Mapping the frame writes into; list frames write through the parent. */
  obj: Record<string, unknown>
  /** Indentation of the line that opened the frame. */
  indent: number
  /** True when the frame reads items from `obj[listKey]`. */
  isList: boolean
  /** List key the frame appends to when `isList`. */
  listKey: string
}

/**
 * Parse the UAsset IR YAML dialect.
 * @param text - document text.
 * @returns the root mapping; unparsable lines are skipped rather than throwing.
 */
export function parseSimpleYAML(text: string): Record<string, unknown> {
  const lines = text.split('\n')
  const root: Record<string, unknown> = {}
  const stack: PurYamlFrame[] = [{ obj: root, indent: -1, isList: false, listKey: '' }]

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.search(/\S/)
    const trimmed = line.trim()

    const commentIndex = trimmed.indexOf(' #')
    const content = commentIndex > 0 ? trimmed.substring(0, commentIndex).trim() : trimmed

    while (stack.length > 1 && indent <= (stack[stack.length - 1]?.indent ?? -1)) stack.pop()
    const current = stack[stack.length - 1]
    if (current === undefined) continue

    if (content.startsWith('- ')) {
      const itemValue = content.substring(2).trim()
      const list = listFrame(current)
      current.obj[current.listKey] = list
      if (itemValue.includes(': ')) {
        const item: Record<string, unknown> = {}
        parseKV(itemValue, item)
        list.push(item)
        stack.push({ obj: item, indent, isList: false, listKey: '' })
      } else {
        list.push(parseValue(itemValue))
      }
      continue
    }

    if (content.endsWith(':')) {
      const key = content.substring(0, content.length - 1).trim()
      if (!key) continue
      const next = nextLine(lines, index)
      if (next === undefined || next.indent <= indent) continue
      if (next.text.startsWith('- ')) {
        current.obj[key] = []
        stack.push({ obj: current.obj, indent, isList: true, listKey: key })
      } else {
        const child: Record<string, unknown> = {}
        current.obj[key] = child
        stack.push({ obj: child, indent, isList: false, listKey: '' })
      }
      continue
    }

    if (!content.includes(': ')) continue
    const list = current.isList ? listOf(current.obj[current.listKey]) : undefined
    const target = list !== undefined ? list[list.length - 1] : current.obj
    if (target === undefined || !isRecord(target)) continue
    const key = parseKV(content, target)
    const next = nextLine(lines, index)
    if (next === undefined || next.indent <= indent || target[key] !== undefined) continue
    if (next.text.startsWith('- ')) {
      target[key] = []
      stack.push({ obj: target, indent, isList: true, listKey: key })
    } else {
      const child: Record<string, unknown> = {}
      target[key] = child
      stack.push({ obj: child, indent, isList: false, listKey: '' })
    }
  }

  return root
}

/**
 * Convert a scalar string to its typed value.
 * @param value - trimmed scalar text.
 * @returns boolean, null, number or unquoted string.
 */
function parseValue(value: string): unknown {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (INTEGER.test(value)) return parseFloat(value)
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
  return value
}

/**
 * Read one `key: value` pair into a mapping.
 * @param line - the trimmed line.
 * @param target - mapping receiving the pair.
 * @returns the key, or an empty string when the line has no separator.
 */
function parseKV(line: string, target: Record<string, unknown>): string {
  const separator = line.indexOf(': ')
  if (separator < 0) return ''
  const key = line.substring(0, separator).trim()
  target[key] = parseValue(line.substring(separator + 2).trim())
  return key
}

/**
 * Next line that carries content, skipping blanks and comments.
 * @param lines - all document lines.
 * @param from - index of the current line.
 * @returns the trimmed text and its indentation, or undefined at end of input.
 */
function nextLine(lines: readonly string[], from: number): { text: string; indent: number } | undefined {
  for (let index = from + 1; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (!line.trim() || line.trim().startsWith('#')) continue
    return { text: line.trim(), indent: line.search(/\S/) }
  }
  return undefined
}

/**
 * List a frame appends to, creating it when absent.
 * @param frame - the current frame.
 * @returns the list stored at the frame's list key.
 */
function listFrame(frame: PurYamlFrame): unknown[] {
  const existing = listOf(frame.obj[frame.listKey])
  if (existing !== undefined) return existing
  const created: unknown[] = []
  frame.obj[frame.listKey] = created
  return created
}

/**
 * Read a value that is expected to be a list.
 * @param value - candidate value.
 * @returns the list, or undefined.
 */
function listOf(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined
}

/**
 * Tell whether a value is a plain mapping.
 * @param value - candidate value.
 * @returns true for non-array objects.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

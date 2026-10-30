/**
 * A deliberately small YAML frontmatter reader: scalars, quoted strings,
 * inline arrays, block lists, booleans, and numbers — the subset notes use.
 * Anything richer stays a string, which the properties panel shows verbatim.
 * @module dsh-obsidian-vault/vault/frontmatter
 */

/** Parsed frontmatter and the body that follows it. */
export interface Frontmatter {
  readonly values: Readonly<Record<string, unknown>>
  readonly body: string
}

const EMPTY: Frontmatter = { values: {}, body: '' }

/**
 * Read a leading `---` block and return the remaining body.
 * @param source - complete note text.
 * @returns the parsed values; `body` is the source when no block exists.
 */
export function parseFrontmatter(source: string): Frontmatter {
  const text = source.startsWith('\uFEFF') ? source.slice(1) : source
  if (!text.startsWith('---')) return { values: {}, body: source }
  const lines = text.split(/\r?\n/)
  if ((lines[0] ?? '').trim() !== '---') return { values: {}, body: source }
  let end = -1
  for (let index = 1; index < lines.length; index += 1) {
    const line = (lines[index] ?? '').trim()
    if (line === '---' || line === '...') {
      end = index
      break
    }
  }
  if (end === -1) return EMPTY
  const values = parseBlock(lines.slice(1, end))
  return { values, body: lines.slice(end + 1).join('\n') }
}

function parseBlock(lines: readonly string[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  let currentKey: string | undefined
  let list: string[] | undefined
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (line.length === 0 || line.trimStart().startsWith('#')) continue
    const item = /^\s*-\s*(.*)$/.exec(line)
    if (item !== null && currentKey !== undefined && (list !== undefined || /^\s+/.test(line))) {
      list ??= []
      list.push(unquote(item[1]!.trim()))
      values[currentKey] = list
      continue
    }
    const pair = /^([A-Za-z0-9_\-. ]+):(.*)$/.exec(line)
    if (pair === null) continue
    currentKey = pair[1]!.trim()
    list = undefined
    const rest = pair[2]!.trim()
    if (rest.length === 0) {
      values[currentKey] = undefined
      continue
    }
    const array = /^\[(.*)\]$/.exec(rest)
    if (array !== null) {
      values[currentKey] = array[1]!
        .split(',')
        .map(part => unquote(part.trim()))
        .filter(part => part.length > 0)
      continue
    }
    values[currentKey] = scalar(rest)
  }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete values[key]
  }
  return values
}

function scalar(raw: string): unknown {
  const text = unquote(raw)
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null' || text === '~') return null
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text)
  return text
}

function unquote(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

/**
 * Query evaluator: matches one parsed query against a note, including the
 * `file:`/`path:`/`content:`/`tag:`/`line:`/`block:`/`section:`/`task*:`
 * fields and property lookups.
 * @module dsh-obsidian-vault/vault/query-match
 */
import type { ParsedQuery, QueryDoc, QueryField, QueryNode } from './query-types.ts'

interface Scope {
  readonly text: string
  readonly tags: readonly string[]
  readonly frontmatter: Readonly<Record<string, unknown>>
  readonly caseSensitive: boolean
}

/**
 * Evaluate one parsed node against a document.
 * @param parsed - result of `parseQuery`.
 * @param doc - the note to test.
 * @returns whether the note matches.
 */
export function matchesQuery(parsed: ParsedQuery, doc: QueryDoc): boolean {
  if (parsed.kind === 'plain') {
    const needle = parsed.text.toLowerCase()
    if (needle.length === 0) return false
    return doc.title.toLowerCase().includes(needle)
      || doc.path.toLowerCase().includes(needle)
      || doc.content.toLowerCase().includes(needle)
      || doc.tags.some(tag => tag.toLowerCase().includes(needle))
  }
  return evaluate(parsed.node, {
    text: doc.content,
    tags: doc.tags,
    frontmatter: doc.frontmatter ?? {},
    caseSensitive: false,
  }, doc)
}

function evaluate(node: QueryNode, scope: Scope, doc: QueryDoc): boolean {
  switch (node.kind) {
    case 'all':
      return true
    case 'term':
      return includes(scope.text, node.value, scope.caseSensitive)
    case 'phrase':
      return includes(scope.text, node.value, scope.caseSensitive)
    case 'regex':
      return matchesRegex(scope.text, node.value, scope.caseSensitive)
    case 'and':
      return node.children.every(child => evaluate(child, scope, doc))
    case 'or':
      return node.children.some(child => evaluate(child, scope, doc))
    case 'not':
      return !evaluate(node.child, scope, doc)
    case 'case':
      return evaluate(node.child, { ...scope, caseSensitive: node.caseSensitive }, doc)
    case 'property': {
      const raw = scope.frontmatter[node.key]
      if (raw === undefined || raw === null) return false
      const text = Array.isArray(raw) ? raw.map(String).join(' ') : String(raw)
      if (node.value === undefined) return true
      return includes(text, node.value, scope.caseSensitive)
    }
    case 'field':
      return evaluateField(node.field, node.child, scope, doc)
    default:
      return false
  }
}

function evaluateField(field: QueryField, child: QueryNode, scope: Scope, doc: QueryDoc): boolean {
  switch (field) {
    case 'file':
      return evaluate(child, { ...scope, text: doc.title }, doc)
    case 'path':
      return evaluate(child, { ...scope, text: doc.path }, doc)
    case 'content':
      return evaluate(child, { ...scope, text: doc.content }, doc)
    case 'tag': {
      // Accept both `tag:work` and `tag:#work`.
      const text = `${doc.tags.map(tag => `#${tag}`).join(' ')} ${doc.tags.join(' ')}`
      return evaluate(child, { ...scope, text, tags: doc.tags }, doc)
    }
    case 'line':
      return doc.content.split(/\r?\n/).some(line => evaluate(child, { ...scope, text: line }, doc))
    case 'block':
      return doc.content.split(/\r?\n\s*\r?\n/).some(block => evaluate(child, { ...scope, text: block }, doc))
    case 'section':
      return sections(doc).some(section => evaluate(child, { ...scope, text: section }, doc))
    case 'task':
      return taskLines(doc, 'any').some(line => evaluate(child, { ...scope, text: line }, doc))
    case 'task-todo':
      return taskLines(doc, 'todo').some(line => evaluate(child, { ...scope, text: line }, doc))
    case 'task-done':
      return taskLines(doc, 'done').some(line => evaluate(child, { ...scope, text: line }, doc))
    default:
      return false
  }
}

function sections(doc: QueryDoc): string[] {
  const headings = doc.headings ?? []
  if (headings.length === 0) return [doc.content]
  const lines = doc.content.split(/\r?\n/)
  const out: string[] = []
  for (let index = 0; index < headings.length; index += 1) {
    const start = headings[index]!.line - 1
    let end = lines.length
    for (let next = index + 1; next < headings.length; next += 1) {
      if (headings[next]!.level <= headings[index]!.level) {
        end = headings[next]!.line - 1
        break
      }
    }
    out.push(lines.slice(start, end).join('\n'))
  }
  return out
}

const TASK = /^\s*(?:[-*+]|\d+\.)\s+\[( |x|X)\]\s*(.*)$/

function taskLines(doc: QueryDoc, mode: 'any' | 'todo' | 'done'): string[] {
  const out: string[] = []
  for (const line of doc.content.split(/\r?\n/)) {
    const match = TASK.exec(line)
    if (match === null) continue
    const done = match[1] !== ' '
    if (mode === 'todo' && done) continue
    if (mode === 'done' && !done) continue
    out.push(match[2] ?? '')
  }
  return out
}

function matchesRegex(text: string, source: string, caseSensitive: boolean): boolean {
  const last = source.lastIndexOf('/')
  const pattern = source.slice(1, last)
  const flags = source.slice(last + 1)
  try {
    const base = flags.replace(/g/g, '')
    // A search is case-insensitive unless match-case: forbids it; an explicit
    // i flag always wins.
    const effective = base.includes('i') || caseSensitive ? base : `${base}i`
    return new RegExp(pattern, effective).test(text)
  } catch {
    return text.includes(pattern)
  }
}

function includes(text: string, needle: string, caseSensitive: boolean): boolean {
  if (needle.length === 0) return true
  return caseSensitive ? text.includes(needle) : text.toLowerCase().includes(needle.toLowerCase())
}

/**
 * Obsidian search syntax: quoted phrases, `OR`, `-term`, parentheses, the
 * `file:` `path:` `content:` `tag:` `line:` `block:` `section:` `task:`
 * `task-todo:` `task-done:` `match-case:` `ignore-case:` operators, the bare
 * `#tag` shorthand, and property queries (`[key]`, `[key:value]`).
 * @module dsh-obsidian-vault/vault/query
 */

/** One parsed query node. */
export type QueryNode =
  | { readonly kind: 'all' }
  | { readonly kind: 'term'; readonly value: string }
  | { readonly kind: 'phrase'; readonly value: string }
  | { readonly kind: 'regex'; readonly value: string }
  | { readonly kind: 'and'; readonly children: readonly QueryNode[] }
  | { readonly kind: 'or'; readonly children: readonly QueryNode[] }
  | { readonly kind: 'not'; readonly child: QueryNode }
  | { readonly kind: 'field'; readonly field: QueryField; readonly child: QueryNode }
  | { readonly kind: 'property'; readonly key: string; readonly value?: string }
  | { readonly kind: 'case'; readonly caseSensitive: boolean; readonly child: QueryNode }

/** Search fields the parser understands. */
export type QueryField =
  | 'file' | 'path' | 'content' | 'tag' | 'line' | 'block' | 'section'
  | 'task' | 'task-todo' | 'task-done'

/** A document as the evaluator sees it. */
export interface QueryDoc {
  readonly path: string
  readonly title: string
  readonly content: string
  readonly tags: readonly string[]
  readonly frontmatter?: Readonly<Record<string, unknown>>
  readonly headings?: ReadonlyArray<{ readonly level: number; readonly text: string; readonly line: number }>
}

/** Result of parsing one query string. */
export type ParsedQuery =
  | { readonly kind: 'plain'; readonly text: string }
  | { readonly kind: 'tree'; readonly node: QueryNode }

const FIELDS = new Set<string>([
  'file', 'path', 'content', 'tag', 'line', 'block', 'section', 'task', 'task-todo', 'task-done',
])

interface Token {
  readonly type: 'term' | 'phrase' | 'regex' | 'or' | 'lparen' | 'rparen' | 'neg' | 'field' | 'case'
  readonly value: string
}

/**
 * Tokenize a query string.
 * @param input - raw query.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0
  const pushWord = (word: string): void => {
    if (word.length === 0) return
    if (word === 'OR') {
      tokens.push({ type: 'or', value: word })
      return
    }
    if (word.startsWith('#') && word.length > 1) {
      tokens.push({ type: 'field', value: `tag:${word.slice(1)}` })
      return
    }
    const separator = word.indexOf(':')
    if (separator > 0) {
      const field = word.slice(0, separator).toLowerCase()
      const rest = word.slice(separator + 1)
      if (field === 'match-case' || field === 'ignore-case') {
        tokens.push({ type: 'case', value: field })
        pushWord(rest)
        return
      }
      if (FIELDS.has(field)) {
        tokens.push({ type: 'field', value: `${field}:${rest}` })
        return
      }
    }
    tokens.push({ type: 'term', value: word })
  }

  while (index < input.length) {
    const char = input[index]!
    if (/\s/.test(char)) {
      index += 1
      continue
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: char === '(' ? 'lparen' : 'rparen', value: char })
      index += 1
      continue
    }
    if (char === '-') {
      tokens.push({ type: 'neg', value: '-' })
      index += 1
      continue
    }
    if (char === '"') {
      let value = ''
      index += 1
      while (index < input.length && input[index] !== '"') {
        if (input[index] === '\\' && index + 1 < input.length) {
          value += input[index + 1]
          index += 2
          continue
        }
        value += input[index]
        index += 1
      }
      index += 1
      tokens.push({ type: 'phrase', value })
      continue
    }
    if (char === '/') {
      let pattern = ''
      index += 1
      while (index < input.length && input[index] !== '/') {
        pattern += input[index]
        index += 1
      }
      index += 1
      let flags = ''
      while (index < input.length && /[a-z]/i.test(input[index]!)) {
        flags += input[index]
        index += 1
      }
      tokens.push({ type: 'regex', value: `/${pattern}/${flags}` })
      continue
    }
    let word = ''
    while (index < input.length && !/[\s()]/.test(input[index]!)) {
      if (input[index] === '"') {
        index += 1
        while (index < input.length && input[index] !== '"') {
          word += input[index]
          index += 1
        }
        index += 1
        continue
      }
      word += input[index]
      index += 1
    }
    pushWord(word)
  }
  return tokens
}

/**
 * Parse a query into a tree, or report that it is plain text.
 * @param input - raw query.
 */
export function parseQuery(input: string): ParsedQuery {
  const trimmed = input.trim()
  const tokens = tokenize(trimmed)
  const structured = tokens.some(token =>
    token.type === 'or' || token.type === 'lparen' || token.type === 'neg' || token.type === 'field'
    || token.type === 'case' || token.type === 'phrase' || token.type === 'regex'
    || (token.type === 'term' && /^\[[^\]]+\]$/.test(token.value)))
  if (!structured) return { kind: 'plain', text: trimmed }
  let cursor = 0

  const peek = (): Token | undefined => tokens[cursor]
  const next = (): Token | undefined => tokens[cursor++]

  const parseOr = (): QueryNode => {
    const children: QueryNode[] = [parseAnd()]
    while (peek()?.type === 'or') {
      next()
      children.push(parseAnd())
    }
    return children.length === 1 ? children[0]! : { kind: 'or', children }
  }

  const parseAnd = (): QueryNode => {
    const children: QueryNode[] = []
    while (true) {
      const token = peek()
      if (token === undefined || token.type === 'or' || token.type === 'rparen') break
      children.push(parseUnary())
    }
    if (children.length === 0) return { kind: 'all' }
    return children.length === 1 ? children[0]! : { kind: 'and', children }
  }

  const parseUnary = (): QueryNode => {
    if (peek()?.type === 'neg') {
      next()
      return { kind: 'not', child: parseUnary() }
    }
    return parsePrimary()
  }

  const parsePrimary = (): QueryNode => {
    const token = next()
    if (token === undefined) return { kind: 'all' }
    if (token.type === 'lparen') {
      const node = parseOr()
      if (peek()?.type === 'rparen') next()
      return node
    }
    if (token.type === 'case') {
      const [name, ...rest] = token.value.split(':')
      const child = parseUnary()
      return { kind: 'case', caseSensitive: name === 'match-case', child: rest.length === 0 ? child : child }
    }
    if (token.type === 'field') {
      const separator = token.value.indexOf(':')
      const field = token.value.slice(0, separator) as QueryField
      const value = token.value.slice(separator + 1)
      const child: QueryNode = peek()?.type === 'lparen'
        ? parsePrimary()
        : value.length === 0
          ? { kind: 'all' }
          : { kind: 'term', value }
      return { kind: 'field', field, child }
    }
    if (token.type === 'phrase') return { kind: 'phrase', value: token.value }
    if (token.type === 'regex') return { kind: 'regex', value: token.value }
    if (token.type === 'term') {
      const property = /^\[([^\]]+)\]$/.exec(token.value)
      if (property !== null) {
        const body = property[1]!
        const separator = body.indexOf(':')
        return separator === -1
          ? { kind: 'property', key: body }
          : { kind: 'property', key: body.slice(0, separator), value: body.slice(separator + 1) }
      }
      return { kind: 'term', value: token.value }
    }
    return { kind: 'all' }
  }

  const node = parseOr()
  return { kind: 'tree', node }
}

interface Scope {
  readonly text: string
  readonly tags: readonly string[]
  readonly frontmatter: Readonly<Record<string, unknown>>
  readonly caseSensitive: boolean
}

/**
 * Evaluate one parsed node against a document.
 * @param parsed - result of {@link parseQuery}.
 * @param doc - the note to test.
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

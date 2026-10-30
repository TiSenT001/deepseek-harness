/**
 * Obsidian search syntax: quoted phrases, `OR`, `-term`, parentheses, the
 * `file:` `path:` `content:` `tag:` `line:` `block:` `section:` `task:`
 * `task-todo:` `task-done:` `match-case:` `ignore-case:` operators, the bare
 * `#tag` shorthand, and property queries (`[key]`, `[key:value]`).
 * @module dsh-obsidian-vault/vault/query
 */
import { tokenize } from './query-tokenize.ts'
import type { ParsedQuery, QueryField, QueryNode, Token } from './query-types.ts'

export * from './query-types.ts'
export * from './query-tokenize.ts'
export * from './query-match.ts'

/**
 * Parse a query into a tree, or report that it is plain text.
 * @param input - raw query.
 * @returns the parsed tree, or the plain-text fallback.
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

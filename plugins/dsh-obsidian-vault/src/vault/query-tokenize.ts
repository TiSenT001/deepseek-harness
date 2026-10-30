/**
 * Query tokenizer: splits a search string into terms, phrases, regexes,
 * field prefixes, parentheses and negation markers.
 * @module dsh-obsidian-vault/vault/query-tokenize
 */
import type { Token } from './query-types.ts'

const FIELDS = new Set<string>([
  'file', 'path', 'content', 'tag', 'line', 'block', 'section', 'task', 'task-todo', 'task-done',
])

/**
 * Tokenize a query string.
 * @param input - raw query.
 * @returns the lexical tokens, in order.
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

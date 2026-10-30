/**
 * A small, dependency-free syntax highlighter shared by the code view and the
 * fenced code blocks inside notes. It classifies comments, strings, numbers,
 * keywords, literals, tags, attributes, and punctuation; every other character
 * stays plain text, so an unknown language simply renders uncoloured.
 * @module dsh-obsidian-vault/client/ui/files/tokenize
 */
import {
  ATTRIBUTE_LANGUAGES,
  HASH_LANGUAGES,
  KEYWORDS,
  LITERAL_WORDS,
  MARKUP_LANGUAGES,
  PLAIN_LANGUAGES,
} from './lang-data.ts'
import { tokenizeMarkdown } from './tokenize-markdown.ts'

/** Colour classes the stylesheet binds to one token kind. */
export type TokenKind =
  | 'plain' | 'comment' | 'string' | 'number' | 'keyword' | 'literal'
  | 'function' | 'attr' | 'tag' | 'punct'

/** One classified run of source text. */
export interface Token {
  readonly kind: TokenKind
  readonly text: string
}

interface Rules {
  readonly line: readonly string[]
  readonly block?: readonly [string, string]
  readonly quotes: readonly string[]
  readonly keywords: ReadonlySet<string>
  readonly literals: ReadonlySet<string>
  /** Treat `name:` as an attribute (CSS, YAML, TOML, INI, JSON keys). */
  readonly attributeColon: boolean
  /** Treat `<name>` and its attributes as markup. */
  readonly markup: boolean
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*/
const NUMBER = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/

/**
 * Tokenize a whole source text.
 * @param code - source text.
 * @param language - registry language key, or undefined for plain text.
 * @returns the tokens in source order, newlines included.
 */
export function tokenize(code: string, language: string | undefined): Token[] {
  if (language === undefined || PLAIN_LANGUAGES.has(language)) return [{ kind: 'plain', text: code }]
  if (language === 'markdown') return tokenizeMarkdown(code)
  const rules = rulesFor(language)
  if (rules.markup) return tokenizeMarkup(code)
  return scan(code, rules)
}

/**
 * Tokenize a whole source text, split into lines.
 * @param code - source text.
 * @param language - registry language key, or undefined for plain text.
 * @returns one token array per line; the array length equals the line count.
 */
export function tokenizeLines(code: string, language: string | undefined): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokenize(code, language)) {
    const parts = token.text.split('\n')
    parts.forEach((part, index) => {
      if (index > 0) lines.push([])
      if (part.length > 0) lines[lines.length - 1]!.push({ kind: token.kind, text: part })
    })
  }
  return lines
}

function rulesFor(language: string): Rules {
  const keywords = new Set(KEYWORDS[language] ?? [])
  const hash = HASH_LANGUAGES.has(language)
  const markup = MARKUP_LANGUAGES.has(language)
  const stylesheet = language === 'css' || language === 'scss' || language === 'less'
  const block: readonly [string, string] | undefined = hash
    ? undefined
    : language === 'sql' || language === 'lua'
      ? ['--[[', ']]']
      : ['/*', '*/']
  const line = hash
    ? ['#']
    : language === 'sql' || language === 'lua'
      ? ['--']
      : stylesheet
        ? []
        : ['//']
  return {
    line,
    ...(block === undefined ? {} : { block }),
    quotes: language === 'toml' ? ['"', "'"] : ['"', "'", '`'],
    keywords,
    literals: LITERAL_WORDS,
    attributeColon: ATTRIBUTE_LANGUAGES.has(language),
    markup,
  }
}

function scan(source: string, rules: Rules): Token[] {
  const out: Token[] = []
  let plain = ''
  const flush = (): void => {
    if (plain.length > 0) out.push({ kind: 'plain', text: plain })
    plain = ''
  }
  let index = 0
  while (index < source.length) {
    const rest = source.slice(index)
    const comment = rules.line.find(marker => rest.startsWith(marker))
    if (comment !== undefined) {
      const end = source.indexOf('\n', index)
      const stop = end === -1 ? source.length : end
      flush()
      out.push({ kind: 'comment', text: source.slice(index, stop) })
      index = stop
      continue
    }
    if (rules.block !== undefined && rest.startsWith(rules.block[0])) {
      const close = source.indexOf(rules.block[1], index + rules.block[0].length)
      const stop = close === -1 ? source.length : close + rules.block[1].length
      flush()
      out.push({ kind: 'comment', text: source.slice(index, stop) })
      index = stop
      continue
    }
    const quote = rules.quotes.find(candidate => rest.startsWith(candidate))
    if (quote !== undefined) {
      const stop = stringEnd(source, index, quote)
      flush()
      out.push({ kind: 'string', text: source.slice(index, stop), ...stringRole(source, stop, rules) })
      index = stop
      continue
    }
    const number = NUMBER.exec(rest)
    if (number !== null) {
      flush()
      out.push({ kind: 'number', text: number[0] })
      index += number[0].length
      continue
    }
    const identifier = IDENTIFIER.exec(rest)
    if (identifier !== null) {
      const word = identifier[0]
      const after = source.slice(index + word.length)
      const isAttribute = rules.attributeColon && /^\s*:/.test(after)
      const isCall = /^\s*\(/.test(after)
      const kind: TokenKind = rules.keywords.has(word)
        ? 'keyword'
        : rules.literals.has(word)
          ? 'literal'
          : isAttribute
            ? 'attr'
            : isCall
              ? 'function'
              : 'plain'
      flush()
      out.push({ kind, text: word })
      index += word.length
      continue
    }
    if ('{}()[];,.:+-*/%=<>!&|^~?@'.includes(source[index]!)) {
      flush()
      out.push({ kind: 'punct', text: source[index]! })
      index += 1
      continue
    }
    plain += source[index]
    index += 1
  }
  flush()
  return out
}

/** A JSON-style key is the string itself; the colon stays punctuation. */
function stringRole(source: string, end: number, rules: Rules): { readonly kind?: TokenKind } {
  if (!rules.attributeColon) return {}
  const after = source.slice(end)
  return /^\s*:/.test(after) ? { kind: 'attr' } : {}
}

function stringEnd(source: string, start: number, quote: string): number {
  const triple = quote + quote + quote
  const multi = quote === '`' || (quote !== '`' && source.startsWith(triple, start))
  const delimiter = multi && source.startsWith(triple, start) ? triple : quote
  let index = start + delimiter.length
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2
      continue
    }
    if (source.startsWith(delimiter, index)) return index + delimiter.length
    if (source[index] === '\n' && !multi) return index
    index += 1
  }
  return source.length
}

function tokenizeMarkup(source: string): Token[] {
  const out: Token[] = []
  let index = 0
  while (index < source.length) {
    const char = source[index]!
    if (source.startsWith('<!--', index)) {
      const close = source.indexOf('-->', index)
      const stop = close === -1 ? source.length : close + 3
      out.push({ kind: 'comment', text: source.slice(index, stop) })
      index = stop
      continue
    }
    if (char !== '<') {
      let stop = source.indexOf('<', index)
      if (stop === -1) stop = source.length
      out.push({ kind: 'plain', text: source.slice(index, stop) })
      index = stop
      continue
    }
    const name = /^<\/?([A-Za-z][\w:-]*)/.exec(source.slice(index))
    if (name === null) {
      out.push({ kind: 'punct', text: char })
      index += 1
      continue
    }
    const prefix = name[0].slice(0, name[0].length - name[1]!.length)
    out.push({ kind: 'punct', text: prefix })
    out.push({ kind: 'tag', text: name[1]! })
    let cursor = index + name[0].length
    while (cursor < source.length && source[cursor] !== '>') {
      const attribute = /^[\s/]*([A-Za-z_:][\w:.-]*)/.exec(source.slice(cursor))
      if (attribute === null) {
        out.push({ kind: 'plain', text: source[cursor]! })
        cursor += 1
        continue
      }
      if (attribute[0].trim().length > 0) out.push({ kind: 'plain', text: attribute[0].slice(0, attribute[0].length - attribute[1]!.length) })
      out.push({ kind: 'attr', text: attribute[1]! })
      cursor += attribute[0].length
      if (source[cursor] === '=') {
        out.push({ kind: 'punct', text: '=' })
        cursor += 1
        const quote = source[cursor]
        if (quote === '"' || quote === "'") {
          const stop = stringEnd(source, cursor, quote)
          out.push({ kind: 'string', text: source.slice(cursor, stop) })
          cursor = stop
        }
      }
    }
    if (cursor < source.length) {
      out.push({ kind: 'punct', text: '>' })
      cursor += 1
    }
    index = cursor
  }
  return out
}

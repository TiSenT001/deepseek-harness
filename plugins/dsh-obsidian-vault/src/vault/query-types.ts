/**
 * Shared search-query types: the parsed node tree, the fields the parser
 * understands, and the document shape the evaluator reads.
 * @module dsh-obsidian-vault/vault/query-types
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

/** One lexical token from the query string. */
export interface Token {
  readonly type: 'term' | 'phrase' | 'regex' | 'or' | 'lparen' | 'rparen' | 'neg' | 'field' | 'case'
  readonly value: string
}

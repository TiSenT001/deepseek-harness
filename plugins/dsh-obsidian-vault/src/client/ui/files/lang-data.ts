/**
 * Language data tables for the lightweight syntax highlighter: keyword lists
 * per language and the sets that pick comment styles, markup mode, attribute
 * detection, and plain-text passthrough.
 * @module dsh-obsidian-vault/client/ui/files/lang-data
 */

/** Words highlighted as literals regardless of language. */
export const LITERAL_WORDS = new Set([
  'true', 'false', 'null', 'undefined', 'None', 'True', 'False', 'nil', 'NaN', 'Infinity',
])

/** Keyword lists keyed by registry language. */
export const KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  javascript: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete',
    'do', 'else', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try',
    'typeof', 'var', 'void', 'while', 'yield',
  ],
  typescript: [
    'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'declare',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally', 'for', 'from',
    'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'namespace',
    'new', 'of', 'private', 'protected', 'public', 'readonly', 'return', 'satisfies', 'static',
    'super', 'switch', 'this', 'throw', 'try', 'type', 'typeof', 'var', 'void', 'while', 'yield',
  ],
  python: [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
    'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  ],
  bash: ['case', 'do', 'done', 'elif', 'else', 'esac', 'fi', 'for', 'function', 'if', 'in', 'then', 'until', 'while'],
  go: ['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'],
  rust: ['as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'static', 'struct', 'super', 'trait', 'type', 'unsafe', 'use', 'where', 'while'],
  java: ['abstract', 'boolean', 'break', 'case', 'catch', 'class', 'continue', 'default', 'do', 'else', 'enum', 'extends', 'final', 'finally', 'for', 'if', 'implements', 'import', 'instanceof', 'interface', 'new', 'package', 'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'throws', 'try', 'void', 'while'],
  kotlin: ['as', 'break', 'class', 'companion', 'continue', 'do', 'else', 'enum', 'fun', 'if', 'in', 'interface', 'is', 'object', 'package', 'return', 'sealed', 'super', 'this', 'throw', 'try', 'val', 'var', 'when', 'while'],
  c: ['break', 'case', 'const', 'continue', 'default', 'do', 'else', 'enum', 'extern', 'for', 'goto', 'if', 'inline', 'return', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'void', 'volatile', 'while'],
  cpp: ['auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue', 'default', 'delete', 'do', 'else', 'enum', 'explicit', 'extern', 'for', 'friend', 'if', 'inline', 'namespace', 'new', 'operator', 'private', 'protected', 'public', 'return', 'sizeof', 'static', 'struct', 'switch', 'template', 'throw', 'try', 'typedef', 'typename', 'using', 'virtual', 'void', 'volatile', 'while'],
  csharp: ['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'else', 'enum', 'finally', 'for', 'foreach', 'if', 'interface', 'namespace', 'new', 'private', 'protected', 'public', 'return', 'static', 'struct', 'switch', 'throw', 'try', 'using', 'var', 'void', 'while'],
  ruby: ['begin', 'case', 'class', 'def', 'do', 'else', 'elsif', 'end', 'ensure', 'for', 'if', 'module', 'next', 'require', 'rescue', 'return', 'then', 'unless', 'until', 'while', 'yield'],
  php: ['abstract', 'array', 'as', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'echo', 'else', 'elseif', 'extends', 'final', 'finally', 'for', 'foreach', 'function', 'if', 'implements', 'interface', 'namespace', 'new', 'private', 'protected', 'public', 'return', 'static', 'switch', 'throw', 'try', 'use', 'while'],
  sql: ['ALTER', 'AND', 'AS', 'BY', 'CREATE', 'DELETE', 'DROP', 'FROM', 'GROUP', 'HAVING', 'INSERT', 'INTO', 'JOIN', 'LEFT', 'LIMIT', 'NOT', 'NULL', 'ON', 'OR', 'ORDER', 'RIGHT', 'SELECT', 'SET', 'TABLE', 'UPDATE', 'VALUES', 'WHERE'],
  swift: ['async', 'await', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer', 'do', 'else', 'enum', 'extension', 'for', 'func', 'guard', 'if', 'import', 'in', 'init', 'let', 'private', 'protocol', 'public', 'return', 'struct', 'switch', 'throw', 'try', 'var', 'where', 'while'],
  dart: ['abstract', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'else', 'enum', 'extends', 'final', 'for', 'if', 'import', 'in', 'new', 'return', 'static', 'super', 'switch', 'throw', 'try', 'var', 'void', 'while', 'with', 'yield'],
  lua: ['and', 'break', 'do', 'else', 'elseif', 'end', 'for', 'function', 'if', 'in', 'local', 'not', 'or', 'repeat', 'return', 'then', 'until', 'while'],
  groovy: ['class', 'def', 'else', 'for', 'if', 'import', 'new', 'return', 'static', 'throws', 'try', 'void', 'while'],
  powershell: ['begin', 'catch', 'class', 'do', 'else', 'elseif', 'end', 'filter', 'finally', 'for', 'foreach', 'function', 'if', 'param', 'return', 'switch', 'throw', 'try', 'until', 'while'],
}

/** Languages whose line comment marker is `#`. */
export const HASH_LANGUAGES = new Set(['python', 'ruby', 'bash', 'yaml', 'toml', 'ini', 'properties', 'powershell'])

/** Languages scanned as markup (`<tag attr="…">`). */
export const MARKUP_LANGUAGES = new Set(['html', 'xml', 'vue', 'svelte'])

/** Languages rendered without any colouring. */
export const PLAIN_LANGUAGES = new Set(['text', 'csv'])

/** Languages where `name:` marks an attribute. */
export const ATTRIBUTE_LANGUAGES = new Set(['css', 'scss', 'less', 'yaml', 'toml', 'ini', 'properties'])

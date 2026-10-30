/**
 * The 58 visual-programming node templates upstream ships. Titles live in
 * locale dictionaries keyed `preset.<id>`; categories key `presetCategory.<key>`,
 * so this module stays free of display copy.
 * @module dsh-obsidian-vault/pur-kernel/presets
 */

/** Picker grouping of a preset. */
export type PurPresetCategory = 'math' | 'logic' | 'string' | 'array' | 'object' | 'control' | 'utility'

/** One node template: pins and the `process` body it evaluates. */
export interface PurCodePreset {
  /** Stable preset id; also the title's message key suffix. */
  readonly id: string
  /** Picker grouping. */
  readonly category: PurPresetCategory
  /** Input pin labels, in order. */
  readonly inputs: readonly string[]
  /** Output pin labels, in order. */
  readonly outputs: readonly string[]
  /** Body of `function process(inputs)`. */
  readonly code: string
}

/** The templates, in upstream picker order. */
export const PUR_CODE_PRESETS: readonly PurCodePreset[] = [
  { id: 'math-add', category: 'math', inputs: ['a', 'b'], outputs: ['sum'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { sum: a + b };\n}' },
  { id: 'math-sub', category: 'math', inputs: ['a', 'b'], outputs: ['diff'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { diff: a - b };\n}' },
  { id: 'math-mul', category: 'math', inputs: ['a', 'b'], outputs: ['product'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { product: a * b };\n}' },
  { id: 'math-div', category: 'math', inputs: ['a', 'b'], outputs: ['quotient'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { quotient: a / b };\n}' },
  { id: 'math-mod', category: 'math', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a % b };\n}' },
  { id: 'math-pow', category: 'math', inputs: ['base', 'exp'], outputs: ['result'], code: 'function process(inputs) {\n  const { base, exp } = inputs;\n  return { result: Math.pow(base, exp) };\n}' },
  { id: 'math-sqrt', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.sqrt(x) };\n}' },
  { id: 'math-abs', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.abs(x) };\n}' },
  { id: 'math-ceil', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.ceil(x) };\n}' },
  { id: 'math-floor', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.floor(x) };\n}' },
  { id: 'math-round', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.round(x) };\n}' },
  { id: 'math-sin', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.sin(x) };\n}' },
  { id: 'math-cos', category: 'math', inputs: ['x'], outputs: ['result'], code: 'function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.cos(x) };\n}' },
  { id: 'math-random', category: 'math', inputs: ['min', 'max'], outputs: ['result'], code: 'function process(inputs) {\n  const { min, max } = inputs;\n  return { result: min + Math.random() * (max - min) };\n}' },
  { id: 'math-min', category: 'math', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Math.min(a, b) };\n}' },
  { id: 'math-max', category: 'math', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Math.max(a, b) };\n}' },
  { id: 'logic-and', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: !!(a && b) };\n}' },
  { id: 'logic-or', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: !!(a || b) };\n}' },
  { id: 'logic-not', category: 'logic', inputs: ['a'], outputs: ['result'], code: 'function process(inputs) {\n  const { a } = inputs;\n  return { result: !a };\n}' },
  { id: 'logic-xor', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Boolean(a) !== Boolean(b) };\n}' },
  { id: 'logic-gt', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a > b };\n}' },
  { id: 'logic-lt', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a < b };\n}' },
  { id: 'logic-eq', category: 'logic', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a === b };\n}' },
  { id: 'logic-if', category: 'logic', inputs: ['condition', 'thenValue', 'elseValue'], outputs: ['result'], code: 'function process(inputs) {\n  const { condition, thenValue, elseValue } = inputs;\n  return { result: condition ? thenValue : elseValue };\n}' },
  { id: 'str-concat', category: 'string', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: String(a) + String(b) };\n}' },
  { id: 'str-upper', category: 'string', inputs: ['text'], outputs: ['result'], code: 'function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).toUpperCase() };\n}' },
  { id: 'str-lower', category: 'string', inputs: ['text'], outputs: ['result'], code: 'function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).toLowerCase() };\n}' },
  { id: 'str-len', category: 'string', inputs: ['text'], outputs: ['result'], code: 'function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).length };\n}' },
  { id: 'str-split', category: 'string', inputs: ['text', 'sep'], outputs: ['result'], code: 'function process(inputs) {\n  const { text, sep } = inputs;\n  return { result: String(text).split(sep) };\n}' },
  { id: 'str-replace', category: 'string', inputs: ['text', 'find', 'replacement'], outputs: ['result'], code: 'function process(inputs) {\n  const { text, find, replacement } = inputs;\n  return { result: String(text).split(find).join(replacement) };\n}' },
  { id: 'str-slice', category: 'string', inputs: ['text', 'start', 'end'], outputs: ['result'], code: 'function process(inputs) {\n  const { text, start, end } = inputs;\n  return { result: String(text).slice(start, end) };\n}' },
  { id: 'str-includes', category: 'string', inputs: ['text', 'search'], outputs: ['result'], code: 'function process(inputs) {\n  const { text, search } = inputs;\n  return { result: String(text).includes(search) };\n}' },
  { id: 'arr-make', category: 'array', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: [a, b] };\n}' },
  { id: 'arr-len', category: 'array', inputs: ['arr'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).length };\n}' },
  { id: 'arr-push', category: 'array', inputs: ['arr', 'item'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr, item } = inputs;\n  return { result: (arr || []).concat(item) };\n}' },
  { id: 'arr-concat', category: 'array', inputs: ['arr1', 'arr2'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr1, arr2 } = inputs;\n  return { result: (arr1 || []).concat(arr2 || []) };\n}' },
  { id: 'arr-map', category: 'array', inputs: ['arr'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).map(x => x * 2) };\n}' },
  { id: 'arr-filter', category: 'array', inputs: ['arr'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).filter(x => x > 0) };\n}' },
  { id: 'arr-sort', category: 'array', inputs: ['arr'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).slice().sort((x, y) => x - y) };\n}' },
  { id: 'arr-sum', category: 'array', inputs: ['arr'], outputs: ['result'], code: 'function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).reduce((s, x) => s + x, 0) };\n}' },
  { id: 'obj-make', category: 'object', inputs: ['key', 'value'], outputs: ['result'], code: 'function process(inputs) {\n  const { key, value } = inputs;\n  return { result: { [key]: value } };\n}' },
  { id: 'obj-get', category: 'object', inputs: ['obj', 'key'], outputs: ['result'], code: 'function process(inputs) {\n  const { obj, key } = inputs;\n  return { result: obj ? obj[key] : undefined };\n}' },
  { id: 'obj-keys', category: 'object', inputs: ['obj'], outputs: ['result'], code: 'function process(inputs) {\n  const { obj } = inputs;\n  return { result: obj ? Object.keys(obj) : [] };\n}' },
  { id: 'obj-values', category: 'object', inputs: ['obj'], outputs: ['result'], code: 'function process(inputs) {\n  const { obj } = inputs;\n  return { result: obj ? Object.values(obj) : [] };\n}' },
  { id: 'obj-merge', category: 'object', inputs: ['a', 'b'], outputs: ['result'], code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Object.assign({}, a || {}, b || {}) };\n}' },
  { id: 'ctrl-range', category: 'control', inputs: ['start', 'end'], outputs: ['result'], code: 'function process(inputs) {\n  const { start, end } = inputs;\n  return { result: Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i) };\n}' },
  { id: 'ctrl-sumrange', category: 'control', inputs: ['n'], outputs: ['result'], code: 'function process(inputs) {\n  const { n } = inputs;\n  let s = 0;\n  for (let i = 1; i <= n; i++) s += i;\n  return { result: s };\n}' },
  { id: 'ctrl-factorial', category: 'control', inputs: ['n'], outputs: ['result'], code: 'function process(inputs) {\n  const { n } = inputs;\n  let s = 1;\n  for (let i = 2; i <= n; i++) s *= i;\n  return { result: s };\n}' },
  { id: 'ctrl-fib', category: 'control', inputs: ['n'], outputs: ['result'], code: 'function process(inputs) {\n  const { n } = inputs;\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; }\n  return { result: a };\n}' },
  { id: 'ctrl-counter', category: 'control', inputs: ['prev'], outputs: ['result'], code: 'function process(inputs) {\n  const { prev } = inputs;\n  return { result: (prev || 0) + 1 };\n}' },
  { id: 'util-log', category: 'utility', inputs: ['value'], outputs: ['result'], code: "function process(inputs) {\n  const { value } = inputs;\n  console.log('Pur Studio:', value);\n  return { result: value };\n}" },
  { id: 'util-identity', category: 'utility', inputs: ['value'], outputs: ['result'], code: 'function process(inputs) {\n  const { value } = inputs;\n  return { result: value };\n}' },
  { id: 'util-const', category: 'utility', inputs: [], outputs: ['result'], code: 'function process() {\n  return { result: 42 };\n}' },
  { id: 'util-now', category: 'utility', inputs: [], outputs: ['result'], code: 'function process() {\n  return { result: Date.now() };\n}' },
  { id: 'util-date', category: 'utility', inputs: [], outputs: ['result'], code: 'function process() {\n  return { result: new Date().toISOString() };\n}' },
  { id: 'util-typeof', category: 'utility', inputs: ['value'], outputs: ['result'], code: 'function process(inputs) {\n  const { value } = inputs;\n  return { result: typeof value };\n}' },
  { id: 'util-tonum', category: 'utility', inputs: ['text'], outputs: ['result'], code: 'function process(inputs) {\n  const { text } = inputs;\n  return { result: parseFloat(text) };\n}' },
  { id: 'util-tostr', category: 'utility', inputs: ['value'], outputs: ['result'], code: 'function process(inputs) {\n  const { value } = inputs;\n  return { result: String(value) };\n}' },
]

/** Categories in picker order. */
export const PUR_PRESET_CATEGORIES: readonly PurPresetCategory[] = ['math', 'logic', 'string', 'array', 'object', 'control', 'utility']

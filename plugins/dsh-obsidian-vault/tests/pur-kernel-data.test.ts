import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  codeNodeHeight,
  createElementId,
  parseStudioDocument,
  PUR_CODE_PRESETS,
  PUR_PRESET_CATEGORIES,
  PurDocumentError,
  serializeStudioDocument,
} from '../src/pur-kernel/index.ts'
import type { PurStudioDocument } from '../src/pur-kernel/index.ts'

test('generates the upstream nine-character base-36 suffix', () => {
  assert.equal(createElementId(() => 0.123456789), '4fzzzxjyl')
  const live = createElementId()
  assert.match(live, /^[0-9a-z]{1,9}$/)
})

test('sizes a node from its pin rows', () => {
  assert.equal(codeNodeHeight({}), 88)
  assert.equal(codeNodeHeight({ inputs: [{ id: 'a', label: 'a' }] }), 88)
  assert.equal(codeNodeHeight({ inputs: [], outputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }] }), 116)
})

/** Id prefix each preset category uses upstream. */
const PREFIX_CATEGORY: Record<string, string> = { math: 'math', logic: 'logic', str: 'string', arr: 'array', obj: 'object', ctrl: 'control', util: 'utility' }

test('ships the 58 upstream presets', () => {
  assert.equal(PUR_CODE_PRESETS.length, 58)
  const ids = new Set(PUR_CODE_PRESETS.map((preset) => preset.id))
  assert.equal(ids.size, 58)
  for (const preset of PUR_CODE_PRESETS) {
    assert.ok(PUR_PRESET_CATEGORIES.includes(preset.category))
    assert.equal(PREFIX_CATEGORY[preset.id.split('-')[0] ?? ''], preset.category)
    for (const pin of [...preset.inputs, ...preset.outputs]) assert.match(pin, /^[A-Za-z_$][\w$]*$/)
    assert.match(preset.code, /^function process\(/)
    assert.doesNotThrow(() => new Function(preset.code))
  }
})

test('keeps a representative preset byte-identical', () => {
  const add = PUR_CODE_PRESETS.find((preset) => preset.id === 'math-add')
  assert.deepEqual(add, {
    id: 'math-add',
    category: 'math',
    inputs: ['a', 'b'],
    outputs: ['sum'],
    code: 'function process(inputs) {\n  const { a, b } = inputs;\n  return { sum: a + b };\n}',
  })
})

test('writes documents the way upstream saves them', () => {
  const document: PurStudioDocument = { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }
  assert.equal(serializeStudioDocument(document), '{\n  "elements": [],\n  "viewState": {\n    "offsetX": 0,\n    "offsetY": 0,\n    "scale": 1\n  }\n}')
})

test('reads a document back with its extras and pins', () => {
  const document: PurStudioDocument = {
    elements: [
      { id: 'g1', type: 'group', x: 10, y: 10, w: 300, h: 200, content: 'Group', children: [
        { id: 'c1', type: 'code-node', x: 5, y: 5, w: 200, h: 116, content: '', code: 'function process() {}', inputs: [{ id: 'p1', label: 'a' }] },
      ] },
      { id: 'l1', type: 'line', from: 'c1', to: 'c1', fromSide: 'right', toSide: 'left', content: 'note' },
    ],
    viewState: { offsetX: 40, offsetY: -12, scale: 1.25 },
  }
  assert.deepEqual(parseStudioDocument(serializeStudioDocument(document)), document)
})

test('keeps unknown element properties', () => {
  const text = '{"elements":[{"id":"a","type":"text","x":0,"y":0,"w":10,"h":10,"content":"hi","custom":1}],"viewState":{}}'
  const parsed = parseStudioDocument(text)
  assert.equal(Reflect.get(parsed.elements[0] ?? {}, 'custom'), 1)
  assert.deepEqual(parsed.viewState, { offsetX: 0, offsetY: 0, scale: 1 })
})

test('lines keep their own field set', () => {
  const parsed = parseStudioDocument('{"elements":[{"id":"l","type":"line","from":"a","to":"b"}]}')
  const line = parsed.elements[0]
  assert.ok(line)
  assert.equal(line.type, 'line')
  assert.equal(Object.hasOwn(line, 'x'), false)
  assert.equal(parsed.elements.length, 1)
})

test('reports unreadable documents', () => {
  assert.throws(() => parseStudioDocument('{'), (error: unknown) => error instanceof PurDocumentError && error.cause !== undefined)
  assert.throws(() => parseStudioDocument('[]'), PurDocumentError)
  assert.throws(() => parseStudioDocument('{"elements":"nope"}'), PurDocumentError)
  assert.throws(() => parseStudioDocument('{"elements":[{"id":"a","type":"bogus"}]}'), PurDocumentError)
  assert.throws(() => parseStudioDocument('{"elements":[{"id":"a","type":"group","children":[7]}]}'), PurDocumentError)
  assert.throws(() => parseStudioDocument('{"elements":[{"id":"a","type":"code-node","inputs":[{"label":1}]}]}'), PurDocumentError)
})

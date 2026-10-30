import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPipeline, irToElements, parseSimpleYAML, renderHtml, renderJavaScript, renderPython } from '../src/pur-kernel/index.ts'
import type { PurElement, PurNoteLinkElement, PurPipeline } from '../src/pur-kernel/index.ts'
import {
  ALGO_ELEMENTS,
  CYCLE_ELEMENTS,
  GOLDEN_CYCLE_NOTICES,
  GOLDEN_CYCLE_REFUSED,
  GOLDEN_HEADER,
  GOLDEN_HTML,
  GOLDEN_IR,
  GOLDEN_JS,
  GOLDEN_PY,
  GOLDEN_YAML,
  IR_INPUT,
  UPSTREAM_CORE,
  UPSTREAM_HTML,
  UPSTREAM_JS,
  UPSTREAM_PY,
  YAML_INPUTS,
} from './helpers/pur-algo-golden.ts'

/** Id source reproducing the ids the upstream run allocated. */
function counterIds(start = 1000): () => string {
  let next = start
  return () => `id${String(next++).padStart(6, '0')}`
}

/** Group label the upstream importer wrote. */
function upstreamLabel(name: string, nodes: number, links: number): string {
  return `📦 ${name} (${nodes}节点 ${links}连线)`
}

/** Pipeline the upstream generators consumed, or a failed assertion. */
function algorithmPipeline(): PurPipeline {
  const built = buildPipeline(ALGO_ELEMENTS)
  assert.ok(built.ok, 'the fixture must be executable')
  return built.pipeline
}

/** A note link whose content carries no code. */
function noteLink(partial: Partial<PurNoteLinkElement>): PurElement {
  return {
    id: 'nl1',
    type: 'note-link',
    x: 0,
    y: 0,
    w: 250,
    h: 120,
    content: '',
    link: 'notes/code.md',
    outputs: [{ id: 'o', label: 'o' }],
    ...partial,
  }
}

test('parses the IR YAML dialect the way upstream does', () => {
  YAML_INPUTS.forEach((text, index) => {
    const golden = GOLDEN_YAML[index]
    assert.ok(golden !== undefined, `missing golden ${index}`)
    assert.deepEqual(parseSimpleYAML(text), golden, `document ${index}`)
  })
})

test('finds the following line by position, not by first occurrence', () => {
  // Upstream looks the bare key up with `lines.indexOf(line)`, so the second
  // identical line inherits the first one's follower and grows an empty list.
  const text = ['a:', '  p:', '    - one', 'b:', '  p:', '  keep: 1'].join('\n')
  assert.deepEqual(parseSimpleYAML(text), { a: { p: ['one'] }, b: { keep: 1 } })
})

test('imports IR graphs the way upstream does', () => {
  assert.deepEqual(irToElements(IR_INPUT, 50, 50, { createId: counterIds(), formatLabel: upstreamLabel }), GOLDEN_IR)
})

test('keeps zero coordinates the upstream importer replaced', () => {
  const ir = { graphs: [{ name: 'G', nodes: [{ id: 'a', type: 'add', x: 0, y: 0, pins: [] }] }] }
  assert.deepEqual(irToElements(ir, 0, 0, { createId: counterIds() }), [
    {
      id: 'id001001',
      type: 'group',
      x: 0,
      y: 0,
      w: 440,
      h: 190,
      content: '📦 G (1 nodes, 0 links)',
      children: [
        {
          id: 'id001000',
          type: 'text',
          title: 'add',
          content: '// add',
          inputs: [],
          outputs: [],
          x: 0,
          y: 48,
          w: 300,
          h: 90,
          bgColor: 'rgba(20,40,60,0.92)',
          color: '#c8e0ff',
          fontSize: 14,
          rotation: 0,
          opacity: 1,
        },
      ],
      rotation: 0,
      opacity: 1,
    },
  ])
})

test('reports an IR document without graphs', () => {
  assert.equal(irToElements({ graphs: [] }, 0, 0, { createId: counterIds() }), null)
  assert.equal(irToElements({}, 0, 0, { createId: counterIds() }), null)
  assert.throws(() => irToElements('nope', 0, 0, { createId: counterIds() }))
})

test('orders the pipeline the way upstream does', () => {
  const pipeline = algorithmPipeline()
  assert.deepEqual(
    pipeline.nodes.map((node) => [node.id, node.safeName]),
    [
      ['n1', 'node_0_加法'],
      ['n2', 'node_1_倍数'],
      ['t1', 'node_2_纯文本'],
    ],
  )
  assert.deepEqual(
    pipeline.edges,
    [
      { fromNode: 'n1', fromPin: 'sum', toNode: 'n2', toPin: 'value' },
      { fromNode: 'n2', fromPin: 'double', toNode: 't1', toPin: 'x' },
    ],
  )
  assert.deepEqual(pipeline.inputMap.get('n2')?.get('value'), { fromNode: 'n1', fromPin: 'sum' })
})

test('refuses a pipeline without code nodes', () => {
  const text: PurElement = { id: 'plain', type: 'text', x: 0, y: 0, w: 200, h: 60, content: 'text' }
  assert.deepEqual(buildPipeline([text]), { ok: false, reason: 'no-code-nodes' })
})

test('refuses a cyclic pipeline the way upstream does', () => {
  assert.equal(GOLDEN_CYCLE_REFUSED, true)
  assert.equal(GOLDEN_CYCLE_NOTICES.length, 1)
  assert.deepEqual(buildPipeline(CYCLE_ELEMENTS), { ok: false, reason: 'cycle' })
})

test('renders JavaScript byte for byte like upstream', () => {
  assert.equal(renderJavaScript(algorithmPipeline(), UPSTREAM_CORE, UPSTREAM_JS, GOLDEN_HEADER), GOLDEN_JS)
})

test('renders an HTML page byte for byte like upstream', () => {
  assert.equal(renderHtml(algorithmPipeline(), UPSTREAM_HTML, GOLDEN_HEADER), GOLDEN_HTML)
})

test('renders Python byte for byte like upstream', () => {
  assert.equal(renderPython(algorithmPipeline(), UPSTREAM_CORE, UPSTREAM_PY, GOLDEN_HEADER), GOLDEN_PY)
})

test('injects code read from a linked note into every format', () => {
  const code = 'function process(inputs) {\n  return inputs.v * 2\n}'
  const built = buildPipeline([noteLink({})], { resolveLinkedCode: () => code })
  assert.ok(built.ok)
  assert.equal(built.pipeline.nodes[0]?.linkedCode, code)
  assert.match(renderJavaScript(built.pipeline, UPSTREAM_CORE, UPSTREAM_JS, GOLDEN_HEADER), /return inputs\.v \* 2/)
  assert.match(renderHtml(built.pipeline, UPSTREAM_HTML, GOLDEN_HEADER), /<pre class="node-src">function process\(inputs\) {\n  return inputs\.v \* 2\n}<\/pre>/)
  assert.match(renderPython(built.pipeline, UPSTREAM_CORE, UPSTREAM_PY, GOLDEN_HEADER), /    return inputs\.v \* 2\n/)
})

test('skips the linked note when the card already holds code', () => {
  let calls = 0
  const built = buildPipeline([noteLink({ content: 'function process() { return { v: 2 }; }' })], {
    resolveLinkedCode: () => {
      calls += 1
      return 'function process() { return { v: 3 }; }'
    },
  })
  assert.ok(built.ok)
  assert.equal(calls, 0)
  assert.equal(built.pipeline.nodes[0]?.linkedCode, undefined)
})

test('names a titleless node instead of emitting undefined', () => {
  const titleless: PurElement = {
    id: 'tl',
    type: 'text',
    x: 0,
    y: 0,
    w: 200,
    h: 60,
    content: 'function process() { return {}; }',
    inputs: [{ id: 'x', label: 'x' }],
  }
  const built = buildPipeline([titleless])
  assert.ok(built.ok)
  assert.equal(built.pipeline.nodes[0]?.title, '')
  assert.equal(built.pipeline.nodes[0]?.safeName, 'node_0_node')
  const js = renderJavaScript(built.pipeline, UPSTREAM_CORE, UPSTREAM_JS, GOLDEN_HEADER)
  assert.match(js, /\/\/ \[节点 1\] \n/)
  assert.ok(!js.includes('undefined\nconst'))
})

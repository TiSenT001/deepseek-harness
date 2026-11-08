/**
 * Regenerate the recorded golden expectations for the Pur canvas kernel.
 *
 * The goldens are regression baselines: they record what the renderer draws, what
 * the controller does per step, what the context menus contain, and where pins sit.
 * Layout changes are allowed, but they must be re-recorded and reviewed as a diff.
 *
 * Usage:
 *   node --experimental-strip-types scripts/regen-expected.mjs [--suite all|controller|menu|render|geometry] [--scenario <substring>]
 *
 * Suites:
 *   controller  replay CONTROLLER_SCENARIOS and rewrite every step snapshot.
 *   menu        replay MENU_SCENARIOS and rewrite the trees, calls and selection.
 *   render      render traces from RENDER_INPUTS (canvas calls + image loads).
 *   geometry    pin offsets, pin world positions, pin hit tests and line endpoints.
 *
 * The replay helpers come from tests/helpers/expected-harness.ts, the same module the
 * tests use, so a re-record cannot drift from what the tests compare against.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const load = async (relative) => import(new URL(relative, root).href)

const { CONTROLLER_SCENARIOS, MENU_SCENARIOS } = await load('tests/helpers/pur-controller-expected.ts')
const { RENDER_INPUTS } = await load('tests/helpers/pur-render-expected.ts')
const {
  GEOMETRY_ELEMENTS,
  GOLDEN_PIN_WORLD,
  GOLDEN_PIN_OFFSETS,
  GOLDEN_PIN_AT,
  GOLDEN_LINE_ENDPOINT_AT,
} = await load('tests/helpers/pur-geometry-expected.ts')
const { replayScenario, replayMenu } = await load('tests/helpers/expected-harness.ts')
const { drawScene, pinPosition, pinWorldPosition, pinAt, lineEndpointAt } = await load('src/pur-kernel/index.ts')
const { RenderRecorder } = await load('tests/helpers/pur-render-recorder.ts')

const controllerPath = fileURLToPath(new URL('tests/helpers/pur-controller-expected.ts', root))
const renderPath = fileURLToPath(new URL('tests/helpers/pur-render-expected.ts', root))
const geometryPath = fileURLToPath(new URL('tests/helpers/pur-geometry-expected.ts', root))

/**
 * Locate the array literal assigned to an exported constant.
 * @param source - file text.
 * @param name - exported constant name.
 * @returns bracket indices, or null when the export is absent.
 */
function arrayRange(source, name) {
  const marker = `export const ${name}`
  const start = source.indexOf(marker)
  if (start < 0) return null
  const assign = source.indexOf('= [', start)
  if (assign < 0) return null
  const open = assign + 2
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '[') depth += 1
    else if (char === ']') {
      depth -= 1
      if (depth === 0) return { open, close: index }
    }
  }
  return null
}

/**
 * The array literal bound to an exported constant.
 * @param name - exported constant name.
 * @returns the parsed array.
 */
async function readArray(name) {
  const text = readFileSync(controllerPath, 'utf8')
  const range = arrayRange(text, name)
  if (range === null) throw new Error(`${name} not found`)
  return JSON.parse(text.slice(range.open, range.close + 1))
}

/**
 * Replace one exported array literal, keeping the surrounding declarations.
 * The new body must be valid JSON so the rewrite cannot produce broken syntax.
 * @param path - file to update.
 * @param name - exported constant name.
 * @param body - new array literal text.
 */
function writeArray(path, name, body) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
  const range = arrayRange(text, name)
  if (range === null) throw new Error(`${name} not found`)
  JSON.parse(body)
  writeFileSync(path, `${text.slice(0, range.open)}${body}${text.slice(range.close + 1)}`, 'utf8')
}

/** JSON one-liner. */
const line = (value) => JSON.stringify(value)

/**
 * Render a list with one compact item per line, so a change touches one line.
 * @param items - values to render.
 * @param indent - indentation of the closing bracket.
 * @returns the array literal text.
 */
function itemList(items, indent) {
  if (items.length === 0) return '[]'
  const pad = ' '.repeat(indent)
  const inner = ' '.repeat(indent + 2)
  return `[\n${items.map((item) => inner + line(item)).join(',\n')}\n${pad}]`
}

/**
 * Render a snapshot with one element per line.
 * @param snapshot - recorded snapshot.
 * @param indent - indentation of the opening brace.
 * @returns the object literal text.
 */
function formatSnapshot(snapshot, indent) {
  const pad = ' '.repeat(indent)
  const inner = ' '.repeat(indent + 2)
  const rows = [
    `${inner}"calls": ${line(snapshot.calls)},`,
    `${inner}"elements": ${itemList(snapshot.elements, indent + 2)},`,
    `${inner}"selected": ${line(snapshot.selected)},`,
    `${inner}"view": ${line(snapshot.view)},`,
    `${inner}"historyIndex": ${line(snapshot.historyIndex)},`,
    `${inner}"historyLength": ${line(snapshot.historyLength)},`,
    `${inner}"clipboard": ${itemList(snapshot.clipboard, indent + 2)},`,
    `${inner}"zoomUntil": ${line(snapshot.zoomUntil)}${snapshot.handled === undefined ? '' : ','}`,
  ]
  if (snapshot.handled !== undefined) rows.push(`${inner}"handled": ${line(snapshot.handled)}`)
  return `{\n${rows.join('\n')}\n${pad}}`
}

/**
 * Render a controller scenario.
 * @param scenario - recorded scenario.
 * @returns the object literal text.
 */
function formatScenario(scenario) {
  const setup = [`    "elements": ${itemList(scenario.setup.elements, 4)}`]
  if (scenario.setup.selected !== undefined) setup.push(`    "selected": ${line(scenario.setup.selected)}`)
  if (scenario.setup.view !== undefined) setup.push(`    "view": ${line(scenario.setup.view)}`)
  const rows = ['{', `  "name": ${line(scenario.name)},`, '  "setup": {', setup.join(',\n'), '  },', '  "steps": [']
  scenario.steps.forEach((step, index) => {
    const comma = index === scenario.steps.length - 1 ? '' : ','
    rows.push('    {', `      "op": ${line(step.op)},`, `      "snapshot": ${formatSnapshot(step.snapshot, 6)}`, `    }${comma}`)
  })
  rows.push('  ]', '}')
  return rows.join('\n')
}

/**
 * Render a menu scenario; the tree stays one line because it is data, not geometry.
 * @param scenario - recorded menu scenario.
 * @returns the object literal text.
 */
function formatMenu(scenario) {
  const rows = [
    `  "name": ${line(scenario.name)},`,
    `  "setup": ${line(scenario.setup)},`,
    `  "event": ${line(scenario.event)},`,
    `  "context": ${line(scenario.context)},`,
    `  "menu": ${line(scenario.menu)},`,
    `  "calls": ${line(scenario.calls)},`,
    `  "selected": ${line(scenario.selected)}`,
  ]
  return `{\n${rows.join('\n')}\n}`
}

/** Suite selection from argv. */
const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const suite = flag('--suite') ?? 'all'
const filter = flag('--scenario')
const wants = (name) => suite === 'all' || suite === name

if (wants('controller')) {
  const before = await readArray('CONTROLLER_SCENARIOS')
  let recorded = 0
  const scenarios = before.map((scenario) => {
    if (filter !== undefined && !scenario.name.includes(filter)) return scenario
    const snapshots = replayScenario(scenario)
    recorded += 1
    return { ...scenario, steps: scenario.steps.map((step, index) => ({ op: step.op, snapshot: snapshots[index] })) }
  })
  const body = `[\n${scenarios.map(formatScenario).join(',\n')}\n]`
  writeArray(controllerPath, 'CONTROLLER_SCENARIOS', body)
  console.log(`controller: replayed ${recorded} of ${scenarios.length} scenario(s)`)
}

if (wants('menu')) {
  const before = await readArray('MENU_SCENARIOS')
  let recorded = 0
  const scenarios = before.map((scenario) => {
    if (filter !== undefined && !scenario.name.includes(filter)) return scenario
    recorded += 1
    return { ...scenario, ...replayMenu(scenario) }
  })
  writeArray(controllerPath, 'MENU_SCENARIOS', `[\n${scenarios.map(formatMenu).join(',\n')}\n]`)
  console.log(`menu: replayed ${recorded} of ${scenarios.length} scenario(s)`)
}

if (wants('render')) {
  const labels = {
    imageLoading: '加载中...',
    codeNodeFallbackTitle: '节点',
    codeNodeBadge: '◯ node',
    noteLinkFallback: '链接',
    codeCardPrefix: '📄 ',
  }
  const sceneOf = (input) => ({
    elements: input.elements,
    view: input.view,
    width: input.width,
    height: input.height,
    preferences: { backgroundColor: input.backgroundColor, gridColor: input.gridColor, showGrid: input.showGrid },
    labels,
    images: new Map(input.imageKeys.map((key) => [key, {}])),
    selectedIds: new Set(input.selectedIds),
    hoveredLineId: input.hoveredLineId,
    hoverPin: input.hoverPin ?? null,
    selectionRect: input.selectionRect ?? null,
    pinDrag: input.pinDrag ?? null,
    zoomBadgeAlpha: input.zoomBadgeAlpha,
    lockPulseIds: new Set(input.lockPulseIds ?? []),
    editingIds: new Set(input.editingIds ?? []),
  })
  const traces = RENDER_INPUTS.map((input) => {
    const recorder = new RenderRecorder({ roundRect: true })
    const effects = drawScene(recorder, sceneOf(input))
    return { name: input.name, calls: recorder.calls, loads: [...effects.loadImages] }
  })
  const body = `[\n${traces
    .map((trace) => [
      '  {',
      `    "name": ${line(trace.name)},`,
      `    "calls": ${itemList(trace.calls, 4)},`,
      `    "loads": ${itemList(trace.loads, 4)}`,
      '  }',
    ].join('\n'))
    .join(',\n')}\n]`
  writeArray(renderPath, 'GOLDEN_RENDER', body)
  console.log(`render: recorded ${traces.length} trace(s)`)
}

if (wants('geometry')) {
  const offsets = GOLDEN_PIN_OFFSETS.map((query) => ({
    ...query,
    result: pinPosition(
      {
        w: query.w,
        h: query.h,
        inputs: Array.from({ length: query.inputCount }, (_, index) => ({ id: `i${index}`, label: `i${index}` })),
        outputs: Array.from({ length: query.outputCount }, (_, index) => ({ id: `o${index}`, label: `o${index}` })),
      },
      query.isInput,
      query.index,
    ),
  }))
  const pins = GOLDEN_PIN_AT.map((query) => ({ ...query, hit: pinAt(GEOMETRY_ELEMENTS, query.x, query.y, query.scale) }))
  const endpoints = GOLDEN_LINE_ENDPOINT_AT.map((query) => ({ ...query, hit: lineEndpointAt(GEOMETRY_ELEMENTS, query.x, query.y, query.scale) }))
  const world = GOLDEN_PIN_WORLD.map((query) => ({ ...query, result: pinWorldPosition(GEOMETRY_ELEMENTS, query.nodeId, query.pinId) }))
  const onePerLine = (items) => `[\n${items.map((entry) => `  ${line(entry)}`).join(',\n')}\n]`
  writeArray(geometryPath, 'GOLDEN_PIN_WORLD', onePerLine(world))
  writeArray(geometryPath, 'GOLDEN_PIN_OFFSETS', onePerLine(offsets))
  writeArray(geometryPath, 'GOLDEN_PIN_AT', onePerLine(pins))
  writeArray(geometryPath, 'GOLDEN_LINE_ENDPOINT_AT', onePerLine(endpoints))
  console.log(`geometry: ${world.length} world pins, ${offsets.length} offsets, ${pins.length} hits, ${endpoints.length} endpoints`)
}

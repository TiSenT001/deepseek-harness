/**
 * Large-canvas acceptance gate: build a deterministic document with many inline
 * pictures, send it through the same read/write routes a real canvas uses, and
 * fail when loading or saving it exceeds the recorded budgets.
 *
 * Usage:
 *   node scripts/pur-large-doc-bench.mjs <app-url> [--elements 300] [--image-kb 200] [--json]
 *
 * The document is written to a temporary canvas path and deleted afterwards, so the
 * bench never touches a real canvas. Budgets are generous on purpose: they detect a
 * regression in order of magnitude, not small machine noise.
 */
import { randomBytes } from 'node:crypto'

const url = process.argv[2]
if (url === undefined) {
  console.error('usage: node scripts/pur-large-doc-bench.mjs <app-url> [--elements N] [--image-kb K]')
  process.exit(2)
}
const flag = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index >= 0 ? Number(process.argv[index + 1]) : fallback
}
const elementCount = flag('--elements', 300)
const imageKb = flag('--image-kb', 200)
const json = process.argv.includes('--json')

/** Budgets in milliseconds for a document of the default size. */
const BUDGET = { read: 8000, parse: 800, stringify: 600, write: 4000, save: 4500 }

const origin = new URL(url).origin
const api = (route) => `${origin}/obsidian/api/${route}`
const tokenFile = process.env.DSH_WEB_TOKEN_FILE
const token = tokenFile === undefined
  ? (new URL(url).searchParams.get('token') ?? '')
  : (await import('node:fs')).readFileSync(tokenFile, 'utf8').trim()
const withToken = (target) => {
  const next = new URL(target)
  if (token !== '') next.searchParams.set('token', token)
  return next
}

/**
 * One inline picture whose payload is as large as requested.
 * @param index - element index, used only for the alt text.
 * @returns a data URL.
 */
function picture(index) {
  return `data:image/png;base64,${randomBytes(Math.round((imageKb * 1024 * 3) / 4)).toString('base64').slice(0, imageKb * 1024)}${index === -1 ? '' : ''}`
}

const elements = Array.from({ length: elementCount }, (_, index) => ({
  id: `bench-${index}`,
  type: 'image',
  x: (index % 20) * 320,
  y: Math.floor(index / 20) * 240,
  w: 300,
  h: 200,
  original: '',
  dataURL: picture(index),
  rotation: 0,
  opacity: 1,
}))
const document = { elements, viewState: { offsetX: 0, offsetY: 0, scale: 1 } }
const payload = JSON.stringify(document)
const path = `Pur画布/性能基准-${Date.now()}.PurStudio`
const target = withToken(api('bridge/write-text'))

/**
 * Write the document once so the bench measures an update, like a real save.
 * @returns the write duration in milliseconds.
 */
async function writeOnce() {
  const started = performance.now()
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, content: payload }),
  })
  if (!response.ok) throw new Error(`write failed: ${response.status}`)
  return performance.now() - started
}

let exitCode = 0
try {
  const writeMs = await writeOnce()
  const readStarted = performance.now()
  const response = await fetch(withToken(`${api('bridge/read-text')}?path=${encodeURIComponent(path)}`))
  const body = await response.json()
  const readMs = performance.now() - readStarted
  const parseStarted = performance.now()
  const parsed = JSON.parse(body.content)
  const parseMs = performance.now() - parseStarted
  const stringifyStarted = performance.now()
  const serialized = JSON.stringify({ elements: parsed.elements, viewState: parsed.viewState })
  const stringifyMs = performance.now() - stringifyStarted
  const saveStarted = performance.now()
  await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, content: serialized }),
  })
  const saveMs = performance.now() - saveStarted
  const results = {
    elements: elementCount,
    imageKb,
    megabytes: Math.round(payload.length / 1048576),
    readMs: Math.round(readMs),
    parseMs: Math.round(parseMs),
    stringifyMs: Math.round(stringifyMs),
    writeMs: Math.round(writeMs),
    saveMs: Math.round(saveMs),
    budgets: BUDGET,
    pass: readMs <= BUDGET.read
      && parseMs <= BUDGET.parse
      && stringifyMs <= BUDGET.stringify
      && writeMs <= BUDGET.write
      && saveMs <= BUDGET.save,
  }
  if (json) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    console.log(`doc ${results.megabytes}MB · ${elementCount} images of ${imageKb}KB`)
    console.log(`read ${results.readMs}ms (≤${BUDGET.read}) · parse ${results.parseMs}ms (≤${BUDGET.parse}) · stringify ${results.stringifyMs}ms (≤${BUDGET.stringify})`)
    console.log(`write ${results.writeMs}ms (≤${BUDGET.write}) · save ${results.saveMs}ms (≤${BUDGET.save})`)
    console.log(results.pass ? 'PASS' : 'FAIL')
  }
  exitCode = results.pass ? 0 : 1
} finally {
  await fetch(withToken(api('delete')), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  }).catch(() => undefined)
}
process.exit(exitCode)

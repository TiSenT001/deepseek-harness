import { writeFileSync } from 'node:fs'
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

/**
 * Canvas load/pan benchmark: builds N distinct pictures, a grid canvas that
 * references them, then measures document size, first paint, JS heap and the
 * 99th percentile frame time while panning.
 */
const url = process.argv[2]
const count = Number(process.argv[3] ?? '300')
const canvasPath = 'G:/个人知识库/Pur画布/性能基准.purstudio'
/** Origin only: the page URL carries the token in its query string. */
const origin = new URL(url).origin
/** Store calls come from Node, so they need the token the app would carry. */
const token = process.argv[4] ?? ''
/** Initial zoom; 1 decodes everything on screen, 0.35 exercises the tile path. */
const scale = Number(process.argv[5] ?? '0.35')

/** One distinct PNG of the given size, so every element decodes separately. */
function pngBytes(index, width = 640, height = 480) {
  // Raw RGBA scanlines with a per-image tint, wrapped in a minimal PNG.
  const bytesPerRow = width * 4 + 1
  const raw = Buffer.alloc(bytesPerRow * height)
  for (let y = 0; y < height; y++) {
    raw[y * bytesPerRow] = 0
    for (let x = 0; x < width; x++) {
      const at = y * bytesPerRow + 1 + x * 4
      // Smooth gradients per image keep the PNG small while decoding to a full
      // 640x480 bitmap, which is what the cache budget is about.
      raw[at] = (x * 255 / width + index * 5) % 256
      raw[at + 1] = (y * 255 / height + index * 9) % 256
      raw[at + 2] = ((x + y) * 255 / (width + height) + index * 13) % 256
      raw[at + 3] = 255
    }
  }
  return raw
}

/** Minimal PNG encoder for a raw RGBA buffer. */
async function encodePng(raw, width, height) {
  const zlib = await import('node:zlib')
  const { deflateSync } = zlib
  const chunks = []
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  chunks.push(signature, chunk('IHDR', ihdr))
  chunks.push(chunk('IDAT', deflateSync(raw, { level: 6 })))
  chunks.push(chunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(chunks)
}

/** One length-prefixed, CRC-checked PNG chunk. */
function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0, 0)
  return Buffer.concat([length, body, crc])
}

/** CRC-32 as PNG defines it. */
function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

console.log(`building ${count} images…`)
const refs = []
for (let index = 0; index < count; index++) {
  const png = await encodePng(pngBytes(index), 640, 480)
  const dataUrl = `data:image/png;base64,${png.toString('base64')}`
  const suffix = token === '' ? '' : `?token=${encodeURIComponent(token)}`
  const response = await fetch(`${origin}/obsidian/api/pur/store-image${suffix}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: `bench-${index}.png`, dataUrl }),
  })
  if (!response.ok) throw new Error(`store-image failed: ${response.status}`)
  const body = await response.json()
  refs.push(body.ref)
}
console.log(`stored ${refs.length} assets`)

const columns = Math.ceil(Math.sqrt(count))
const elements = refs.map((ref, index) => ({
  id: `i${index}`,
  type: 'image',
  x: (index % columns) * 240,
  y: Math.floor(index / columns) * 190,
  w: 220,
  h: 165,
  original: ref,
}))
const document = JSON.stringify({ elements, viewState: { offsetX: 0, offsetY: 0, scale } }, null, 2)
writeFileSync(canvasPath, document, 'utf8')
console.log(`document: ${(document.length / 1024).toFixed(0)} KB`)

const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
if ((await page.locator('.ov-root').count()) === 0) await page.locator('button', { hasText: '知识库' }).first().click()
await page.locator('.ov-root').waitFor({ timeout: 15000 })
await page.locator('.ov-tree .ov-dir[title="Pur画布"]').first().click()
await page.waitForTimeout(600)

const started = Date.now()
await page.locator('.ov-tree .ov-file[title="Pur画布/性能基准.purstudio"]').first().click()
await page.locator('canvas').first().waitFor({ timeout: 60000 })
// Two frames after the canvas exists means the first paint has happened; waiting
// a fixed interval would fold the bench's own sleep into the number.
await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const openMs = Date.now() - started
await page.waitForTimeout(1200)

const heap = await page.evaluate(() => (performance.memory === undefined ? undefined : performance.memory.usedJSHeapSize))
// Chromium reports the same number through CDP when the JS flag is not set.
let cdpHeap
try {
  const session = await page.context().newCDPSession(page)
  const { metrics } = await session.send('Performance.getMetrics')
  cdpHeap = metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value
  await session.detach()
} catch {
  cdpHeap = undefined
}

// Frame deltas sampled inside the page: driving the wheel through the protocol
// would measure the round trip instead of the canvas.
const frames = await page.evaluate(async () => {
  const canvas = document.querySelector('canvas')
  if (canvas === null) return []
  const samples = []
  let last = performance.now()
  let running = true
  const tick = () => {
    if (!running) return
    const now = performance.now()
    samples.push(now - last)
    last = now
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  for (let step = 0; step < 90; step++) {
    canvas.dispatchEvent(new WheelEvent('wheel', {
      deltaY: step % 2 === 0 ? 120 : -120,
      clientX: 400,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    }))
    await new Promise((resolve) => setTimeout(resolve, 16))
  }
  running = false
  return samples
})
frames.sort((a, b) => a - b)
const p99 = frames[Math.floor(frames.length * 0.99)] ?? 0
const median = frames[Math.floor(frames.length * 0.5)] ?? 0

console.log(JSON.stringify({
  images: count,
  scale,
  documentKB: Math.round(document.length / 1024),
  openMs,
  heapMB: heap === undefined ? undefined : Math.round(heap / 1048576),
  cdpHeapMB: cdpHeap === undefined ? undefined : Math.round(cdpHeap / 1048576),
  wheelMedianMs: median,
  wheelP99Ms: p99,
}, null, 2))

await browser.close()

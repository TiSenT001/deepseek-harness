import { chromium } from './playwright-env.mjs'

// G7 acceptance, part 2: force sliders reheat the live simulation without a
// refetch or rebuild, and the global graph lays out without main-thread long
// tasks (worker path when > 120 nodes).

const url = process.argv[2]
if (url === undefined) {
  console.error('usage: node graph-forces-probe.mjs <url>')
  process.exit(1)
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
  window.__longtasks = []
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__longtasks.push(Math.round(entry.duration))
  }).observe({ entryTypes: ['longtask'] })
  // Sampled canvas snapshot helpers: __snap() stores, __diff() counts changed
  // pixels (every 4th pixel in both axes) against the stored frame.
  window.__snap = () => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return false
    window.__frame = c.getContext('2d').getImageData(0, 0, c.width, c.height).data.slice()
    return true
  }
  window.__diff = () => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null || window.__frame === undefined) return -1
    const now = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    const before = window.__frame
    let changed = 0
    for (let i = 0; i < now.length; i += 16) {
      if (Math.abs(now[i] - before[i]) > 12
        || Math.abs(now[i + 1] - before[i + 1]) > 12
        || Math.abs(now[i + 2] - before[i + 2]) > 12) changed += 1
    }
    return changed
  }
})

const result = { slider: null, global: null, errors: [] }
const graphRequests = []

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.locator('button', { hasText: '知识库' }).first().click()
  await page.waitForTimeout(600)
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(250)
  await page.keyboard.type('README')
  await page.waitForTimeout(800)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1000)
  await page.locator('button[aria-label="关系图"]').first().click()
  await page.waitForTimeout(3500)
  page.on('request', (request) => {
    if (request.url().includes('/obsidian/api/graph')) graphRequests.push(request.url())
  })
  // Park the pointer off the canvas so hover never dirties the pixel diff.
  await page.mouse.move(20, 20)

  const canvas = page.locator('canvas.ov-graph-canvas')
  if ((await canvas.boundingBox()) === null) throw new Error('canvas not found')

  // Wait out the initial layout (alpha 1 cools in ~5s at 60fps).
  await page.waitForTimeout(7000)
  await page.mouse.move(20, 20)
  await page.waitForTimeout(300)

  // --- Slider live reheat ---
  await page.evaluate(() => window.__snap())
  await page.waitForTimeout(500)
  const cooledDiff = await page.evaluate(() => window.__diff())
  const beforeCount = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.positions ?? '')
  const beforeRequests = graphRequests.length

  await page.locator('.ov-graph-tools button[aria-expanded]:has(svg)').first().click()
  await page.waitForTimeout(400)
  const tracks = page.locator('.ov-kit-slider-track')
  const trackCount = await tracks.count()
  if (trackCount < 7) throw new Error(`expected >= 7 sliders, found ${trackCount}`)
  // Slider order per GRAPH_SCHEMA: textFade, nodeScale, linkWidth, then forces
  // center / repel / link / linkDistance. Push repel (index 4) near its max.
  const repel = tracks.nth(4)
  const valueBefore = await repel.getAttribute('aria-valuetext')
  const track = await repel.boundingBox()
  if (track === null) throw new Error('repel slider not visible')
  await page.mouse.click(track.x + track.width * 0.92, track.y + track.height / 2)
  await page.waitForTimeout(150)
  const valueAfter = await repel.getAttribute('aria-valuetext')

  // Motion must resume without any graph refetch and without losing nodes.
  await page.mouse.move(20, 20)
  await page.waitForTimeout(300)
  await page.evaluate(() => window.__snap())
  await page.waitForTimeout(500)
  const reheatedDiff = await page.evaluate(() => window.__diff())
  const afterCount = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.positions ?? '')

  result.slider = {
    trackCount,
    valueBefore,
    valueAfter,
    valueChanged: valueBefore !== valueAfter,
    cooledDiff,
    reheatedDiff,
    noRefetch: graphRequests.length === beforeRequests,
    noRebuild: beforeCount === afterCount && afterCount !== '0',
    reheated: reheatedDiff > Math.max(1000, cooledDiff * 10),
  }

  // --- Global graph: worker layout without main-thread long tasks ---
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  await page.evaluate(() => { window.__longtasks = [] })
  await page.locator('.ov-graph-tools button').first().click()
  const globalStart = Date.now()
  // Wait until the node count is stable across two 1s reads (layout cooled).
  let nodes = '0'
  let previous = ''
  while (Date.now() - globalStart < 30000) {
    await page.waitForTimeout(1000)
    nodes = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.positions ?? '0')
    if (nodes === previous && nodes !== '0') break
    previous = nodes
  }
  const longtasks = await page.evaluate(() => window.__longtasks)
  const workerLoaded = await page.evaluate(() =>
    performance.getEntriesByType('resource').some(entry => entry.name.includes('worker.js')))

  result.global = {
    nodes: Number(nodes),
    workerLoaded,
    longtasks,
    longtaskCount: longtasks.length,
    noLongTasks: longtasks.length === 0,
  }

  await page.screenshot({ path: '.artifacts/ui/graph-forces.png' })
} catch (cause) {
  result.errors.push(String(cause?.stack ?? cause))
}

console.log(JSON.stringify(result, null, 2))
await browser.close()
process.exit(result.errors.length > 0 ? 1 : 0)

import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1343, height: 723 } })
// Simulate a host that cannot serve the worker script.
await page.route('**/worker.js', route => route.abort())
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(4000)
const state = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  if (c === null) return { canvas: false }
  const ctx = c.getContext('2d')
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  let painted = 0
  for (let i = 3; i < data.length; i += 4 * 53) if (data[i] > 0) painted += 1
  return { canvas: true, width: c.width, height: c.height, painted, zoom: c.dataset.zoom, header: document.querySelector('.ov-note-head')?.textContent?.slice(0, 40) }
})
await page.screenshot({ path: '.artifacts/ui/59-worker-blocked.png' })
console.log(JSON.stringify({ state, errors }, null, 2))
await browser.close()

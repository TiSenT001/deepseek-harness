import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 160)}`))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(3500)
const canvasInfo = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.ov-graph-canvas')
  if (canvas === null) return { canvas: false }
  const ctx = canvas.getContext('2d')
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let painted = 0
  for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 0) painted += 1
  return { canvas: true, width: canvas.width, height: canvas.height, paintedSamples: painted }
})
const header = await page.evaluate(() => document.querySelector('.ov-note-head')?.textContent?.slice(0, 80))
await page.screenshot({ path: '.artifacts/ui/50-canvas-global.png' })
console.log(JSON.stringify({ canvasInfo, header, errors }, null, 2))
await browser.close()

import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const graphCalls = []
const errors = []
page.on('response', async (res) => {
  if (res.url().includes('/graph')) graphCalls.push({ status: res.status(), url: res.url().slice(0, 140) })
})
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(3500)
const state = await page.evaluate(() => ({
  header: document.querySelector('.ov-note-head')?.textContent?.slice(0, 60),
  canvas: document.querySelectorAll('canvas.ov-graph-canvas').length,
  zoom: document.querySelector('canvas.ov-graph-canvas')?.dataset.zoom,
  empty: document.querySelectorAll('.ov-empty').length,
}))
await page.screenshot({ path: '.artifacts/ui/57-graph-empty.png' })
console.log(JSON.stringify({ state, graphCalls, errors }, null, 2))
await browser.close()

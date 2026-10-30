import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const workerRequests = []
page.on('request', (request) => { if (request.url().includes('worker.js')) workerRequests.push(request.url()) })
const consoleErrors = []
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 160)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1000)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1000)
const result = await page.evaluate(async () => {
  const durations = []
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) durations.push(Math.round(entry.duration)) })
  observer.observe({ type: 'longtask', buffered: false })
  const scope = [...document.querySelectorAll('.ov-note-head button')].find(b => /局部图|全库图/.test(b.textContent ?? ''))
  scope?.click()
  await new Promise(resolve => setTimeout(resolve, 7000))
  observer.disconnect()
  return { durations, nodes: document.querySelectorAll('.ov-graph circle').length }
})
await page.screenshot({ path: '.artifacts/ui/40-worker-global.png' })
console.log(JSON.stringify({ workerRequests, consoleErrors, ...result, maxLong: Math.max(0, ...result.durations) }, null, 2))
await browser.close()

import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3200)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(800)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1000)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1200)
const before = await page.evaluate(() => document.querySelectorAll('.ov-graph circle').length)
const result = await page.evaluate(async () => {
  const durations = []
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) durations.push(Math.round(entry.duration)) })
  observer.observe({ type: 'longtask', buffered: false })
  const scope = [...document.querySelectorAll('.ov-note-head button')].find(b => /局部图|全库图/.test(b.textContent ?? ''))
  scope?.click()
  const started = performance.now()
  await new Promise(resolve => setTimeout(resolve, 8000))
  observer.disconnect()
  return { durations, elapsed: Math.round(performance.now() - started), scopeLabel: scope?.textContent }
})
const after = await page.evaluate(() => ({
  nodes: document.querySelectorAll('.ov-graph circle').length,
  heading: [...document.querySelectorAll('.ov-note-head button')].map(b => b.textContent?.trim()).filter(Boolean),
}))
await page.screenshot({ path: '.artifacts/ui/31-global-graph.png' })
console.log(JSON.stringify({ before, after, ...result, maxLong: Math.max(0, ...result.durations) }, null, 2))
await browser.close()

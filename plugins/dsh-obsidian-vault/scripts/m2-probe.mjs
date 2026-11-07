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
await page.waitForTimeout(1500)
// read force slider values
await page.locator('button', { hasText: '⚙' }).first().click()
await page.waitForTimeout(400)
const sliders = await page.evaluate(() => [...document.querySelectorAll('.ov-graph-range input[type=range]')].map(s => s.value))
const labels = await page.evaluate(() => [...document.querySelectorAll('.ov-graph-range')].map(r => r.textContent?.trim()))
await page.screenshot({ path: '.artifacts/ui/30-forces.png' })
// switch to global graph and measure long tasks
const longTasks = await page.evaluate(async () => {
  const entries = []
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) entries.push(Math.round(entry.duration)) })
  observer.observe({ type: 'longtask', buffered: true })
  const button = [...document.querySelectorAll('.ov-top button')].find(b => b.textContent?.includes('全库') || b.textContent?.includes('局部'))
  button?.click()
  await new Promise(resolve => setTimeout(resolve, 6000))
  observer.disconnect()
  return entries
})
const counts = await page.evaluate(() => ({ nodes: document.querySelectorAll('.ov-graph circle').length, header: document.querySelector('.ov-note-head strong, .ov-note-head button')?.textContent?.trim() }))
await page.screenshot({ path: '.artifacts/ui/31-global-graph.png' })
console.log(JSON.stringify({ sliders, labels, longTasks, counts }, null, 2))
await browser.close()

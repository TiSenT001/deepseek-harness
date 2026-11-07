import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1100)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(2500)
const local = await page.evaluate(() => {
  const circles = [...document.querySelectorAll('.ov-graph circle')]
  return { count: circles.length, nonzero: circles.filter(c => Number(c.getAttribute('cx')) !== 0 || Number(c.getAttribute('cy')) !== 0).length }
})
// switch to global
await page.locator('.ov-note-head button', { hasText: /局部图|全库图/ }).first().click()
await page.waitForTimeout(3000)
const global = await page.evaluate(() => {
  const circles = [...document.querySelectorAll('.ov-graph circle')]
  const xs = circles.map(c => Number(c.getAttribute('cx')))
  const ys = circles.map(c => Number(c.getAttribute('cy')))
  return {
    count: circles.length,
    nonzero: circles.filter(c => Number(c.getAttribute('cx')) !== 0 || Number(c.getAttribute('cy')) !== 0).length,
    bounds: [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].map(v => Math.round(v)),
  }
})
await page.screenshot({ path: '.artifacts/ui/47-global-collapse.png' })
console.log(JSON.stringify({ local, global }, null, 2))
await browser.close()

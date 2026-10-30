import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1100)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1500)
const snapshot = () => page.evaluate(() => {
  const circles = [...document.querySelectorAll('.ov-graph circle')]
  return circles.slice(0, 5).map(c => `${c.getAttribute('cx')},${c.getAttribute('cy')}`)
})
const before = await snapshot()
// change depth 1 -> 2
await page.locator('.ov-graph-select').first().selectOption('2').catch(async () => {
  const selects = page.locator('.ov-note-head select')
  await selects.last().selectOption('2')
})
await page.waitForTimeout(2200)
const after = await snapshot()
const count = await page.evaluate(() => document.querySelectorAll('.ov-graph circle').length)
// zoom with wheel at a point and check scale
const scaleBefore = await page.evaluate(() => document.querySelector('.ov-graph > g[transform]')?.getAttribute('transform'))
await page.locator('.ov-graph').hover({ position: { x: 500, y: 300 } })
await page.mouse.wheel(0, -240)
await page.waitForTimeout(500)
const scaleAfter = await page.evaluate(() => document.querySelector('.ov-graph > g[transform]')?.getAttribute('transform'))
await page.screenshot({ path: '.artifacts/ui/43-g3.png' })
console.log(JSON.stringify({ before, after, count, scaleBefore, scaleAfter, errors }, null, 2))
await browser.close()

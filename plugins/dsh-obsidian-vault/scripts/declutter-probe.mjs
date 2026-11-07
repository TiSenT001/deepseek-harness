import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(3500)
const state = await page.evaluate(() => {
  const circles = [...document.querySelectorAll('.ov-graph circle')]
  const labels = [...document.querySelectorAll('.ov-graph text')]
  const edges = [...document.querySelectorAll('.ov-graph line')]
  return {
    nodes: circles.length,
    labels: labels.length,
    edges: edges.length,
    edgeOpacity: edges[0] === undefined ? null : getComputedStyle(edges[0]).strokeOpacity,
    nonzero: circles.filter(c => Number(c.getAttribute('cx')) !== 0).length,
  }
})
await page.screenshot({ path: '.artifacts/ui/49-global-declutter.png' })
console.log(JSON.stringify(state))
await browser.close()

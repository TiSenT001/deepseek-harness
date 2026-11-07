import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1389, height: 755 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 180)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 180)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
// click the README file in the tree exactly like a user would
await page.locator('.ov-file', { hasText: 'README' }).first().click()
await page.waitForTimeout(1200)
const afterClick = await page.evaluate(() => ({ tab: document.querySelector('.ov-doctab-active .ov-doctab-label')?.textContent }))
// now open the graph
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(4000)
const state = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  return {
    canvas: c !== null,
    positions: c?.dataset.positions,
    edges: c?.dataset.edges,
    zoom: c?.dataset.zoom,
    header: document.querySelector('.ov-note-head')?.textContent?.slice(0, 44),
    hint: [...document.querySelectorAll('.ov-note-head span')].map(s => s.textContent).slice(0, 6),
  }
})
await page.screenshot({ path: '.artifacts/ui/61-tree-click-graph.png' })
console.log(JSON.stringify({ afterClick, state, errors }, null, 2))
await browser.close()

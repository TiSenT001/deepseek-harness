/**
 * Probe the search surface and the graph filter controls.
 * Usage: node scripts/search-probe.mjs <token-url>
 */
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/search-probe.mjs <token-url>')
const outDir = '.artifacts/ui'

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await mkdir(outDir, { recursive: true })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(1200)

await page.keyboard.press('Control+f')
await page.waitForTimeout(400)
await page.locator('.ov-search-input').fill('审计')
await page.waitForTimeout(1200)
await page.screenshot({ path: `${outDir}/09-search.png` })
const search = await page.evaluate(() => ({
  count: document.querySelectorAll('.ov-search-item').length,
  snippets: [...document.querySelectorAll('.ov-search-snippet')].slice(0, 3).map(node => node.textContent),
  marks: document.querySelectorAll('.ov-search-snippet .ov-highlight').length,
}))
console.log(JSON.stringify({ search }, null, 2))

await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.keyboard.press('Control+o')
await page.waitForTimeout(250)
await page.keyboard.type('TiSenT-GPU')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(1200)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(1500)
await page.screenshot({ path: `${outDir}/10-graph-filters.png` })
const graph = await page.evaluate(() => ({
  filters: document.querySelectorAll('.ov-graph-filter').length,
  selects: [...document.querySelectorAll('.ov-graph-select')].map(node => node.querySelectorAll('option').length),
  nodes: document.querySelectorAll('.ov-graph circle').length,
}))
console.log(JSON.stringify({ graph }, null, 2))
await browser.close()

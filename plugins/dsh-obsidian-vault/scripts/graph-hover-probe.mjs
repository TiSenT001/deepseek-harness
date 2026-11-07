/**
 * Hover one graph node: neighbours stay lit, the rest dim.
 * Usage: node scripts/graph-hover-probe.mjs <token-url>
 */
import { chromium } from './playwright-env.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/graph-hover-probe.mjs <token-url>')
const outDir = '.artifacts/ui'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(1000)
await page.keyboard.press('Control+o')
await page.waitForTimeout(250)
await page.keyboard.type('TiSenT-GPU')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(1000)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1200)

const target = page.locator('.ov-graph circle').nth(3)
await target.hover()
await page.waitForTimeout(500)
await page.screenshot({ path: `${outDir}/13-graph-hover.png` })
const state = await page.evaluate(() => ({
  nodes: document.querySelectorAll('.ov-graph circle').length,
  dimmed: document.querySelectorAll('.ov-node-dim').length,
  active: document.querySelectorAll('.ov-node-active').length,
  dimEdges: document.querySelectorAll('.ov-edge-dim').length,
}))
console.log(JSON.stringify(state, null, 2))
await browser.close()

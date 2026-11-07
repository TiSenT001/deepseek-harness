/**
 * Verify the graph animates: sample one node's coordinates right after opening
 * and again after the ease settles, then screenshot the result.
 * Usage: node scripts/graph-anim-probe.mjs <token-url>
 */
import { chromium } from './playwright-env.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/graph-anim-probe.mjs <token-url>')
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

const sample = async () => page.evaluate(() => {
  const circle = document.querySelector('.ov-graph circle')
  return circle === null ? null : { cx: Number(circle.getAttribute('cx')), cy: Number(circle.getAttribute('cy')) }
})
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
const early = await sample()
await page.screenshot({ path: `${outDir}/11-graph-early.png` })
await page.waitForTimeout(900)
const settled = await sample()
await page.screenshot({ path: `${outDir}/12-graph-settled.png` })

console.log(JSON.stringify({
  early,
  settled,
  moved: early !== null && settled !== null
    && (Math.abs(early.cx - settled.cx) > 1 || Math.abs(early.cy - settled.cy) > 1),
}, null, 2))
await browser.close()

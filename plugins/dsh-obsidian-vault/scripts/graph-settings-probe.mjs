/**
 * Verify the graph settings: ghost nodes, filters, groups, arrows, panel.
 * Usage: node scripts/graph-settings-probe.mjs <token-url>
 */
import { chromium } from './playwright-env.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/graph-settings-probe.mjs <token-url>')
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
await page.waitForTimeout(900)
await page.keyboard.press('Control+o')
await page.waitForTimeout(250)
await page.keyboard.type('TiSenT-GPU')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(900)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1200)

const count = async () => page.evaluate(() => ({
  nodes: document.querySelectorAll('.ov-graph circle').length,
  ghosts: document.querySelectorAll('.ov-node-unresolved').length,
  tags: document.querySelectorAll('.ov-node-tag').length,
}))

const initial = await count()

// Open the settings panel.
await page.locator('button', { hasText: '⚙' }).first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${outDir}/14-graph-settings.png` })

// Existing files only: ghost nodes disappear.
const existingOnly = page.locator('.ov-graph-toggle', { hasText: '仅显示已存在的笔记' }).locator('input')
if (await existingOnly.count() > 0) {
  await existingOnly.check()
  await page.waitForTimeout(900)
}
const afterExisting = await count()

// Tags as nodes.
const tagsToggle = page.locator('.ov-graph-toggle', { hasText: '标签作为节点' }).locator('input')
if (await tagsToggle.count() > 0) {
  await tagsToggle.check()
  await page.waitForTimeout(900)
}
const afterTags = await count()

// Continuous animation: the toggle stays on so the layout never freezes.
const animateToggle = page.locator('.ov-graph-toggle', { hasText: '持续动画' }).locator('input')
if (await animateToggle.count() > 0 && !(await animateToggle.isChecked())) {
  await animateToggle.check()
  await page.waitForTimeout(700)
}
const afterAnimate = await count()

// Node size slider.
const before = await page.evaluate(() => Number(document.querySelector('.ov-graph circle')?.getAttribute('r')))
const slider = page.locator('.ov-graph-range input[type="range"]').nth(1)
if (await slider.count() > 0) {
  await slider.fill('1.8')
  await page.waitForTimeout(700)
}
const after = await page.evaluate(() => Number(document.querySelector('.ov-graph circle')?.getAttribute('r')))
await page.screenshot({ path: `${outDir}/15-graph-settings-applied.png` })

console.log(JSON.stringify({ initial, afterExisting, afterTags, afterAnimate, radius: { before, after } }, null, 2))
await browser.close()

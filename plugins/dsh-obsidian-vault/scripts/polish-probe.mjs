/**
 * Verify P5 polish: graph keyboard controls, narrow-screen drawers, property
 * copy, and the loading skeleton.
 * Usage: node scripts/polish-probe.mjs <token-url>
 */
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/polish-probe.mjs <token-url>')
await mkdir('.artifacts/ui', { recursive: true })

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-write', 'clipboard-read'],
})
const page = await context.newPage()
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(900)

const openNote = async (title) => {
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(300)
  await page.keyboard.type(title)
  await page.waitForTimeout(800)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1200)
}

// Property copy.
await openNote('TiSenT-GPU')
await page.locator('.ov-tab', { hasText: '属性' }).first().click()
await page.waitForTimeout(400)
const propertyRow = page.locator('.ov-panel .ov-item').first()
const copyVisible = await propertyRow.count() > 0
if (copyVisible) {
  await propertyRow.click()
  await page.waitForTimeout(300)
}
const copiedLabel = await page.evaluate(() =>
  document.querySelector('.ov-panel .ov-item .ov-item-meta')?.textContent ?? '')

// Graph keyboard.
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForSelector('.ov-graph circle', { timeout: 8000 })
await page.waitForTimeout(1200)
const readTransform = () => page.evaluate(() =>
  document.querySelector('.ov-graph > g[transform]')?.getAttribute('transform') ?? '')
const before = await readTransform()
await page.locator('.ov-graph').click({ position: { x: 400, y: 300 } })
await page.keyboard.press('Equal')
await page.keyboard.press('Equal')
await page.waitForTimeout(500)
const zoomed = await readTransform()
await page.keyboard.press('ArrowRight')
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(400)
const panned = await readTransform()
await page.screenshot({ path: '.artifacts/ui/26-graph-keyboard.png' })

// Narrow screen drawers.
await page.setViewportSize({ width: 980, height: 760 })
await page.waitForTimeout(700)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(600)
const narrowState = await page.evaluate(() => {
  const visible = (selector) => {
    const element = document.querySelector(selector)
    if (element === null) return null
    const style = getComputedStyle(element)
    return { display: style.display, transform: style.transform }
  }
  return {
    toggleDisplay: visible('.ov-narrow-only'),
    tree: visible('.ov-explorer'),
    rail: visible('.ov-rail'),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }
})
await page.locator('button', { hasText: '笔记树' }).first().click()
await page.waitForTimeout(500)
const opened = await page.evaluate(() => {
  const element = document.querySelector('.ov-explorer')
  return element === null ? null : getComputedStyle(element).transform
})
await page.screenshot({ path: '.artifacts/ui/27-narrow-drawer.png' })

// Loading skeleton, with the note request delayed.
const slow = await context.newPage()
await slow.route('**/obsidian/api/note**', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  await route.continue()
})
await slow.goto(url, { waitUntil: 'domcontentloaded' })
await slow.waitForTimeout(3000)
await slow.locator('button', { hasText: '知识库' }).first().click()
await slow.waitForTimeout(800)
await slow.keyboard.press('Control+o')
await slow.waitForTimeout(300)
await slow.keyboard.type('TiSenT-GPU')
await slow.waitForTimeout(700)
await slow.keyboard.press('Enter')
await slow.waitForTimeout(350)
const skeleton = await slow.evaluate(() => ({
  skeleton: document.querySelectorAll('.ov-skeleton').length,
  lines: document.querySelectorAll('.ov-skeleton-line').length,
}))
await slow.screenshot({ path: '.artifacts/ui/28-skeleton.png' })
await slow.close()

console.log(JSON.stringify({ copiedLabel, before, zoomed, panned, narrowState, opened, skeleton }, null, 2))
await browser.close()

/**
 * Verify per-tab scroll restoration and per-tab back/forward history.
 * Usage: node scripts/tab-scroll-probe.mjs <token-url>
 */
import { chromium } from './playwright-env.mjs'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/tab-scroll-probe.mjs <token-url>')

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(900)

const open = async (title) => {
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(300)
  await page.keyboard.type(title)
  await page.waitForTimeout(800)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1100)
}
const scrollTop = () => page.evaluate(() => Math.round(document.querySelector('.ov-scroll')?.scrollTop ?? -1))
const activeLabel = () => page.evaluate(() => document.querySelector('.ov-doctab-active .ov-doctab-label')?.textContent)

await open('外部大脑')
const firstLabel = await activeLabel()
await page.evaluate(() => { const el = document.querySelector('.ov-scroll'); if (el) el.scrollTop = 900 })
await page.waitForTimeout(500)
const scrolled = await scrollTop()

await page.locator('.ov-doctab-new').click()
await page.waitForTimeout(300)
await page.keyboard.type('TiSenT-GPU')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(1200)
const secondLabel = await activeLabel()

await page.locator('.ov-doctab').nth(0).click()
await page.waitForTimeout(900)
const restored = await scrollTop()

await page.locator('.ov-doctab').nth(1).click()
await page.waitForTimeout(500)
await page.locator('.ov-doctab').nth(0).click()
await page.waitForTimeout(900)
const restoredAgain = await scrollTop()

// Per-tab history: follow an internal link in the first tab, then go back.
await page.locator('.ov-doctab').nth(0).click()
await page.waitForTimeout(700)
const linkCount = await page.locator('.ov-document a').count()
let historyOk = null
if (linkCount > 0) {
  await page.locator('.ov-document a').first().click()
  await page.waitForTimeout(1100)
  const afterLink = await activeLabel()
  await page.keyboard.press('Alt+ArrowLeft')
  await page.waitForTimeout(1100)
  const afterBack = await activeLabel()
  historyOk = { afterLink, afterBack, firstLabel }
}

console.log(JSON.stringify({ firstLabel, secondLabel, scrolled, restored, restoredAgain, historyOk }, null, 2))
await browser.close()

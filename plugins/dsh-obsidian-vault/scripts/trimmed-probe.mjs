import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1680, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(800)
const ui = await page.evaluate(() => ({
  sortSelect: document.querySelectorAll('.ov-explorer-select').length,
  extensionToggle: document.querySelectorAll('.ov-explorer-toggle').length,
  densityButton: [...document.querySelectorAll('.ov-top button')].map(b => b.textContent?.trim()),
  toolbar: [...document.querySelectorAll('.ov-explorer-tool')].map(b => b.getAttribute('title')),
  firstFile: document.querySelector('.ov-file')?.textContent,
}))
await page.screenshot({ path: '.artifacts/ui/56-trimmed-ui.png' })
console.log(JSON.stringify({ ui, errors }, null, 2))
await browser.close()

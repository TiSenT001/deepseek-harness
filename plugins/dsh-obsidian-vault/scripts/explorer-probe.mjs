import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(1200)
const tools = await page.evaluate(() => ({
  buttons: [...document.querySelectorAll('.ov-explorer-tool')].map(b => b.getAttribute('title')),
  sort: document.querySelector('.ov-explorer-select')?.value,
  extension: document.querySelector('.ov-explorer-toggle input')?.checked,
  firstFile: document.querySelector('.ov-file')?.textContent,
}))
await page.locator('.ov-explorer-toggle input').check()
await page.waitForTimeout(400)
const withExtension = await page.evaluate(() => document.querySelector('.ov-file')?.textContent)
await page.locator('.ov-explorer-select').selectOption('modified')
await page.waitForTimeout(400)
const sortAfter = await page.evaluate(() => document.querySelector('.ov-explorer-select')?.value)
const file = page.locator('.ov-file').first()
await file.click({ button: 'right' })
await page.waitForTimeout(300)
const menu = await page.evaluate(() => [...document.querySelectorAll('.ov-menu-item')].map(b => b.textContent))
await page.screenshot({ path: '.artifacts/ui/18-explorer-menu.png' })
console.log(JSON.stringify({ tools, withExtension, sortAfter, menu }, null, 2))
await browser.close()

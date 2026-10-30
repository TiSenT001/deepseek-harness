import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3200)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1200)
const tabs = ['大纲', '反链', '属性', '标签']
const counts = {}
for (const label of tabs) {
  await page.locator('.ov-tab', { hasText: label }).first().click()
  await page.waitForTimeout(400)
  counts[label] = await page.evaluate(() => document.querySelectorAll('.ov-panel .ov-item, .ov-panel .ov-backlink-group').length)
}
await page.screenshot({ path: '.artifacts/ui/36-panels.png' })
console.log(JSON.stringify(counts))
await browser.close()

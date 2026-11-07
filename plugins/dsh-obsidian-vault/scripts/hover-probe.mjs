import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3200)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1300)
const link = page.locator('.ov-document a[href*="dsh-obsidian.invalid/open"]').first()
await link.hover()
await page.waitForTimeout(600)
const preview = await page.evaluate(() => {
  const card = document.querySelector('.ov-preview')
  return card === null ? null : { title: card.querySelector('.ov-preview-title')?.textContent, body: (card.querySelector('.ov-preview-body')?.textContent ?? '').slice(0, 40) }
})
await page.screenshot({ path: '.artifacts/ui/37-hover-preview.png' })
console.log(JSON.stringify({ preview }))
await browser.close()

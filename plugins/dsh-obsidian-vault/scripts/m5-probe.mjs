import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3200)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('TiSenT-GPU'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1300)
await page.screenshot({ path: '.artifacts/ui/34-typography.png' })
await page.locator('.ov-tab', { hasText: '属性' }).first().click()
await page.waitForTimeout(500)
const props = await page.evaluate(() => [...document.querySelectorAll('.ov-panel .ov-item')].slice(0, 5).map(item => item.textContent?.trim()))
await page.screenshot({ path: '.artifacts/ui/35-properties.png' })
const metrics = await page.evaluate(() => {
  const doc = document.querySelector('.ov-document')
  const h1 = doc?.querySelector('h1')
  const p = doc?.querySelector('p')
  const style = doc === null || doc === undefined ? null : getComputedStyle(doc)
  return {
    fontSize: style?.fontSize,
    lineHeight: style?.lineHeight,
    width: Math.round(doc?.getBoundingClientRect().width ?? 0),
    h1Size: h1 === null || h1 === undefined ? null : getComputedStyle(h1).fontSize,
    pMargin: p === null || p === undefined ? null : getComputedStyle(p).marginBottom,
  }
})
console.log(JSON.stringify({ props, metrics }, null, 2))
await browser.close()

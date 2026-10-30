import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
const readDensity = () => page.evaluate(() => {
  const root = document.querySelector('.ov-root')
  const item = document.querySelector('.ov-item')
  return {
    variant: root?.getAttribute('data-ov-variant'),
    itemPadding: item === null ? null : getComputedStyle(item).padding,
    gap: getComputedStyle(document.querySelector('.ov-tabs') ?? document.body).gap,
  }
})
const comfortable = await readDensity()
const toggle = page.locator('.ov-top button', { hasText: /宽松|紧凑/ }).first()
const hasToggle = await toggle.count()
if (hasToggle > 0) await toggle.click()
await page.waitForTimeout(500)
const compact = await readDensity()
await page.screenshot({ path: '.artifacts/ui/42-variant-compact.png' })
// reload to confirm persistence
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(700)
const persisted = await readDensity()
console.log(JSON.stringify({ hasToggle, comfortable, compact, persisted, errors }, null, 2))
await browser.close()

/**
 * Verify the tab model: preview tabs, reuse, pin, new tab, context menu.
 * Usage: node scripts/tabs-probe.mjs <token-url>
 */
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/tabs-probe.mjs <token-url>')
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

const state = async () => page.evaluate(() => ({
  tabs: [...document.querySelectorAll('.ov-doctab')].map(tab => ({
    label: tab.querySelector('.ov-doctab-label')?.textContent,
    active: tab.classList.contains('ov-doctab-active'),
    preview: tab.classList.contains('ov-doctab-preview'),
  })),
}))

const files = page.locator('.ov-file')
await files.nth(0).click()
await page.waitForTimeout(900)
const first = await state()

await page.locator('.ov-filter').fill('TiSenT')
await page.waitForTimeout(900)
await page.locator('.ov-file').nth(0).click()
await page.waitForTimeout(900)
const reused = await state()
await page.locator('.ov-filter').fill('')
await page.waitForTimeout(500)

const activeTab = page.locator('.ov-doctab.ov-doctab-active').first()
await activeTab.dblclick()
await page.waitForTimeout(400)
const pinned = await state()

await page.keyboard.press('Control+o')
await page.waitForTimeout(250)
await page.keyboard.type('TiSenT-GPU')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(1000)
const replaced = await state()

await page.locator('.ov-doctab-new').click()
await page.waitForTimeout(300)
await page.keyboard.type('外部大脑')
await page.waitForTimeout(800)
await page.keyboard.press('Enter')
await page.waitForTimeout(1000)
const twoTabs = await state()
await page.screenshot({ path: `${outDir}/19-tabs.png` })

await page.locator('.ov-doctab.ov-doctab-active').first().click({ button: 'right' })
await page.waitForTimeout(300)
const menu = await page.evaluate(() => [...document.querySelectorAll('.ov-menu-item')].map(item => item.textContent))
const closeOthers = page.locator('.ov-menu-item', { hasText: '关闭其他' }).first()
if (await closeOthers.count() > 0) {
  await closeOthers.click()
  await page.waitForTimeout(500)
}
const afterCloseOthers = await state()
await page.screenshot({ path: `${outDir}/20-tabs-menu.png` })

console.log(JSON.stringify({ first, reused, pinned, replaced, twoTabs, menu, afterCloseOthers }, null, 2))
await browser.close()

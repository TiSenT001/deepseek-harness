/**
 * Verify P4 reading-view features: heading embed slice, block embed slice,
 * block-link jump with highlight, and grouped backlinks.
 * Usage: node scripts/reading-probe.mjs <token-url>
 */
import { chromium } from './playwright-env.mjs'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2]
if (url === undefined) throw new Error('usage: node scripts/reading-probe.mjs <token-url>')
await mkdir('.artifacts/ui', { recursive: true })

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(900)

const openNote = async (title) => {
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(300)
  await page.keyboard.type(title)
  await page.waitForTimeout(900)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1400)
}

await openNote('Source')
const body = await page.evaluate(() => document.querySelector('.ov-document')?.textContent ?? '')
await page.screenshot({ path: '.artifacts/ui/22-embed-sections.png' })

// Block link → opens target and highlights the block.
const blockLink = page.locator('.ov-document a[href*="dsh-obsidian.invalid"]', { hasText: 'target' }).first()
let jump = null
if (await blockLink.count() > 0) {
  await blockLink.click()
  await page.waitForTimeout(1600)
  jump = await page.evaluate(() => {
    const block = document.querySelector('[data-block-id="blk1"]')
    return {
      title: document.querySelector('.ov-document h1')?.textContent,
      hasBlockAnchor: block !== null,
      markerStripped: block === null ? null : !(block.textContent ?? '').includes('^blk1'),
      flashing: block?.classList.contains('ov-flash') ?? false,
      top: block?.getBoundingClientRect().top ?? null,
    }
  })
  await page.screenshot({ path: '.artifacts/ui/23-block-jump.png' })
}

// Backlinks rail on the target note.
await page.locator('.ov-tab', { hasText: '反链' }).first().click()
await page.waitForTimeout(700)
const backlinks = await page.evaluate(() => ({
  groups: document.querySelectorAll('.ov-backlink-group').length,
  heads: [...document.querySelectorAll('.ov-backlink-name')].map(node => node.textContent),
  count: document.querySelector('.ov-backlink-count')?.textContent,
}))
await page.screenshot({ path: '.artifacts/ui/24-backlinks-grouped.png' })

console.log(JSON.stringify({
  embedHasSectionTwo: body.includes('第二节内容'),
  embedHasFirstParagraph: body.includes('第一段内容'),
  embedHasSectionThree: body.includes('第三节内容'),
  jump,
  backlinks,
}, null, 2))
await browser.close()

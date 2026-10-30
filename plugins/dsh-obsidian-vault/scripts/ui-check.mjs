/**
 * Manual UI probe for the vault plugin. Not part of the test suite: it opens a
 * running DSH web instance, prints the sidebar rail entries, and with `--click`
 * drives the quick switcher to open one note and capture screenshots.
 *
 * Usage:
 *   node scripts/ui-check.mjs <token-url> [--click] [--query text] [--out dir]
 */
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const url = args[0]
if (url === undefined) {
  console.error('usage: node scripts/ui-check.mjs <token-url> [--click] [--query text] [--out dir]')
  process.exit(1)
}
const click = args.includes('--click')
const queryIndex = args.indexOf('--query')
const query = queryIndex === -1 ? 'TiSenT-GPU' : args[queryIndex + 1]
const outIndex = args.indexOf('--out')
const outDir = resolve(outIndex === -1 ? '.artifacts/ui' : args[outIndex + 1])
const TITLE = '.ov-title, .ov-document h1'

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
page.on('console', message => {
  if (message.type() === 'error' && !message.text().includes('404')) errors.push(`console: ${message.text()}`)
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)

const buttons = await page.evaluate(() => [...document.querySelectorAll('button')]
  .map(button => ({
    label: button.getAttribute('aria-label'),
    title: button.getAttribute('title'),
    text: (button.textContent ?? '').trim().slice(0, 16),
  }))
  .filter(entry => (entry.label ?? '').length > 0 || (entry.title ?? '').length > 0))
console.log(JSON.stringify({ buttons: buttons.slice(0, 40) }, null, 2))

if (click) {
  await mkdir(outDir, { recursive: true })
  await page.screenshot({ path: `${outDir}/01-vault.png` })
  const entry = page.locator('button', { hasText: '知识库' }).first()
  if (await entry.count() > 0) await entry.click()
  await page.waitForTimeout(1500)
  const mounted = await page.locator('.ov-root').count()
  console.log(`vault page mounted: ${mounted > 0}`)

  if (mounted > 0) {
    await page.keyboard.press('Control+o')
    await page.waitForTimeout(300)
    await page.keyboard.type(query)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${outDir}/02-quick.png` })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `${outDir}/03-note.png` })

    const stats = await page.evaluate((titleSelector) => ({
      title: document.querySelector(titleSelector)?.textContent ?? null,
      anchors: [...document.querySelectorAll('.ov-scroll a')].slice(0, 6).map(a => a.getAttribute('href')),
      headings: document.querySelectorAll('.ov-scroll h1, .ov-scroll h2, .ov-scroll h3').length,
      railTabs: [...document.querySelectorAll('.ov-tab')].map(tab => tab.textContent),
      docTabs: [...document.querySelectorAll('.ov-doctab')].map(tab => tab.textContent),
      properties: document.querySelectorAll('.ov-property-row').length,
    }), TITLE)
    console.log(JSON.stringify(stats, null, 2))

    const backlinks = page.locator('.ov-tab', { hasText: '反链' }).first()
    if (await backlinks.count() > 0) {
      await backlinks.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${outDir}/04-backlinks.png` })
    }

    const link = page.locator('.ov-scroll a').first()
    if (await link.count() > 0) {
      const before = await page.locator(TITLE).textContent()
      await link.click()
      await page.waitForTimeout(1400)
      const after = await page.locator(TITLE).textContent()
      console.log(JSON.stringify({ navigation: { before, after, changed: before !== after } }, null, 2))
      await page.screenshot({ path: `${outDir}/05-linked-note.png` })
      await page.keyboard.press('Alt+ArrowLeft')
      await page.waitForTimeout(900)
      console.log(`back navigation: ${await page.locator(TITLE).textContent()}`)
    }

    const graphButton = page.locator('button[aria-label="关系图"], button[title="关系图"]').first()
    if (await graphButton.count() > 0) {
      await graphButton.click()
      await page.waitForTimeout(2600)
      await page.screenshot({ path: `${outDir}/06-graph.png` })
      const graphStats = await page.evaluate(() => ({
        stats: document.querySelector('.ov-graph-stats')?.textContent ?? null,
        nodes: document.querySelector('.ov-graph-canvas')?.dataset.positions ?? null,
        edges: document.querySelector('.ov-graph-canvas')?.dataset.edges ?? null,
      }))
      console.log(JSON.stringify({ graphStats }, null, 2))

      const tagButton = page.locator('.ov-tag-picker > button').first()
      if (await tagButton.count() > 0) {
        await tagButton.click()
        await page.waitForTimeout(400)
        await page.keyboard.type('研究')
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${outDir}/07-tagpicker.png` })
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1800)
        await page.screenshot({ path: `${outDir}/08-graph-tagged.png` })
        const filtered = await page.evaluate(() => ({
          stats: document.querySelector('.ov-graph-stats')?.textContent ?? null,
          nodes: document.querySelector('.ov-graph-canvas')?.dataset.positions ?? null,
          edges: document.querySelector('.ov-graph-canvas')?.dataset.edges ?? null,
        }))
        console.log(JSON.stringify({ filtered }, null, 2))
      }

      const scope = page.locator('.ov-graph-tools > button').first()
      if (await scope.count() > 0) {
        await scope.click()
        await page.waitForTimeout(3200)
        await page.screenshot({ path: `${outDir}/09-graph-global.png` })
      }
    }
  }
}
console.log(JSON.stringify({ outDir, errors }, null, 2))
await browser.close()

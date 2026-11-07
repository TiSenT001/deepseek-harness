import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const read = async (page, label) => {
  const s = await page.evaluate(() => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    return { pos: c?.dataset.positions, zoom: c?.dataset.zoom, header: document.querySelector('.ov-note-head')?.textContent?.slice(0, 30) }
  })
  console.log(label, JSON.stringify(s))
}
for (const [label, openNote] of [['A-no-note', false], ['B-after-note', true], ['C-no-note-again', false]]) {
  const page = await browser.newPage({ viewport: { width: 1347, height: 704 } })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.locator('button', { hasText: '知识库' }).first().click()
  await page.waitForTimeout(900)
  if (openNote) {
    await page.locator('.ov-file', { hasText: 'README' }).first().click()
    await page.waitForTimeout(900)
  }
  await page.locator('button', { hasText: '关系图' }).first().click()
  await page.waitForTimeout(3500)
  await read(page, label)
  await page.screenshot({ path: `.artifacts/ui/66-${label}.png` })
  await page.close()
}
await browser.close()

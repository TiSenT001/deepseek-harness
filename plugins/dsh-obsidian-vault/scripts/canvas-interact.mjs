import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1000)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(3000)
const canvas = page.locator('canvas.ov-graph-canvas')
const box = await canvas.boundingBox()
// find a painted node by probing pixels for the green channel
const target = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  const ctx = c.getContext('2d')
  const ratio = window.devicePixelRatio || 1
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  for (let y = 6; y < c.height - 6; y += 3) {
    for (let x = 6; x < c.width - 6; x += 3) {
      const i = (y * c.width + x) * 4
      if (data[i + 3] > 200 && data[i + 1] > 120 && data[i] < 120) {
        return { x: x / ratio, y: y / ratio }
      }
    }
  }
  return null
})
let clicked = null
if (target !== null && box !== null) {
  await page.mouse.click(box.x + target.x, box.y + target.y)
  await page.waitForTimeout(1200)
  clicked = await page.evaluate(() => document.querySelector('.ov-doctab-active .ov-doctab-label')?.textContent)
}
// zoom by wheel
const before = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.width)
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.wheel(0, -240)
await page.waitForTimeout(400)
const after = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.width)
await page.screenshot({ path: '.artifacts/ui/51-canvas-interaction.png' })
console.log(JSON.stringify({ target, clicked, canvasWidth: [before, after], errors }, null, 2))
await browser.close()

import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
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
const target = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  const ctx = c.getContext('2d')
  const ratio = window.devicePixelRatio || 1
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  for (let y = 4; y < c.height - 4; y += 3) {
    for (let x = 4; x < c.width - 4; x += 3) {
      const i = (y * c.width + x) * 4
      if (data[i + 3] > 200 && data[i + 1] > 110) return { x: x / ratio, y: y / ratio }
    }
  }
  return null
})
let dragState = null
if (target !== null && box !== null) {
  await page.mouse.move(box.x + target.x, box.y + target.y)
  await page.mouse.down()
  await page.waitForTimeout(150)
  dragState = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.drag)
  await page.mouse.move(box.x + target.x + 50, box.y + target.y + 30, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(200)
}
const after = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.drag)
await page.screenshot({ path: '.artifacts/ui/53-canvas-final.png' })
console.log(JSON.stringify({ dragState, afterRelease: after }))
await browser.close()

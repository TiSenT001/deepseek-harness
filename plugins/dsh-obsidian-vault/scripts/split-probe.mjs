import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.locator('button', { hasText: '知识库' }).first().click()
await page.waitForTimeout(600)
await page.keyboard.press('Control+o'); await page.waitForTimeout(250)
await page.keyboard.type('外部大脑'); await page.waitForTimeout(800)
await page.keyboard.press('Enter'); await page.waitForTimeout(1000)
await page.locator('button', { hasText: '关系图' }).first().click()
await page.waitForTimeout(3000)
const state = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  return { zoom: c?.dataset.zoom, pan: c?.dataset.pan, width: c?.width, height: c?.height }
})
const box = await page.locator('canvas.ov-graph-canvas').boundingBox()
const target = await page.evaluate(() => {
  const c = document.querySelector('canvas.ov-graph-canvas')
  const ctx = c.getContext('2d')
  const ratio = window.devicePixelRatio || 1
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  for (let y = 4; y < c.height - 4; y += 3) for (let x = 4; x < c.width - 4; x += 3) {
    const i = (y * c.width + x) * 4
    if (data[i + 3] > 200 && data[i + 1] > 110) return { x: x / ratio, y: y / ratio }
  }
  return null
})
let drag = null
if (target !== null && box !== null) {
  await page.mouse.move(box.x + target.x, box.y + target.y)
  await page.mouse.down()
  await page.waitForTimeout(120)
  drag = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.drag)
  await page.mouse.up()
}
await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5)
await page.mouse.wheel(0, -240)
await page.waitForTimeout(300)
const afterZoom = await page.evaluate(() => ({ zoom: document.querySelector('canvas.ov-graph-canvas')?.dataset.zoom, pan: document.querySelector('canvas.ov-graph-canvas')?.dataset.pan }))
await page.screenshot({ path: '.artifacts/ui/54-canvas-split.png' })
console.log(JSON.stringify({ state, drag, afterZoom, errors }, null, 2))
await browser.close()

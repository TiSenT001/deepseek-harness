/**
 * Before/after numbers for externalizing one canvas' inline images.
 *
 * Usage: node scripts/pur-externalize-bench.mjs <url> <token> <vault canvas path>
 *
 * It reports the document size on disk, the time the pane needs to render it and
 * the JS heap the page holds, then calls `pur/externalize`, then repeats the same
 * three measurements. Run it against a real moodboard canvas, not a fixture.
 */
import { readFileSync, statSync } from 'node:fs'
import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const [, , url, token, canvasPath] = process.argv
if (url === undefined || token === undefined || canvasPath === undefined) {
  console.error('usage: node scripts/pur-externalize-bench.mjs <url> <token> <canvas path>')
  process.exit(1)
}

const apiUrl = (route, params = {}) => {
  const target = new URL(`http://127.0.0.1:3080/obsidian/api/${route}`)
  target.searchParams.set('token', token)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return target
}

const api = async (route, init, params) => {
  const response = await fetch(apiUrl(route, params), init)
  return { status: response.status, body: await response.json().catch(() => ({})) }
}

/** Absolute file size, from the vault root the plugin reports. */
const sizeOf = (root) => statSync(`${root}/${canvasPath}`).size

/** Open the canvas in the pane and measure render time and heap. */
const measureUi = async (root) => {
  const browser = await chromium.launch({ headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  if ((await page.locator('.ov-root').count()) === 0) {
    await page.locator('button', { hasText: '知识库' }).first().click()
  }
  await page.locator('.ov-root').waitFor({ timeout: 15000 })
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(500)
  await page.locator('.ov-quick-input').fill(canvasPath.split('/').at(-1).replace(/\.PurStudio$/i, ''))
  await page.waitForTimeout(800)
  const started = Date.now()
  await page.locator('.ov-tree .ov-file', { hasText: canvasPath.split('/').at(-1) }).first().click().catch(() => undefined)
  await page.locator('canvas').first().waitFor({ timeout: 120000 })
  const openMs = Date.now() - started
  await page.waitForTimeout(3000)
  const heapMb = await page.evaluate(() => (performance.memory === undefined ? -1 : Math.round(performance.memory.usedJSHeapSize / 1048576)))
  await page.keyboard.press('Escape').catch(() => undefined)
  await page.waitForTimeout(500)
  await page.evaluate((path) => {
    const input = document.querySelector('.ov-quick-input')
    if (input !== null) input.value = path
  }, canvasPath).catch(() => undefined)
  await browser.close()
  return { openMs, heapMb }
}

const root = 'G:/个人知识库'
const before = { bytes: sizeOf(root), ...(await measureUi(root)) }
console.log('before:', JSON.stringify(before))

const externalized = await api('pur/externalize', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ path: canvasPath }),
})
console.log('externalize:', externalized.status, JSON.stringify(externalized.body).slice(0, 200))
if (externalized.status !== 200) {
  console.error('externalize failed; the host may need a restart')
  process.exit(1)
}

const after = { bytes: sizeOf(root), ...(await measureUi(root)) }
console.log('after:', JSON.stringify(after))
console.log('ratio:', {
  bytesPct: Math.round((after.bytes / before.bytes) * 100),
  openPct: Math.round((after.openMs / Math.max(1, before.openMs)) * 100),
  heapPct: before.heapMb > 0 ? Math.round((after.heapMb / before.heapMb) * 100) : -1,
})
void readFileSync

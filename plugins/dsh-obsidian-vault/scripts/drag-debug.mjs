import { chromium } from './playwright-env.mjs'
import { writeFileSync } from 'node:fs'

// Instrumented replay of the audit's drag-move check: why does leg-2 (drop on
// a root file row, which bubbles to the tree container) never call the move
// API while leg-1 (drop on a dir row) works?
const url = process.argv[2]
if (url === undefined) {
  console.error('usage: node drag-debug.mjs <url>')
  process.exit(1)
}
const origin = new URL(url).origin
const API = `${origin}/obsidian/api`
const api = async (route, init) => {
  const res = await fetch(`${API}/${route}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status}`)
  return res.json()
}

const DIR = '审核临时文件夹'
const NOTE = '调试笔记.md'

await api('mkdir', { method: 'POST', body: JSON.stringify({ path: DIR }) })
await api('create', { method: 'POST', body: JSON.stringify({ path: NOTE }) })
writeFileSync(`G:\\个人知识库\\${NOTE}`, '# 调试笔记\n')

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const ovRoot = page.locator('.ov-root')
  if ((await ovRoot.count()) === 0 || !(await ovRoot.isVisible())) {
    await page.locator('button', { hasText: '知识库' }).first().click()
  }
  await page.waitForSelector('.ov-root', { timeout: 15000 })
  await page.locator('button[aria-label="更多操作"]').click()
  await page.locator('.ov-menu-item', { hasText: '刷新索引' }).click()
  await page.waitForTimeout(1500)

  await page.evaluate(() => {
    window.__log = []
    for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
      window.addEventListener(type, (event) => {
        const t = event.target
        window.__log.push({
          type,
          target: t instanceof Element ? `${t.tagName.toLowerCase()}[title="${t.getAttribute('title') ?? ''}"]` : String(t),
          cls: t instanceof Element ? String(t.className).slice(0, 80) : '',
          prevented: event.defaultPrevented,
        })
      }, true)
    }
    const orig = window.fetch
    window.fetch = (...args) => {
      const u = String(args[0])
      if (u.includes('/obsidian/api/')) {
        window.__log.push({ type: 'fetch', url: u.replace(/^.*\/obsidian\/api\//, ''), body: args[1]?.body ?? null })
      }
      return orig(...args)
    }
  })

  const tree = page.locator('.ov-tree')
  const dir = tree.locator(`.ov-dir[title="${DIR}"]`)
  await tree.locator(`.ov-file[title="${NOTE}"]`).waitFor({ timeout: 8000 })

  // ---- leg 1: root file -> dir row (known good) ----
  await page.evaluate(() => window.__log.push({ type: 'phase', name: 'leg1-start' }))
  await tree.locator(`.ov-file[title="${NOTE}"]`).dragTo(dir)
  await page.waitForTimeout(1500)
  const after1 = JSON.stringify(await api('tree'))
  console.log('leg1 moved into dir:', after1.includes(`${DIR}/调试笔记.md`))

  // expand the dir so the inner row exists
  const chev = await dir.locator('.ov-chevron').textContent()
  if (chev === '▸') {
    await dir.click()
    await page.waitForTimeout(400)
  }
  const inner = tree.locator(`.ov-file[title="${DIR}/调试笔记.md"]`)
  await inner.waitFor({ timeout: 5000 })

  // ---- leg 2: inner file -> first root file row (the failing case) ----
  const rootFile = tree.locator('.ov-file:not([title*="/"])').first()
  console.log('leg2 target root row title:', await rootFile.getAttribute('title'))
  await page.evaluate(() => window.__log.push({ type: 'phase', name: 'leg2-dragTo' }))
  await inner.dragTo(rootFile)
  await page.waitForTimeout(1500)
  const after2 = await api('tree')
  console.log('leg2 back at root:', after2.nodes.map(node => node.name).includes('调试笔记.md'))

  // ---- leg 3 (manual mouse drag, only if leg 2 failed): watch mid-drag state ----
  if (!after2.nodes.map(node => node.name).includes('调试笔记.md')) {
    await page.evaluate(() => window.__log.push({ type: 'phase', name: 'leg3-manual' }))
    const innerBox = await inner.boundingBox()
    const rootBox = await rootFile.boundingBox()
    if (innerBox === null || rootBox === null) throw new Error('bounding box missing')
    await page.mouse.move(innerBox.x + innerBox.width / 2, innerBox.y + innerBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(innerBox.x + innerBox.width / 2 + 24, innerBox.y + innerBox.height / 2, { steps: 4 })
    await page.waitForTimeout(250)
    console.log('mid-drag source class:', await inner.getAttribute('class'))
    await page.mouse.move(rootBox.x + rootBox.width / 2, rootBox.y + rootBox.height / 2, { steps: 10 })
    await page.waitForTimeout(250)
    console.log('mid-drag container class:', await tree.getAttribute('class'))
    console.log('mid-drag root row class:', await rootFile.getAttribute('class'))
    await page.mouse.up()
    await page.waitForTimeout(1500)
    const after3 = await api('tree')
    console.log('leg3 back at root:', after3.nodes.map(node => node.name).includes('调试笔记.md'))
  }

  const log = await page.evaluate(() => window.__log)
  console.log('\n==== EVENT LOG ====')
  for (const entry of log) console.log(JSON.stringify(entry))
} finally {
  await api('delete', { method: 'POST', body: JSON.stringify({ path: `${DIR}/调试笔记.md` }) }).catch(() => {})
  await api('delete', { method: 'POST', body: JSON.stringify({ path: NOTE }) }).catch(() => {})
  await api('delete', { method: 'POST', body: JSON.stringify({ path: DIR }) }).catch(() => {})
  await browser.close()
}

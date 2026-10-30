import { chromium } from 'file:///G:/Software/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
if (url === undefined) {
  console.error('usage: node graph-click-drag-probe.mjs <url>')
  process.exit(1)
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

/** Scan the canvas for the first opaque coloured pixel (a node dot). */
async function findNode(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return null
    const ctx = c.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    for (let y = 6; y < c.height - 6; y += 3) {
      for (let x = 6; x < c.width - 6; x += 3) {
        const i = (y * c.width + x) * 4
        // Opaque, not pure grey background — node dots are saturated.
        if (data[i + 3] > 200) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          if (max - min > 25 || max > 150) return { x: x / ratio, y: y / ratio, r, g, b }
        }
      }
    }
    return null
  })
}

/** Re-scan for a pixel matching the given colour within a search box. */
async function findNear(page, color, cx, cy, radius) {
  return page.evaluate((args) => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return null
    const ctx = c.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const x0 = Math.max(0, Math.floor((args.cx - args.radius) * ratio))
    const y0 = Math.max(0, Math.floor((args.cy - args.radius) * ratio))
    const x1 = Math.min(c.width, Math.ceil((args.cx + args.radius) * ratio))
    const y1 = Math.min(c.height, Math.ceil((args.cy + args.radius) * ratio))
    if (x1 <= x0 || y1 <= y0) return null
    const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data
    let best = null
    let bestDist = Infinity
    for (let py = 0; py < y1 - y0; py += 2) {
      for (let px = 0; px < x1 - x0; px += 2) {
        const i = (py * (x1 - x0) + px) * 4
        if (data[i + 3] < 200) continue
        const dr = data[i] - args.color.r
        const dg = data[i + 1] - args.color.g
        const db = data[i + 2] - args.color.b
        const dist = dr * dr + dg * dg + db * db
        if (dist < bestDist) {
          bestDist = dist
          best = { x: (x0 + px) / ratio, y: (y0 + py) / ratio }
        }
      }
    }
    return bestDist < 900 ? best : null
  }, { color, cx, cy, radius })
}

const result = { drag: null, click: null, errors: [] }
const graphRequests = []

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.locator('button', { hasText: '知识库' }).first().click()
  await page.waitForTimeout(600)
  await page.keyboard.press('Control+o')
  await page.waitForTimeout(250)
  await page.keyboard.type('README')
  await page.waitForTimeout(800)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1000)
  await page.locator('button[aria-label="关系图"]').first().click()
  await page.waitForTimeout(3500)
  page.on('request', (request) => {
    if (request.url().includes('/obsidian/api/graph')) graphRequests.push(request.url())
  })

  const canvas = page.locator('canvas.ov-graph-canvas')
  const box = await canvas.boundingBox()
  if (box === null) throw new Error('canvas not found')

  // --- Bug 1: drag release must NOT snap back ---
  const node = await findNode(page)
  if (node === null) throw new Error('no node found on canvas')
  const startX = box.x + node.x
  const startY = box.y + node.y
  const dx = 70
  const dy = 45

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(120)
  const dragActive = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.drag ?? '')
  await page.mouse.move(startX + dx, startY + dy, { steps: 8 })
  await page.mouse.up()
  // Let the live simulation settle (120 ticks ~ 2s; sample after 800ms).
  await page.waitForTimeout(800)

  // Find where the dragged node ended up by scanning the whole canvas for its
  // colour. Snap-back would place it back at the original co-ordinates.
  const finalPos = await page.evaluate((color) => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return null
    const ctx = c.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    let best = null
    let bestDist = Infinity
    for (let y = 0; y < c.height; y += 2) {
      for (let x = 0; x < c.width; x += 2) {
        const i = (y * c.width + x) * 4
        if (data[i + 3] < 200) continue
        const dr = data[i] - color.r
        const dg = data[i + 1] - color.g
        const db = data[i + 2] - color.b
        const dist = dr * dr + dg * dg + db * db
        if (dist < bestDist) {
          bestDist = dist
          best = { x: x / ratio, y: y / ratio }
        }
      }
    }
    return bestDist < 1200 ? best : null
  }, node)

  const distToStart = finalPos === null ? Infinity : Math.hypot(finalPos.x - node.x, finalPos.y - node.y)
  const distToDrop = finalPos === null ? Infinity : Math.hypot(finalPos.x - (node.x + dx), finalPos.y - (node.y + dy))
  result.drag = {
    dragEngaged: dragActive !== '',
    original: { x: node.x, y: node.y },
    drop: { x: node.x + dx, y: node.y + dy },
    final: finalPos,
    distToStart: Math.round(distToStart),
    distToDrop: Math.round(distToDrop),
    // No snap-back: the node kept a meaningful share of the displacement (an
    // interpolation snap-back would return it within a few px of the start;
    // force settling keeps it somewhere between start and drop).
    noSnapBack: finalPos !== null && distToStart > 15,
  }

  // --- Bug 2: local-graph click must recenter, not navigate away ---
  // The drag reheated the live simulation (alpha 0.3, ~4-5s to cool); node
  // dots keep drifting until it sleeps and pixel-scanned click targets go
  // stale. Wait until the dragged node's position is stable.
  if (finalPos !== null) {
    let last = finalPos
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await page.waitForTimeout(400)
      const now = await findNear(page, node, last.x, last.y, 60)
      if (now === null) break
      if (Math.hypot(now.x - last.x, now.y - last.y) < 1.5) break
      last = now
    }
  }
  // One of the dots may be the current centre node (a no-op click), so try up
  // to eight distinct dots and stop at the first that refetches the graph.
  const cw = box.width / 2
  const ch = box.height / 2
  const candidates = await page.evaluate(() => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return []
    const ctx = c.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    const solid = (px, py) => {
      // Node dots are filled discs; text strokes are 1-2px and fail this.
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const i = ((py + oy) * c.width + (px + ox)) * 4
          if (data[i + 3] < 200) return false
        }
      }
      return true
    }
    const found = []
    for (let y = 6; y < c.height - 6 && found.length < 8; y += 3) {
      for (let x = 6; x < c.width - 6 && found.length < 8; x += 3) {
        const i = (y * c.width + x) * 4
        if (data[i + 3] > 200) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          if ((max - min > 25 || max > 150) === false) continue
          if (!solid(x, y)) continue
          const sx = x / ratio, sy = y / ratio
          if (found.every(p => Math.hypot(p.x - sx, p.y - sy) > 30)) found.push({ x: sx, y: sy })
        }
      }
    }
    return found
  })
  if (candidates.length === 0) throw new Error('no node found for click test')

  const beforePan = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.pan ?? '')
  const beforeCount = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.positions ?? '')
  let clicked = null
  const attempts = []
  for (const target of candidates) {
    // Hover first: dataset.hover proves the hit test resolves this pixel to a
    // node before we commit a click.
    await page.mouse.move(box.x + target.x, box.y + target.y)
    await page.waitForTimeout(160)
    const hover = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.hover ?? '')
    const refetchesBefore = graphRequests.length
    if (hover === '') {
      attempts.push({ x: Math.round(target.x), y: Math.round(target.y), hover, clicked: false })
      continue
    }
    await page.mouse.down()
    await page.waitForTimeout(60)
    await page.mouse.up()
    attempts.push({ x: Math.round(target.x), y: Math.round(target.y), hover, clicked: true })
    // Wait for the debounced refetch, relayout and camera glide.
    await page.waitForTimeout(2200)
    if (graphRequests.length > refetchesBefore) {
      clicked = target
      break
    }
  }

  const stillGraph = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas') !== null)
  const afterPan = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.pan ?? '')
  const afterCount = await page.evaluate(() => document.querySelector('canvas.ov-graph-canvas')?.dataset.positions ?? '')
  const parsePan = (s) => {
    const [x, y] = s.split(',').map(Number)
    return { x: x ?? 0, y: y ?? 0 }
  }
  const bp = parsePan(beforePan)
  const ap = parsePan(afterPan)
  // The clicked node becomes the centre: focus-fit puts it at screen centre,
  // so a node dot must appear near the canvas middle afterwards.
  const nearCenter = await page.evaluate(() => {
    const c = document.querySelector('canvas.ov-graph-canvas')
    if (c === null) return false
    const ctx = c.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const w = 50
    const cx = Math.floor(c.width / 2 - w * ratio)
    const cy = Math.floor(c.height / 2 - w * ratio)
    const data = ctx.getImageData(cx, cy, w * 2 * ratio, w * 2 * ratio).data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 200) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        if (Math.max(r, g, b) - Math.min(r, g, b) > 25 || Math.max(r, g, b) > 150) return true
      }
    }
    return false
  })
  result.click = {
    stillGraphView: stillGraph,
    panBefore: beforePan,
    panAfter: afterPan,
    positionsBefore: beforeCount,
    positionsAfter: afterCount,
    refetches: graphRequests.length,
    cameraMoved: beforePan !== afterPan,
    nodeNearScreenCenter: nearCenter,
    attempts,
    // A click on a neighbour refetches the graph and focus-fit glides the new
    // centre node to the middle of the screen.
    recentred: stillGraph && graphRequests.length > 0 && nearCenter,
  }

  await page.screenshot({ path: '.artifacts/ui/graph-click-drag.png' })
} catch (cause) {
  result.errors.push(String(cause?.stack ?? cause))
}

console.log(JSON.stringify(result, null, 2))
await browser.close()
process.exit(result.errors.length > 0 ? 1 : 0)

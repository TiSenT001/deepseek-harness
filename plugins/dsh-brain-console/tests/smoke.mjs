/**
 * 面板冒烟测试 —— 只读验证，绝不触发任何真实动作。
 *
 * 覆盖：面板能加载 → 服务卡/KPI 渲染 → ⋯ 菜单项齐全 → 备份/缓存对话框能打开并列出条目。
 * prune / backup 这些会改数据的端点在测试里全部拦截成假应答，跑一百遍也不会删东西。
 *
 * 用法：
 *   node tests/smoke.mjs                      # 自动发现 token（读 DSH home 的 dsh_web_token.txt）
 *   DSH_PANEL_URL='http://127.0.0.1:3080/?token=xxx' node tests/smoke.mjs
 *   node tests/smoke.mjs --url 'http://...' --shot 结果截图.png
 *
 * 依赖：Playwright 来自宿主仓库（apps/web 的依赖），插件自己不带 node_modules。
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const argOf = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const repoRoot = process.env.DSH_REPO ?? fileURLToPath(new URL('../../../', import.meta.url))

/**
 * 自动发现面板地址：dsh web 每次重启 token 都会变，但它会把完整地址写在
 * `<DSH_HOME>/dsh_web_token.txt` 里（一行，形如 http://127.0.0.1:3080/?token=...）。
 * 优先 DSH_HOME，其次宿主仓库里的 .dsh-home，最后 ~/.dsh。
 */
const discoverUrl = () => {
  const homes = [
    process.env.DSH_HOME,
    path.join(repoRoot, '.dsh-home'),
    path.join(os.homedir(), '.dsh'),
  ].filter(Boolean)
  for (const home of homes) {
    const file = path.join(home, 'dsh_web_token.txt')
    try {
      const text = fs.readFileSync(file, 'utf8').trim()
      if (text.startsWith('http')) return { url: text, from: file }
    } catch {
      // 文件不在就试下一个
    }
  }
  return null
}

const explicit = argOf('--url') ?? process.env.DSH_PANEL_URL
const found = explicit ? { url: explicit, from: '--url / DSH_PANEL_URL' } : discoverUrl()
if (!found) {
  console.error('找不到面板地址：既没有 --url / DSH_PANEL_URL，也没在 DSH home 里读到 dsh_web_token.txt。')
  console.error('请先启动 dsh web（它会写这个文件），或显式传地址：')
  console.error("  DSH_PANEL_URL='http://127.0.0.1:3080/?token=xxx' node tests/smoke.mjs")
  process.exit(2)
}
const URL_ = found.url
console.log(`面板地址: ${URL_.replace(/token=[^&]+/, 'token=***')}  （来源: ${found.from}）`)

// Playwright 从宿主仓库解析（可用 DSH_REPO 覆盖）
const requireFromHost = createRequire(path.join(repoRoot, 'apps/web/package.json'))
const { chromium } = requireFromHost('playwright')

const results = []
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`)
}
const soft = async (name, fn) => {
  try {
    const detail = await fn()
    record(name, true, detail ?? '')
  } catch (error) {
    record(name, false, String(error).split('\n')[0].slice(0, 160))
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)))

// 所有会改数据的端点：拦截成假应答（本测试只开对话框，不发请求，这里只是保险）
await page.route('**/actions/prune-backups', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"removed":[],"freed_mb":0,"kept":[]}' }))
await page.route('**/actions/caches/prune', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"freed_mb":0,"items":[]}' }))
await page.route('**/actions/backup', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
await page.route('**/units/start-batch', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"group":"","started":[],"failed":[]}' }))
await page.route('**/units/restart-batch', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"group":"","restarted":[],"failed":[]}' }))
await page.route('**/units/*/start', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
await page.route('**/units/*/stop', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
await page.route('**/units/*/restart', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
await page.route('**/quality/failed-edges/ignore', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"ignored":0}' }))
await page.route('**/quality/failed-edges/unignore', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"ignored":0}' }))
await page.route('**/embed/start', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
await page.route('**/embed/cancel', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))

/** 等卡片出现；管理器刚好在重启时（另一个窗口改后端）等一等再判失败。 */
const waitForCards = async (timeout = 8000) => {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await page.locator('article.bc-card').count()) return true
    await page.waitForTimeout(400)
  }
  return false
}

const openPanel = async () => {
  const enter = async () => {
    await page.goto(URL_, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const opener = page.getByRole('button', { name: '打开侧边栏' })
    if (await opener.count()) await opener.click()
    await page.waitForTimeout(800)
    const nav = page.getByText('TiSenT Brain', { exact: true }).first()
    if (await nav.count()) await nav.click()
    await page.waitForTimeout(2000)
  }
  await enter()
  // 首次加载撞上管理器重启（19998 短暂不可用）时重进一次，避免把瞬断当回归
  if (!(await waitForCards())) await enter()
  await waitForCards()
}

const closeOverlay = async () => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

try {
  await openPanel()

  await soft('面板渲染出服务卡', async () => {
    const n = await page.locator('article.bc-card').count()
    if (n === 0) throw new Error('没有 .bc-card')
    return `${n} 张`
  })

  await soft('概览指标带存在', async () => {
    const n = await page.locator('.bc-kpi').count()
    if (n === 0) throw new Error('没有 .bc-kpi')
    return `${n} 项`
  })

  await soft('标题行显示运行计数', async () => {
    const text = await page.locator('.bc-count').innerText()
    if (!/\d+\s*\/\s*\d+\s*运行中/.test(text)) throw new Error(`计数文案异常: ${text}`)
    return text.replace(/\s+/g, ' ')
  })

  await soft('⋯ 菜单项齐全', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(500)
    const texts = await page.locator('[role="menu"]').innerText().catch(() => '')
    const need = ['立即备份', '清理备份', '清理缓存']
    const missing = need.filter((k) => !texts.includes(k))
    if (missing.length) throw new Error(`缺: ${missing.join('/')}`)
    return need.join(' / ')
  })

  await soft('清理备份对话框能列出快照', async () => {
    await page.locator('[role="menu"]').getByText('清理备份…').click()
    await page.waitForTimeout(1200)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const rows = await dialog.locator('.bc-backup-row').count()
    const confirm = await dialog.locator('button', { hasText: '删除' }).count()
    const noop = await dialog.locator('button', { hasText: '没有可删的' }).count()
    await closeOverlay()
    if (rows === 0) return '当前没有快照（面板空态正常）'
    // 快照数 ≤ 保留数时按钮是「没有可删的」——这也是正确状态
    if (!confirm && !noop) throw new Error('有快照但既没有确认按钮也没有禁用态')
    return `${rows} 个快照${noop ? '（保留数已覆盖全部）' : ''}`
  })

  await soft('清理缓存对话框能列出条目且受保护不可选', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('清理缓存…').click()
    await page.waitForTimeout(1500)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const rows = await dialog.locator('.bc-cache-row').count()
    const protectedRows = await dialog.locator('.bc-cache-row[data-risk="protected"]').count()
    const checkable = await dialog.locator('input.bc-cache-check').count()
    await closeOverlay()
    if (rows === 0) throw new Error('缓存登记表为空')
    if (protectedRows === 0) throw new Error('没有受保护条目（至少应有图像向量库）')
    return `${rows} 项（受保护 ${protectedRows}）· 可勾选 ${checkable}`
  })

  await soft('点击日志图标展开底部控制台', async () => {
    const card = page.locator('article.bc-card').first()
    await card.getByRole('button', { name: /日志/ }).first().click()
    await page.waitForTimeout(1200)
    const dock = await page.locator('.bc-dock').count()
    if (!dock) throw new Error('日志控制台没出现')
    // 级别过滤：切到「错误」，应落在当前过滤按钮上并写入偏好
    const errorLevel = page.locator('.bc-dock-level', { hasText: '错误' }).first()
    await errorLevel.click()
    await page.waitForTimeout(300)
    const active = await errorLevel.getAttribute('data-active')
    const stored = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    // 恢复「全部」，避免影响后续使用
    await page.locator('.bc-dock-level', { hasText: '全部' }).first().click()
    await page.waitForTimeout(200)
    await page.locator('.bc-dock').getByRole('button', { name: '收起日志' }).click()
    await page.waitForTimeout(300)
    const closed = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    if (active === null) throw new Error('级别过滤按钮没有激活')
    if (stored === null || !stored.includes('"logLevel":"error"')) throw new Error(`级别未持久化: ${stored}`)
    if (stored === null || !stored.includes('"logDockOpen":true') || !stored.includes('"lastLogUnit"')) {
      throw new Error(`日志展开状态未记录: ${stored}`)
    }
    if (closed === null || !closed.includes('"logDockOpen":false')) throw new Error(`收起日志未记录: ${closed}`)
    return '已展开 · 错误级别过滤生效 · 展开/收起状态已记忆'
  })

  await soft('宿主下发管理器地址配置', async () => {
    const origin = new URL(page.url()).origin
    const response = await page.request.get(`${origin}/brain-console/api/config`)
    if (response.status() === 404) {
      return '宿主为旧版（404）· 浏览器回退默认地址'
    }
    if (!response.ok()) throw new Error(`config 状态 ${response.status()}`)
    const data = await response.json()
    if (typeof data.managerUrl !== 'string' || data.managerUrl === '') {
      throw new Error('config 缺 managerUrl')
    }
    return `managerUrl=${data.managerUrl}`
  })

  await soft('失败边明细对话框能打开', async () => {
    // 入口是两跳：失败边 KPI → 趋势对话框 → 「查看失败边明细」
    const kpi = page.locator('.bc-kpi-action', { hasText: '失败边' }).first()
    if (!(await kpi.count())) throw new Error('没有可点的「失败边」指标')
    await kpi.click()
    await page.waitForTimeout(1000)
    const detailBtn = page.getByRole('button', { name: '查看失败边明细' })
    if (!(await detailBtn.count())) throw new Error('趋势对话框里没有「查看失败边明细」')
    await detailBtn.click()
    await page.waitForTimeout(800)
    const dialog = page.getByRole('dialog')
    const text = await dialog.innerText()
    if (!text.includes('失败边')) throw new Error(`标题不是「失败边」: ${text.slice(0, 40)}`)
    await page.waitForSelector('.bc-failed-row', { timeout: 6000 }).catch(() => {})
    const rows = await dialog.locator('.bc-failed-row').count()
    const empty = (await dialog.innerText()).includes('没有失败边')
    await closeOverlay()
    if (rows === 0 && !empty) throw new Error('既没有明细行也不是空态')
    return `${rows} 条${empty ? '（空态）' : ''}`
  })

  await soft('趋势对话框能打开', async () => {
    const kpi = page.locator('.bc-kpi-action', { hasText: '数据库' }).first()
    if (!(await kpi.count())) throw new Error('没有可点的「数据库」指标')
    await kpi.click()
    await page.waitForTimeout(1200)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const text = await dialog.innerText()
    if (!text.includes('趋势')) throw new Error(`标题不含「趋势」: ${text.slice(0, 40)}`)
    await closeOverlay()
    return '已打开'
  })

  await soft('依赖关系拓扑能打开', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('依赖关系…').click()
    await page.waitForTimeout(800)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const nodes = await dialog.locator('.bc-dep-node').count()
    const edges = await dialog.locator('.bc-dep-edge').count()
    if (nodes === 0) throw new Error('依赖图没有节点')
    let interaction = ''
    if (edges > 0) {
      await dialog.locator('.bc-dep-edge-hit').first().hover()
      await page.waitForTimeout(300)
      const activeEdges = await dialog.locator('.bc-dep-edge[data-active="true"]').count()
      if (activeEdges === 0) throw new Error('边悬停没有高亮')
      const zoomBefore = await dialog.locator('.bc-dep-graph').getAttribute('viewBox')
      await dialog.getByRole('button', { name: '放大' }).click()
      await dialog.getByRole('button', { name: '放大' }).click()
      await page.waitForTimeout(200)
      const zoomAfter = await dialog.locator('.bc-dep-graph').getAttribute('viewBox')
      if (zoomBefore === zoomAfter) throw new Error('缩放没有改变 viewBox')
      await dialog.getByRole('button', { name: '重置' }).click()
      interaction = ` · 悬停高亮 ${activeEdges} 边 · 缩放生效`
    }
    await dialog.locator('.bc-dep-node').first().click()
    await page.waitForTimeout(700)
    const detail = await page.locator('.bc-detail-list').count()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    if (detail === 0) throw new Error('点击节点没有打开单元详情')
    return `${nodes} 个节点 · ${edges} 条依赖 · 点节点打开详情${interaction}`
  })

  await soft('单元 ⋯ 菜单能打开', async () => {
    const btn = page.locator('article.bc-card').first().getByRole('button', { name: '单元更多操作' })
    if (!(await btn.count())) throw new Error('卡片上没有单元菜单按钮')
    await btn.first().click()
    await page.waitForTimeout(600)
    const menu = page.locator('[role="menu"]')
    if (!(await menu.count())) throw new Error('菜单没弹出')
    await closeOverlay()
    return '已弹出'
  })

  await soft('⋯ 菜单含索引与诊断入口', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(500)
    const texts = await page.locator('[role="menu"]').innerText().catch(() => '')
    const need = ['索引与嵌入状态', '下载诊断包']
    const missing = need.filter((k) => !texts.includes(k))
    if (missing.length) {
      await closeOverlay()
      throw new Error(`缺 ${missing.join('/')}`)
    }
    await closeOverlay()
    return need.join(' / ')
  })

  await soft('索引与嵌入状态对话框能打开', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('索引与嵌入状态…').click()
    await page.waitForTimeout(1500)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const tabs = await dialog.locator('.bc-tab').count()
    if (tabs !== 4) throw new Error(`标签数 ${tabs}，应为 4`)
    // 概览页
    await dialog.getByRole('tab', { name: '概览' }).click()
    await page.waitForTimeout(300)
    const rows = await dialog.locator('.bc-index-row').count()
    if (!(await dialog.innerText()).includes('笔记向量')) throw new Error('概览页缺笔记向量')
    if (rows === 0) throw new Error('概览页没有任何行')
    // 分块页
    await dialog.getByRole('tab', { name: '分块' }).click()
    await page.waitForTimeout(300)
    if (!(await dialog.innerText()).includes('分块索引')) throw new Error('分块页缺分块索引')
    // 定时任务页 + 筛选
    await dialog.getByRole('tab', { name: '定时任务' }).click()
    await page.waitForTimeout(300)
    if (!(await dialog.innerText()).includes('管道心跳')) throw new Error('定时任务页缺管道心跳')
    const crons = await dialog.locator('.bc-cron-row').count()
    if (crons === 0) throw new Error('没有管道心跳行')
    await dialog.locator('.bc-cron-all > summary').click()
    await page.waitForTimeout(300)
    const filterInput = dialog.locator('.bc-cron-filter-input')
    const allBefore = await dialog.locator('.bc-cron-all-list .bc-cron-row').count()
    await filterInput.fill('backup')
    await page.waitForTimeout(300)
    const allAfter = await dialog.locator('.bc-cron-all-list .bc-cron-row').count()
    await filterInput.fill('')
    if (allBefore > 0 && (allAfter === 0 || allAfter >= allBefore)) {
      throw new Error(`筛选未生效: ${allBefore} → ${allAfter}`)
    }
    // 手动补嵌页
    await dialog.getByRole('tab', { name: '手动补嵌' }).click()
    await page.waitForTimeout(300)
    if (!(await dialog.innerText()).includes('补向量缺失')) throw new Error('手动补嵌页缺操作按钮')
    const buttons = await dialog.locator('.bc-embed-actions button').count()
    // 窄屏不溢出
    await page.setViewportSize({ width: 760, height: 800 })
    await page.waitForTimeout(400)
    const narrowBox = await dialog.boundingBox()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(300)
    await closeOverlay()
    if (!narrowBox || narrowBox.height > 780) throw new Error('窄屏下弹窗超出视口')
    return `标签 ${tabs} · 概览 ${rows} 行 · 心跳 ${crons} 条 · 筛选 ${allBefore}→${allAfter} · 补嵌按钮 ${buttons} · 窄屏高 ${Math.round(narrowBox.height)}px`
  })

  await soft('趋势图含 24h 变化与告警线', async () => {
    const kpi = page.locator('.bc-kpi-action', { hasText: '失败边' }).first()
    if (!(await kpi.count())) throw new Error('没有可点的「失败边」指标')
    await kpi.click()
    await page.waitForTimeout(1500)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const delta = await dialog.locator('.bc-trend-delta').count()
    const threshold = await dialog.locator('.bc-trend-threshold').count()
    const limitButton = await dialog.getByRole('button', { name: '阈值' }).count()
    await closeOverlay()
    if (delta === 0) throw new Error('没有 24h 变化读数')
    if (threshold === 0) throw new Error('没有告警线')
    if (limitButton === 0) throw new Error('没有阈值编辑入口')
    return `24h 变化 ${delta} 处 · 告警线 ${threshold} 条 · 阈值入口 ${limitButton}`
  })

  await soft('自动恢复记录对话框能打开', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('自动恢复记录…').click()
    await page.waitForTimeout(1200)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    const text = await dialog.innerText()
    if (!text.includes('自动恢复记录')) throw new Error(`标题不对: ${text.slice(0, 40)}`)
    const rows = await dialog.locator('.bc-auto-row').count()
    const empty = text.includes('没有恢复记录')
    const bundleNodes = await dialog.locator('.bc-auto-bundle').count()
    const bundleLinks = await dialog.locator('.bc-auto-bundle-link').count()
    const missing = await dialog.locator('.bc-auto-bundle-missing').count()
    const pruneBtn = await dialog.getByRole('button', { name: /清理旧诊断包/ }).count()
    await closeOverlay()
    if (rows === 0 && !empty) throw new Error('既没有记录也不是空态')
    if (pruneBtn === 0) throw new Error('缺少清理旧诊断包按钮')
    if (bundleLinks + missing !== bundleNodes) throw new Error('诊断包行既有链接也有失效标记才算完整')
    return `${rows} 条记录 · ${bundleLinks} 个有效链接 · ${missing} 个已清理${empty ? '（空态）' : ''}`
  })

  await soft('系统体检对话框能打开', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('系统体检…').click()
    await page.waitForTimeout(300)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    // 体检脚本约 2 秒；等结果网格或错误块出现（最多 30 秒）
    await page.waitForSelector('.bc-checkup-grid, .bc-backup-error', { timeout: 30000 }).catch(() => {})
    const text = await dialog.innerText()
    const hasGrid = await dialog.locator('.bc-checkup-grid').count()
    const errorShown = text.includes('体检失败') || text.includes('超时')
    let extra = ''
    if (hasGrid) {
      const history = await dialog.locator('.bc-checkup-history').count()
      const rows = await dialog.locator('.bc-checkup-row-btn').count()
      extra = ` · 历史 ${history} · 膨胀表 ${rows}`
      if (history > 0) {
        // 清空按钮在折叠 details 里：展开后 getByRole 才能进入可访问性树
        await dialog.locator('.bc-checkup-history > summary').click()
        await page.waitForTimeout(300)
      }
      const historyRows = await dialog.locator('.bc-checkup-history-row').count()
      const trends = await dialog.locator('.bc-checkup-trend-row').count()
      if (historyRows >= 2 && trends !== 3) throw new Error(`趋势行 ${trends}，应为 3`)
      if (trends > 0) {
        const ranges = await dialog.locator('.bc-checkup-trend-range').count()
        if (ranges !== trends) throw new Error(`趋势范围标签 ${ranges}，应为 ${trends}`)
      }
      if ((await dialog.getByRole('button', { name: '清空历史' }).count()) === 0) {
        throw new Error('缺少清空历史按钮')
      }
      if (historyRows > 0 && (await dialog.getByText('按天聚合').count()) === 0) {
        throw new Error('历史列表没有按天聚合提示')
      }
      // 导出 CSV：应触发浏览器下载，文件名带 brain-checkup 前缀
      const exportBtn = dialog.getByRole('button', { name: '导出 CSV' })
      if ((await exportBtn.count()) === 0) throw new Error('缺少导出 CSV 按钮')
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        exportBtn.first().click(),
      ])
      if (download === null) throw new Error('导出 CSV 没有触发下载')
      const csvName = download.suggestedFilename()
      if (!csvName.startsWith('brain-checkup-') || !csvName.endsWith('.csv')) {
        throw new Error(`CSV 文件名异常: ${csvName}`)
      }
      extra += ` · CSV ${csvName}`
      // 导出全量 JSON
      const jsonBtn = dialog.getByRole('button', { name: '导出 JSON' })
      if ((await jsonBtn.count()) === 0) throw new Error('缺少导出 JSON 按钮')
      const [jsonDownload] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        jsonBtn.first().click(),
      ])
      if (jsonDownload === null) throw new Error('导出 JSON 没有触发下载')
      const jsonName = jsonDownload.suggestedFilename()
      if (!jsonName.startsWith('brain-checkup-history-') || !jsonName.endsWith('.json')) {
        throw new Error(`JSON 文件名异常: ${jsonName}`)
      }
      extra += ` · JSON ${jsonName}`
      const copyBtn = dialog.getByRole('button', { name: /复制摘要|已复制/ })
      if ((await copyBtn.count()) === 0) throw new Error('缺少复制摘要按钮')
      await copyBtn.click()
      await page.waitForTimeout(1000)
      const copyLabel = await copyBtn.innerText().catch(() => '')
      const copyOk = copyLabel.trim() === '已复制'
      const shownError = (await dialog.locator('.bc-backup-error').count()) > 0
      if (!copyOk && !shownError) throw new Error('复制摘要没有反馈')
      extra += ` · 趋势 ${trends} · 复制 ${copyLabel.trim() || '?'}`
      if (rows > 0) {
        await dialog.locator('.bc-checkup-row-btn').first().click()
        await page.waitForTimeout(800)
        const columns = await dialog.locator('.bc-checkup-columns').count()
        if (columns === 0) throw new Error('膨胀表点开后没有列结构')
        extra += ' · 列结构可见'
        const indexes = await dialog.locator('.bc-checkup-index').count()
        extra += ` · 索引区 ${indexes}`
        const emptyChips = dialog.locator('.bc-checkup-tag-btn')
        if ((await emptyChips.count()) > 0) {
          await emptyChips.first().click()
          await page.waitForTimeout(1500)
          if ((await dialog.locator('.bc-checkup-usage').count()) === 0) {
            throw new Error('空表点开后没有引用面板')
          }
          const refs = await dialog.locator('.bc-checkup-usage-row').count()
          extra += ` · 源码引用 ${refs}`
        }
      }
    }
    await closeOverlay()
    if (!hasGrid && !errorShown) throw new Error('既没有结果也不是明确错误')
    return hasGrid ? text.split('\n').slice(0, 4).join(' / ') + extra : '体检接口错误（已在对话框提示）'
  })

  await soft('存储概览对话框能打开', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '更多操作' }).click()
    await page.waitForTimeout(400)
    await page.locator('[role="menu"]').getByText('存储概览…').click()
    await page.waitForTimeout(1200)
    const dialog = page.getByRole('dialog')
    if (!(await dialog.count())) throw new Error('对话框没打开')
    await page.waitForSelector('.bc-storage-row, .bc-backup-empty, .bc-backup-error', { timeout: 15000 }).catch(() => {})
    const rows = await dialog.locator('.bc-storage-row').count()
    const text = await dialog.innerText()
    await closeOverlay()
    if (rows === 0 && !text.includes('没有可统计')) throw new Error('既没有存储项也不是空态')
    if (!text.includes('设置')) throw new Error('存储概览没提示去设置页调阈值')
    return `${rows} 项${text.includes('合计占用') ? ' · 有合计' : ''} · 阈值提示指向设置`
  })

  await soft('设置页面能打开并保存阈值', async () => {
    await page.locator('.bc-header').getByRole('button', { name: '设置' }).click()
    await page.waitForSelector('.bc-settings', { timeout: 10000 })
    const settings = page.locator('.bc-settings')
    const inputs = settings.locator('.bc-settings-input')
    const count = await inputs.count()
    if (count !== 6) throw new Error(`设置输入框 ${count}，应为 6`)
    const dockToggle = await settings.getByRole('button', { name: /已开启|已关闭/ }).count()
    if (dockToggle === 0) throw new Error('日志展开开关缺失')
    const gear = await page.locator('.bc-header').getByRole('button', { name: '设置' }).count()
    if (gear === 0) throw new Error('顶部缺少设置齿轮按钮')
    const pathGroup = await page.locator('.bc-settings-group', { hasText: '路径' }).count()
    if (pathGroup === 0) throw new Error('缺少路径设置组')
    const derived = await page.locator('.bc-settings-derived').count()
    const oldHostNote = await page.getByText('宿主路径配置暂不可用').count()
    if (derived === 0 && oldHostNote === 0) throw new Error('路径组既没有派生信息也没有旧宿主提示')
    // 原样保存，避免改变真实阈值
    await settings.getByRole('button', { name: '保存磁盘阈值' }).click()
    await page.waitForTimeout(1200)
    const diskNotice = await page.locator('.bc-settings-notice').innerText().catch(() => '')
    await settings.getByRole('button', { name: '保存趋势阈值' }).click()
    await page.waitForTimeout(1200)
    const trendNotice = await page.locator('.bc-settings-notice').innerText().catch(() => '')
    await settings.getByRole('button', { name: '保存定时任务阈值' }).click()
    await page.waitForTimeout(1200)
    const cronNotice = await page.locator('.bc-settings-notice').innerText().catch(() => '')
    // 刷新间隔：切 10 秒 → 校验 localStorage → 切回 5 秒
    await settings.getByRole('button', { name: '10 秒' }).click()
    await page.waitForTimeout(300)
    const storedTen = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    await settings.getByRole('button', { name: '5 秒' }).click()
    await page.waitForTimeout(300)
    const storedFive = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    const uiNotice = await page.locator('.bc-settings-notice').innerText().catch(() => '')
    // 日志默认行数/级别
    await settings.getByRole('button', { name: '300 行' }).click()
    await settings.getByRole('button', { name: '错误' }).click()
    await page.waitForTimeout(300)
    const logPrefs = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    await settings.getByRole('button', { name: '120 行' }).click()
    await settings.getByRole('button', { name: '全部' }).click()
    // 分组顺序：第一组下移再移回
    const orderRows = settings.locator('.bc-settings-order-row')
    const orderCount = await orderRows.count()
    let orderMoved = false
    if (orderCount >= 2) {
      const firstName = (await orderRows.first().locator('.bc-settings-order-name').innerText()).trim()
      await orderRows.first().getByRole('button', { name: /下移/ }).click()
      await page.waitForTimeout(200)
      const storedOrder = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
      orderMoved = storedOrder !== null && storedOrder.includes('"groupOrder"') && !storedOrder.includes('"groupOrder":[]')
      await orderRows.first().getByRole('button', { name: /下移/ }).click()
      await page.waitForTimeout(200)
      const restored = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
      const restoredOrder = JSON.parse(restored).groupOrder
      let guard = 0
      while (restoredOrder[0] !== firstName && guard < orderCount) {
        await orderRows.first().getByRole('button', { name: /下移/ }).click()
        await page.waitForTimeout(100)
        guard += 1
      }
    }
    await settings.getByRole('button', { name: '返回面板' }).click()
    await page.waitForTimeout(800)
    const back = await page.locator('.bc-header').count()
    if (!diskNotice.includes('已保存')) throw new Error(`磁盘阈值保存提示: ${diskNotice}`)
    if (!trendNotice.includes('已保存')) throw new Error(`趋势阈值保存提示: ${trendNotice}`)
    if (!cronNotice.includes('已保存')) throw new Error(`定时任务阈值保存提示: ${cronNotice}`)
    if (back === 0) throw new Error('返回后面板不存在')
    if (storedTen === null || !storedTen.includes('10')) throw new Error(`刷新间隔未持久化: ${storedTen}`)
    if (storedFive === null || !storedFive.includes('5')) throw new Error(`刷新间隔恢复失败: ${storedFive}`)
    if (!uiNotice.includes('刷新间隔')) throw new Error(`界面组提示: ${uiNotice}`)
    if (logPrefs === null || !logPrefs.includes('"logLines":300') || !logPrefs.includes('"logLevel":"error"')) {
      throw new Error(`日志偏好未持久化: ${logPrefs}`)
    }
    return `${count} 个输入 · 齿轮入口 · 路径组 ${pathGroup}${derived > 0 ? '（已派生）' : '（旧宿主提示）'} · 保存提示「${diskNotice.trim()} / ${cronNotice.trim()} / ${trendNotice.trim()}」· 间隔切 10s→5s · 日志 300/错误 · 分组移动 ${orderMoved} · 返回正常`
  })

  await soft('首页分组可折叠且记忆', async () => {
    const section = page.locator('.bc-section').first()
    const toggle = section.locator('.bc-section-collapse').first()
    if ((await toggle.count()) === 0) throw new Error('分组没有折叠按钮')
    await toggle.click()
    await page.waitForTimeout(300)
    const collapsedGrids = await section.locator('.bc-grid').count()
    const stored = await page.evaluate(() => window.localStorage.getItem('brain.console.prefs.v1'))
    await toggle.click()
    await page.waitForTimeout(300)
    const expandedGrids = await section.locator('.bc-grid').count()
    if (collapsedGrids !== 0) throw new Error('折叠后仍渲染成员网格')
    if (stored === null || stored.includes('"collapsedGroups":[]')) throw new Error('折叠状态未持久化')
    if (expandedGrids === 0) throw new Error('再次点击没展开')
    return '折叠隐藏网格 · 状态已持久化 · 再点展开'
  })

  await soft('磁盘低余量时顶部出现告警', async () => {
    const mock = async (totalGb, freeGb) => {
      await page.route('**/storage/summary*', (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          generated_at: '2026-01-01 00:00:00',
          total_bytes: 0,
          items: [],
          disk: { total_bytes: totalGb * 1024 ** 3, free_bytes: freeGb * 1024 ** 3 },
          thresholds: { warn_gb: 10, critical_percent: 2 },
        }),
      }))
    }
    const refresh = async () => {
      await page.locator('.bc-header').getByRole('button', { name: '刷新' }).first().click()
      await page.waitForTimeout(2200)
    }
    // 红档：可用 2GB / 总量 653GB → 占比 0.3% < 2%
    await mock(653, 2)
    await refresh()
    const redChip = page.locator('.bc-header-alert', { hasText: '磁盘可用' })
    const redCount = await redChip.count()
    const redTone = redCount > 0 ? await redChip.first().getAttribute('data-tone') : null
    const redText = redCount > 0 ? (await redChip.first().innerText()).trim() : ''
    // 黄档：可用 8GB / 总量 200GB → 占比 4% ≥ 2%，但 8GB < 10GB
    await mock(200, 8)
    await refresh()
    const yellowTone = (await redChip.count()) > 0 ? await redChip.first().getAttribute('data-tone') : null
    let opened = 0
    if ((await redChip.count()) > 0) {
      await redChip.first().click()
      await page.waitForTimeout(600)
      opened = await page.getByRole('dialog').count()
      await closeOverlay()
    }
    await page.unroute('**/storage/summary*')
    await refresh()
    if (redCount === 0) throw new Error('低余量 mock 没触发顶部告警')
    if (redTone !== 'bad') throw new Error(`红档 data-tone=${redTone}`)
    if (!redText.includes('%')) throw new Error(`告警文案缺占比: ${redText}`)
    if (yellowTone !== 'warn') throw new Error(`黄档 data-tone=${yellowTone}`)
    if (opened === 0) throw new Error('点击磁盘告警没有打开存储概览')
    return `红档 ${redText} · 黄档 ${yellowTone} · 打开对话框 ${opened}`
  })

  record('运行期间无 pageerror', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200))

  const shot = argOf('--shot')
  if (shot) {
    await page.screenshot({ path: shot })
    console.log(`📸 截图: ${shot}`)
  }
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} 通过`)
if (failed.length) {
  console.error('失败项: ' + failed.map((f) => f.name).join(' · '))
  process.exit(1)
}

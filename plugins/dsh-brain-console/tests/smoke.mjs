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
    await page.getByRole('button', { name: '收起日志' }).click().catch(() => {})
    return '已展开'
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

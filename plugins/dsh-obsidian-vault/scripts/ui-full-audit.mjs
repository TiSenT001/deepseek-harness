import { chromium } from './playwright-env.mjs'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// Full interactive audit of the obsidian-vault plugin: walks every button and
// feature in the UI, records per-check pass/fail, and collects console errors.
// Fixtures are created/deleted through the plugin API and UI paths only.
const args = process.argv.slice(2)
let url = args.find(arg => !arg.startsWith('--'))
if (url === undefined) {
  console.error('usage: node ui-full-audit.mjs <url> [--only=name1,name2]')
  process.exit(1)
}
// `--only=a,b` runs just the named checks; page setup and fixture teardown
// always run so the vault is left clean either way.
const onlyArg = args.find(arg => arg.startsWith('--only='))
const only = onlyArg === undefined
  ? undefined
  : new Set(onlyArg.slice('--only='.length).split(',').filter(name => name.length > 0))
const origin = new URL(url).origin
const API = `${origin}/obsidian/api`

// A restarted host rotates the URL token, and the token file a caller reads can be
// older than the one the running server accepts. The launch log always holds the
// current URL, so a blank page retries with it before failing the audit.
const LOG_URL = fileURLToPath(new URL('../../../.dsh-home/dsh-web.log', import.meta.url))
const urlFromLog = () => {
  try {
    if (!existsSync(LOG_URL)) return undefined
    const lines = readFileSync(LOG_URL, 'utf8').split('\n')
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const match = lines[index].match(/dsh web: (http:\/\/\S+)/)
      if (match !== null) return match[1].trim()
    }
  } catch {
    // A missing or unreadable log is not an audit failure.
  }
  return undefined
}
const SHOTS = '.artifacts/ui/audit'
mkdirSync(SHOTS, { recursive: true })

const api = async (route, init) => {
  const res = await fetch(`${API}/${route}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status}`)
  return res.json()
}

// The active vault root is machine-specific; ask the Host instead of hardcoding
// a drive letter, so the audit runs on any checkout.
const VAULT_ROOT = String((await api('status')).root ?? '')

// ---------- fixtures ----------
const FIXTURE_DIR = '审核临时文件夹'
const FIXTURE = `${FIXTURE_DIR}/审核夹具.md`
const LINKER = '审核链接者.md'
const GHOST = '审核不存在目标.md'
const RENAMED = '审核链接者改名.md'
// Drag fixtures stay adjacent in sort order so both rows fit in one screenful.
const DRAG_SOURCE_DIR = '审核拖拽源'
const DRAG_TARGET_DIR = '审核拖拽目标'
const DRAG_NAME = '拖动笔记.md'
const DRAG_FILE = `${DRAG_SOURCE_DIR}/${DRAG_NAME}`
// Attachments live inside the fixture folder so the tree shows them beside the
// notes and opening one never needs a long scroll through the vault root.
const CODE_ATTACHMENT = `${FIXTURE_DIR}/样例代码.ts`
const IMAGE_ATTACHMENT = `${FIXTURE_DIR}/样例图片.png`
const BINARY_ATTACHMENT = `${FIXTURE_DIR}/样例数据.bin`
const CODE_BODY = [
  '// 审核注释',
  'export function auditTrail(value: number): string {',
  '  return `value=${value}`',
  '}',
  '',
].join('\n')
// 1x1 PNG, so a successful decode proves the asset route served real bytes.
const IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
const fixtureBody = [
  '---',
  'title: 审核夹具',
  'created: 2026-10-27',
  'tags:',
  '  - 审核标签',
  'draft: false',
  'count: 42',
  '---',
  '# 审核夹具标题',
  '',
  '> [!note]- 可折叠标注',
  '> 标注正文第一行',
  '',
  '普通段落含 ==高亮文字== 和 [[审核链接者]] 还有 [[审核不存在目标]]。',
  '',
  '#审核标签',
  '',
  '- [ ] 未完成任务',
  '- [x] 已完成任务',
  '',
  '~~~js',
  "console.log('audit code')",
  '~~~',
  '',
  '外部链接 [Example](https://example.com)',
  '',
  '带脚注的句子[^note1]。',
  '',
  '[^note1]: 脚注内容。',
  '',
].join('\n')
const linkerBody = '# 审核链接者\n\n链接到 [[审核夹具]]。\n'

await api('mkdir', { method: 'POST', body: JSON.stringify({ path: FIXTURE_DIR }) })
await api('create', { method: 'POST', body: JSON.stringify({ path: FIXTURE }) })
await api('create', { method: 'POST', body: JSON.stringify({ path: LINKER }) })
// `create` makes empty notes and registers the paths in the index; the bodies
// go to disk directly and are picked up by the refresh click after page load.
writeFileSync(join(VAULT_ROOT, FIXTURE), fixtureBody)
writeFileSync(join(VAULT_ROOT, LINKER), linkerBody)
// Attachments are not notes, so `create` refuses them; writing them to disk
// before the boot refresh is the same path a real vault takes.
writeFileSync(join(VAULT_ROOT, CODE_ATTACHMENT), CODE_BODY)
writeFileSync(join(VAULT_ROOT, IMAGE_ATTACHMENT), Buffer.from(IMAGE_BASE64, 'base64'))
writeFileSync(join(VAULT_ROOT, BINARY_ATTACHMENT), Buffer.from([0x00, 0x01, 0x02, 0x03]))

// A nested heading tree exercises the outline drag: demoting 大纲二级甲 must
// carry 大纲三级甲 along, and the drag back restores the file byte-for-byte.
const OUTLINE_NOTE = `${FIXTURE_DIR}/审核大纲.md`
const OUTLINE_BODY = ['# 大纲一级', '', '## 大纲二级甲', '', '### 大纲三级甲', '', '## 大纲二级乙', ''].join('\n')
await api('create', { method: 'POST', body: JSON.stringify({ path: OUTLINE_NOTE }) })
writeFileSync(join(VAULT_ROOT, OUTLINE_NOTE), OUTLINE_BODY)

// Relative links, sized image embeds, and nested callouts share one note. The
// ./ link targets 审核大纲 rather than 审核夹具: a link to the main fixture
// would add a backlink row and break note.inline-backlinks' count assertion.
const RELATIVE_NOTE = `${FIXTURE_DIR}/审核相对链接.md`
const RELATIVE_BODY = [
  '# 审核相对',
  '',
  '相对 [[../审核链接者]] 与同目录 [[./审核大纲]]。',
  '',
  '![[样例图片.png|300x200]]',
  '',
  '> [!note] 外层标注',
  '> 外层正文',
  '> > [!tip] 内层标注',
  '> > 内层正文',
  '',
].join('\n')
await api('create', { method: 'POST', body: JSON.stringify({ path: RELATIVE_NOTE }) })
writeFileSync(join(VAULT_ROOT, RELATIVE_NOTE), RELATIVE_BODY)

// A throwaway second vault proves the page follows the Host's active root:
// after vault/open the polling reload must redraw the tree from vault B, and
// switching back through the manager must restore the fixture vault.
const AUDIT_VAULT_B = mkdtempSync(join(tmpdir(), 'ov-audit-b-'))
// The DSH plugin folder is global (inside this package), so the fixture lands
// there and the cleanup at the end removes it again.
const AUDIT_DSH_DIR = fileURLToPath(new URL('../plugins/audit-dsh', import.meta.url))
mkdirSync(join(AUDIT_VAULT_B, '.obsidian'), { recursive: true })
writeFileSync(join(AUDIT_VAULT_B, '远端笔记.md'), '# 远端\n\n来自第二个库。\n', 'utf8')
// A DSH-adapted fixture: display-only, no enablement.
mkdirSync(AUDIT_DSH_DIR, { recursive: true })
writeFileSync(
  join(AUDIT_DSH_DIR, 'manifest.json'),
  JSON.stringify({ id: 'audit-dsh', name: 'Audit DSH', version: '0.2.0', description: '审核用 DSH 插件' }),
  'utf8',
)
writeFileSync(join(AUDIT_DSH_DIR, 'main.js'), 'export {}\n', 'utf8')

// A community plugin fixture for the bridge checks: the manifest feeds the
// community list, and the main.js exercises the obsidian shim (P9-3) —
// data.json round-trip, vault reads/writes, commands, a view, blocked Node
// modules — and reports every outcome into the frame DOM as #fixture-results.
const AUDIT_PUR_DIR = join(AUDIT_VAULT_B, '.obsidian', 'plugins', 'pur-studio')
mkdirSync(AUDIT_PUR_DIR, { recursive: true })
writeFileSync(
  join(AUDIT_PUR_DIR, 'manifest.json'),
  JSON.stringify({ id: 'pur-studio', name: 'Pur Studio', version: '0.1.0', description: '审核用桥接插件' }),
  'utf8',
)
// graph.json is embedded into the frame document so the shim's fs stub can
// answer the plugin's synchronous read; a 1x1 png proves getResourcePath.
writeFileSync(join(AUDIT_VAULT_B, '.obsidian', 'graph.json'), JSON.stringify({ colorGroups: [{ query: 'path:远端', color: { rgb: 14701138 } }] }), 'utf8')
writeFileSync(
  join(AUDIT_VAULT_B, 'pixel.png'),
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
)
writeFileSync(join(AUDIT_PUR_DIR, 'main.js'), String.raw`
const { Plugin, Notice, ItemView, normalizePath, TFile } = require('obsidian')

let sink = null
const results = []
function record(name, ok, detail) {
  results.push({ name: name, ok: !!ok, detail: String(detail == null ? '' : detail) })
  if (!sink) {
    sink = document.createElement('pre')
    sink.id = 'fixture-results'
    document.body.appendChild(sink)
  }
  sink.textContent = JSON.stringify(results)
}

class AuditView extends ItemView {
  getViewType() { return 'audit-view' }
  getDisplayText() { return '审核视图' }
  async onOpen() { this.contentEl.textContent = '审核视图内容' }
}

module.exports = class PurFixture extends Plugin {
  async onload() {
    try {
      record('normalizePath', normalizePath('a\\b//c.md') === 'a/b/c.md', normalizePath('a\\b//c.md'))
      const absent = await this.loadData()
      record('loadData-absent', absent === null, typeof absent)
      await this.saveData({ seed: 7 })
      const stored = await this.loadData()
      record('data-roundtrip', !!stored && stored.seed === 7, JSON.stringify(stored))
      const files = this.app.vault.getFiles()
      record('getFiles', files.length > 0 && files.every(function (f) { return f instanceof TFile }), String(files.length))
      const target = this.app.vault.getAbstractFileByPath('远端笔记.md')
      record('getAbstractFileByPath', !!target && target.path === '远端笔记.md', target ? target.path : 'null')
      const text = await this.app.vault.read(target)
      record('vault.read', text.indexOf('远端') >= 0, text.slice(0, 12))
      if (!(await this.app.vault.adapter.exists('桥接新建.md'))) {
        await this.app.vault.create('桥接新建.md', '# 桥接\n')
      }
      await this.app.vault.process('桥接新建.md', function (data) { return data + '更多\n' })
      const created = await this.app.vault.read('桥接新建.md')
      record('vault.create-process', created.indexOf('更多') >= 0, JSON.stringify(created))
      // Obsidian's getActiveFile is a synchronous getter; the shim answers from
      // the snapshot the host pushed before onload, never a Promise.
      const active = this.app.workspace.getActiveFile()
      record('getActiveFile-sync', active === null || active instanceof TFile, active === null ? 'null' : active.path)
      record('commands-empty', Object.keys(this.app.commands.commands).length === 0, JSON.stringify(this.app.commands.commands))
      try {
        this.app.commands.executeCommandById('workspace:move-to-new-window')
        record('executeCommandById-throws', false, 'no throw')
      } catch (error) {
        record('executeCommandById-throws', String(error).indexOf('unsupported obsidian api') >= 0, String(error))
      }
      // Tag reads warm asynchronously: the first call reports "not indexed",
      // the second answers from the warm entry.
      const first = this.app.metadataCache.getFileCache(target)
      record('fileCache-cold', first === null, String(first))
      await new Promise(function (resolve) { setTimeout(resolve, 400) })
      const warm = this.app.metadataCache.getFileCache(target)
      record('fileCache-warm', !!warm && Array.isArray(warm.tags), warm ? JSON.stringify(warm.tags) : 'null')
      const commandMark = document.createElement('div')
      commandMark.id = 'fixture-command'
      document.body.appendChild(commandMark)
      this.addCommand({ id: 'fixture-ping', name: '夹具命令', callback: function () { commandMark.textContent = '夹具命令已跑' } })
      this.addCommand({ id: 'fixture-open', name: '夹具打开链接', callback: () => { void this.app.workspace.openLinkText('远端笔记.md') } })
      this.registerView('audit-view', function (leaf) { return new AuditView(leaf) })
      await this.app.workspace.getLeaf().setViewState({ type: 'audit-view' })
      const mounted = document.querySelector('.ov-shim-view-content')
      record('view-mounted', !!mounted && mounted.textContent === '审核视图内容', mounted ? mounted.textContent : 'null')
      try {
        require('child_process').exec('dir')
        record('child_process-blocked', false, 'no throw')
      } catch (error) {
        record('child_process-blocked', String(error).indexOf('unsupported obsidian api') >= 0, String(error))
      }
      try {
        void require('electron').remote.BrowserWindow
        record('electron-blocked', false, 'no throw')
      } catch (error) {
        record('electron-blocked', String(error).indexOf('unsupported obsidian api') >= 0, String(error))
      }
      const graph = require('fs').readFileSync('/vault/.obsidian/graph.json', 'utf8')
      record('graph-json', graph.indexOf('colorGroups') >= 0, graph.slice(0, 24))
      const img = document.createElement('img')
      img.src = this.app.vault.getResourcePath('pixel.png')
      document.body.appendChild(img)
      const loaded = await new Promise(function (resolve) {
        img.onload = function () { resolve(true) }
        img.onerror = function () { resolve(false) }
      })
      record('resource-loads', loaded === true, img.src)
      new Notice('夹具通知', 0)
      record('notice', document.querySelector('.ov-shim-notice') !== null, '夹具通知')
      record('done', true, '')
    } catch (error) {
      record('fatal', false, String(error && error.stack ? error.stack : error))
    }
  }
}
`, 'utf8')

// Daily notes and templates read `.obsidian` configuration, so the fixture
// writes a temporary config pair before boot and restores the originals after.
const DAILY_DIR = '审核每日'
const TEMPLATE_DIR = '审核模板夹'
const TEMPLATE_NOTE = `${TEMPLATE_DIR}/每日模板.md`
const TEMPLATE_BODY = '# 每日模板\n\n今日待办\n'
const TEMPLATE_CREATED = '审核模板新建'
const dailyConfigPath = join(VAULT_ROOT, '.obsidian', 'daily-notes.json')
const templatesConfigPath = join(VAULT_ROOT, '.obsidian', 'templates.json')
const bookmarksConfigPath = join(VAULT_ROOT, '.obsidian', 'bookmarks.json')
// Capture the vault's real configs once and journal them until the restore
// below succeeds. An interrupted run therefore cannot make its own fixture
// values look like the originals on the next attempt.
const originalsPath = fileURLToPath(new URL('../.data/audit-vault-originals.json', import.meta.url))
const originals = existsSync(originalsPath)
  ? JSON.parse(readFileSync(originalsPath, 'utf8'))
  : {
    daily: existsSync(dailyConfigPath) ? readFileSync(dailyConfigPath, 'utf8') : undefined,
    templates: existsSync(templatesConfigPath) ? readFileSync(templatesConfigPath, 'utf8') : undefined,
    bookmarks: existsSync(bookmarksConfigPath) ? readFileSync(bookmarksConfigPath, 'utf8') : undefined,
  }
if (!existsSync(originalsPath)) {
  mkdirSync(dirname(originalsPath), { recursive: true })
  writeFileSync(originalsPath, JSON.stringify(originals), 'utf8')
}
writeFileSync(dailyConfigPath, JSON.stringify({ folder: DAILY_DIR, format: 'YYYY-MM-DD', template: TEMPLATE_NOTE }, null, 2), 'utf8')
writeFileSync(templatesConfigPath, JSON.stringify({ folder: TEMPLATE_DIR, format: '' }, null, 2), 'utf8')
mkdirSync(join(VAULT_ROOT, TEMPLATE_DIR), { recursive: true })
writeFileSync(join(VAULT_ROOT, TEMPLATE_NOTE), TEMPLATE_BODY, 'utf8')
const today = new Date()
const TODAY = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const results = []
const skipped = []
const consoleErrors = []
let dialogAnswer = ''
let currentCheck = 'boot'

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }),
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
})
const page = await context.newPage()
// The conflict check submits a stale write on purpose, so its 409 and the
// matching Chromium resource error are the behavior under test, not a defect.
const expectedFailure = (text) => currentCheck === 'note.editor-conflict-bar'
  && text.includes('409')
  && (text.includes('/obsidian/api/note') || text.includes('(Conflict)'))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !expectedFailure(msg.text())) consoleErrors.push(msg.text())
})
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
page.on('response', (response) => {
  const text = `HTTP ${response.status()} ${response.url()} during ${currentCheck}`
  if (response.status() >= 400 && !expectedFailure(text)) consoleErrors.push(text)
})
const traceStart = Date.now()
const apiTrace = []
const traceRequest = (request) => {
  if (!request.url().includes('/obsidian/api/')) return
  apiTrace.push(`${String(Date.now() - traceStart).padStart(6)}ms REQ ${request.method()} ${request.url().replace(origin, '')} ${request.postData() ?? ''} [${currentCheck}]`)
}
const traceResponse = (response) => {
  if (!response.url().includes('/obsidian/api/')) return
  apiTrace.push(`${String(Date.now() - traceStart).padStart(6)}ms RES ${response.status()} ${response.url().replace(origin, '')} [${currentCheck}]`)
}
page.on('request', traceRequest)
page.on('response', traceResponse)
page.on('dialog', async (dialog) => {
  if (dialog.type() === 'confirm') {
    await dialog.accept()
    return
  }
  await dialog.accept(dialogAnswer)
})

/**
 * Fill and submit the in-app ask dialog that replaced `window.prompt`. Embedded
 * webviews block the native dialog, so every prompt renders as `.ov-dialog`.
 */
async function answerAsk(text) {
  const dialog = page.locator('.ov-dialog')
  await dialog.waitFor({ timeout: 8000 })
  const input = dialog.locator('.ov-dialog-input')
  if ((await input.count()) === 1) await input.fill(text)
  await dialog.locator('.ov-dialog-button', { hasText: '确定' }).click()
  await sleep(500)
}

/** Accept the in-app confirmation that replaced `window.confirm`. */
async function confirmAsk() {
  const dialog = page.locator('.ov-dialog')
  await dialog.waitFor({ timeout: 8000 })
  await dialog.locator('.ov-dialog-button', { hasText: '确定' }).click()
  await sleep(500)
}

async function check(name, fn) {
  if (only !== undefined && !only.has(name)) {
    skipped.push(name)
    return
  }
  currentCheck = name
  // Animations, index refreshes and rAF counters occasionally settle one frame
  // late; a single retry after clearing transient overlays separates that jitter
  // from a real defect. Persistent failures are reported with both messages.
  const attempts = []
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const detail = await fn()
      results.push({ name, ok: true, detail: attempt === 1 ? detail : { ...(detail ?? {}), retried: true } })
      console.log(`ok ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}${attempt > 1 ? ' (retry)' : ''}`)
      return
    } catch (error) {
      attempts.push(error instanceof Error ? error.message : String(error))
      if (attempt === 1) {
        try {
          await page.keyboard.press('Escape')
          await sleep(250)
        } catch {
          // Clearing an overlay is best effort; the retry runs either way.
        }
      }
    }
  }
  {
    const message = attempts.join(' | ')
    results.push({ name, ok: false, detail: message })
    console.log(`FAIL ${name} — ${message}`)
    // A failed check can leave a modal or menu open, which blocks every later
    // click and turns one defect into a cascade; clear it before moving on.
    try {
      await page.keyboard.press('Escape')
      await sleep(150)
    } catch {
      // A page-level failure may make even Escape unusable.
    }
    try {
      await page.screenshot({ path: `${SHOTS}/${name}.png` })
    } catch {
      // Screenshot failure must not mask the real failure.
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sleep = (ms) => page.waitForTimeout(ms)

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await sleep(2500)
  const ovRoot = page.locator('.ov-root')
  if ((await ovRoot.count()) === 0 || !(await ovRoot.isVisible())) {
    const entry = page.locator('button', { hasText: '知识库' }).first()
    // A rotated token leaves the page blank, which otherwise surfaces as a
    // 30s locator timeout on every check and hides the real cause.
    if ((await entry.count()) === 0) {
      const fromLog = urlFromLog()
      if (fromLog !== undefined && new URL(fromLog).origin === origin && fromLog !== url) {
        url = fromLog
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await sleep(2500)
      }
      const retry = page.locator('button', { hasText: '知识库' }).first()
      if ((await retry.count()) === 0) {
        const title = await page.title()
        throw new Error(
          `workspace did not render (page title "${title}"): the URL token probably expired after a restart — `
          + 'pass the URL printed in .dsh-home/dsh-web.log',
        )
      }
      await retry.click()
    } else {
      await entry.click()
    }
  }
  await page.locator('.ov-root').waitFor({ timeout: 15000 })
  // Refresh the index so the fixtures written to disk are picked up.
  await page.locator('.ov-top button[aria-label="刷新索引"]').click()
  await sleep(1500)

  // Record drag events and move calls so a drag failure shows what happened.
  await page.evaluate(() => {
    window.__dragLog = []
    for (const type of ['dragstart', 'dragover', 'drop', 'dragend']) {
      window.addEventListener(type, (event) => {
        const t = event.target
        if (window.__dragLog.length < 400) {
          window.__dragLog.push(`${type}:${t instanceof Element ? (t.getAttribute('title') ?? t.tagName) : '?'}@${Math.round(event.clientX)},${Math.round(event.clientY)}`)
        }
      }, true)
    }
    const orig = window.fetch
    window.fetch = (...args) => {
      if (String(args[0]).includes('/obsidian/api/move')) window.__dragLog.push(`fetch-move:${args[1]?.body ?? ''}`)
      return orig(...args)
    }
  })

  const explorerFilter = page.locator('input.ov-filter')
  const tree = page.locator('.ov-tree')

  async function openViaFilter(query) {
    await explorerFilter.fill(query)
    await sleep(600)
    const hit = tree.locator('.ov-file', { hasText: query }).first()
    await hit.click()
    await sleep(900)
  }

  // Run one command palette entry by its label.
  async function runPalette(label) {
    await page.keyboard.press('Control+p')
    await sleep(350)
    await page.locator('.ov-quick-input').fill(label)
    await sleep(400)
    await page.keyboard.press('Enter')
    await sleep(700)
  }

  // Bridge checks must run against vault B (a throwaway temp dir): --only runs
  // skip the earlier vault switch, so hop over and back when vault A is active.
  let bridgePreviousRoot
  async function ensureVaultB() {
    const status = await api('status')
    if (status.root === AUDIT_VAULT_B) return
    bridgePreviousRoot = status.root
    await api('vault/open', { method: 'POST', body: JSON.stringify({ path: AUDIT_VAULT_B }) })
    await sleep(9500)
  }
  async function restoreBridgeVault() {
    if (bridgePreviousRoot === undefined) return
    await api('vault/open', { method: 'POST', body: JSON.stringify({ path: bridgePreviousRoot }) })
    bridgePreviousRoot = undefined
    await sleep(9500)
  }

  const rootMenu = () => page.locator('.ov-menu').first()
  const menuLabels = async () => {
    const texts = await rootMenu().locator('.ov-menu-item').allTextContents()
    return texts.map(text => text.trim())
  }

  // Attachments have no search hits (hits are notes), so they open from the
  // tree: collapse everything, expand the fixture folder, click the row.
  async function openTreeAttachment(name) {
    await explorerFilter.fill('')
    await sleep(500)
    await page.locator('button[aria-label="全部折叠"]').click()
    await sleep(400)
    const dir = tree.locator(`.ov-dir[title="${FIXTURE_DIR}"]`)
    await dir.scrollIntoViewIfNeeded()
    if ((await dir.locator('.ov-chevron').textContent()) === '▸') {
      await dir.click()
      await sleep(500)
    }
    await tree.locator(`.ov-file[title="${FIXTURE_DIR}/${name}"]`).click()
    await sleep(1500)
  }

  // ================= 顶栏 =================
  await check('nav.history-buttons-initial', async () => {
    // No tab has opened yet, so both directions stay disabled.
    const back = page.locator('button[aria-label="后退"]')
    const forward = page.locator('button[aria-label="前进"]')
    assert(await back.isDisabled(), 'back enabled with no history')
    assert(await forward.isDisabled(), 'forward enabled with no history')
    // The empty state offers no switcher button: the ribbon and Ctrl+O cover it.
    const action = await page.locator('.ov-state .ov-state-action').count()
    assert(action === 0, 'empty state still renders an action button')
  })

  await check('nav.panel-visible', async () => {
    assert(await page.locator('.ov-root').isVisible(), 'plugin root not visible')
    const count = await page.locator('.ov-statusbar-item', { hasText: '篇笔记' }).first().textContent()
    assert(/\d+/.test(count ?? ''), `note count missing: ${count}`)
    return { count }
  })

  await check('nav.topbar-refresh', async () => {
    // The quick-switcher pill and the overflow menu are gone; the index reload
    // is a plain topbar button now.
    assert((await page.locator('.ov-pill').count()) === 0, 'quick-switch pill still rendered')
    assert((await page.locator('button[aria-label="更多操作"]').count()) === 0, 'overflow button still rendered')
    const refresh = page.locator('.ov-top button[aria-label="刷新索引"]')
    assert((await refresh.count()) === 1, 'topbar refresh button missing')
    await refresh.click()
    await sleep(1200)
    const count = await page.locator('.ov-statusbar-item', { hasText: '篇笔记' }).first().textContent()
    assert(/\d+/.test(count ?? ''), `note count missing after refresh: ${count}`)
  })

  // ================= 快速切换 =================
  await check('quick.files-mode-search-open', async () => {
    await page.keyboard.press('Control+o')
    await sleep(300)
    await page.locator('.ov-quick-input').fill('审核夹具')
    await sleep(700)
    const items = page.locator('.ov-quick-item')
    assert((await items.count()) > 0, 'no file hits for 审核夹具')
    await page.keyboard.press('Enter')
    await sleep(900)
    assert((await page.locator('.ov-quick').count()) === 0, 'switcher still open after Enter')
    const tab = page.locator('.ov-doctab', { hasText: '审核夹具' })
    assert((await tab.count()) > 0, 'tab did not open')
  })

  await check('quick.ctrl-f-search-mode', async () => {
    await page.keyboard.press('Control+f')
    await sleep(300)
    const mode = await page.locator('.ov-quick-mode').textContent()
    assert(mode?.includes('全文'), `expected search mode, got ${mode}`)
    await page.locator('.ov-quick-input').fill('audit code')
    await sleep(800)
    const items = page.locator('.ov-quick-list .ov-item')
    assert((await items.count()) > 0, 'no content hits for audit code')
    const snippet = await items.first().locator('.ov-quick-snippet').count()
    assert(snippet > 0, 'search hit has no snippet')
    // The palette's two search toggles compose Host query syntax and persist.
    const foot = page.locator('.ov-quick-foot')
    const matchCase = foot.locator('button', { hasText: 'Aa' })
    const regex = foot.locator('button', { hasText: '.*' })
    assert((await matchCase.getAttribute('aria-pressed')) === 'false', 'match-case toggle starts on')
    await matchCase.click()
    await sleep(300)
    assert((await matchCase.getAttribute('aria-pressed')) === 'true', 'match-case toggle did not set')
    let stored = await page.evaluate(() => window.localStorage.getItem('ov.search.options.v1'))
    assert(stored !== null && stored.includes('"matchCase":true'), `match-case not persisted: ${stored}`)
    await regex.click()
    await sleep(300)
    assert((await regex.getAttribute('aria-pressed')) === 'true', 'regex toggle did not set')
    stored = await page.evaluate(() => window.localStorage.getItem('ov.search.options.v1'))
    assert(stored !== null && stored.includes('"regex":true'), `regex not persisted: ${stored}`)
    await regex.click()
    await matchCase.click()
    await sleep(300)
    assert((await matchCase.getAttribute('aria-pressed')) === 'false', 'match-case toggle did not clear')
    // Ordering and density are client-side; both persist next to the toggles.
    const sortButton = foot.locator('button', { hasText: '相关度' })
    await sortButton.click()
    await sleep(400)
    assert((await foot.locator('button', { hasText: '名称' }).count()) === 1, 'sort toggle did not switch to name')
    stored = await page.evaluate(() => window.localStorage.getItem('ov.search.options.v1'))
    assert(stored !== null && stored.includes('"sort":"name"'), 'sort not persisted: ' + stored)
    const compactButton = foot.locator('button', { hasText: '折叠' })
    await compactButton.click()
    await sleep(400)
    assert((await page.locator('.ov-quick-snippet').count()) === 0, 'compact did not hide snippets')
    await compactButton.click()
    await foot.locator('button', { hasText: '名称' }).click()
    await sleep(400)
    assert((await page.locator('.ov-quick-snippet').count()) > 0, 'snippets did not come back')
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('quick.question-prefix-switches', async () => {
    await page.keyboard.press('Control+o')
    await sleep(300)
    await page.locator('.ov-quick-input').fill('?审核链接者')
    await sleep(700)
    const mode = await page.locator('.ov-quick-mode').textContent()
    assert(mode?.includes('全文'), `? prefix did not switch: ${mode}`)
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('quick.tab-toggles-mode', async () => {
    await page.keyboard.press('Control+o')
    await sleep(300)
    await page.locator('.ov-quick-input').fill('审核')
    await sleep(600)
    const before = await page.locator('.ov-quick-mode').textContent()
    await page.keyboard.press('Tab')
    await sleep(300)
    const after = await page.locator('.ov-quick-mode').textContent()
    assert(before !== after, `Tab did not toggle mode (${before})`)
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('quick.command-mode', async () => {
    await page.keyboard.press('Control+p')
    await sleep(400)
    const mode = await page.locator('.ov-quick-mode').textContent()
    assert(mode?.includes('命令'), `Ctrl+P did not open commands: ${mode}`)
    const items = page.locator('.ov-quick-list .ov-item')
    const total = await items.count()
    assert(total >= 8, `too few commands listed: ${total}`)
    await page.locator('.ov-quick-input').fill('编辑')
    await sleep(400)
    assert((await items.count()) === 1, `filter kept ${await items.count()} commands`)
    await page.keyboard.press('Enter')
    await sleep(900)
    assert((await page.locator('.ov-quick').count()) === 0, 'palette stayed open after running a command')
    assert(await page.locator('.ov-editor-view').isVisible(), 'edit command did not open the editor')
    await page.locator('.ov-editor-view button[aria-label="阅读"]').click()
    await sleep(800)
    assert((await page.locator('.ov-editor-view').count()) === 0, 'reading view not restored after the edit command')
    return { total }
  })

  await check('quick.backdrop-closes', async () => {
    await page.keyboard.press('Control+o')
    await sleep(300)
    // Click the dimmed layer corner, not the dialog.
    await page.locator('.ov-quick-layer').click({ position: { x: 8, y: 8 } })
    await sleep(200)
    assert((await page.locator('.ov-quick').count()) === 0, 'backdrop click did not close')
  })

  // ================= 标签页 =================
  await check('tabs.new-tab-flow', async () => {
    const before = await page.locator('.ov-doctab').count()
    await page.locator('.ov-doctab-new').click()
    await sleep(400)
    const after = await page.locator('.ov-doctab').count()
    assert(after === before + 1, `new-tab count ${before} -> ${after}`)
    assert(await page.locator('.ov-vault-empty').isVisible(), 'new tab did not show the empty page')
    // Close the placeholder again so later checks start from the original tabs.
    await page.locator('.ov-doctab-active .ov-doctab-close').click()
    await sleep(400)
    assert(await page.locator('.ov-doctab').count() === before, 'empty tab did not close')
  })

  await check('tabs.select-and-history', async () => {
    // History grows on permanent opens and on preview navigations inside the
    // reused preview tab; this check exercises the permanent path. Close the
    // 链接者 tab left over from the new-tab check, then open 链接者 via the
    // quick switcher (permanent open), which replaces the active 夹具 tab and
    // pushes history.
    const stray = page.locator('.ov-doctab', { hasText: '审核链接者' })
    if ((await stray.count()) > 0) {
      await stray.first().locator('.ov-doctab-close').click()
      await sleep(400)
    }
    await page.locator('.ov-doctab', { hasText: '审核夹具' }).first().click()
    await sleep(500)
    const before = await page.locator('.ov-doctab').count()
    await page.keyboard.press('Control+o')
    await sleep(300)
    await page.locator('.ov-quick-input').fill('审核链接者')
    await sleep(700)
    await page.keyboard.press('Enter')
    await sleep(900)
    const tabCount = await page.locator('.ov-doctab').count()
    assert(tabCount === before, `permanent open changed tab count ${before} -> ${tabCount}`)
    const active = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(active?.includes('审核链接者'), `active tab is ${active}`)
    const back = page.locator('button[aria-label="后退"]')
    const forward = page.locator('button[aria-label="前进"]')
    assert(await back.isEnabled(), 'back disabled after two opens in one tab')
    assert(await forward.isDisabled(), 'forward enabled at the newest history entry')
    await back.click()
    await sleep(600)
    const afterBack = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(afterBack?.includes('审核夹具'), `back landed on ${afterBack}`)
    // The tab switch must re-render the note body, not just the tab strip.
    const backDoc = await page.locator('.ov-document').textContent()
    assert(backDoc?.includes('审核夹具标题'), 'back did not re-render the fixture note')
    assert(await back.isDisabled(), 'back enabled at the oldest history entry')
    assert(await forward.isEnabled(), 'forward disabled after going back')
    await forward.click()
    await sleep(600)
    const afterFwd = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(afterFwd?.includes('审核链接者'), `forward landed on ${afterFwd}`)
    const fwdDoc = await page.locator('.ov-document').textContent()
    assert(fwdDoc?.includes('链接到'), 'forward did not re-render the linker note')
    assert(await forward.isDisabled(), 'forward enabled after returning to the newest entry')
    // Leave the tab on 审核夹具 for the probes that follow.
    await back.click()
    await sleep(600)
  })

  await check('tabs.alt-arrows', async () => {
    // Active tab history is [审核夹具, 审核链接者] with the index on 审核夹具.
    await page.keyboard.press('Alt+ArrowRight')
    await sleep(500)
    const fwd = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(fwd?.includes('审核链接者'), `Alt+Right landed on ${fwd}`)
    await page.keyboard.press('Alt+ArrowLeft')
    await sleep(500)
    const backTo = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(backTo?.includes('审核夹具'), `Alt+Left landed on ${backTo}`)
  })

  await check('tabs.dblclick-pins', async () => {
    // A single click on a note without a tab opens a preview tab; only preview
    // tabs offer Pin, which is what the next check asserts.
    await openViaFilter('审核链接者')
    await explorerFilter.fill('')
    await sleep(400)
    const tab = page.locator('.ov-doctab-active')
    const isPreview = (await tab.getAttribute('class'))?.includes('ov-doctab-preview')
    assert(isPreview === true, 'tree click did not open a preview tab')
    await tab.dblclick()
    await sleep(300)
    const cls = await page.locator('.ov-doctab-active').getAttribute('class')
    assert(!(cls ?? '').includes('ov-doctab-preview'), 'tab still preview after dblclick')
  })

  await check('tabs.context-menu-close-others', async () => {
    // Right-click a preview tab so the menu carries the Pin command; the note
    // must not already own a tab, so drop the one the earlier checks opened.
    const stale = page.locator('.ov-doctab', { hasText: '审核夹具' })
    if ((await stale.count()) > 0) {
      await stale.first().locator('.ov-doctab-close').click()
      await sleep(400)
    }
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    await sleep(400)
    await page.locator('.ov-doctab', { hasText: '审核夹具' }).first().click({ button: 'right' })
    await sleep(300)
    const menu = page.locator('.ov-menu')
    assert(await menu.isVisible(), 'tab menu did not open')
    const labels = await menu.locator('.ov-menu-item').allTextContents()
    for (const wanted of ['关闭标签页', '关闭其他标签页', '关闭全部标签页', '固定标签页']) {
      assert(labels.some(label => label.includes(wanted)), `menu missing ${wanted}`)
    }
    await menu.locator('.ov-menu-item', { hasText: '关闭其他标签页' }).click()
    await sleep(400)
    const count = await page.locator('.ov-doctab').count()
    assert(count === 1, `close-others left ${count} tabs`)
  })

  await check('tabs.close-x-and-empty-state', async () => {
    await page.locator('.ov-doctab-active .ov-doctab-close').click()
    await sleep(400)
    assert((await page.locator('.ov-doctab').count()) === 0, 'tab still present')
    assert(await page.locator('.ov-main-column .ov-vault-empty').first().isVisible(), 'empty state missing')
  })

  // ================= 分屏 =================
  await check('panes.split-right', async () => {
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    await sleep(400)
    // Pin 夹具 so the next open spawns a second tab instead of replacing the
    // preview, then open 审核大纲 as the active preview tab.
    await page.locator('.ov-doctab', { hasText: '审核夹具' }).first().dblclick()
    await sleep(300)
    await openViaFilter('审核大纲')
    await explorerFilter.fill('')
    await sleep(400)
    assert((await page.locator('.ov-pane').count()) === 1, 'expected a single pane before the split')
    await runPalette('向右拆分')
    assert((await page.locator('.ov-pane').count()) === 2, 'split did not add a pane')
    assert((await page.locator('.ov-main-column[data-direction="row"]').count()) === 1, 'row direction missing')
    const left = page.locator('.ov-pane').nth(0)
    const right = page.locator('.ov-pane').nth(1)
    const rightClass = await right.getAttribute('class')
    assert(rightClass?.includes('ov-pane-active'), `new pane did not take focus: ${rightClass}`)
    assert((await left.locator('.ov-doctab', { hasText: '审核夹具' }).count()) === 1, 'left pane lost 审核夹具')
    assert((await right.locator('.ov-doctab', { hasText: '审核大纲' }).count()) === 1, 'active tab did not move right')
  })

  await check('panes.independent-tabs', async () => {
    // Focus is on the right pane; opening a note there must not touch the left.
    await page.keyboard.press('Control+o')
    await sleep(300)
    await page.locator('.ov-quick-input').fill('审核链接者')
    await sleep(700)
    await page.keyboard.press('Enter')
    await sleep(900)
    const left = page.locator('.ov-pane').nth(0)
    const right = page.locator('.ov-pane').nth(1)
    const leftTabs = await left.locator('.ov-doctab').count()
    const rightTabs = await right.locator('.ov-doctab').count()
    assert(leftTabs === 1 && rightTabs === 1, `tab counts ${leftTabs}/${rightTabs}`)
    assert((await left.locator('.ov-doctab', { hasText: '审核夹具' }).count()) === 1, 'left pane tab changed')
    assert((await right.locator('.ov-doctab', { hasText: '审核链接者' }).count()) === 1, 'right pane did not open 审核链接者')
  })

  await check('panes.focus-follows-click', async () => {
    const left = page.locator('.ov-pane').nth(0)
    await left.locator('.ov-doctab', { hasText: '审核夹具' }).click()
    await sleep(400)
    const leftClass = await left.getAttribute('class')
    const rightClass = await page.locator('.ov-pane').nth(1).getAttribute('class')
    assert(leftClass?.includes('ov-pane-active'), `left pane not active: ${leftClass}`)
    assert(!rightClass?.includes('ov-pane-active'), `right pane stayed active: ${rightClass}`)
  })

  await check('panes.splitter-resize', async () => {
    const splitter = page.locator('[data-ov-pane-splitter]')
    assert((await splitter.count()) === 1, 'pane splitter missing')
    assert((await splitter.getAttribute('aria-orientation')) === 'vertical', 'row split needs a vertical splitter')
    const left = page.locator('.ov-pane').nth(0)
    const right = page.locator('.ov-pane').nth(1)
    const widths = async () => [
      (await left.boundingBox())?.width ?? 0,
      (await right.boundingBox())?.width ?? 0,
    ]
    const before = await widths()
    const box = await splitter.boundingBox()
    assert(box !== null, 'pane splitter has no bounding box')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 120, y, { steps: 12 })
    await page.mouse.up()
    await sleep(400)
    const dragged = await widths()
    assert(dragged[0] > before[0] + 60, `left pane did not widen (${before[0]} -> ${dragged[0]})`)
    assert(dragged[1] < before[1] - 60, `right pane did not shrink (${before[1]} -> ${dragged[1]})`)
    await splitter.dblclick()
    await sleep(400)
    const reset = await widths()
    assert(Math.abs(reset[0] - reset[1]) < 8, `double click did not even the panes (${reset[0]} vs ${reset[1]})`)
  })

  await check('panes.split-down-and-close', async () => {
    await runPalette('向下拆分')
    assert((await page.locator('.ov-pane').count()) === 3, 'down split did not add a third pane')
    assert((await page.locator('.ov-main-column[data-direction="column"]').count()) === 1, 'column direction missing')
    assert((await page.locator('[data-ov-pane-splitter][aria-orientation="horizontal"]').count()) === 2, 'column split needs horizontal splitters')
    await runPalette('关闭窗格')
    assert((await page.locator('.ov-pane').count()) === 2, 'first close did not drop a pane')
    await runPalette('关闭窗格')
    assert((await page.locator('.ov-pane').count()) === 1, 'second close did not return to one pane')
    // With one pane left, the close command leaves the palette.
    await page.keyboard.press('Control+p')
    await sleep(350)
    await page.locator('.ov-quick-input').fill('关闭窗格')
    await sleep(400)
    assert((await page.locator('.ov-quick-list .ov-item').count()) === 0, 'close-pane still listed with one pane')
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('tabs.context-menu-split-close-pane', async () => {
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    await sleep(400)
    await page.locator('.ov-doctab', { hasText: '审核夹具' }).first().click({ button: 'right' })
    await sleep(300)
    let labels = await menuLabels()
    for (const wanted of ['向右拆分', '向下拆分', '关闭窗格']) {
      assert(labels.some(label => label.includes(wanted)), `tab menu missing ${wanted}: ${labels.join(' | ')}`)
    }
    const disabledClose = rootMenu().locator('.ov-menu-item', { hasText: '关闭窗格' })
    assert((await disabledClose.getAttribute('aria-disabled')) === 'true', 'close-pane enabled with one pane')
    await rootMenu().locator('.ov-menu-item', { hasText: '向右拆分' }).click()
    await sleep(600)
    assert((await page.locator('.ov-pane').count()) === 2, 'menu split did not add a pane')
    const moved = page.locator('.ov-pane').nth(1)
    assert((await moved.locator('.ov-doctab', { hasText: '审核夹具' }).count()) === 1, 'fixture tab did not move to the new pane')
    // Right-clicking the other pane's tab focuses that pane first, so the
    // close command targets the pane the menu was opened on.
    await moved.locator('.ov-doctab', { hasText: '审核夹具' }).click({ button: 'right' })
    await sleep(300)
    labels = await menuLabels()
    assert(labels.some(label => label.includes('关闭窗格')), `tab menu lost 关闭窗格: ${labels.join(' | ')}`)
    const closeItem = rootMenu().locator('.ov-menu-item', { hasText: '关闭窗格' })
    assert((await closeItem.getAttribute('aria-disabled')) !== 'true', 'close-pane disabled with two panes')
    await closeItem.click()
    await sleep(600)
    assert((await page.locator('.ov-pane').count()) === 1, 'close-pane did not return to one pane')
  })

  // ================= 文件列表 =================
  await check('explorer.filter-and-open', async () => {
    await openViaFilter('审核夹具')
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核夹具'), `opened ${active}`)
    await explorerFilter.fill('')
    await sleep(400)
  })

  await check('explorer.dir-expand-collapse-all', async () => {
    // Auto-reveal may already have expanded the fixture dir (active note inside).
    const dir = tree.locator('.ov-dir', { hasText: FIXTURE_DIR }).first()
    const initial = await dir.locator('.ov-chevron').textContent()
    if (initial === '▾') {
      await dir.click()
      await sleep(300)
      assert((await dir.locator('.ov-chevron').textContent()) === '▸', 'dir did not collapse')
    }
    await dir.click()
    await sleep(300)
    let chevron = await dir.locator('.ov-chevron').textContent()
    assert(chevron === '▾', `dir did not expand (${chevron})`)
    const child = tree.locator('.ov-file', { hasText: '审核夹具' }).first()
    assert(await child.isVisible(), 'expanded child not visible')
    await page.locator('button[aria-label="全部折叠"]').click()
    await sleep(300)
    chevron = await tree.locator('.ov-dir', { hasText: FIXTURE_DIR }).first().locator('.ov-chevron').textContent()
    assert(chevron === '▸', `collapse-all left ${chevron}`)
  })

  await check('explorer.tag-chip-opens-search', async () => {
    const head = page.locator('.ov-explorer-tags-head')
    const expanded = await head.getAttribute('aria-expanded')
    if (expanded === 'false') {
      await head.click()
      await sleep(300)
    }
    const chip = page.locator('.ov-tag-chip', { hasText: '#审核标签' }).first()
    assert((await chip.count()) > 0, 'fixture tag chip missing')
    await chip.click()
    await sleep(800)
    assert(await page.locator('.ov-quick').isVisible(), 'tag chip did not open the search panel')
    const mode = await page.locator('.ov-quick-mode').textContent()
    assert(mode?.includes('全文'), `tag chip opened ${mode}`)
    const query = await page.locator('.ov-quick-input').inputValue()
    assert(query === '#审核标签', `prefilled query is ${query}`)
    const hits = page.locator('.ov-quick-list .ov-item')
    assert((await hits.count()) > 0, 'tag search returned no files')
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('explorer.tags-section-toggle', async () => {
    const head = page.locator('.ov-explorer-tags-head')
    const before = await head.getAttribute('aria-expanded')
    await head.click()
    await sleep(300)
    const after = await head.getAttribute('aria-expanded')
    assert(before !== after, 'tags section did not toggle')
    await head.click()
    await sleep(200)
  })

  // ================= 笔记视图 =================
  await check('note.properties-tags-tasks', async () => {
    await openViaFilter('审核夹具')
    const rows = await page.locator('.ov-property-row').count()
    assert(rows >= 4, `property rows ${rows}`)
    const chips = await page.locator('.ov-tag-row .ov-chip', { hasText: '#审核标签' }).count()
    assert(chips > 0, 'tag chip missing in note header')
    const tasks = await page.locator('.ov-document input[type="checkbox"]').count()
    assert(tasks === 2, `task checkboxes ${tasks}`)
    await explorerFilter.fill('')
    await sleep(300)
  })

  await check('note.callout-folds', async () => {
    const callout = page.locator('details.ov-callout').first()
    assert((await callout.count()) > 0, 'no foldable callout')
    const openBefore = await callout.getAttribute('open')
    await callout.locator('summary.ov-callout-head').click()
    await sleep(300)
    const openAfter = await callout.getAttribute('open')
    assert((openBefore === null) !== (openAfter === null), `fold did not flip (${openBefore} -> ${openAfter})`)
  })

  await check('note.relative-links-resolve', async () => {
    await openViaFilter('审核相对链接')
    const links = await page.locator('.ov-document a[href^="https://dsh-obsidian.invalid/open"]').all()
    const paths = []
    for (const link of links) {
      const href = await link.getAttribute('href')
      paths.push(new URL(href).searchParams.get('p'))
    }
    assert(paths.includes('审核链接者.md'), `../ link did not resolve: ${paths}`)
    assert(paths.includes(`${FIXTURE_DIR}/审核大纲.md`), `./ link did not resolve: ${paths}`)
  })

  await check('note.embed-image-size', async () => {
    const img = page.locator('.ov-document img[width="300"][height="200"]').first()
    assert((await img.count()) > 0, 'sized image embed missing')
    const alt = await img.getAttribute('alt')
    assert(alt === null || alt.trim().length === 0, `alt marker leaked: ${alt}`)
  })

  await check('note.nested-callout-renders', async () => {
    const nested = page.locator('.ov-callout .ov-callout')
    assert((await nested.count()) > 0, 'nested callout not rendered')
    const text = await page.locator('.ov-document').textContent()
    assert(text?.includes('内层正文'), 'inner callout body missing')
    // The checks that follow expect the main fixture note.
    await openViaFilter('审核夹具')
  })

  await check('note.highlight-mark', async () => {
    const marks = await page.locator('.ov-document mark.ov-highlight').count()
    assert(marks > 0, 'no ==highlight== rendered')
  })

  await check('note.footnote-renders', async () => {
    const text = await page.locator('.ov-document').textContent()
    assert(text?.includes('脚注'), 'footnotes section missing')
    assert(text?.includes('脚注内容'), 'footnote body missing')
  })

  await check('note.code-copy-button', async () => {
    const button = page.locator('.ov-document button', { hasText: '复制' }).first()
    assert((await button.count()) > 0, 'code copy button missing')
    await button.click()
    await sleep(400)
    const label = await button.textContent()
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')
    assert(label?.includes('已复制') || clip.includes('audit code'), `copy failed: label=${label} clip=${clip}`)
  })

  await check('note.wikilink-opens', async () => {
    const link = page.locator('.ov-document a[href^="https://dsh-obsidian.invalid/open"]').first()
    assert((await link.count()) > 0, 'no resolved wikilink rendered')
    await link.click()
    await sleep(900)
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核链接者'), `wikilink opened ${active}`)
  })

  await check('note.hover-preview', async () => {
    const link = page.locator('.ov-document a[href^="https://dsh-obsidian.invalid/open"]').first()
    await link.hover()
    await sleep(800)
    const preview = page.locator('.ov-preview')
    assert(await preview.isVisible(), 'preview card did not appear')
    const title = await preview.locator('.ov-preview-title').textContent()
    assert((title ?? '').length > 0, 'preview title empty')
    await page.mouse.move(40, 400)
    await sleep(400)
  })

  await check('note.inline-backlinks', async () => {
    await openViaFilter('审核夹具')
    const section = page.locator('.ov-doc-backlinks')
    assert(await section.isVisible(), 'inline backlinks section missing')
    const title = await section.locator('.ov-doc-backlinks-title').textContent()
    assert(title?.includes('反链') && title.includes('1'), `section title is ${title}`)
    const row = section.locator('.ov-doc-backlink-row', { hasText: '审核链接者' })
    assert((await row.count()) === 1, `expected one 审核链接者 row, got ${await row.count()}`)
    const context = await row.first().locator('.ov-doc-backlink-context').textContent()
    assert(context?.includes('链接到'), `row context is ${context}`)
    // The header toggle hides and restores the section; the choice is stored so
    // a reload keeps it.
    await page.locator('.ov-note-head button', { hasText: '隐藏反链' }).click()
    await sleep(300)
    assert((await page.locator('.ov-doc-backlinks').count()) === 0, 'toggle did not hide the section')
    const stored = await page.evaluate(() => window.localStorage.getItem('ov.note.inlineBacklinks.v1'))
    assert(stored === '0', `toggle did not persist: ${stored}`)
    await page.locator('.ov-note-head button', { hasText: '显示反链' }).click()
    await sleep(300)
    assert(await page.locator('.ov-doc-backlinks').isVisible(), 'toggle did not restore the section')
    await row.first().click()
    await sleep(900)
    const active = await page.locator('.ov-doctab-active .ov-doctab-label').textContent()
    assert(active?.includes('审核链接者'), `row click opened ${active}`)
    await explorerFilter.fill('')
    await sleep(300)
  })

  await check('note.breadcrumb-filters-explorer', async () => {
    await openViaFilter('审核夹具')
    const crumb = page.locator('.ov-breadcrumb-item', { hasText: FIXTURE_DIR })
    assert((await crumb.count()) > 0, 'breadcrumb missing')
    await crumb.first().click()
    await sleep(600)
    const value = await explorerFilter.inputValue()
    assert(value === FIXTURE_DIR, `filter is ${value}`)
  })

  await check('note.tag-chip-opens-search', async () => {
    await page.locator('.ov-tag-row .ov-chip', { hasText: '#审核标签' }).first().click()
    await sleep(800)
    assert(await page.locator('.ov-quick').isVisible(), 'note tag chip did not open the search panel')
    const query = await page.locator('.ov-quick-input').inputValue()
    assert(query === '#审核标签', `prefilled query is ${query}`)
    await page.keyboard.press('Escape')
    await sleep(300)
  })

  // ================= 右栏 =================
  await check('rail.outline-click-scrolls', async () => {
    await page.locator('.ov-rail .ov-tab', { hasText: '大纲' }).click()
    await sleep(400)
    const item = page.locator('.ov-panel .ov-item', { hasText: '审核夹具标题' }).first()
    assert((await item.count()) > 0, 'outline item missing')
    const scroller = page.locator('.ov-scroll')
    await scroller.evaluate(el => { el.scrollTop = 0 })
    await item.click()
    await sleep(800)
    const top = await scroller.evaluate(el => el.scrollTop)
    assert(top > 0, 'outline click did not scroll')
  })

  await check('rail.outline-drag-level', async () => {
    await openViaFilter('审核大纲')
    await page.locator('.ov-rail .ov-tab', { hasText: '大纲' }).click()
    await sleep(400)
    const row = page.locator('.ov-panel .ov-item', { hasText: '大纲二级甲' }).first()
    const box = await row.boundingBox()
    assert(box !== null, 'outline row missing')
    const y = box.y + box.height / 2
    // 30px is one 24px level step; the finally keeps a failed assertion from
    // leaving the mouse button held down and corrupting every later check.
    await page.mouse.move(box.x + 40, y)
    await page.mouse.down()
    let badge = null
    try {
      await page.mouse.move(box.x + 40 + 30, y, { steps: 6 })
      await sleep(150)
      badge = await page.locator('.ov-outline-badge').textContent()
      assert(badge === 'H2→H3', `badge is ${badge}`)
    } finally {
      await page.mouse.up()
    }
    await sleep(900)
    const demoted = await api(`note?path=${encodeURIComponent(OUTLINE_NOTE)}`)
    assert(demoted.content.includes('### 大纲二级甲'), `demote did not save: ${demoted.content.slice(0, 80)}`)
    assert(demoted.content.includes('#### 大纲三级甲'), 'subtree did not follow the demote')
    // The drag back promotes the subtree and restores the fixture on disk.
    const back = page.locator('.ov-panel .ov-item', { hasText: '大纲二级甲' }).first()
    const boxBack = await back.boundingBox()
    assert(boxBack !== null, 'outline row missing after the save')
    await page.mouse.move(boxBack.x + 60, boxBack.y + boxBack.height / 2)
    await page.mouse.down()
    try {
      await page.mouse.move(boxBack.x + 60 - 30, boxBack.y + boxBack.height / 2, { steps: 6 })
    } finally {
      await page.mouse.up()
    }
    await sleep(900)
    const restored = await api(`note?path=${encodeURIComponent(OUTLINE_NOTE)}`)
    assert(restored.content.includes('## 大纲二级甲'), 'promote did not save')
    assert(!restored.content.includes('#### 大纲三级甲'), 'subtree did not follow the promote')
    // The following rail checks read the fixture note's backlinks.
    await openViaFilter('审核夹具')
    return { badge }
  })

  await check('rail.backlinks-panel', async () => {
    await page.locator('.ov-rail .ov-tab', { hasText: '反链' }).click()
    await sleep(600)
    const group = page.locator('.ov-backlink-group', { hasText: '审核链接者' })
    assert((await group.count()) > 0, 'backlink group missing')
    // filter
    const filter = page.locator('.ov-rail input[aria-label="过滤笔记"]')
    await filter.fill('不存在的关键词')
    await sleep(400)
    assert((await page.locator('.ov-backlink-group').count()) === 0, 'filter did not narrow to zero')
    await filter.fill('')
    await sleep(400)
    // open
    await page.locator('.ov-backlink-group .ov-item').first().click()
    await sleep(800)
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核链接者'), `backlink opened ${active}`)
  })

  await check('rail.backlinks-sort-select', async () => {
    const select = page.locator('.ov-rail select[aria-label="排序方式"]')
    assert((await select.count()) > 0, 'sort select missing')
    await select.selectOption('count')
    await sleep(300)
    const value = await select.inputValue()
    assert(value === 'count', `sort is ${value}`)
    await select.selectOption('path')
  })

  // ================= 图谱 =================
  await check('graph.open-local', async () => {
    await page.locator('button[aria-label="关系图"]').click()
    await sleep(2500)
    assert(await page.locator('canvas.ov-graph-canvas').isVisible(), 'canvas missing')
    const stats = await page.locator('.ov-graph-stats').first().textContent()
    assert(/\d+ 节点/.test(stats ?? ''), `stats: ${stats}`)
    return { stats }
  })

  await check('graph.keyboard-zoom-pan', async () => {
    const canvas = page.locator('canvas.ov-graph-canvas')
    const zoomBefore = Number(await canvas.getAttribute('data-zoom'))
    await page.keyboard.press('+')
    await sleep(500)
    const zoomIn = Number(await canvas.getAttribute('data-zoom'))
    assert(zoomIn > zoomBefore, `+ did not zoom (${zoomBefore} -> ${zoomIn})`)
    await page.keyboard.press('-')
    await sleep(500)
    const zoomOut = Number(await canvas.getAttribute('data-zoom'))
    assert(zoomOut < zoomIn, `- did not zoom (${zoomIn} -> ${zoomOut})`)
    const panBefore = await canvas.getAttribute('data-pan')
    await page.keyboard.press('ArrowLeft')
    await sleep(500)
    const panAfter = await canvas.getAttribute('data-pan')
    assert(panBefore !== panAfter, 'arrow key did not pan')
  })

  await check('graph.filter-query', async () => {
    const stats = page.locator('.ov-graph-stats').first()
    const nodeCount = async () => Number(/(\d+) 节点/.exec(await stats.textContent() ?? '')?.[1] ?? -1)
    const before = await nodeCount()
    try {
      await page.locator('input[aria-label="过滤节点"]').fill('zzz不存在zzz')
      await sleep(1200)
      // A local graph keeps its center node; assert the count collapses.
      const filtered = await nodeCount()
      assert(filtered >= 0 && filtered < before, `filter ${before} -> ${filtered}`)
    } finally {
      await page.locator('input[aria-label="过滤节点"]').fill('')
      await sleep(1200)
    }
    const after = await nodeCount()
    assert(after === before, `stats ${before} -> ${after}`)
  })

  await check('graph.tag-picker', async () => {
    await page.locator('button[aria-label="按标签过滤"]').click()
    await sleep(400)
    assert(await page.locator('.ov-tagpop').isVisible(), 'tag popover missing')
    await page.locator('.ov-tagpop-input').fill('审核')
    await sleep(400)
    const item = page.locator('.ov-tagpop-item', { hasText: '#审核标签' }).first()
    assert((await item.count()) > 0, 'tag option missing')
    await item.click()
    await sleep(1200)
    const stats = await page.locator('.ov-graph-stats').first().textContent()
    assert(/\d+ 节点/.test(stats ?? ''), `stats: ${stats}`)
    // clear
    await page.locator('button[aria-label="按标签过滤"]').click()
    await sleep(300)
    await page.locator('.ov-tagpop-item', { hasText: '全部标签' }).first().click()
    await sleep(1000)
  })

  await check('graph.hops-select', async () => {
    const select = page.locator('button[aria-label="跳"]')
    assert((await select.count()) > 0, 'hops select missing on local graph')
    await select.click()
    await page.locator('.ov-select-option', { hasText: '2' }).first().click()
    await sleep(1500)
    const stats = await page.locator('.ov-graph-stats').first().textContent()
    assert(/\d+ 节点/.test(stats ?? ''), `stats: ${stats}`)
    await select.click()
    await page.locator('.ov-select-option', { hasText: '1' }).first().click()
    await sleep(1500)
  })

  await check('graph.settings-panel', async () => {
    await page.locator('button[aria-label="图谱设置"]').click()
    await sleep(500)
    const panel = page.locator('.ov-graph-panel')
    assert(await panel.isVisible(), 'settings panel missing')
    const animate = panel.locator('.ov-kit-toggle', { hasText: '持续动画' })
    const animateBefore = await animate.getAttribute('data-on')
    try {
      for (const section of ['过滤', '分组', '显示', '力']) {
        assert((await panel.locator('.ov-graph-panel-title', { hasText: section }).count()) > 0, `section ${section} missing`)
      }
      // toggle continuous animation; the finally block restores it
      await animate.click()
      await sleep(300)
      assert((await animate.getAttribute('data-on')) !== animateBefore, 'animate toggle did not flip')
      // slider by keyboard
      const slider = panel.locator('[role="slider"][aria-label="节点大小"]')
      const valueBefore = await slider.getAttribute('aria-valuenow')
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await sleep(300)
      const valueAfter = await slider.getAttribute('aria-valuenow')
      assert(Number(valueAfter) > Number(valueBefore), `slider ${valueBefore} -> ${valueAfter}`)
      // restore slider
      await page.keyboard.press('ArrowLeft')
      await sleep(200)
      // groups: the vault's own graph.json may already carry Obsidian colour
      // groups, so assert relative counts and remove only the row added here.
      const rows = async () => panel.locator('.ov-group-row').count()
      const base = await rows()
      await panel.locator('.ov-button', { hasText: '新增分组' }).click()
      await sleep(300)
      assert((await rows()) === base + 1, `group rows ${await rows()} after add, expected ${base + 1}`)
      await panel.locator('.ov-group-row').last().locator('.ov-graph-text').fill('tag:#审核标签')
      await sleep(300)
      await panel.locator('.ov-group-row').last().locator('button').click()
      await sleep(300)
      assert((await rows()) === base, 'group not removed')
    } finally {
      // Restore the toggle so settings end as they started, and close the panel
      // even after a failure so later checks see the same UI.
      try {
        if ((await animate.getAttribute('data-on')) !== animateBefore) await animate.click()
        if ((await panel.count()) > 0) await panel.locator('button[aria-label="关闭"]').first().click()
      } catch {
        // The panel may already be detached; the next check re-opens it.
      }
      await sleep(500)
    }
    assert((await page.locator('.ov-graph-panel').count()) === 0, 'panel did not close')
  })

  await check('graph.replay-animates', async () => {
    const canvas = page.locator('canvas.ov-graph-canvas')
    const snap = () => page.evaluate(() => document.querySelector('canvas.ov-graph-canvas').toDataURL().length)
    await page.locator('button[aria-label="重播"]').click()
    await sleep(200)
    const first = await snap()
    await sleep(700)
    const second = await snap()
    assert(first !== second, 'replay did not animate the canvas')
    await sleep(3500)
  })

  await check('graph.scope-global-and-back', async () => {
    const toggle = page.locator('.ov-graph-tools .ov-button').first()
    await toggle.click()
    await sleep(6000)
    try {
      const stats = await page.locator('.ov-graph-stats').first().textContent()
      const nodes = Number(/(\d+) 节点/.exec(stats ?? '')?.[1])
      assert(nodes >= 400, `global nodes ${nodes} (${stats})`)
      const zoom = Number(await page.locator('canvas.ov-graph-canvas').getAttribute('data-zoom'))
      assert(zoom < 1, `global zoom ${zoom} should be < 1 (spread, not blob)`)
    } finally {
      // Always return to the local graph so later checks see a settled local view.
      const stats = await page.locator('.ov-graph-stats').first().textContent()
      const nodes = Number(/(\d+) 节点/.exec(stats ?? '')?.[1] ?? 0)
      if (nodes > 100) {
        await toggle.click()
        await sleep(2500)
      }
    }
  })

  await check('graph.reset-view', async () => {
    const canvas = page.locator('canvas.ov-graph-canvas')
    // wait for local settle, capture fit pan
    await sleep(1500)
    const panFit = await canvas.getAttribute('data-pan')
    await page.keyboard.press('ArrowLeft')
    await sleep(400)
    const panMoved = await canvas.getAttribute('data-pan')
    assert(panMoved !== panFit, 'pan did not move')
    await page.locator('button[aria-label="重置视图"]').click()
    await sleep(2000)
    const panReset = await canvas.getAttribute('data-pan')
    const [fx, fy] = (panFit ?? '0,0').split(',').map(Number)
    const [rx, ry] = (panReset ?? '9999,9999').split(',').map(Number)
    assert(Math.abs(fx - rx) + Math.abs(fy - ry) < 40, `reset ${panReset} != fit ${panFit}`)
  })

  await check('graph.live-loop', async () => {
    // The loop must stay awake while the graph is visible: hover, camera glide
    // and incoming simulation ticks all rely on it instead of a wake call.
    const frames = () => page.evaluate(() => Number(document.querySelector('canvas.ov-graph-canvas')?.dataset.frames))
    const first = await frames()
    await sleep(1200)
    const second = await frames()
    assert(second > first, `frame loop stopped: ${first} -> ${second}`)
  })

  await check('graph.drag-node', async () => {
    // The fitted local graph centres on 审核夹具, so the viewport centre hits it.
    const canvas = page.locator('canvas.ov-graph-canvas')
    const box = await canvas.boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const snap = () => page.evaluate(() => document.querySelector('canvas.ov-graph-canvas').toDataURL().length)
    const before = await snap()
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await sleep(150)
    const grabbed = await canvas.getAttribute('data-drag')
    assert(grabbed, 'no node grabbed at the viewport centre')
    await page.mouse.move(cx + 120, cy + 80, { steps: 8 })
    await sleep(300)
    await page.mouse.up()
    await sleep(600)
    assert((await canvas.getAttribute('data-drag')) === '', 'drag did not end')
    assert((await snap()) !== before, 'canvas did not change after the drag')
    return { grabbed }
  })

  await check('graph.forces-slider-reheats', async () => {
    const canvas = page.locator('canvas.ov-graph-canvas')
    // Toggle only when closed: a failing check above may have left it open.
    const openedHere = (await page.locator('.ov-graph-panel').count()) === 0
    if (openedHere) {
      await page.locator('button[aria-label="图谱设置"]').click()
      await sleep(300)
    }
    try {
      const slider = page.locator('.ov-graph-panel [role="slider"][aria-label*="力"]').first()
      assert((await slider.count()) > 0, 'no force slider')
      const before = await canvas.getAttribute('data-frames')
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await sleep(900)
      const after = await canvas.getAttribute('data-frames')
      assert(after !== before, `loop did not wake: frames ${before} -> ${after}`)
      // The slider persists to the user's graph settings; put it back.
      await page.keyboard.press('ArrowLeft')
      await sleep(400)
    } finally {
      if (openedHere) {
        await page.locator('button[aria-label="图谱设置"]').click()
        await sleep(300)
      }
    }
  })

  await check('graph.culls-offscreen', async () => {
    // G8: zoomed in, offscreen nodes/edges are culled before drawing. The
    // local fixture graph is too small to cull, so run this on the global
    // graph and restore the local view afterwards.
    const read = () => page.evaluate(() => {
      const canvas = document.querySelector('canvas.ov-graph-canvas')
      return {
        positions: Number(canvas?.dataset.positions),
        drawnNodes: Number(canvas?.dataset.drawnNodes),
        drawnEdges: Number(canvas?.dataset.drawnEdges),
        edges: Number(canvas?.dataset.edges),
      }
    })
    const toggle = page.locator('.ov-graph-tools .ov-button').first()
    await toggle.click()
    await sleep(6000)
    try {
      // Wait for the zoom-to-fit glide to stop before zooming: a still-active
      // fit rewrites the zoom target every frame and would swallow the keys.
      const camera = () => page.evaluate(() => {
        const canvas = document.querySelector('canvas.ov-graph-canvas')
        return `${canvas?.dataset.zoom}/${canvas?.dataset.pan}`
      })
      for (let i = 0; i < 10; i += 1) {
        const before = await camera()
        await sleep(400)
        if ((await camera()) === before) break
      }
      // Fit frames the whole global graph; a few 1.1x steps leave too many
      // edges touching the viewport, so zoom past the outer ring.
      for (let i = 0; i < 8; i += 1) await page.keyboard.press('=')
      await sleep(1500)
      const zoomed = await read()
      assert(zoomed.positions >= 400, `global positions ${zoomed.positions}`)
      assert(zoomed.drawnNodes < zoomed.positions, `nodes ${zoomed.drawnNodes}/${zoomed.positions} not culled`)
      assert(zoomed.drawnEdges < zoomed.edges, `edges ${zoomed.drawnEdges}/${zoomed.edges} not culled`)
      await page.locator('button[aria-label="重置视图"]').click()
      await sleep(1500)
      const reset = await read()
      assert(reset.drawnNodes === reset.positions, `after reset nodes ${reset.drawnNodes}/${reset.positions}`)
      return zoomed
    } finally {
      await toggle.click()
      await sleep(2500)
    }
  })

  await check('graph.close-returns-reading', async () => {
    await page.locator('button[aria-label="阅读"]').click()
    await sleep(800)
    assert((await page.locator('canvas.ov-graph-canvas').count()) === 0, 'graph still visible')
    assert(await page.locator('.ov-note').isVisible(), 'note view not restored')
  })

  // ================= 文件操作 =================
  await check('files.create-note-button', async () => {
    // active note 审核夹具 sits in 审核临时文件夹, so the new note lands there
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    dialogAnswer = '审核按钮新建'
    await page.locator('button[aria-label="新建笔记"]').click()
    await answerAsk(dialogAnswer)
    await sleep(1200)
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核按钮新建'), `opened ${active}`)
  })

  await check('files.rename-via-menu', async () => {
    await explorerFilter.fill('审核按钮新建')
    await sleep(600)
    const row = tree.locator('.ov-file', { hasText: '审核按钮新建' }).first()
    await row.click({ button: 'right' })
    await sleep(400)
    const menu = page.locator('.ov-menu')
    assert(await menu.isVisible(), 'file menu missing')
    const labels = await menu.locator('.ov-menu-item').allTextContents()
    for (const wanted of ['打开', '在新标签页打开', '复制路径', '重命名', '删除']) {
      assert(labels.some(label => label.includes(wanted)), `menu missing ${wanted}`)
    }
    dialogAnswer = '审核按钮新建改名'
    await menu.locator('.ov-menu-item', { hasText: '重命名' }).click()
    await answerAsk(dialogAnswer)
    await sleep(1200)
    await explorerFilter.fill('审核按钮新建改名')
    await sleep(600)
    assert((await tree.locator('.ov-file', { hasText: '审核按钮新建改名' }).count()) > 0, 'renamed file not in tree')
    const tab = await page.locator('.ov-doctab-active').textContent()
    assert(tab?.includes('审核按钮新建改名'), `tab did not remap: ${tab}`)
  })

  await check('files.copy-path', async () => {
    const row = tree.locator('.ov-file', { hasText: '审核按钮新建改名' }).first()
    await row.click({ button: 'right' })
    await sleep(300)
    await page.locator('.ov-menu-item', { hasText: '复制路径' }).click()
    await sleep(400)
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    assert(clip.includes('审核按钮新建改名.md'), `clipboard: ${clip}`)
  })

  await check('files.open-in-new-tab', async () => {
    const before = await page.locator('.ov-doctab').count()
    const row = tree.locator('.ov-file', { hasText: '审核按钮新建改名' }).first()
    await row.click({ button: 'right' })
    await sleep(300)
    await page.locator('.ov-menu-item', { hasText: '在新标签页打开' }).click()
    await sleep(800)
    const after = await page.locator('.ov-doctab').count()
    assert(after > before, `tabs ${before} -> ${after}`)
  })

  await check('files.code-view-highlight', async () => {
    await openTreeAttachment('样例代码.ts')
    await page.locator('.ov-code-view').waitFor({ timeout: 10000 })
    const language = (await page.locator('.ov-code-lang').textContent())?.trim()
    assert(language === 'typescript', `language badge ${language}`)
    const numbers = await page.locator('.ov-code-line-no').allTextContents()
    // The fixture ends with a newline, so the gutter counts five lines.
    assert(numbers.length === 5, `gutter rows ${numbers.length}`)
    assert(numbers[0] === '1' && numbers[4] === '5', `gutter values ${numbers.join(',')}`)
    const keywords = await page.locator('.ov-tk-keyword').allTextContents()
    for (const wanted of ['export', 'function']) {
      assert(keywords.includes(wanted), `keyword ${wanted} missing: ${keywords.join('|')}`)
    }
    const calls = await page.locator('.ov-tk-function').allTextContents()
    assert(calls.includes('auditTrail'), `call tokens ${calls.join('|')}`)
    const comments = await page.locator('.ov-tk-comment').allTextContents()
    assert(comments.some(text => text.includes('审核注释')), 'comment not highlighted')
    const strings = await page.locator('.ov-tk-string').allTextContents()
    assert(strings.some(text => text.includes('value=')), `string tokens ${strings.join('|')}`)
    await page.locator('.ov-code-actions button[aria-label="复制"]').click()
    await sleep(400)
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    // The Windows clipboard normalizes line feeds to CRLF on write.
    const normalized = clip.replace(/\r\n/g, '\n')
    assert(
      normalized === CODE_BODY,
      `copied text differs (${normalized.length} vs ${CODE_BODY.length} chars): ${JSON.stringify(normalized.slice(0, 120))}`,
    )
    return { language, lines: numbers.length }
  })

  await check('files.image-preview', async () => {
    await openTreeAttachment('样例图片.png')
    const image = page.locator('.ov-file-image')
    await image.waitFor({ timeout: 10000 })
    const decoded = await image.evaluate(element => ({
      complete: element.complete,
      width: element.naturalWidth,
    }))
    assert(decoded.complete && decoded.width > 0, `image not decoded: ${JSON.stringify(decoded)}`)
    const badge = (await page.locator('.ov-code-lang').textContent())?.trim()
    assert(badge === 'PNG', `badge ${badge}`)
    return decoded
  })

  await check('files.binary-download-card', async () => {
    await openTreeAttachment('样例数据.bin')
    const link = page.locator('.ov-file-download')
    await link.waitFor({ timeout: 10000 })
    const href = await link.getAttribute('href')
    assert(href !== null && href.includes('/obsidian/api/asset'), `download href ${href}`)
    assert(href.includes('download=1'), `download href misses download flag: ${href}`)
    assert((await link.textContent())?.trim() === '下载', 'download label missing')
    const keys = await page.locator('.ov-file-info-key').allTextContents()
    assert(keys.includes('大小'), `info rows ${keys.join('|')}`)
    return { href }
  })

  await check('note.source-and-reading-roundtrip', async () => {
    await openViaFilter('审核夹具')
    await page.locator('.ov-note').waitFor({ timeout: 10000 })
    await page.locator('.ov-note button[title="源码"]').click()
    await sleep(1500)
    await page.locator('.ov-editor-view').waitFor({ timeout: 10000 })
    const area = page.locator('.ov-editor-area')
    const initial = await area.inputValue()
    assert(initial.includes('审核夹具标题'), 'editor does not show the note body')
    assert(initial.includes('~~~js'), 'editor does not show the fence')
    assert((await page.locator('.ov-editor-view .ov-code-lang').textContent())?.trim() === '编辑', 'editor badge is not the edit label')

    // A keystroke alone must land on disk: the editor autosaves after its
    // debounce, so the check polls the file instead of pressing Ctrl+S.
    const edited = `${initial}\n自动保存校验行\n`
    await area.fill(edited)
    let stored
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await sleep(300)
      stored = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
      if (stored.text === edited) break
    }
    assert(stored.text === edited, 'autosave did not reach the file')

    // Ctrl+S writes immediately; rebuilding the fixture body here also leaves
    // the note exactly as every later check expects it.
    await area.fill(fixtureBody)
    await page.keyboard.press('Control+s')
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await sleep(300)
      stored = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
      if (stored.text === fixtureBody) break
    }
    assert(stored.text === fixtureBody, 'Ctrl+S did not restore the fixture body')

    await page.locator('.ov-editor-view button[aria-label="阅读"]').click()
    await sleep(1500)
    assert((await page.locator('.ov-editor-view').count()) === 0, 'editor still mounted')
    assert(await page.locator('.ov-note').isVisible(), 'reading view not restored')
    return { lines: fixtureBody.split('\n').length }
  })

  await check('note.editor-conflict-bar', async () => {
    await openViaFilter('审核夹具')
    await page.locator('.ov-note').waitFor({ timeout: 10000 })
    await page.locator('.ov-note button[title="源码"]').click()
    const area = page.locator('.ov-editor-area')
    await area.waitFor({ timeout: 10000 })
    // The open editor keeps the mtime it read; changing the file from outside
    // makes its next write stale, which the Host reports as a 409.
    writeFileSync(join(VAULT_ROOT, FIXTURE), `${fixtureBody}\n外部修改行\n`)
    await area.fill(`${await area.inputValue()}\n编辑器草稿行\n`)
    await page.keyboard.press('Control+s')
    const bar = page.locator('.ov-editor-conflict')
    await bar.waitFor({ timeout: 10000 })
    assert((await bar.getAttribute('role')) === 'alert', 'conflict bar is not announced')
    await bar.locator('button', { hasText: '重新载入' }).click()
    await sleep(1200)
    const reloaded = await area.inputValue()
    assert(reloaded.includes('外部修改行'), 'reload did not take the disk text')
    assert(!reloaded.includes('编辑器草稿行'), 'reload kept the local draft')

    // Restore the fixture through the editor path so the remaining checks see
    // the body the earlier roundtrip check left on disk.
    await area.fill(fixtureBody)
    await page.keyboard.press('Control+s')
    let stored
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await sleep(300)
      stored = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
      if (stored.text === fixtureBody) break
    }
    assert(stored.text === fixtureBody, 'fixture restore after the conflict failed')
    await page.locator('.ov-editor-view button[aria-label="阅读"]').click()
    await sleep(1200)
    assert(await page.locator('.ov-note').isVisible(), 'reading view not restored')
  })

  await check('note.property-edit-persists', async () => {
    await openViaFilter('审核夹具')
    await page.locator('.ov-note').waitFor({ timeout: 10000 })
    const value = page.locator('.ov-property-editable').first()
    assert((await value.count()) === 1, 'no editable property rendered')
    const before = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
    await value.click()
    const input = page.locator('.ov-property-input')
    await input.waitFor({ timeout: 5000 })
    await input.fill('审核探针')
    await input.press('Enter')
    let after = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
    for (let attempt = 0; attempt < 10 && !after.text.includes('审核探针'); attempt += 1) {
      await sleep(300)
      after = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
    }
    assert(after.text.includes('审核探针'), 'property value was not written')
    // The edit bumps mtime; read it before restoring the exact prior text.
    const current = await api(`file?path=${encodeURIComponent(FIXTURE)}`)
    await api('note', { method: 'POST', body: JSON.stringify({ path: FIXTURE, content: before.text, baseMtime: current.mtime }) })
    await sleep(600)
  })

  await check('note.print-command', async () => {
    await openViaFilter('审核夹具')
    await page.locator('.ov-note').waitFor({ timeout: 10000 })
    await page.evaluate(() => {
      const original = window.open
      window.__printCalls = 0
      window.__restorePrint = () => { window.open = original }
      window.open = () => {
        window.__printCalls += 1
        return {
          document: document.implementation.createHTMLDocument('print'),
          focus() {},
          print() {},
          closed: false,
        }
      }
    })
    await page.getByRole('button', { name: '打印', exact: true }).click()
    // The toolbar button opens the settings dialog; its primary button prints.
    const dialog = page.locator('.ov-print-dialog')
    await dialog.waitFor({ timeout: 10000 })
    await dialog.locator('.ov-print-page').first().waitFor({ timeout: 15000 })
    await dialog.locator('.ov-dialog-button-primary').click()
    const calls = await page.evaluate(() => {
      const count = window.__printCalls ?? 0
      window.__restorePrint?.()
      return count
    })
    assert(calls === 1, `print window opened ${calls} times`)
  })

  await check('note.editor-colour-and-find', async () => {
    await openViaFilter('审核夹具')
    await page.locator('.ov-note').waitFor({ timeout: 10000 })
    await page.locator('.ov-note button[title="源码"]').click()
    const area = page.locator('.ov-editor-area')
    await area.waitFor({ timeout: 10000 })
    const coloured = await page.locator('.ov-editor-highlight [class^="ov-md-"]').count()
    assert(coloured > 0, 'the colour layer painted no markdown token')
    await area.click()
    await page.keyboard.press('Control+f')
    const bar = page.locator('.ov-editor-find')
    await bar.waitFor({ timeout: 5000 })
    assert((await page.locator('.ov-quick-input').count()) === 0, 'global search opened instead of the editor find bar')
    await page.locator('.ov-editor-find-input').first().fill('审核')
    const counter = await page.locator('.ov-editor-find-count').first().textContent()
    assert(/^\d+\/\d+$/.test(counter ?? ''), `find counter missing: ${counter}`)
    await page.keyboard.press('Escape')
    await bar.waitFor({ state: 'detached', timeout: 3000 })
    await page.locator('.ov-editor-view button[aria-label="阅读"]').click()
    await sleep(800)
  })

  await check('files.drag-move-into-dir-and-back', async () => {
    await explorerFilter.fill('')
    await sleep(400)
    // The vault lists attachments too, so a root note and a root folder can sit
    // a screenful apart and one HTML5 drag cannot keep both rows under the
    // cursor. Source and target fixture folders sort next to each other, so the
    // drag and the drag back stay in view without any scrolling.
    await api('mkdir', { method: 'POST', body: JSON.stringify({ path: DRAG_SOURCE_DIR }) })
    await api('mkdir', { method: 'POST', body: JSON.stringify({ path: DRAG_TARGET_DIR }) })
    await api('create', { method: 'POST', body: JSON.stringify({ path: DRAG_FILE }) })
    let ready = false
    for (let attempt = 0; attempt < 20 && !ready; attempt += 1) {
      await sleep(400)
      ready = JSON.stringify(await api('tree')).includes(`${DRAG_SOURCE_DIR}/${DRAG_NAME}`)
    }
    assert(ready, 'drag fixtures missing from the tree')
    const fixtureDirRow = tree.locator(`.ov-dir[title="${FIXTURE_DIR}"]`)
    if ((await fixtureDirRow.locator('.ov-chevron').textContent()) === '▾') {
      await fixtureDirRow.click()
      await sleep(300)
    }
    const sourceDir = tree.locator(`.ov-dir[title="${DRAG_SOURCE_DIR}"]`)
    if ((await sourceDir.locator('.ov-chevron').textContent()) === '▸') {
      await sourceDir.click()
      await sleep(300)
    }
    await tree.locator(`.ov-file[title="${DRAG_FILE}"]`).dragTo(tree.locator(`.ov-dir[title="${DRAG_TARGET_DIR}"]`))
    await sleep(1500)
    const intoTarget = `${DRAG_TARGET_DIR}/${DRAG_NAME}`
    assert(JSON.stringify(await api('tree')).includes(intoTarget), 'file not moved into dir')
    const targetDir = tree.locator(`.ov-dir[title="${DRAG_TARGET_DIR}"]`)
    if ((await targetDir.locator('.ov-chevron').textContent()) === '▸') {
      await targetDir.click()
      await sleep(400)
    }
    await tree.locator(`.ov-file[title="${intoTarget}"]`).dragTo(tree.locator(`.ov-dir[title="${DRAG_SOURCE_DIR}"]`))
    await sleep(1500)
    assert(
      JSON.stringify(await api('tree')).includes(DRAG_FILE),
      `file not back at ${DRAG_SOURCE_DIR}`,
    )
    return { moved: intoTarget }
  })

  await check('files.new-folder-button', async () => {
    dialogAnswer = '审核按钮新建文件夹'
    await page.locator('button[aria-label="新建文件夹"]').click()
    await answerAsk(dialogAnswer)
    // mkdir awaits a full rescan; poll instead of racing it.
    let found = false
    for (let attempt = 0; attempt < 20 && !found; attempt += 1) {
      await sleep(500)
      found = JSON.stringify(await api('tree')).includes('审核按钮新建文件夹')
    }
    assert(found, 'folder not created')
  })

  await check('files.delete-via-menu', async () => {
    try {
      await explorerFilter.fill('审核按钮新建改名')
      await sleep(600)
      const row = tree.locator('.ov-file', { hasText: '审核按钮新建改名' }).first()
      await row.click({ button: 'right' })
      await sleep(300)
      await page.locator('.ov-menu-item', { hasText: '删除' }).click()
    await confirmAsk()
      await sleep(1200)
      await explorerFilter.fill('审核按钮新建改名')
      await sleep(600)
      assert((await tree.locator('.ov-file', { hasText: '审核按钮新建改名' }).count()) === 0, 'file still in tree')
      const tabs = await page.locator('.ov-doctab', { hasText: '审核按钮新建改名' }).count()
      assert(tabs === 0, 'deleted file tab still open')
    } finally {
      await explorerFilter.fill('')
      await sleep(300)
    }
  })

  await check('files.dir-menu-new-note-here', async () => {
    // The dir row only exists in tree mode, not among search hits.
    await explorerFilter.fill('')
    await sleep(400)
    const dir = tree.locator(`.ov-dir[title="${FIXTURE_DIR}"]`)
    await dir.click({ button: 'right' })
    await sleep(300)
    const menu = page.locator('.ov-menu')
    const labels = await menu.locator('.ov-menu-item').allTextContents()
    for (const wanted of ['在此新建笔记', '在此新建文件夹', '复制路径', '重命名', '删除']) {
      assert(labels.some(label => label.includes(wanted)), `dir menu missing ${wanted}`)
    }
    dialogAnswer = '审核目录内新建'
    await menu.locator('.ov-menu-item', { hasText: '在此新建笔记' }).click()
    await answerAsk(dialogAnswer)
    await sleep(1200)
    const json = JSON.stringify(await api('tree'))
    assert(json.includes(`${FIXTURE_DIR}/审核目录内新建.md`), 'note not created in dir')
  })

  // ================= 统一右键菜单 =================
  await check('menu.tree-file-items', async () => {
    await explorerFilter.fill('审核夹具')
    await sleep(600)
    await tree.locator('.ov-file', { hasText: '审核夹具' }).first().click({ button: 'right' })
    await sleep(300)
    const labels = await menuLabels()
    const wanted = ['打开', '在新标签页打开', '重命名', '移动到…', '复制 Wiki 链接', '在关系图中打开', '书签', '复制路径', '删除']
    for (const label of wanted) {
      assert(labels.some(text => text.includes(label)), `file menu missing ${label}: ${labels.join(' | ')}`)
    }
    assert((await rootMenu().getAttribute('role')) === 'menu', 'menu lacks role=menu')
    assert((await page.locator('.ov-menu-item.ov-menu-item-active').count()) === 1, 'no active item on open')
    return { labels }
  })

  await check('menu.keyboard-navigation', async () => {
    const activeId = () => page.locator('.ov-menu-item.ov-menu-item-active').first().getAttribute('data-menu-id')
    assert((await activeId()) === 'open', 'initial active is not the first item')
    await page.keyboard.press('ArrowDown')
    assert((await activeId()) === 'open-new-tab', 'ArrowDown did not advance')
    await page.keyboard.press('End')
    assert((await activeId()) === 'delete', 'End did not reach the last item')
    await page.keyboard.press('Home')
    assert((await activeId()) === 'open', 'Home did not return to the first item')
  })

  await check('menu.submenu-and-arrow-left', async () => {
    await rootMenu().locator('.ov-menu-item', { hasText: '移动到…' }).hover()
    await sleep(300)
    const sub = page.locator('.ov-menu-sub')
    assert((await sub.count()) === 1 && (await sub.first().isVisible()), 'move submenu did not open')
    const targets = await sub.first().locator('.ov-menu-item').allTextContents()
    assert(targets.some(text => text.includes('知识库根目录')), `move submenu missing root: ${targets.join(' | ')}`)
    await page.keyboard.press('ArrowLeft')
    await sleep(200)
    assert((await page.locator('.ov-menu-sub').count()) === 0, 'ArrowLeft did not return to the root menu')
    assert(await rootMenu().isVisible(), 'root menu closed on ArrowLeft')
    await page.keyboard.press('Escape')
    await sleep(200)
    assert((await page.locator('.ov-menu').count()) === 0, 'Escape did not dismiss the menu')
    assert((await page.locator('.ov-menu-layer').count()) === 0, 'menu backdrop stayed mounted')
  })

  await check('menu.tree-multiselect-batch', async () => {
    await page.keyboard.press('Escape')
    await explorerFilter.fill('')
    await sleep(600)
    // Collapse-all ran earlier; reveal the fixture folder before selecting it.
    const fixtureDir = tree.locator('.ov-dir', { hasText: FIXTURE_DIR }).first()
    if ((await fixtureDir.locator('.ov-chevron').textContent()) === '▸') {
      await fixtureDir.click()
      await sleep(300)
    }
    const first = tree.locator('.ov-file', { hasText: '审核夹具' }).first()
    const second = tree.locator('.ov-file', { hasText: '审核链接者' }).first()
    await first.click({ modifiers: ['Control'] })
    await sleep(200)
    await second.click({ modifiers: ['Control'] })
    await sleep(200)
    const selected = await tree.locator('.ov-file.ov-selected').count()
    assert(selected === 2, `ctrl-click selected ${selected} rows`)
    await second.click({ button: 'right' })
    await sleep(300)
    const labels = await menuLabels()
    assert(labels.some(text => text.includes('全部打开')), `selection menu missing open-all: ${labels.join(' | ')}`)
    assert(labels.some(text => text.includes('复制全部路径')), 'selection menu missing copy-all')
    assert(labels.some(text => text.includes('删除') && text.includes('2')), 'selection delete lacks the count')
    await page.keyboard.press('Escape')
    await sleep(300)
  })

  await check('menu.panel-tabs', async () => {
    // Self-sufficient for incremental runs: the rail renders only while a
    // Markdown note is open.
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    await sleep(300)
    if (!(await page.locator('.ov-rail').isVisible())) {
      await page.locator('.ov-ribbon button[aria-label="切换右侧边栏"]').click()
      await sleep(500)
    }
    const railTab = page.locator('.ov-rail .ov-tab', { hasText: '大纲' }).first()
    await railTab.click({ button: 'right' })
    await sleep(300)
    const checked = page.locator('.ov-menu-item[aria-checked="true"]')
    assert((await checked.count()) === 1, `panel menu has ${await checked.count()} checked rows`)
    assert(((await checked.first().textContent()) ?? '').includes('大纲'), 'the checked row is not the active rail')
    // The plugins rail tab moved into the settings dialog, so the panel menu
    // must not offer it anymore.
    const menuTexts = await page.locator('.ov-menu-item').allTextContents()
    assert(!menuTexts.some(text => text.includes('插件')), `panel menu still lists 插件: ${menuTexts.join(' | ')}`)
    await page.keyboard.press('Escape')
    await sleep(200)
  })

  await check('menu.editor-selection-copy', async () => {
    await explorerFilter.fill('审核夹具')
    await sleep(600)
    await tree.locator('.ov-file', { hasText: '审核夹具' }).first().click()
    await sleep(900)
    await page.evaluate(() => {
      const paragraph = [...document.querySelectorAll('.ov-document p')]
        .find(node => (node.textContent ?? '').includes('普通段落含'))
      if (paragraph === undefined) throw new Error('fixture paragraph missing')
      const range = document.createRange()
      range.selectNodeContents(paragraph)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      paragraph.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 640, clientY: 420 }))
    })
    await sleep(300)
    const item = page.locator('.ov-menu-item', { hasText: '复制所选文本' })
    assert((await item.count()) === 1, 'editor menu missing copy-selection')
    assert((await item.getAttribute('aria-disabled')) !== 'true', 'copy-selection disabled with a selection')
    await item.click()
    await sleep(400)
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    assert(clip.trim().length > 0, 'clipboard stayed empty after copy')
    await explorerFilter.fill('')
    await sleep(300)
  })

  // ================= 未解析链接 =================
  await check('note.unresolved-link-creates', async () => {
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    const link = page.locator('.ov-document a.ov-unresolved').first()
    assert((await link.count()) > 0, 'no unresolved link rendered')
    await link.click()
    await sleep(1500)
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核不存在目标'), `created and opened ${active}`)
    const json = JSON.stringify(await api('tree'))
    assert(json.includes(GHOST), 'ghost note not created')
  })

  // ================= 工作区框架（Ribbon / 分栏 / 状态栏 / 标签增强） =================
  await check('ui.ribbon-toggles-explorer', async () => {
    const filesEntry = page.locator('.ov-ribbon button[aria-label="文件"]')
    const searchEntry = page.locator('.ov-ribbon button[aria-label="搜索"]')
    assert((await filesEntry.count()) === 1, 'ribbon 文件 entry missing')
    const state = async () => ({
      open: await page.locator('.ov-explorer').isVisible(),
      files: await filesEntry.getAttribute('aria-pressed'),
      search: await searchEntry.getAttribute('aria-pressed'),
    })
    // Normalize first: the 文件 entry owns an open explorer whatever came before.
    if (!(await state()).open || (await state()).search === 'true') {
      await filesEntry.click()
      await sleep(400)
    }
    const ready = await state()
    assert(ready.open, `explorer did not open from the ribbon: ${JSON.stringify(ready)}`)
    await filesEntry.click()
    await sleep(400)
    const closed = await state()
    assert(!closed.open, `ribbon click did not hide the explorer: ${JSON.stringify(closed)}`)
    assert(closed.files === 'false', `文件 entry still pressed after hiding: ${JSON.stringify(closed)}`)
    await filesEntry.click()
    await sleep(400)
    const reopened = await state()
    assert(reopened.open, `ribbon click did not restore the explorer: ${JSON.stringify(reopened)}`)
    assert(reopened.files === 'true', `文件 entry not pressed after restoring: ${JSON.stringify(reopened)}`)
    return { ready, closed, reopened }
  })

  await check('ui.ribbon-search-opens-quick', async () => {
    // The ribbon entry and Ctrl+F share one full-text entry point; the explorer
    // filter stays a tree filter, so this check asserts the overlay, not focus.
    await page.locator('.ov-ribbon button[aria-label="搜索"]').click()
    await sleep(500)
    assert(await page.locator('.ov-quick').isVisible(), '搜索 entry did not open the quick switcher')
    const mode = await page.locator('.ov-quick-mode').first().textContent()
    assert((mode ?? '').includes('全文搜索'), `search mode not preselected: ${mode}`)
    const focused = await page.evaluate(() => {
      const active = document.activeElement
      return active instanceof HTMLInputElement ? active.className : `not-an-input:${active?.tagName ?? 'none'}`
    })
    assert(focused.includes('ov-quick-input'), `focus went to ${focused}`)
    // Search is an action, not a state: the entry never stays pressed.
    assert((await page.locator('.ov-ribbon button[aria-label="搜索"]').getAttribute('aria-pressed')) === 'false', '搜索 entry stayed pressed')
    await page.keyboard.press('Escape')
    await sleep(400)
    assert((await page.locator('.ov-quick').count()) === 0, 'quick switcher stayed open after Escape')
  })

  await check('ui.ribbon-graph-toggles-view', async () => {
    const graphEntry = page.locator('.ov-ribbon button[aria-label="关系图"]')
    assert((await graphEntry.count()) === 1, 'ribbon 关系图 entry missing')
    await graphEntry.click()
    await sleep(2500)
    assert(await page.locator('canvas.ov-graph-canvas').isVisible(), 'ribbon graph click did not open the graph')
    assert((await graphEntry.getAttribute('aria-pressed')) === 'true', '关系图 entry not pressed while the graph is open')
    await graphEntry.click()
    await sleep(900)
    assert((await page.locator('canvas.ov-graph-canvas').count()) === 0, 'second ribbon click did not return to reading')
  })

  await check('ui.ribbon-toggles-rail', async () => {
    const entry = page.locator('.ov-ribbon button[aria-label="切换右侧边栏"]')
    assert((await entry.count()) === 1, 'ribbon 切换右侧边栏 entry missing')
    const state = async () => ({
      open: await page.locator('.ov-rail').isVisible(),
      pressed: await entry.getAttribute('aria-pressed'),
    })
    const before = await state()
    await entry.click()
    await sleep(500)
    const flipped = await state()
    assert(flipped.open === !before.open, `rail visibility did not flip: ${JSON.stringify(before)} -> ${JSON.stringify(flipped)}`)
    assert(flipped.pressed === String(flipped.open), `aria-pressed lost the rail state: ${JSON.stringify(flipped)}`)
    await entry.click()
    await sleep(500)
    const restored = await state()
    assert(restored.open === before.open, `rail did not restore: ${JSON.stringify(restored)}`)
    assert(restored.pressed === String(before.open), `aria-pressed did not restore: ${JSON.stringify(restored)}`)
  })

  await check('ui.splitter-left-drag-and-reset', async () => {
    const explorer = page.locator('.ov-explorer')
    const splitter = page.locator('[data-ov-splitter="left"]')
    assert((await splitter.count()) === 1, 'left splitter missing')
    const width = async () => (await explorer.boundingBox())?.width ?? 0
    const before = await width()
    const box = await splitter.boundingBox()
    assert(box !== null, 'left splitter has no bounding box')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, y, { steps: 10 })
    await page.mouse.up()
    await sleep(400)
    const dragged = await width()
    assert(dragged > before + 40, `left column did not widen (${before} -> ${dragged})`)
    const stored = await page.evaluate(() => window.localStorage.getItem('ov.layout.widths.v1'))
    const storedLeft = stored === null ? undefined : JSON.parse(stored).left
    assert(typeof storedLeft === 'number' && Math.abs(storedLeft - dragged) <= 1, `width not persisted: ${stored}`)
    await splitter.dblclick()
    await sleep(400)
    const reset = await width()
    assert(Math.abs(reset - 248) <= 1, `double click did not reset the left width (${reset})`)
    return { before, dragged, reset }
  })

  await check('ui.splitter-right-drag-and-reset', async () => {
    const rail = page.locator('.ov-rail')
    const splitter = page.locator('[data-ov-splitter="right"]')
    assert((await splitter.count()) === 1, 'right splitter missing')
    const width = async () => (await rail.boundingBox())?.width ?? 0
    const before = await width()
    const box = await splitter.boundingBox()
    assert(box !== null, 'right splitter has no bounding box')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 70, y, { steps: 10 })
    await page.mouse.up()
    await sleep(400)
    const dragged = await width()
    assert(dragged > before + 40, `right column did not widen (${before} -> ${dragged})`)
    await splitter.dblclick()
    await sleep(400)
    const reset = await width()
    assert(Math.abs(reset - 288) <= 1, `double click did not reset the right width (${reset})`)
    return { before, dragged, reset }
  })

  await check('ui.statusbar-metrics', async () => {
    await openViaFilter('审核夹具')
    await explorerFilter.fill('')
    await sleep(500)
    const bar = page.locator('.ov-statusbar')
    assert((await bar.count()) === 1, 'status bar missing')
    const box = await bar.boundingBox()
    assert(box !== null && Math.abs(box.height - 24) <= 1, `status bar height ${box?.height}`)
    const texts = await bar.locator('.ov-statusbar-item').allTextContents()
    const row = texts.join(' | ')
    assert(texts.some(text => /词/.test(text)), `word count missing: ${row}`)
    assert(texts.some(text => /反链/.test(text)), `backlink count missing: ${row}`)
    assert(texts.some(text => /篇笔记/.test(text)), `index count missing: ${row}`)
    assert(texts.some(text => text.includes('知识库')), `vault name missing: ${row}`)
    assert((await bar.locator('.ov-statusbar-dot[data-state="ok"]').count()) === 1, 'index dot not in the ok state')
    const words = Number(/(\d+)\s*词/.exec(row)?.[1] ?? 0)
    assert(words > 0, `word count is ${words} for a non-empty note`)
    return { row, words }
  })

  await check('tabs.drag-reorder', async () => {
    const titles = async () => page.locator('.ov-doctab').evaluateAll(nodes => nodes.map(node => node.getAttribute('title') ?? ''))
    const addTab = async (query) => {
      await page.locator('.ov-doctab-new').click()
      await sleep(400)
      await page.locator('.ov-quick-input').fill(query)
      await sleep(700)
      await page.keyboard.press('Enter')
      await sleep(1000)
    }
    // A strip left over from earlier checks can hold six tabs, and the drag
    // distance then ends past the rows the pointer started on. Rebuild a known
    // three-tab strip so the drag stays short.
    await page.locator('.ov-doctab').first().click({ button: 'right' })
    await sleep(300)
    await page.locator('.ov-menu-item', { hasText: '关闭全部标签页' }).click()
    await sleep(500)
    await addTab('审核链接者')
    await addTab('审核不存在目标')
    await addTab('审核夹具')
    const before = await titles()
    assert(before.length === 3, `expected three tabs, got ${before.length}: ${before.join(' | ')}`)
    // Drag the first tab past the last one, keeping it selected.
    await page.locator('.ov-doctab').first().click()
    await sleep(500)
    const draggedPath = before[0]
    await page.locator('.ov-doctab').first().dragTo(page.locator('.ov-doctab').nth(before.length - 1))
    await sleep(700)
    const after = await titles()
    assert(after[after.length - 1] === draggedPath, `drag did not move ${draggedPath} to the end: ${after.join(' | ')}`)
    assert(after[0] === before[1] && after[1] === before[2], `drag dropped others out of order: ${after.join(' | ')}`)
    assert(((await page.locator('.ov-doctab-active').getAttribute('title')) ?? '') === draggedPath, 'dragged tab lost selection')
    return { before, after }
  })

  await check('tabs.overflow-menu', async () => {
    const strip = page.locator('.ov-tabstrip')
    const count = await page.locator('.ov-doctab').count()
    assert(count >= 3, `need three tabs for the overflow probe, have ${count}`)
    // Constrain the strip instead of opening a dozen tabs: both make it scroll.
    await strip.evaluate(node => { node.style.maxWidth = '80px' })
    await sleep(400)
    const trigger = page.locator('.ov-doctab-overflow')
    assert((await trigger.count()) === 1, 'overflow trigger missing after constraining the strip')
    const activePath = (await page.locator('.ov-doctab-active').getAttribute('title')) ?? ''
    await trigger.click()
    await sleep(400)
    const menu = page.locator('.ov-tab-overflow')
    assert(await menu.isVisible(), 'overflow menu did not open')
    const rows = menu.locator('.ov-tab-overflow-item')
    assert((await rows.count()) === count, `overflow lists ${await rows.count()} tabs, expected ${count}`)
    assert(((await menu.locator('.ov-tab-overflow-active').getAttribute('title')) ?? '') === activePath, 'overflow does not mark the active tab')
    const target = (await rows.nth(0).getAttribute('title')) ?? ''
    await rows.nth(0).click()
    await sleep(600)
    assert((await page.locator('.ov-tab-overflow').count()) === 0, 'overflow menu stayed open after picking a tab')
    assert(((await page.locator('.ov-doctab-active').getAttribute('title')) ?? '') === target, 'overflow pick did not activate the tab')
    await strip.evaluate(node => { node.style.maxWidth = '' })
    await sleep(500)
    // Whether the restored strip still scrolls depends on how many tabs are
    // open, so assert the trigger tracks the measurement rather than vanishing.
    const scrolls = await strip.evaluate(node => node.scrollWidth > node.clientWidth + 1)
    const triggerAfter = await page.locator('.ov-doctab-overflow').count()
    assert((triggerAfter === 1) === scrolls, `overflow trigger (${triggerAfter}) does not match the strip measurement (${scrolls})`)
    return { count, target, scrolls }
  })

  await check('ui.narrow-drawers', async () => {
    // The workspace sits inside the host chrome, so park and slide assertions
    // compare against the workspace body, not the browser viewport.
    const bodyBox = async () => (await page.locator('.ov-body').boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 }
    // Restore the desktop viewport even on failure; a lingering narrow layout
    // would make every later click land on the drawer instead of the ribbon.
    try {
      await page.setViewportSize({ width: 1024, height: 900 })
      await sleep(700)
      assert((await page.locator('[data-ov-splitter="right"]').count()) === 0, 'right splitter still docked at 1024px')
      assert(await page.locator('.ov-ribbon').isVisible(), 'ribbon disappeared in the 1100px layout')
      await page.locator('button[aria-label="大纲"]').click()
      await sleep(500)
      const floatingRail = await bodyBox()
      const railBox = await page.locator('.ov-rail').boundingBox()
      assert(railBox !== null && railBox.x + railBox.width >= floatingRail.x + floatingRail.width - 1, `rail overlay is not floating: ${JSON.stringify(railBox)}`)
      const scrim = page.locator('.ov-scrim')
      assert(await scrim.isVisible(), 'scrim missing behind the rail overlay')
      await scrim.click({ position: { x: 200, y: 200 } })
      await sleep(400)
      assert((await page.locator('.ov-scrim').count()) === 0, 'scrim stayed after closing the rail overlay')

      await page.setViewportSize({ width: 800, height: 900 })
      await sleep(700)
      assert((await page.locator('[data-ov-splitter="left"]').count()) === 0, 'left splitter still docked at 800px')
      const narrowBody = await bodyBox()
      const parked = await page.locator('.ov-explorer').boundingBox()
      assert(parked !== null && parked.x + parked.width <= narrowBody.x + 1, `explorer is not parked off-canvas: ${JSON.stringify(parked)} vs body ${JSON.stringify(narrowBody)}`)
      await page.locator('.ov-ribbon button[aria-label="文件"]').click()
      await sleep(500)
      const drawer = await page.locator('.ov-explorer').boundingBox()
      assert(drawer !== null && Math.abs(drawer.x - narrowBody.x) <= 1, `drawer did not slide in: ${JSON.stringify(drawer)} vs body ${JSON.stringify(narrowBody)}`)
      await page.locator('.ov-scrim').click({ position: { x: 600, y: 200 } })
      await sleep(500)
      assert((await page.locator('.ov-scrim').count()) === 0, 'scrim stayed after closing the drawer')
    } finally {
      await page.setViewportSize({ width: 1440, height: 900 })
      await sleep(700)
    }
    assert((await page.locator('[data-ov-splitter="left"]').count()) === 1, 'left splitter did not come back at 1440px')
  })

  // ================= 多库管理 =================
  await check('vaults.manager-lists-recent', async () => {
    await page.locator('.ov-vault-switch').click()
    await sleep(400)
    const dialog = page.locator('.ov-dialog')
    assert(await dialog.isVisible(), 'vault manager did not open')
    assert((await dialog.locator('.ov-vault-row').count()) >= 1, 'no recent vault rows')
    assert((await dialog.locator('.ov-vault-row-tag').count()) === 1, 'active tag missing')
    const openButton = dialog.locator('button', { hasText: '打开文件夹' })
    assert((await openButton.count()) === 1, 'open-folder button missing')
    assert(!(await openButton.isDisabled()), 'directory picker unavailable, open-folder disabled')
    assert((await dialog.locator('button', { hasText: '新建知识库' }).count()) === 1, 'new-vault button missing')
    await page.keyboard.press('Escape')
    await sleep(300)
    assert((await page.locator('.ov-dialog').count()) === 0, 'dialog stayed open after Escape')
  })

  await check('vaults.inspect-unconfigured', async () => {
    const probe = await api(`vault/inspect?path=${encodeURIComponent(AUDIT_VAULT_B)}`)
    assert(probe.exists === true && probe.configured === true, `unexpected probe: ${JSON.stringify(probe)}`)
    const missing = await api(`vault/inspect?path=${encodeURIComponent(`${AUDIT_VAULT_B}-nope`)}`)
    assert(missing.exists === false, 'missing dir reported as existing')
  })

  let switchedVault

  await check('vaults.switch-and-reload', async () => {
    // Close every tab first: the open note path belongs to vault A, so leaving
    // it open would fetch a 404 from vault B and pollute the console log.
    while ((await page.locator('.ov-doctab').count()) > 0) {
      await page.locator('.ov-doctab .ov-doctab-close').first().click()
      await sleep(200)
    }
    const before = await api('status')
    const opened = await api('vault/open', { method: 'POST', body: JSON.stringify({ path: AUDIT_VAULT_B }) })
    assert(opened.configured === true, 'vault B should carry .obsidian')
    assert(opened.vault.active === true, 'vault B did not activate')
    switchedVault = { before: before.root, opened }
    // The page polls the index every 8s and reloads when the version moves.
    await sleep(9500)
    const name = await page.locator('.ov-vault-switch-name').textContent()
    assert(name === basename(AUDIT_VAULT_B), `switcher still shows vault A: ${name}`)
    const status = await api('status')
    assert(status.root === opened.vault.path, `index root is ${status.root}, expected ${opened.vault.path}`)
    const treeB = await page.locator('.ov-tree').textContent()
    assert(treeB?.includes('远端笔记'), `tree did not load vault B: ${treeB?.slice(0, 160)}`)
  })

  await check('config.obsidian-roundtrip', async () => {
    // Vault B is a throwaway temp directory, so writing `.obsidian` files here
    // never touches the user's real vault; ensureVaultB covers --only runs that
    // skipped the earlier switch. graph.json starts seeded with colorGroups
    // (the shim fixture reads it), which doubles as a pre-existing unknown key
    // every write must preserve.
    await ensureVaultB()
    const seeded = await api('config/read?file=graph')
    assert(seeded.file === 'graph' && Array.isArray(seeded.value?.colorGroups), `unexpected initial graph.json: ${JSON.stringify(seeded)}`)
    const first = await api('config/write', {
      method: 'POST',
      body: JSON.stringify({ file: 'graph', value: { search: '', showTags: false, collapseForces: true, 'collapse-filter': true } }),
    })
    assert(first.value.collapseForces === true, `write dropped an unknown key: ${JSON.stringify(first)}`)
    assert(Array.isArray(first.value.colorGroups), `write dropped the seeded colorGroups: ${JSON.stringify(first)}`)
    await api('config/write', {
      method: 'POST',
      body: JSON.stringify({ file: 'graph', value: { nodeSizeMultiplier: 1.25 } }),
    })
    const merged = await api('config/read?file=graph')
    assert(merged.value.collapseForces === true && merged.value['collapse-filter'] === true, `unknown keys lost: ${JSON.stringify(merged.value)}`)
    assert(Array.isArray(merged.value.colorGroups), `seeded colorGroups lost: ${JSON.stringify(merged.value)}`)
    assert(merged.value.nodeSizeMultiplier === 1.25 && merged.value.search === '', `merged values: ${JSON.stringify(merged.value)}`)
    const onDisk = JSON.parse(readFileSync(join(AUDIT_VAULT_B, '.obsidian', 'graph.json'), 'utf8'))
    assert(onDisk.collapseForces === true, 'unknown key did not reach disk')
    let rejected = false
    try {
      await api('config/read?file=../../vaults')
    } catch {
      rejected = true
    }
    assert(rejected, 'config/read served a name outside the whitelist')
  })

  await check('graph.settings-persist-to-vault', async () => {
    await ensureVaultB()
    // Seed the unknown key this check asserts on: in --only runs the
    // config.obsidian-roundtrip check has not written it yet.
    await api('config/write', {
      method: 'POST',
      body: JSON.stringify({ file: 'graph', value: { collapseForces: true } }),
    })
    await page.locator('button[aria-label="关系图"]').click()
    await sleep(2500)
    await page.locator('button[aria-label="图谱设置"]').click()
    await sleep(500)
    const panel = page.locator('.ov-graph-panel')
    assert(await panel.isVisible(), 'settings panel missing on vault B')
    const animate = panel.locator('.ov-kit-toggle', { hasText: '持续动画' })
    const before = await animate.getAttribute('data-on')
    await animate.click()
    await sleep(1200)
    const stored = await api('config/read?file=graph')
    assert(stored.value.dshAnimate === (before !== 'true'), `graph.json dshAnimate=${JSON.stringify(stored.value.dshAnimate)} after toggling from ${before}`)
    // Leave the default on for the rest of the run.
    await animate.click()
    await sleep(900)
    assert(stored.value.collapseForces === true, 'settings write dropped unknown keys')
    const slider = panel.locator('[role="slider"][aria-label="节点大小"]')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await sleep(1200)
    const scaled = await api('config/read?file=graph')
    assert(typeof scaled.value.nodeSizeMultiplier === 'number' && scaled.value.nodeSizeMultiplier !== 1.25, `nodeSizeMultiplier=${JSON.stringify(scaled.value.nodeSizeMultiplier)}`)
    await page.keyboard.press('ArrowLeft')
    await sleep(900)
    await panel.locator('button[aria-label="关闭"]').click()
    await sleep(300)
    // Back to the reading view so the switch-back check starts from the same
    // state the earlier checks left the page in.
    await page.locator('button[aria-label="关系图"]').click()
    await sleep(600)
  })

  // ================= 插件面板 =================
  await check('plugins.core-toggle-persists', async () => {
    const core = await api('plugins/toggle', { method: 'POST', body: JSON.stringify({ id: 'graph', enabled: false }) })
    assert(core.core.find(plugin => plugin.id === 'graph')?.enabled === false, 'core disable did not apply')
    const onDisk = JSON.parse(readFileSync(join(AUDIT_VAULT_B, '.obsidian', 'core-plugins.json'), 'utf8'))
    assert(onDisk.graph === false, `core-plugins.json graph: ${JSON.stringify(onDisk.graph)}`)
    assert(onDisk['file-explorer'] === true, 'an absent core file should start from the defaults')
    const dshEntry = core.dsh?.find(plugin => plugin.id === 'audit-dsh')
    assert(dshEntry !== undefined, `dsh fixture missing: ${JSON.stringify(core.dsh)}`)
    assert(dshEntry.name === 'Audit DSH' && dshEntry.version === '0.2.0', `dsh manifest not read: ${JSON.stringify(dshEntry)}`)
    assert(
      typeof core.dshFolder === 'string' && core.dshFolder.includes('dsh-obsidian-vault') && core.dshFolder.endsWith('plugins'),
      `dsh folder ${core.dshFolder}`,
    )
  })

  await check('settings.dialog-plugins', async () => {
    // Plugin management lives in the settings dialog the ribbon gear opens.
    await page.locator('.ov-ribbon button[aria-label="设置"]').click()
    await sleep(900)
    const dialog = page.locator('.ov-dialog[aria-label="设置"]')
    assert(await dialog.isVisible(), 'settings dialog did not open')

    // Bridging is gone: no appearance picker, no community/bridge section; the
    // DSH folder list and the built-in switches remain.
    const titles = await dialog.locator('.ov-section-title').allTextContents()
    assert(!titles.some(text => text.includes('外观')), `appearance section survived: ${titles.join(' | ')}`)
    assert(!titles.some(text => text.includes('可桥接插件')), `bridge section survived: ${titles.join(' | ')}`)
    assert(titles.some(text => text.includes('DSH 插件')), `dsh section missing: ${titles.join(' | ')}`)
    assert(titles.some(text => text.includes('核心插件')), `core section missing: ${titles.join(' | ')}`)

    // The DSH row has no enable toggle; expanding it reveals the id detail.
    const dshRow = dialog.locator('.ov-plugin-row[data-plugin="audit-dsh"]')
    assert((await dshRow.count()) === 1, 'dsh plugin row missing')
    assert((await dshRow.locator('.ov-plugin-toggle').count()) === 0, 'dsh row should have no enable toggle')
    await dshRow.locator('button.ov-plugin-info').click()
    await sleep(300)
    const dshDetail = dshRow.locator('.ov-plugin-detail')
    assert(await dshDetail.isVisible(), 'dsh detail block missing')
    assert((await dshDetail.textContent())?.includes('audit-dsh'), 'dsh detail id row missing')
    await dshRow.locator('button.ov-plugin-info').click()
    await sleep(300)
    assert((await dshRow.locator('.ov-plugin-detail').count()) === 0, 'dsh detail stayed after collapse')

    const openFolder = dialog.locator('button[aria-label="打开插件文件夹"]')
    assert((await openFolder.count()) === 1 && !(await openFolder.isDisabled()), 'open-folder button missing')

    // The core toggle mirrors the server state, whatever earlier checks set.
    const listed = await api('plugins/list')
    const graphEnabled = listed.core.find(plugin => plugin.id === 'graph')?.enabled
    assert(typeof graphEnabled === 'boolean', `graph missing from plugins/list: ${JSON.stringify(listed.core)}`)
    const coreRow = dialog.locator('.ov-plugin-row[data-plugin="graph"]')
    assert((await coreRow.count()) === 1, 'core plugin row missing')
    assert(
      (await coreRow.locator('.ov-kit-toggle').getAttribute('data-on')) === String(graphEnabled),
      `core toggle disagrees with the server: ui=${await coreRow.locator('.ov-kit-toggle').getAttribute('data-on')} api=${graphEnabled}`,
    )

    await dialog.locator('button[aria-label="刷新"]').click()
    await sleep(700)
    assert((await dialog.locator('.ov-plugin-row[data-plugin="audit-dsh"]').count()) === 1, 'refresh dropped the dsh row')
    assert((await dialog.locator('.ov-plugin-row[data-plugin="graph"]').count()) === 1, 'refresh dropped the core rows')

    await page.keyboard.press('Escape')
    await sleep(400)
    assert((await page.locator('.ov-dialog[aria-label="设置"]').count()) === 0, 'settings dialog stayed open after Escape')
  })

  await check('ui.ribbon-settings-gear', async () => {
    // The ribbon keeps a single settings gear below the spacer; the plugins
    // entry and the per-plugin icons moved into the settings dialog.
    const gear = page.locator('.ov-ribbon button[aria-label="设置"]')
    assert((await gear.count()) === 1, 'settings gear missing or duplicated')
    assert((await page.locator('.ov-ribbon button[aria-label="插件"]').count()) === 0, 'plugins ribbon entry survived')
    assert((await page.locator('.ov-ribbon button[data-plugin]').count()) === 0, 'per-plugin ribbon icons survived')
    const spacers = page.locator('.ov-ribbon .ov-ribbon-spacer')
    assert((await spacers.count()) === 1, `ribbon spacers: ${await spacers.count()}`)
    const afterSpacer = await page.evaluate(() => {
      const spacer = document.querySelector('.ov-ribbon .ov-ribbon-spacer')
      const next = spacer?.nextElementSibling
      return next instanceof HTMLButtonElement ? next.getAttribute('aria-label') : `not-a-button:${next?.tagName ?? 'none'}`
    })
    assert(afterSpacer === '设置', `the entry after the spacer is ${afterSpacer}`)
    assert((await gear.getAttribute('aria-pressed')) === 'false', 'settings gear is an action, never pressed')
    await gear.click()
    await sleep(700)
    assert(await page.locator('.ov-dialog[aria-label="设置"]').isVisible(), 'gear click did not open the settings dialog')
    await page.locator('.ov-dialog-close').click()
    await sleep(400)
    assert((await page.locator('.ov-dialog[aria-label="设置"]').count()) === 0, 'settings dialog stayed open after the close button')
  })

  await check('ui.ribbon-pur-icon', async () => {
    // Bridging is gone: the rail entry writes a real canvas file and opens it.
    const entry = page.locator('.ov-ribbon button[aria-label="打开 Pur Studio"]')
    assert((await entry.count()) === 1, `Pur Studio ribbon entry: ${await entry.count()}`)
    assert((await entry.getAttribute('aria-pressed')) === 'false', 'Pur Studio entry is an action, never pressed')
    await entry.click()
    await sleep(1500)
    const tab = page.locator('.ov-doctab', { hasText: '新画布' }).first()
    assert((await tab.count()) === 1, 'ribbon click did not open a canvas tab')

    // The canvas menu is the kernel's own overlay: right-click opens it and
    // Escape dismisses it (it has no focusable trigger of its own).
    const canvas = page.locator('canvas').first()
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    await sleep(500)
    assert((await page.locator('.ov-menu').count()) >= 1, 'canvas right-click did not open a menu')
    const items = await page.locator('.ov-menu [data-pur-menu-item]').count()
    assert(items > 0, `canvas menu has no keyboard-reachable items: ${items}`)
    await page.keyboard.press('Escape')
    await sleep(300)
    assert((await page.locator('.ov-menu').count()) === 0, 'Escape did not dismiss the canvas menu')

    // The canvas is opaque to assistive technology, so it carries a role and a
    // label, and its selection and zoom are mirrored into a live status.
    assert((await canvas.getAttribute('role')) === 'application', 'canvas role missing')
    const canvasLabel = await canvas.getAttribute('aria-label')
    assert(canvasLabel !== null && canvasLabel.length > 0, 'canvas label missing')
    const pane = canvas.locator('xpath=..')
    const statusOf = async () => (await pane.locator('[role="status"]').first().textContent()) ?? ''
    await sleep(600)
    assert(/\d/.test(await statusOf()), 'live status is empty')

    // Double-click adds a text card, then the selection and Escape are observable.
    const box = await canvas.boundingBox()
    await page.mouse.dblclick(box.x + 240, box.y + 220)
    await sleep(700)
    await page.keyboard.press('Escape')
    await sleep(500)
    await page.mouse.click(box.x + 640, box.y + 420)
    await sleep(300)
    await page.keyboard.press('Control+a')
    await sleep(700)
    assert(/1/.test(await statusOf()), `select-all status: ${await statusOf()}`)
    await page.keyboard.press('Escape')
    await sleep(700)
    assert(/0/.test(await statusOf()), 'Escape did not clear the selection')
    await page.keyboard.press('Tab')
    await sleep(700)
    assert(/1/.test(await statusOf()), 'Tab did not select an element')

    // A resting pointer explains the double click and offers the move cursor.
    // The card's top-left corner is under the creation point, which is a resize
    // handle; aim at its middle so the assertion is about the body cursor.
    await page.mouse.move(box.x + 350, box.y + 265)
    await sleep(900)
    const hint = await pane.evaluate((node) => {
      // The hint is a kit class now, so match the class or the marker instead of an
      // inline style that no longer exists.
      const found = node.querySelector('[data-pur-hint]')
        ?? node.querySelector('.ov-pur-hint')
        ?? [...node.querySelectorAll('div')].find((child) => /双击|Double-click/.test(child.textContent ?? ''))
      return found === undefined || found === null ? null : found.textContent
    })
    assert(hint !== null, 'hover hint did not appear')
    const hoverCursor = await canvas.evaluate((node) => node.style.cursor)
    assert(hoverCursor === 'move', `hover cursor: ${hoverCursor}`)

    const created = await tab.getAttribute('title')
    await tab.locator('.ov-doctab-close').click()
    await sleep(400)
    assert((await page.locator('.ov-doctab', { hasText: '新画布' }).count()) === 0, 'canvas tab stayed open')
    if (created !== null) await api('delete', { method: 'POST', body: JSON.stringify({ path: created }) })
  })



  await check('vaults.switch-back', async () => {
    await page.locator('.ov-vault-switch').click()
    await sleep(500)
    const row = page.locator('.ov-vault-row-main', { hasText: '个人知识库' }).first()
    assert((await row.count()) === 1, 'original vault row missing from the manager')
    await row.click()
    await sleep(1500)
    assert((await page.locator('.ov-dialog').count()) === 0, 'manager stayed open after switching')
    const back = await api('status')
    assert(back.root === switchedVault.before, `index root did not return to ${switchedVault.before}`)
    const treeA = await page.locator('.ov-tree').textContent()
    assert(treeA?.includes(FIXTURE_DIR), 'tree did not reload the original vault')

    const list = await api('vault/list')
    const forgotten = list.vaults.find(v => v.path === switchedVault.opened.vault.path)
    assert(forgotten !== undefined, 'vault B missing from the registry')
    await api('vault/forget', { method: 'POST', body: JSON.stringify({ id: forgotten.id }) })
  })

  // ================= 每日笔记 / 模板 =================
  await check('note.daily-note-command', async () => {
    // daily-notes.json supplies the folder, the date format, and the template,
    // so the opened note proves all three were read and applied.
    await page.keyboard.press('Control+p')
    await sleep(400)
    await page.locator('.ov-quick-input').fill('今日')
    await sleep(400)
    const items = page.locator('.ov-quick-list .ov-item')
    assert((await items.count()) === 1, `daily command count ${await items.count()}`)
    await page.keyboard.press('Enter')
    await sleep(2000)
    assert((await page.locator('.ov-quick').count()) === 0, 'palette stayed open after the daily command')
    const path = `${DAILY_DIR}/${TODAY}.md`
    const file = await api(`file?path=${encodeURIComponent(path)}`)
    assert(file.text === TEMPLATE_BODY, `daily note text ${JSON.stringify(file.text)}`)
    assert((await page.locator('.ov-doctab', { hasText: TODAY }).count()) > 0, 'daily note tab missing')
    const reading = await page.locator('.ov-note').textContent()
    assert(reading?.includes('今日待办'), `reading view text ${reading?.slice(0, 80)}`)
    return { path }
  })

  await check('note.template-command', async () => {
    // templates.json names 审核模板夹, so that folder's notes become palette
    // entries; running one prompts for a name and seeds the new note.
    dialogAnswer = TEMPLATE_CREATED
    await page.keyboard.press('Control+p')
    await sleep(400)
    await page.locator('.ov-quick-input').fill('从模板新建')
    await sleep(400)
    const items = page.locator('.ov-quick-list .ov-item', { hasText: '每日模板' })
    assert((await items.count()) === 1, `template command missing: ${await items.count()}`)
    await page.keyboard.press('Enter')
    await answerAsk(dialogAnswer)
    await sleep(2200)
    assert((await page.locator('.ov-quick').count()) === 0, 'palette stayed open after the template command')
    const path = `${TEMPLATE_CREATED}.md`
    const file = await api(`file?path=${encodeURIComponent(path)}`)
    assert(file.text === TEMPLATE_BODY, `template note text ${JSON.stringify(file.text)}`)
    return { path }
  })

  // ================= 书签 =================
  await check('rail.bookmarks-toggle', async () => {
    // The file context menu writes one entry into bookmarks.json; the rail
    // tab then lists it, opens it, and removes it again.
    const target = FIXTURE
    await explorerFilter.fill('审核夹具')
    await sleep(700)
    await tree.locator('.ov-file', { hasText: '审核夹具' }).first().click({ button: 'right' })
    await sleep(400)
    const toggle = page.locator('.ov-menu-item', { hasText: /添加书签|移除书签/ })
    assert((await toggle.count()) === 1, `bookmark menu item count ${await toggle.count()}`)
    await toggle.click()
    await sleep(1000)
    const stored = await api('config/read?file=bookmarks')
    const storedItems = Array.isArray(stored.value?.items) ? stored.value.items : []
    assert(storedItems.some(item => item.path === target), `bookmarks.json ${JSON.stringify(stored.value)}`)
    await page.locator('.ov-rail .ov-tab', { hasText: '书签' }).click()
    await sleep(500)
    const row = page.locator('.ov-bookmark-row', { hasText: '审核夹具' })
    assert((await row.count()) === 1, `bookmark row count ${await row.count()}`)
    await row.locator('.ov-item').click()
    await sleep(900)
    const active = await page.locator('.ov-doctab-active').textContent()
    assert(active?.includes('审核夹具'), `bookmark opened ${active}`)
    await page.locator('.ov-rail .ov-bookmark-remove').first().click()
    await sleep(1000)
    assert((await page.locator('.ov-bookmark-row').count()) === 0, 'bookmark row survived removal')
    const panel = (await page.locator('.ov-panel').textContent()) ?? ''
    assert(panel.includes('还没有书签'), `empty bookmark state ${panel.slice(0, 40)}`)
    await explorerFilter.fill('')
    await sleep(300)
  })
} finally {
  // ---------- cleanup ----------
  // Close the page before deleting fixtures: a live page polling the index would
  // refetch the open note after each removal and report the expected 404 as a
  // console error.
  await browser.close()
  // A failed switch check can leave vault B registered or even active; forget
  // it before removing fixtures so the deletions below hit the fixture vault.
  try {
    const list = await api('vault/list')
    const stale = list.vaults.find(v => v.path === AUDIT_VAULT_B)
    if (stale !== undefined) {
      await api('vault/forget', { method: 'POST', body: JSON.stringify({ id: stale.id }) })
    }
  } catch {
    // The registry may already be clean, or the host may be gone.
  }
  rmSync(AUDIT_VAULT_B, { recursive: true, force: true })
  rmSync(AUDIT_DSH_DIR, { recursive: true, force: true })
  const removals = [GHOST, RENAMED, LINKER, `外设/审核链接者.md`, `${FIXTURE_DIR}/审核夹具.md`, `${FIXTURE_DIR}/审核相对链接.md`, `${FIXTURE_DIR}/审核按钮新建.md`, `${FIXTURE_DIR}/审核目录内新建.md`, `${FIXTURE_DIR}/审核按钮新建文件夹`, FIXTURE_DIR, DRAG_FILE, DRAG_TARGET_DIR, DRAG_SOURCE_DIR, `${TEMPLATE_CREATED}.md`, DAILY_DIR, TEMPLATE_DIR]
  for (const target of removals) {
    await api('delete', { method: 'POST', body: JSON.stringify({ path: target }) }).catch(() => {})
  }
  // Restore the journaled originals; a vault that had no such file gets the
  // fixture removed instead. Only a successful restore clears the journal.
  for (const [file, backup] of [
    [dailyConfigPath, originals.daily],
    [templatesConfigPath, originals.templates],
    [bookmarksConfigPath, originals.bookmarks],
  ]) {
    if (backup === undefined) rmSync(file, { force: true })
    else writeFileSync(file, backup, 'utf8')
  }
  rmSync(originalsPath, { force: true })
}

const failed = results.filter(r => !r.ok)
console.log('\n==== AUDIT SUMMARY ====')
console.log(`checks: ${results.length}, failed: ${failed.length}, skipped: ${skipped.length}`)
for (const f of failed) console.log(`  FAIL ${f.name}: ${f.detail}`)
console.log(`console errors: ${consoleErrors.length}`)
for (const e of consoleErrors.slice(0, 10)) console.log(`  ${e}`)
if (consoleErrors.length > 0) {
  for (const failedCheck of new Set(consoleErrors.map(e => e.split(' during ')[1]).filter(Boolean))) {
    const lines = apiTrace.filter(line => line.endsWith(`[${failedCheck}]`))
    console.log(`---- api trace for ${failedCheck} (${lines.length} lines) ----`)
    for (const line of lines.slice(-80)) console.log(line)
  }
}
process.exit(failed.length > 0 || consoleErrors.length > 0 ? 1 : 0)

/**
 * Host half of dsh-brain-console.
 *
 * 浏览器半部直接调 brain_manager（127.0.0.1:19998）做启停；这里只补一个缺口：
 * **管理器自己没在跑时，浏览器没法拉起它**（面板是它的前端，循环依赖）。
 *
 * 因此宿主侧提供 `/brain-console/api/manager/start`：探活 → 未运行则 detached 拉起
 * 命名启动器（brain_manager.exe）→ 轮询到健康为止。这是"人工控制台"唯一允许的
 * 自启动动作，且必须由用户点击触发，不做开机自启。
 */
import { spawn } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const name = 'dsh-brain-console'

// webServer 由 web-app bundle 提供，且是异步激活的；声明 inject 让 Cordis 等它就绪后
// 再调用 apply，避免在服务未就绪时访问 ctx.webServer 导致插件装载失败。
// （此前不声明 inject，靠装载顺序碰运气：宿主一启动就取 webServer，顺序一变就整行失败。）
export const inject = ['webServer']

// 管理器地址可由部署环境覆盖；默认本机 19998。浏览器半部经 /config 读取。
const MANAGER_URL = process.env.BRAIN_MANAGER_URL ?? 'http://127.0.0.1:19998'
// Machine paths come from the environment: BRAIN_ROOT (or OBSIDIAN_VAULT/.brain),
// and PYTHONW via BRAIN_PYTHONW. An unset root yields a clear route error instead
// of silently operating on a relative .brain directory.
const BRAIN_ROOT = process.env.BRAIN_ROOT ?? (process.env.OBSIDIAN_VAULT ? join(process.env.OBSIDIAN_VAULT, '.brain') : '')
const PYTHONW = process.env.BRAIN_PYTHONW ?? 'pythonw.exe'

interface RouteHost {
  /** 注册一个随插件生命周期释放的 effect。 */
  effect(callback: () => (() => void) | void, label?: string): () => void
  readonly webServer: {
    register(route: {
      readonly kind: 'prefix'
      readonly path: string
      readonly handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
    }): () => void
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function managerAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${MANAGER_URL}/health`, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

function send(res: ServerResponse, code: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(payload)
}

/**
 * 本进程内「正在启动管理器」的时刻。
 *
 * 管理器启动要恢复 7 个服务，约 30s 才在 :19998 上线；在这段窗口里连点两次按钮、
 * 或脚本与面板同时请求，会各 spawn 一个管理器（实测出现过双实例）。用这个时间戳
 * 在进程内去抖：窗口内的后续请求只回 202 starting，不再重复拉起。
 */
let managerStartingSince: number | null = null

/** 去抖窗口要覆盖管理器恢复服务的耗时。 */
const MANAGER_START_WINDOW_MS = 120_000

async function startManager(res: ServerResponse): Promise<void> {
  if (BRAIN_ROOT.length === 0) {
    send(res, 500, { error: 'BRAIN_ROOT is not configured: set BRAIN_ROOT or OBSIDIAN_VAULT for the dsh process' })
    return
  }
  if (await managerAlive()) {
    managerStartingSince = null
    send(res, 200, { running: true, started: false })
    return
  }
  const now = Date.now()
  if (managerStartingSince !== null && now - managerStartingSince < MANAGER_START_WINDOW_MS) {
    send(res, 202, { running: false, starting: true })
    return
  }
  managerStartingSince = now
  try {
    await spawnManager(res)
  } finally {
    managerStartingSince = null
  }
}

async function spawnManager(res: ServerResponse): Promise<void> {
  const script = join(BRAIN_ROOT, 'services', 'brain_manager.py')
  // 优先用「带名字的 pythonw 副本」：任务管理器按 exe 的 FileDescription 显示进程名，
  // 直接跑 pythonw 会显示成 "Python"；副本由 tools/launcher/build_named_python.py 生成。
  const named = join(BRAIN_ROOT, 'tools', 'launcher', 'py', 'brain_manager.exe')
  const launcher = join(BRAIN_ROOT, 'tools', 'launcher', 'brain_manager.exe')
  if (!existsSync(script)) {
    send(res, 500, { error: `manager script missing (${script})` })
    return
  }
  if (existsSync(named)) {
    const logPath = join(BRAIN_ROOT, 'logs', 'brain_manager.log')
    mkdirSync(dirname(logPath), { recursive: true })
    const fd = openSync(logPath, 'a')
    try {
      const child = spawn(named, [script], {
        detached: true,
        stdio: ['ignore', fd, fd],
        windowsHide: true,
        cwd: BRAIN_ROOT,
        env: {
          ...process.env,
          PATH: `${PYTHONW.includes('\\') || PYTHONW.includes('/') ? `${dirname(PYTHONW)};` : ''}${process.env.PATH ?? ''}`,
        },
      })
      child.unref()
    } finally {
      closeSync(fd)
    }
  } else if (existsSync(launcher)) {
    const child = spawn(launcher, [PYTHONW, script], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      cwd: BRAIN_ROOT,
    })
    child.unref()
  } else {
    send(res, 500, { error: `launcher or named python missing (${launcher})` })
    return
  }
  // 管理器启动要恢复上次状态（逐个拉起服务），给 60s
  for (let i = 0; i < 120; i++) {
    await sleep(500)
    if (await managerAlive()) {
      send(res, 200, { running: true, started: true })
      return
    }
  }
  send(res, 504, { error: 'manager did not become healthy within 60s' })
}
export function apply(ctx: RouteHost): void {
  console.log('[brain-console] host apply: registering /brain-console/api')
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: '/brain-console/api',
        handler: async (req, res) => {
          const url = new URL(req.url ?? '/', 'http://localhost')
          if (url.pathname.endsWith('/config')) {
            send(res, 200, { managerUrl: MANAGER_URL })
            return
          }
          if (url.pathname.endsWith('/manager/status')) {
            send(res, 200, { running: await managerAlive() })
            return
          }
          if (url.pathname.endsWith('/manager/start') && req.method === 'POST') {
            await startManager(res)
            return
          }
          send(res, 404, { error: 'not found' })
        },
      }),
    'brain-console: manager routes',
  )
}

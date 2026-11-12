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

import { effectiveConfig, saveConfig, type PanelConfig } from './config.ts'

export const name = 'dsh-brain-console'

// webServer 由 web-app bundle 提供，且是异步激活的；声明 inject 让 Cordis 等它就绪后
// 再调用 apply，避免在服务未就绪时访问 ctx.webServer 导致插件装载失败。
// （此前不声明 inject，靠装载顺序碰运气：宿主一启动就取 webServer，顺序一变就整行失败。）
export const inject = ['webServer']


// 路径与地址来自配置（见 config.ts）：文件优先，环境变量兜底。

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
  const config = effectiveConfig()
  if (config.managerUrl === '') return false
  try {
    const res = await fetch(`${config.managerUrl}/health`, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 读取并解析 JSON 请求体（上限 8KB）。
 * @param req - 宿主请求
 * @returns 解析结果；空体/超限/坏 JSON 返回 {}
 */
async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk as Buffer)
    size += buffer.length
    if (size > 8 * 1024) break
    chunks.push(buffer)
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
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
  const config = effectiveConfig()
  if (config.brainRoot === '') {
    send(res, 500, { error: 'Brain 根目录未配置：在面板设置页填写，或设置 BRAIN_ROOT / OBSIDIAN_VAULT' })
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
  const config = effectiveConfig()
  const script = config.scriptPath
  // 优先用「带名字的 pythonw 副本」：任务管理器按 exe 的 FileDescription 显示进程名，
  // 直接跑 pythonw 会显示成 "Python"；副本由 tools/launcher/build_named_python.py 生成。
  const named = config.namedLauncher
  const launcher = config.launcherPath
  const PYTHONW = config.pythonw
  if (!existsSync(script)) {
    send(res, 500, { error: `manager script missing (${script})` })
    return
  }
  if (existsSync(named)) {
    const logPath = config.logPath
    mkdirSync(dirname(logPath), { recursive: true })
    const fd = openSync(logPath, 'a')
    try {
      const child = spawn(named, [script], {
        detached: true,
        stdio: ['ignore', fd, fd],
        windowsHide: true,
        cwd: config.brainRoot,
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
      cwd: config.brainRoot,
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
            if (req.method === 'POST') {
              const body = await readJsonBody(req)
              const result = saveConfig({
                brainRoot: typeof body.brainRoot === 'string' ? body.brainRoot : undefined,
                managerUrl: typeof body.managerUrl === 'string' ? body.managerUrl : undefined,
              })
              send(res, result.ok ? 200 : 400, result)
              return
            }
            const config: PanelConfig = effectiveConfig()
            send(res, 200, config)
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

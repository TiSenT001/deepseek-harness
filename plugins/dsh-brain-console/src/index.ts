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

const MANAGER_URL = 'http://127.0.0.1:19998'
const BRAIN_ROOT = process.env.BRAIN_ROOT ?? 'G:\\个人知识库\\.brain'
const PYTHONW =
  process.env.BRAIN_PYTHONW ??
  'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Python\\Python311\\pythonw.exe'

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

async function startManager(res: ServerResponse): Promise<void> {
  if (await managerAlive()) {
    send(res, 200, { running: true, started: false })
    return
  }
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
        env: { ...process.env, PATH: `${dirname(PYTHONW)};${process.env.PATH ?? ''}` },
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

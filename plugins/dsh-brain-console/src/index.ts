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
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const name = 'dsh-brain-console'

// 注：不声明 `export const inject = ['webServer']`。实测声明后 apply 不会被调用
// （服务名匹配不上就一直等待），去掉后即可正常装载并注册路由。

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
  const exe = join(BRAIN_ROOT, 'tools', 'launcher', 'brain_manager.exe')
  const script = join(BRAIN_ROOT, 'services', 'brain_manager.py')
  if (!existsSync(exe) || !existsSync(script)) {
    send(res, 500, { error: `launcher or script missing (${exe})` })
    return
  }
  const child = spawn(exe, [PYTHONW, script], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    cwd: BRAIN_ROOT,
  })
  child.unref()
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

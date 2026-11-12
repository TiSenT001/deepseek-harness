/**
 * Browser half: 把「TiSenT Brain」注册为左侧栏入口 + 主面板页面。
 *
 * 与 dsh-obsidian-vault 同一套 slots 契约：
 *   sidebar.panellist（左侧栏入口，带图标） + main（面板页面本体）
 * 两个贡献都先 inject 再 register，激活顺序无关。
 */
import { useEffect, useState, type ReactNode } from 'react'
import { setApiBase } from './api.ts'
import { BrainConsoleIcon } from './icon.tsx'
import { ConsolePage } from './page.tsx'

/** Services the browser half reads. */
export const inject: readonly string[] = ['slots']

const PANEL_ID = 'brain-console'

interface SlotRegistration {
  readonly name: string
  readonly id?: string
  readonly key?: string
  readonly order?: number
  readonly label?: string | (() => string)
}

export interface ClientContext {
  readonly slots: {
    register(options: SlotRegistration, component: (props: never) => ReactNode): () => void
    inject(name: string, callback: () => () => void): () => void
  }
  effect(callback: () => (() => void) | void, label?: string): () => void
}

/**
 * 页面外壳：先向宿主读管理器地址，再挂载真实面板。
 * 宿主路由不可用时回退 api.ts 的默认地址，不阻塞面板。
 */
function ConsoleRoot(): JSX.Element {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/brain-console/api/config', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json() as { managerUrl?: unknown }
          if (typeof data.managerUrl === 'string' && data.managerUrl !== '') {
            setApiBase(data.managerUrl)
          }
        }
      } catch {
        // 宿主路由不可用（旧版）：沿用默认地址
      } finally {
        setReady(true)
      }
    })()
  }, [])
  if (!ready) return <div className="bc-loading">读取管理器配置…</div>
  return <ConsolePage />
}

export function apply(ctx: ClientContext): void {
  // 左侧栏入口
  ctx.effect(
    () => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 30,
        label: () => 'TiSenT Brain',
      },
      BrainConsoleIcon as unknown as (props: never) => ReactNode,
    )),
    'brain-console: panel entry',
  )
  // 面板页面
  ctx.effect(
    () => ctx.slots.inject('main', () => ctx.slots.register(
      { name: 'main', key: PANEL_ID },
      ConsoleRoot as unknown as (props: never) => ReactNode,
    )),
    'brain-console: page',
  )
}

/**
 * Browser half: 把「TiSenT Brain」注册为左侧栏入口 + 主面板页面。
 *
 * 与 dsh-obsidian-vault 同一套 slots 契约：
 *   sidebar.panellist（左侧栏入口，带图标） + main（面板页面本体）
 * 两个贡献都先 inject 再 register，激活顺序无关。
 */
import type { ReactNode } from 'react'
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
      ConsolePage as unknown as (props: never) => ReactNode,
    )),
    'brain-console: page',
  )
}

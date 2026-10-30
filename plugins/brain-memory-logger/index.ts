import type { Context } from '@deepseek-ai/cordis'
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'brain-memory-logger'

// brain_server HTTP 端点（:19995）—— /learn 存用户消息正文、/reply 存 agent 回复。
// 注意：不是 brain_mcp_server（:19996，MCP 工具服务，无 /learn /reply 端点）。
const BRAIN = 'http://127.0.0.1:19995'

// 离线缓冲：brain_server 离线时，失败的消息落盘到这里，恢复后重放（启动时 + 每 60s）。
const OUTBOX = join(dirname(fileURLToPath(import.meta.url)), '.brain-outbox.jsonl')

function extractText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return (content as Array<{ type?: string; text?: string }>)
      .map((b) => (b?.type === 'text' ? (b.text ?? '') : ''))
      .join('')
  }
  return ''
}

async function post(path: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const resp = await fetch(`${BRAIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return resp.ok
  } catch {
    // brain_server 离线时返回 false，交由 outbox 落盘，不阻断 dsh
    return false
  }
}

function enqueueOutbox(entry: { path: string; payload: Record<string, unknown> }): void {
  try {
    appendFileSync(OUTBOX, JSON.stringify(entry) + '\n')
  } catch {
    // 落盘失败也静默——离线缓冲是 best-effort
  }
}

async function flushOutbox(): Promise<void> {
  if (!existsSync(OUTBOX)) return
  try {
    const lines = readFileSync(OUTBOX, 'utf-8').trim().split('\n').filter(Boolean)
    if (lines.length === 0) return
    const remaining: string[] = []
    for (const line of lines) {
      try {
        const { path, payload } = JSON.parse(line)
        const ok = await post(path, payload)
        if (!ok) remaining.push(line)
      } catch {
        remaining.push(line)
      }
    }
    // 写回未成功重放的行（全部成功则截断）
    writeFileSync(OUTBOX, remaining.length ? remaining.join('\n') + '\n' : '')
  } catch {
    // best-effort
  }
}

export function apply(ctx: Context) {
  // dsh 的会话事件统一从 `session/event` 出（session, SessionEvent）。
  // `user/message` / `assistant/message` 是 event.type 的取值，不是 cordis 事件名。
  ctx.on('session/event', (session: any, event: any) => {
    if (event?.type === 'user/message') {
      // 只记录真正的人类提示（source.kind === 'user'），
      // 跳过 agent.inject() 的 synthetic context（文件变更通知、AGENTS.md、cron 通知等，
      // 它们的 source.kind 是 'plugin'/'system-prompt' 等）。
      if (event?.data?.source?.kind !== 'user') return
      const text = extractText(event?.data?.content)
      if (!text) return
      const payload = { text, session_id: session?.id ?? 'deepseek-harness', seq: event?.seq, ts: event?.time }
      void post('/learn', payload).then((ok) => { if (!ok) enqueueOutbox({ path: '/learn', payload }) })
    } else if (event?.type === 'assistant/message') {
      const text = extractText(event?.data?.message?.content)
      if (!text) return
      const payload = { text, session_id: session?.id ?? 'deepseek-harness', seq: event?.seq, ts: event?.time }
      void post('/reply', payload).then((ok) => { if (!ok) enqueueOutbox({ path: '/reply', payload }) })
    }
  })

  // 离线缓冲重放：启动时立即 + 每 60s 兜底
  void flushOutbox()
  setInterval(() => void flushOutbox(), 60_000)
}

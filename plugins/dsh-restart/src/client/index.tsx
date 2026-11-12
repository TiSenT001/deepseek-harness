/**
 * Browser half of dsh-restart: a small footer action that asks the Host to
 * restart, then waits for the same origin to answer again before reloading.
 * @module dsh-restart/client
 */
import React, { type ReactNode } from 'react'

/** Services the browser half reads. */
export const inject: readonly string[] = ['slots']

interface SlotRegistration {
  readonly name: string
  readonly id?: string
  readonly order?: number
}

interface ClientContext {
  readonly slots: {
    register(options: SlotRegistration, component: (props: never) => ReactNode): () => void
    inject(name: string, callback: () => () => void): () => void
  }
  effect(callback: () => (() => void) | void, label?: string): () => void
}

const STYLE = `
.dsh-restart-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-height: 28px;
  padding: 5px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.dsh-restart-button:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  background: var(--dsw-alias-bg-layer-2, #232329);
}
.dsh-restart-button:disabled { opacity: .65; cursor: progress; }
.dsh-restart-glyph { display: inline-flex; flex: none; width: 15px; height: 15px; align-items: center; justify-content: center; }
.dsh-restart-button[data-busy="true"] .dsh-restart-glyph { animation: dsh-restart-spin .9s linear infinite; }
.dsh-restart-note { padding: 0 9px 4px; color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 10.5px; line-height: 1.4; }
.dsh-restart-note[data-tone="error"] { color: var(--dsw-alias-state-error-primary, #f85149); }
@keyframes dsh-restart-spin { to { transform: rotate(360deg); } }
`

type Phase = 'idle' | 'busy' | 'error'

/**
 * Register the footer restart action.
 * @param ctx - Client plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.dshRestart = '1'
    style.textContent = STYLE
    document.head.append(style)
    return () => style.remove()
  }, 'dsh-restart: styles')
  ctx.effect(
    () => ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
      { name: 'sidebar.footer.action', id: 'restart', order: 50 },
      RestartButton as unknown as (props: never) => ReactNode,
    )),
    'dsh-restart: footer action',
  )
}

function RestartButton({ wide = true }: { readonly wide?: boolean }): JSX.Element {
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [note, setNote] = React.useState('')
  const busy = phase === 'busy'

  const restart = async (): Promise<void> => {
    if (busy) return
    setPhase('busy')
    setNote(zh() ? '正在重启…' : 'Restarting…')
    try {
      const response = await fetch('/restart/api/restart', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setNote(zh() ? '等待服务恢复…' : 'Waiting for the host…')
      const deadline = Date.now() + 120_000
      while (Date.now() < deadline) {
        await sleep(700)
        try {
          const probe = await fetch('/', { credentials: 'same-origin', cache: 'no-store', redirect: 'follow' })
          if (probe.ok) {
            window.location.reload()
            return
          }
          if (probe.status === 401 || probe.status === 403) {
            setPhase('error')
            setNote(zh() ? '已重启，但登录凭据失效；请从启动器重新打开。' : 'Restarted, but the login cookie is stale. Reopen from the launcher.')
            return
          }
        } catch {
          // The old process is being replaced; keep polling.
        }
      }
      setPhase('error')
      setNote(zh() ? '重启超时，请检查 restart-helper.log。' : 'Restart timed out; check restart-helper.log.')
    } catch (cause) {
      setPhase('error')
      setNote(`${zh() ? '重启失败' : 'Restart failed'}: ${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  return (
    <>
      <button
        type="button"
        className="dsh-restart-button"
        data-busy={busy ? 'true' : undefined}
        disabled={busy}
        title={zh() ? '重启 DSH（隐藏窗口）' : 'Restart DSH (hidden)'}
        aria-label={zh() ? '重启 DSH' : 'Restart DSH'}
        onClick={() => { void restart() }}
      >
        <span className="dsh-restart-glyph" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.8V6h-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {wide ? <span>{busy ? (zh() ? '重启中…' : 'Restarting…') : (zh() ? '重启 DSH' : 'Restart DSH')}</span> : null}
      </button>
      {note.length === 0 ? null : (
        <div className="dsh-restart-note" data-tone={phase === 'error' ? 'error' : undefined}>{note}</div>
      )}
    </>
  )
}

function zh(): boolean {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

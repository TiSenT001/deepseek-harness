/**
 * 索引与嵌入状态：回答「知识真的进脑子了吗」，并提供补嵌 / 重建入口。
 *
 * 只读部分展示三条链路的最新覆盖；动作部分触发管理器里的后台任务，
 * 运行期间每秒轮询一次进度（完成数 / 总数 / 当前笔记 / 失败 / ETA）。
 */
import { useEffect, useRef, useState } from 'react'
import { cancelEmbed, loadEmbedStatus, loadIndexHealth, startEmbed } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button, Modal } from './primitives.ts'
import type { EmbedJobStatus, IndexHealth } from './types.ts'

export interface IndexHealthDialogProps {
  /** 关闭对话框。 */
  onClose: () => void
}

/** 把可能为空的数值格式化成「—」。 */
function num(value: number | null | undefined, suffix = ''): string {
  return value === null || value === undefined ? '—' : `${value}${suffix}`
}

/** 覆盖率进度条（0–100）。 */
function Coverage({ percent }: { percent: number | null }): JSX.Element {
  const width = percent === null ? 0 : Math.max(0, Math.min(100, percent))
  return (
    <div className="bc-coverage" role="img" aria-label={`覆盖 ${percent === null ? '未知' : width.toFixed(1) + '%'}`}>
      <div className="bc-coverage-fill" style={{ width: `${width}%` }} />
    </div>
  )
}

/** 运行中的任务：进度条 + 计数 + 当前笔记 + 取消。 */
function JobProgress({ job, onCancel }: { job: EmbedJobStatus; onCancel: () => void }): JSX.Element {
  const percent = job.total > 0 ? Math.min(100, (job.done / job.total) * 100) : 0
  const summary = job.state === 'running'
    ? `${job.done} / ${job.total} 篇 · 失败 ${job.failed} · 已用 ${job.elapsed_s ?? 0}s${job.eta_s === null ? '' : ` · 预计剩余 ${job.eta_s}s`}`
    : job.state === 'done'
      ? `完成：${job.done} / ${job.total} 篇，失败 ${job.failed}`
      : job.state === 'cancelled'
        ? `已取消：处理到 ${job.done} / ${job.total} 篇`
        : `出错：${job.error ?? '未知原因'}`
  return (
    <div className="bc-embed-job">
      <div className="bc-embed-job-head">
        <strong>{job.label ?? job.mode}</strong>
        <span>{summary}</span>
        {job.state === 'running' && (
          <Button size="sm" variant="ghost" onClick={onCancel}>取消</Button>
        )}
      </div>
      <Coverage percent={percent} />
      {job.current !== null && job.state === 'running' && (
        <div className="bc-embed-current" title={job.current}>当前：{job.current}</div>
      )}
      {job.failures.length > 0 && (
        <details className="bc-embed-failures">
          <summary>失败 {job.failed} 篇（点开看前 {job.failures.length} 条）</summary>
          <ul>
            {job.failures.map((item) => (
              <li key={item.path}><code>{item.path}</code> — {item.reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

/**
 * 渲染索引与嵌入状态对话框。
 * @param props - 关闭回调
 * @returns 对话框元素（挂载即拉一次状态，运行中每秒刷新）
 */
export function IndexHealthDialog({ onClose }: IndexHealthDialogProps): JSX.Element {
  const [health, setHealth] = useState<IndexHealth | null>(null)
  const [job, setJob] = useState<EmbedJobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)

  const load = async (): Promise<void> => {
    try {
      setHealth(await loadIndexHealth())
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    }
  }

  const poll = (): void => {
    if (timer.current !== null) return
    timer.current = window.setInterval(() => {
      void (async () => {
        try {
          const status = await loadEmbedStatus()
          setJob(status)
          if (status.state !== 'running') {
            if (timer.current !== null) {
              window.clearInterval(timer.current)
              timer.current = null
            }
            await load()
          }
        } catch (e) {
          setError(reasonOf(e))
        }
      })()
    }, 1000)
  }

  useEffect(() => {
    void (async () => {
      await load()
      try {
        const status = await loadEmbedStatus()
        setJob(status)
        if (status.state === 'running') poll()
      } catch {
        // 状态接口不可用时只显示只读健康信息
      }
    })()
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current)
    }
  }, [])

  const run = async (mode: string): Promise<void> => {
    setBusy(true)
    try {
      const result = await startEmbed(mode)
      if (result.status) setJob(result.status)
      if (result.ok) poll()
      else setError(result.error ?? '任务未启动')
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (): Promise<void> => {
    try {
      await cancelEmbed()
    } catch (e) {
      setError(reasonOf(e))
    }
  }

  const percent = health !== null && health.notes !== null && health.notes > 0 && health.vec.total !== null
    ? Math.min(100, (health.vec.total / health.notes) * 100)
    : null
  const stale = health?.chunks.stale_days
  const running = job?.state === 'running'

  return (
    <Modal open onClose={onClose} title="索引与嵌入" closeLabel="关闭"
      description="只读状态 + 手动补嵌；任务在管理器后台跑，关掉面板也会继续"
      footer={(
        <>
          <Button size="sm" variant="ghost" onClick={() => void load()}>刷新</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
        </>
      )}>
      {error !== null && <div className="bc-backup-error">{error}</div>}
      {health === null && error === null && <div className="bc-backup-empty">读取中…</div>}
      {health !== null && (
        <div className="bc-index-health">
          <section>
            <h4>笔记向量 <span className="bc-index-note">vec_cache</span></h4>
            <div className="bc-index-row">
              <span>已向量 / 总笔记</span>
              <strong>{num(health.vec.total)} / {num(health.notes)}</strong>
            </div>
            <Coverage percent={percent} />
            <div className="bc-index-row">
              <span>缺少向量</span>
              <strong className={health.vec.missing ? 'bc-index-warn' : ''}>
                {num(health.vec.missing)} 篇
                {(health.vec.missing_sample ?? []).length > 0 && (
                  <span className="bc-index-sample" title={(health.vec.missing_sample ?? []).join('\n')}>
                    （如 {health.vec.missing_sample[0]}）
                  </span>
                )}
              </strong>
            </div>
            {(health.vec.empty ?? 0) > 0 && (
              <div className="bc-index-row">
                <span>空笔记（0 字节，不需向量）</span>
                <strong>{num(health.vec.empty)} 篇</strong>
              </div>
            )}
            <div className="bc-index-row">
              <span>最近 24h 更新</span>
              <strong>{num(health.vec.fresh_24h)} 篇</strong>
            </div>
            <div className="bc-index-row">
              <span>最后写入</span>
              <strong>{health.vec.last_indexed_at ?? '—'}</strong>
            </div>
            <div className="bc-index-row">
              <span>孤儿向量（笔记已删）</span>
              <strong>{num(health.vec.orphans)}</strong>
            </div>
          </section>

          <section>
            <h4>分块索引 <span className="bc-index-note">chunk_index</span></h4>
            <div className="bc-index-row">
              <span>已分块笔记 / 总笔记</span>
              <strong>{num(health.chunks.notes)} / {num(health.notes)}</strong>
            </div>
            {(health.chunks.empty ?? 0) > 0 && (
              <div className="bc-index-row">
                <span>空笔记（0 字节，不需分块）</span>
                <strong>{num(health.chunks.empty)} 篇</strong>
              </div>
            )}
            <div className="bc-index-row">
              <span>分块总数</span>
              <strong>{num(health.chunks.rows)}</strong>
            </div>
            <div className="bc-index-row">
              <span>最后索引</span>
              <strong>
                {health.chunks.last_indexed_at ?? '—'}
                {stale !== null && stale !== undefined && (
                  <span className="bc-index-sample"> · 最后内容变化 {stale} 天前</span>
                )}
              </strong>
            </div>
          </section>

          <section>
            <h4>按领域覆盖 <span className="bc-index-note">向量 / 笔记</span></h4>
            {(health.by_domain ?? []).length === 0 && (
              <div className="bc-index-row"><span>暂无领域数据</span><strong>—</strong></div>
            )}
            {(health.by_domain ?? []).map((bucket) => {
              const percent = bucket.total > 0 ? (bucket.covered / bucket.total) * 100 : 0
              return (
                <div className="bc-index-domain-row" key={bucket.name}>
                  <span className="bc-index-domain-name" title={bucket.name}>{bucket.name}</span>
                  <div className="bc-index-domain-bar"><div style={{ width: `${percent}%` }} /></div>
                  <span className={bucket.missing > 0 ? 'bc-index-warn' : ''}>
                    {bucket.covered} / {bucket.total}
                  </span>
                </div>
              )
            })}
          </section>

          <section>
            <h4>管道心跳 <span className="bc-index-note">cron 是否按时跑</span></h4>
            {(health.crons ?? []).length === 0 && (
              <div className="bc-index-row"><span>暂无心跳数据</span><strong>—</strong></div>
            )}
            {(health.crons ?? []).map((cron) => (
              <div className="bc-cron-row" key={cron.name} data-status={cron.status}>
                <span className="bc-cron-dot" aria-hidden="true" />
                <span className="bc-cron-name">{cron.name}</span>
                <span className="bc-cron-age">
                  {cron.age_hours === null ? '从未运行' : `${cron.age_hours} 小时前`}
                </span>
                <span className="bc-cron-interval">每 {cron.interval_h} 小时</span>
              </div>
            ))}
          </section>

          <section>
            <h4>重试队列</h4>
            <div className="bc-index-row">
              <span>embed_pending</span>
              <strong>{num(health.pending)} 篇</strong>
            </div>
            <div className="bc-index-row">
              <span>库大小</span>
              <strong>{num(health.db_size_mb, ' MB')}</strong>
            </div>
          </section>

          <section>
            <h4>手动补嵌</h4>
            <div className="bc-embed-actions">
              <Button size="sm" variant="ghost" disabled={busy || running || (health.vec.missing ?? 0) === 0}
                onClick={() => void run('vec:fill')}>
                补向量缺失（{num(health.vec.missing)} 篇）
              </Button>
              <Button size="sm" variant="ghost" disabled={busy || running}
                onClick={() => void run('vec:rebuild')}>
                全量重建向量（{num(health.notes)} 篇）
              </Button>
              <Button size="sm" variant="ghost" disabled={busy || running}
                onClick={() => void run('chunk:rebuild')}>
                分块增量重建（{num(health.notes)} 篇）
              </Button>
              <Button size="sm" variant="ghost" disabled={busy || running}
                title="忽略内容哈希，逐篇重建全部分块（会重写数万分块行）；数十秒到数分钟，期间可取消"
                onClick={() => void run('chunk:force')}>
                分块全量重建（强制）
              </Button>
              {(health.chunks.missing ?? 0) > 0 && (
                <Button size="sm" variant="ghost" disabled={busy || running}
                  onClick={() => void run('chunk:fill')}>
                  补分块缺失（{num(health.chunks.missing)} 篇）
                </Button>
              )}
            </div>
            {job !== null && job.state !== 'idle' && <JobProgress job={job} onCancel={() => void cancel()} />}
          </section>
        </div>
      )}
    </Modal>
  )
}

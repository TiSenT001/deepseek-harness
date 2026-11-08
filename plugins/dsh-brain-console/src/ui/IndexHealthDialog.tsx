/**
 * 索引与嵌入状态：回答「知识真的进脑子了吗」。
 *
 * 只读展示三条链路的最新覆盖：
 * 1. 笔记向量（vec_cache）——vault_watch 实时写，缺向量 = 新笔记还没进语义检索；
 * 2. 分块索引（chunk_index）——body_daemon 维护，滞后说明长文分块检索看的是旧内容；
 * 3. 嵌入重试队列（embed_pending）。
 */
import { useEffect, useState } from 'react'
import { loadIndexHealth } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button, Modal } from './primitives.ts'
import type { IndexHealth } from './types.ts'

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

/**
 * 渲染索引与嵌入状态对话框。
 * @param props - 关闭回调
 * @returns 对话框元素（挂载即拉一次）
 */
export function IndexHealthDialog({ onClose }: IndexHealthDialogProps): JSX.Element {
  const [health, setHealth] = useState<IndexHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    try {
      setHealth(await loadIndexHealth())
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    }
  }

  useEffect(() => { void load() }, [])

  const percent = health !== null && health.notes !== null && health.notes > 0 && health.vec.total !== null
    ? Math.min(100, (health.vec.total / health.notes) * 100)
    : null
  const stale = health?.chunks.stale_days

  return (
    <Modal open onClose={onClose} title="索引与嵌入" closeLabel="关闭"
      description="只读状态；不触发重建"
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
                {health.vec.missing_sample.length > 0 && (
                  <span className="bc-index-sample" title={health.vec.missing_sample.join('\n')}>
                    （如 {health.vec.missing_sample[0]}）
                  </span>
                )}
              </strong>
            </div>
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
            <div className="bc-index-row">
              <span>分块总数</span>
              <strong>{num(health.chunks.rows)}</strong>
            </div>
            <div className="bc-index-row">
              <span>最后索引</span>
              <strong className={stale !== null && stale !== undefined && stale > 2 ? 'bc-index-warn' : ''}>
                {health.chunks.last_indexed_at ?? '—'}
                {stale !== null && stale !== undefined && ` · 滞后 ${stale} 天`}
              </strong>
            </div>
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
        </div>
      )}
    </Modal>
  )
}

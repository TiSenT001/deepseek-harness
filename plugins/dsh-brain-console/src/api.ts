/**
 * brain_manager HTTP 客户端：面板只通过它读写管理器（127.0.0.1:19998）。
 *
 * 这里同时放几个模块级常量加载函数（备份/缓存/失败边/历史）——引用稳定，
 * 对话框只在挂载时拉一次列表，不会因为父组件重渲染而反复请求。
 */
import type {
  BackupListing, BatchRestartResult, BatchStartResult, BatchStopResult, CacheListing, CachePruneResult,
  AutoRecoverStatus, CheckupResult, EmbedJobStatus, FailedEdgesListing, HistoryListing, IndexHealth, PruneResult, RestoreResult, TrendThresholds, Unit, UnitAction,
} from './ui/types.ts'

/** brain_manager 的 HTTP 地址。 */
export const API = 'http://127.0.0.1:19998'

/** 单元动作的中文名。 */
export const ACTION_LABEL: Record<UnitAction, string> = { start: '启动', stop: '停止', restart: '重启' }

/** 从 `<name>:<action>` 里取出正在执行的动作；不属于该单元则为 null。 */
export function busyActionOf(busy: string | null, name: string): UnitAction | null {
  if (busy === null) return null
  const [unit, action] = busy.split(':')
  if (unit !== name) return null
  return action === 'start' || action === 'stop' || action === 'restart' ? action : null
}

/** GET 并解析 JSON（失败抛 HTTP 状态）。 */
export async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

/** POST 并解析 JSON 应答（清理备份要读回删了哪些、释放多少）。 */
export async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

/** POST 且不关心响应体（启停/设置类动作）。 */
export async function postManager(path: string, body?: unknown): Promise<void> {
  await postJson<unknown>(path, body)
}

/** 拉取受管单元列表。 */
export const loadUnits = (): Promise<{ units: Unit[] }> => jget<{ units: Unit[] }>('/units')

/** 备份对话框的回调做成模块级常量：引用稳定，对话框只在挂载时拉一次列表。 */
export const loadBackups = (): Promise<BackupListing> => jget<BackupListing>('/actions/backups')
export const pruneBackups = (keep: number): Promise<PruneResult> =>
  postJson<PruneResult>('/actions/prune-backups', { keep })

/** 系统体检：只读跑 tools/system_checkup.py（约 2 秒）。 */
export const loadSystemCheckup = (): Promise<CheckupResult> => jget<CheckupResult>('/system/checkup')

/** 清理代码里已不存在的僵尸心跳；返回删除的名字列表。 */
export const pruneZombieHeartbeats = (): Promise<{ ok: boolean; removed: string[]; kept?: number; error?: string }> =>
  postJson<{ ok: boolean; removed: string[]; kept?: number; error?: string }>('/crons/prune-zombies', {})

/** 趋势告警阈值。 */
export const loadTrendThresholds = (): Promise<TrendThresholds> => jget<TrendThresholds>('/trend/thresholds')

/** 设置/清除某个指标的告警阈值（value 传 null 表示不画线）。 */
export const saveTrendThreshold = (
  metric: string,
  value: number | null,
): Promise<{ ok: boolean; error?: string; thresholds?: Record<string, number | null> }> =>
  postJson<{ ok: boolean; error?: string; thresholds?: Record<string, number | null> }>(
    '/trend/thresholds', { metric, value })

/** 自愈记录：最近 20 次自动恢复尝试。 */
export const loadAutoRecover = (): Promise<AutoRecoverStatus> => jget<AutoRecoverStatus>('/auto-recover')

/** 从备份快照恢复（停服 → 安全备份 → 覆盖 → 恢复运行）。 */
export const restoreBackup = (name: string): Promise<RestoreResult> =>
  postJson<RestoreResult>('/actions/restore', { name })

/** 失败边明细：KPI 点开时读一次实时清单。 */
export const loadFailedEdges = (): Promise<FailedEdgesListing> =>
  jget<FailedEdgesListing>('/quality/failed-edges?limit=80')

/** 索引与嵌入状态：只读覆盖与新鲜度。 */
export const loadIndexHealth = (): Promise<IndexHealth> => jget<IndexHealth>('/index/health')

/** 把一条失败边加入忽略名单（不删边，只从待消解清单隐藏）。 */
export const ignoreFailedEdge = (source: string, target: string): Promise<{ ok: boolean; ignored: number }> =>
  postJson<{ ok: boolean; ignored: number }>('/quality/failed-edges/ignore', { source, target })

/** 补嵌/重建任务状态。 */
export const loadEmbedStatus = (): Promise<EmbedJobStatus> => jget<EmbedJobStatus>('/embed/status')

/** 启动补嵌/重建任务（vec:fill / vec:rebuild / chunk:fill / chunk:rebuild）。 */
export const startEmbed = (mode: string): Promise<{ ok: boolean; error?: string; status?: EmbedJobStatus }> =>
  postJson<{ ok: boolean; error?: string; status?: EmbedJobStatus }>('/embed/start', { mode })

/** 请求取消当前任务（当前笔记处理完即停）。 */
export const cancelEmbed = (): Promise<{ ok: boolean; status?: EmbedJobStatus }> =>
  postJson<{ ok: boolean; status?: EmbedJobStatus }>('/embed/cancel', {})

/** 诊断包下载地址（zip：状态 + 单元 + 趋势 + 各单元日志尾部）。 */
export const DIAGNOSTICS_URL = `${API}/diagnostics/bundle`

/** 已落盘诊断包的下载地址（自愈记录里点路径即下载）。 */
export const diagnosticsFileUrl = (name: string): string =>
  `${API}/diagnostics/file?name=${encodeURIComponent(name)}`

/** 指标趋势：一次取满一年，对话框里再按 7/30/90/365 天切窗口。 */
export const loadHistory = (): Promise<HistoryListing> => jget<HistoryListing>('/status/history?days=365')

/** 缓存对话框的回调同样模块级（引用稳定）。 */
export const loadCaches = (): Promise<CacheListing> => jget<CacheListing>('/actions/caches')
export const pruneCaches = (ids: string[]): Promise<CachePruneResult> =>
  postJson<CachePruneResult>('/actions/caches/prune', { ids })

export type { BatchRestartResult, BatchStartResult, BatchStopResult }

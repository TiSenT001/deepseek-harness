/**
 * brain_manager 的数据类型：`/units` 的受管单元与 `/status` 的概览。
 *
 * 字段名保持与管理器 JSON 一致（snake_case），不在前端改写，避免两处维护。
 */

/** 一个受管单元（服务 / 守护进程 / 插件）在某一时刻的状态快照。 */
export interface Unit {
  /** 单元名，同时是启停接口的路径参数 */
  name: string
  /** 分组标题，直接用于面板分段 */
  group: string
  /** 一句话说明 */
  desc: string
  /** 相对 brain 根目录的入口脚本 */
  script: string
  /** 监听端口；无端口的单元为 null */
  port: number | null
  /** 持久意愿：管理器下次启动时是否恢复该单元 */
  enabled: boolean
  /** 进程是否在跑 */
  running: boolean
  /** 进程是否响应健康探测 */
  healthy: boolean
  /** 管理器给出的状态文本：运行中 / 已停止 / 异常 */
  state: string
  /** 进程在跑但健康探测失败时的原因（「连接被拒绝」「探测超时」等）；健康时为 null */
  health_error?: string | null
  /** 管理器子进程意外退出时的退出码；在跑或人工停止时为 null */
  last_exit_code?: number | null
  /** 崩溃后被自动恢复的次数（来自 /auto-recover 计数） */
  auto_restarts?: number
  /** 启动顺序依赖的单元名（先启依赖） */
  depends?: string[]
  /** 启动参数（展示用） */
  args?: string[]
  /** 启动时间文本，形如 `2026-11-07 17:00:30`；未运行为 null */
  started_at: string | null
  /** 进程号；部分状态不回报 */
  pid?: number
  /** 父进程号 */
  ppid?: number | null
  /** 是否 brain_manager 的直接子进程（退出时由管理器的 atexit 回收） */
  child_of_manager?: boolean
}

/** `/status` 概览：只读观察值。 */
export interface Overview {
  db_size_mb: number | null
  edges: number | null
  notes: number | null
  sessions: number | null
  failure_edges: number | null
  last_backup: { at: string | null; size_mb: number | null }
}

/** `/actions/backups` 里的一个快照。 */
export interface BackupFile {
  /** 备份文件名，形如 `brain_backup_20261107_1701.db` */
  name: string
  /** 体积（MB，保留一位小数） */
  size_mb: number
  /** 生成时刻文本，形如 `2026-11-07 17:01` */
  at: string
}

/** `/actions/backups`：全部快照（列表已按时间倒序）。 */
export interface BackupListing {
  files: BackupFile[]
  /** 全部快照体积累计（MB） */
  total_mb: number
}

/** `/actions/restore` 的结果。 */
export interface RestoreResult {
  ok: boolean
  error?: string
  restored?: string
  safety?: string
  started?: string[]
  failed?: string[]
}

/** `/actions/prune-backups` 的结果。 */
export interface PruneResult {
  ok: boolean
  /** 实际删掉的文件名 */
  removed: string[]
  /** 释放的空间（MB） */
  freed_mb: number
  /** 保留下来的文件名 */
  kept: string[]
  /** 失败原因（ok=false 时才有） */
  error?: string
}

/** 缓存条目的风险等级。 */
export type CacheRisk = 'safe' | 'confirm' | 'protected'

/** `/actions/caches` 里的一条缓存。 */
export interface CacheItem {
  id: string
  label: string
  risk: CacheRisk
  /** 一句话说明：删了会怎样 */
  note: string
  size_mb: number
  /** 命中多少个目录/文件 */
  count: number
  /** 当前是否真的存在 */
  available: boolean
  /** 默认是否勾选 */
  default_on: boolean
  /** 受保护：展示但不可选 */
  protected: boolean
}

/** `/actions/caches`：缓存登记表。 */
export interface CacheListing {
  items: CacheItem[]
  total_mb: number
  reclaimable_mb: number
  cache_dir: string
  /** 管理器侧取不到缓存位置时的说明（正常为 null） */
  error?: string | null
}

/** `/actions/caches/prune` 的单项结果。 */
export interface CachePruneItem {
  id: string
  label: string
  freed_mb: number
  removed: number
  failed: string[]
}

/** `/actions/caches/prune` 的结果。 */
export interface CachePruneResult {
  ok: boolean
  freed_mb: number
  items: CachePruneItem[]
  error?: string
}

/** `/quality/failed-edges` 里的一条失败边（failure_count > 0）。 */
export interface FailedEdge {
  /** 源笔记 id，形如 `note:目录/文件.md` */
  source: string
  /** 目标笔记 id */
  target: string
  weight: number
  confidence: number
  /** 被记失败（检索命中后未使用）的次数 */
  failures: number
  successes: number
  last_seen: string | null
  origin: string | null
}

/** `/quality/failed-edges` 的结果：实时总数 + 按失败次数排序的前 N 条。 */
export interface FailedEdgesListing {
  total: number | null
  edges: FailedEdge[]
  /** 已被「忽略」的失败边条数（不在 edges 里）。 */
  ignored_total?: number
}

/** `/index/health`：索引与嵌入覆盖。 */
export interface IndexHealth {
  notes: number | null
  vec: {
    total: number | null
    fresh_24h: number | null
    missing: number | null
    missing_sample: string[]
    /** 0 字节空笔记数（不需要向量，单列以避免误判为缺漏）。 */
    empty?: number | null
    empty_sample?: string[]
    orphans: number | null
    last_indexed_at: string | null
  }
  chunks: {
    notes: number | null
    rows: number | null
    /** 有内容但还没分块的笔记数。 */
    missing?: number | null
    missing_sample?: string[]
    /** 0 字节空笔记数。 */
    empty?: number | null
    last_indexed_at: string | null
    stale_days: number | null
  }
  pending: number | null
  db_size_mb: number | null
  /** 按领域（domain 空则顶层目录）的向量覆盖 */
  by_domain?: {
    name: string
    total: number
    covered: number
    missing: number
  }[]
}

/** `/embed/status`：补嵌/重建任务的实时进度。 */
export interface EmbedJobStatus {
  state: 'idle' | 'running' | 'done' | 'cancelled' | 'error'
  mode: string | null
  label: string | null
  total: number
  done: number
  failed: number
  current: string | null
  started_at: string | null
  finished_at: string | null
  eta_s: number | null
  elapsed_s?: number | null
  error: string | null
  failures: { path: string; reason: string }[]
}

/** `/status/history` 里的一个采样点；老快照没有的字段为 null。 */
export interface MetricPoint {
  /** 采样时间，形如 `2026-11-07T23:18:28.510295` 或 `2026-11-07 01:42:42` */
  ts: string
  edges: number | null
  notes: number | null
  sessions: number | null
  db_size_mb: number | null
  failure_edges: number | null
}

/** `/status/history` 的结果：窗口天数 + 升序采样点。 */
export interface HistoryListing {
  days: number
  points: MetricPoint[]
}

/** 可下发的单元动作。 */
export type UnitAction = 'start' | 'stop' | 'restart'

/** `/units/start-batch` 的结果：管理器侧批量启动，一次返回成败两队。 */
export interface BatchStartResult {
  ok: boolean
  group: string
  started: string[]
  failed: { name: string; error: string }[]
}

/** `/units/stop-batch` 的结果：管理器侧批量停止。 */
export interface BatchStopResult {
  ok: boolean
  group: string
  stopped: string[]
  failed: { name: string; error: string }[]
}

/** `/units/restart-batch` 的结果：管理器侧批量重启。 */
export interface BatchRestartResult {
  ok: boolean
  group: string
  restarted: string[]
  failed: { name: string; error: string }[]
}

# dsh-brain-console

**TiSenT Brain** 控制台：在 DSH 侧边栏里查看 / 启停大脑的各项服务与内部插件。

> 名称统一：侧栏入口、页面标题、图标 aria-label 都叫 **TiSenT Brain**；插件包名与面板 id 仍是 `dsh-brain-console`。

> 状态：**面板已实现**（分组服务卡 + 概览指标 + 底部日志控制台，明暗主题跟随宿主）

## 为什么是「控制台」而不是「守护」

2026-11-07 之前，大脑靠三层自动机制维持（HKCU Run → brain_guard → watchdog → body_daemon），
后果是：服务被重复拉起（曾堆到 14 个 translate_server 吃满 GPU）、人工停掉的会被 60 秒后拉回。
用户要求改成**人工控制**：开了就是开，关了就是关，崩了标红等人处理。

## 数据来源：`brain_manager`（:19998）

执行器是独立的 Python 进程，与 DSH 解耦（关掉 DSH，MCP 仍可给 Claude Code 用）。
本插件只做 UI：轮询 + 按钮。

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/units` | 单元列表（状态/端口/pid/ppid/脚本/启动参数/依赖/是否直属子进程；异常时带 `health_error`，崩溃时带 `last_exit_code`） |
| GET | `/health` | 管理器自身健康 |
| POST | `/units/<name>/start` | 启动（先启依赖） |
| POST | `/units/<name>/stop` | 停止（写抑制清单，旧守护不得拉起） |
| POST | `/units/<name>/restart` | 重启 |
| POST | `/units/<name>/adopt` | 接管：重启为 manager 的直接子进程 |
| POST | `/units/<name>/enabled` | 只改持久意愿（下次启动是否恢复），不立即起停 |
| POST | `/units/start-batch` | 管理器侧批量启动：body `{group}`，顺序拉起该组已停止单元，返回 `started` / `failed` 两队 |
| POST | `/units/stop-batch` | 管理器侧批量停止：body `{group}`，顺序停止该组在跑单元（写抑制清单），返回 `stopped` / `failed` |
| POST | `/units/restart-batch` | 管理器侧批量重启：body `{group}`，只重启在跑的单元，返回 `restarted` / `failed` |
| POST | `/units/<name>/truncate-log` | 清空该单元日志文件（不可恢复；在跑的服务从空文件继续写） |
| GET | `/actions/backups` | 备份快照列表（按时间倒序，含体积与总占用） |
| POST | `/actions/prune-backups` | 只保留最近 `keep` 个快照（`keep` 下限 1） |
| GET | `/actions/caches` | 大脑缓存登记表（各条目体积 + 风险等级） |
| POST | `/actions/caches/prune` | 按 id 清理缓存（受保护条目会被跳过） |
| GET | `/quality/failed-edges` | 实时列出 `failure_count > 0` 的边（`?limit=N`，上限 200） |
| GET | `/status/history` | 指标采样序列（`?days=N`，1–365，默认 30）：`edges` / `notes` / `sessions` / `db_size_mb` / `failure_edges` |

CORS：仅放行 `http://127.0.0.1:*` / `http://localhost:*`。

**并发模型**：HTTP 服务是线程池（`ThreadingHTTPServer`）——读请求（`/units`、`/status`、
`/quality/*`）并发处理，写请求（启停、批量、备份、清理、设置）由一把全局写锁串行化。
所以备份/批量启动这类慢操作不会再堵住面板的轮询（实测备份 3.5s 期间 `/units` 轮询
14 次、最长 330ms，全部成功）。

**写操作鉴权**：所有 POST 只接受本机来源——带 `Origin` 的请求必须是 `http://127.0.0.1*` /
`http://localhost*`，否则回 403；没有 `Origin` 的请求（curl / 宿主进程）放行。
（浏览器「简单请求」可以绕过 CORS 预检直接打本机端口，所以必须服务端自己校验，不能只靠响应头。）

## 受管单元（12）

| 组 | 单元 |
|---|---|
| 核心服务 | brain_server(:19995) · mcp_server(:19996) · embed_server(:19997) · translate_server(:19994) |
| 守护进程 | body_daemon · vault_watch · workspace_watch |
| 插件 | c4d_mcp · c4d_push · ue_mcp · ue_viewer · translator_api |

**子进程语义**：服务一律是 `brain_manager` 的直接子进程（`ppid == manager pid`），
manager 退出时按 `atexit` 回收。`body_daemon` 在被接管时（环境变量
`BRAIN_SUPERVISED_BY=brain_manager`）**只跑 cron，不再起停服务**。

## 图标

`src/icon.tsx` → `BrainConsoleIcon`：**Lucide `waypoints`**（ISC，官方路径，非自绘）——四个节点由连接线串起来，
是「神经链接 / 服务接线」的语义。与 Windows 启动器 exe 内嵌的 `brain.ico` 是同一份图形（透明底），
面板和任务管理器视觉一致。

```tsx
icon: (size: number) => <BrainConsoleIcon size={size} />
```

## 面板布局

```
标题行   TiSenT Brain · 运行计数（点：填充=全部运行，绿圈=开机自启）· 最后刷新 · [刷新图标] [更多 ⋯]
         ⋯ 菜单：立即备份 / 清理备份… / 清理缓存…（都打开对话框）/ 开机启动（勾选态 = 已开启）
指标带   数据库 / 知识边 / 笔记 / 记忆 / 失败边 / 上次备份；前五项带 30 天迷你趋势线，
         点开趋势对话框可切 7 / 30 / 90 / 365 天窗口，滚轮缩放、拖拽平移、双击重置，
         悬停读单点数值
分组     核心服务 · 守护进程 · 插件 —— 每组一组卡片；组名后按状态出现「全部启动 / 全部重启 / 全部停止」
卡片操作 图标按钮：列表=日志、刷新=重启、方块=停止、三角=启动（悬停出文字提示）
         单元 ⋯ 菜单：随管理器启动（勾选=下次管理器启动时恢复）/ 接管为子进程（仅外部进程）
         正在看谁的日志，那张卡片的日志图标就是按下态（aria-pressed）
日志     点卡片日志图标在底部展开常驻控制台；打开期间 4 秒静默刷新，停在底部自动跟随，向上翻看不打断
         头部可按关键词过滤（本地匹配，Esc 清空，右边显示「命中 / 总数」），一键复制当前可见内容，
         可暂停自动刷新（暂停时图标变播放），点「120 行」循环 120 / 300 / 1000 行，清空日志需先确认
```

- 头部只留刷新图标与「更多」菜单：备份、清理、开机启动都收进菜单，不再并排堆四个文字按钮
- 运行计数那个点是双色状态：填充色 = 是否全部运行，外圈绿环 = 开机自启已开启；悬停胶囊看自启说明
- 分组表头的「全部启动」只启动该组里已停止的单元，逐个下发，失败的会在顶部提示里列出来
- 「全部停止」先弹确认框列出将被停止的单元；停止会写抑制清单并把持久意愿置为 False，
  这些单元不会随管理器启动恢复，需要手动再启动
- 「全部重启」同样先确认，只重启该组里在跑的单元；已停止的不动
- 两个批量动作都优先走管理器侧批量接口；管理器还是旧代码（404）时自动退回逐个下发
- 不再单独显示「自启」文字片，跑数由胶囊文字表达，点只承担自启状态
- 单元 ⋯ 菜单收纳两个低频动作：「随管理器启动」只改持久意愿（`/units/<name>/enabled`，不立即起停）；
  「接管为子进程」只在该单元不是管理器子进程时出现（`/units/<name>/adopt`，会重启它一次）
- 指标带的「失败边」是唯一可点开的指标：打开只读明细（源/目标笔记、失败次数、来源、权重、最后出现时间）；
  指标带里的数字来自最近的 `metrics_snapshots`（每 6 小时一行），明细里是实时数，两者可能差几条
- 趋势采样：`metrics_snapshots` 每 6 小时写一行（2026-11-07 起新增 `edges` / `notes` / `sessions` / `db_size_mb` 四列，
  老库由 `_ensure_columns()` 自动补列），所以折线要攒几天才有形状；点数不足时对话框明说「数据不足」
- 「失败边明细」入口移到了趋势对话框里（先看趋势，再点「查看失败边明细」）
- 状态灯：运行中绿 / 已停止灰 / 异常红（不自动重启，等人工处理）
- 依赖提示：卡片元信息显示 `依赖 brain_server` / `被 mcp_server 依赖`（来自管理器 registry 的 `depends`）
- 卡片 ⋯ 菜单：查看详情（脚本 / 启动参数 / PID / 父进程 / 托管方式 / 运行时长 / 健康 / 退出码 / 依赖）、
  随管理器启动、接管为子进程
- 快捷键：`r` 立即刷新、`/` 聚焦日志过滤框、`Esc` 收起日志面板（对话框开着时 Esc 只关对话框）
- 卡片元信息：运行中显示运行时长、pid、是否外部进程；已停止显示是否随管理器启动
- 异常时直接给出探测原因（`连接被拒绝` / `探测超时` / `HTTP 500` / `健康接口返回非 JSON`）；
  意外退出（管理器子进程崩溃）会显示 `退出码 N`，与人工停止区分开
- 每次操作后重新拉 `/units`，不自行推断状态
- 样式只用 DSH 主题令牌，明暗主题和「内容字号」设置同时生效；按钮、菜单、状态灯、图标与
  悬停提示全部复用宿主 `@deepseek-ai/dsh-client-ui-primitives`，不另造一套控件

## 备份清理：先列出、再确认

「清理备份」不是一键删除，打开对话框先做三件事：

1. 拉 `/actions/backups`，每条快照标成**保留**或**将删除**（默认保留最近 2 个）；
2. 保留数用 −/+ 调，**下限 1**——永远留一个回滚点（管理器侧也会再夹一次）；
3. 只有点「删除 N 个 · 释放 X」才调 `/actions/prune-backups`，删完重新列一遍并显示释放空间。

删除由 `brain_manager` 执行（它是唯一执行器），前端只下发 `keep`。

## 缓存清理：只清大脑自己的

缓存原本散在 `.brain` 各处（`__pycache__`、`.ruff_cache`、`tmp`、`data/graph_cache.json`…）。
2026-11-07 起统一到 `path_config.CACHE_DIR`（`<vault>/.brain/cache/`）：

```
.brain/cache/
  pycache/   ← PYTHONPYCACHEPREFIX（字节码）
  ruff/      ← RUFF_CACHE_DIR
  tmp/ graph/ web/   ← 大脑自己的临时/图谱/联网缓存
```

- 统一靠环境变量：`brain_manager` 给所有子进程注入 `PYTHONPYCACHEPREFIX` / `RUFF_CACHE_DIR`
- 外部工具的缓存（HF 下载、Codex 运行时、DSH 临时目录）**不归大脑管**，不在清理范围
- 面板按登记表列出：`safe` 默认勾选、`confirm`（可疑孤儿/大件）需手点、
  `protected`（图像向量库、旧向量库）展示但不可选
- 清理仍走「先列后确认」，删完重新统计并显示释放量

## 冒烟测试

`tests/smoke.mjs`：只读验证面板能加载、卡片/KPI 渲染、⋯ 菜单齐全、备份与缓存对话框能列出条目，
以及失败边明细（两跳入口：KPI → 趋势 → 明细）、趋势对话框、单元 ⋯ 菜单。共 11 项。
所有会改数据的端点（`/actions/backup`、`/actions/prune-backups`、`/actions/caches/prune`）
在测试里都拦截成假应答——跑一百遍也不会删任何东西。

```bash
npm run verify          # 类型检查 + 冒烟（提交前跑这个）
npm run smoke           # 只跑冒烟
```

面板地址自动发现：dsh web 每次重启 token 都会变，但它把完整地址写在
`<DSH_HOME>/dsh_web_token.txt`（优先 `DSH_HOME`，其次宿主仓库 `.dsh-home`，最后 `~/.dsh`）。
也可以用 `DSH_PANEL_URL` 或 `--url` 显式指定：

```bash
DSH_PANEL_URL='http://127.0.0.1:3080/?token=xxx' npm run smoke
node tests/smoke.mjs --url 'http://...' --shot smoke.png   # 可选截图
```

Playwright 从宿主仓库解析（`apps/web` 的依赖），插件自己不带 `node_modules`；
宿主路径可用 `DSH_REPO` 覆盖。全部通过退出码 0，任一项失败退出码 1。

## CI

`.github/workflows/brain-console.yml`（仓库根）：只在 `plugins/dsh-brain-console/**` 变更时触发，
单独安装 typescript/tsdown/类型包（不装整个 monorepo，约 1 分钟），跑 `typecheck` + `build`。

冒烟测试不在 CI 里跑——它需要真实运行的 dsh web + brain_manager。冒烟属于本地门禁：
提交前 `npm run verify`。

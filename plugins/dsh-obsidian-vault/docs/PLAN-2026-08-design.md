# dsh-obsidian-vault：以插件形式复刻 Obsidian 的落地方案

> 目标：在 DSH 内提供一个"标准 Obsidian"级别的笔记工作区，**完全不改 DSH 与 dsh-better-sidebar 的源码**，以独立 Cordis 插件加载，模块化、可维护、可升级。

---

## 0. 先回答三个前提问题

**Q1：能不能完全不改源码？**
能。DSH 的客户端插件模型已经提供了两样东西：
- 一个**全局面板页**的承载位：注册 `main`（keyed，key = 你的面板 id）+ `sidebar.panellist`（左侧栏图标），点图标即可在主栏打开整页 —— 与"插件 / 定时任务"面板同一机制（见 `packages/client/ui-plugin-manager/src/client/index.ts:104-150`，`packages/client/ui-layout/src/client/index.ts:73`）。
- 一套**共享运行时**：`PLATFORM_MODULES`（`packages/client/web/src/platform.ts`）把 `react`、`@deepseek-ai/dsh-client-ui-primitives`（MarkdownText / Button / Menu 等）、`dsh-client-ui-slots`、`zod` 作为冻结模块表注入，动态插件可直接 `require`，**不必打包、不会重复 React**。

**Q2：和 better-sidebar 什么关系？**
它可以完全不参与（核心功能自洽）；只在"编辑这篇笔记"时调用一次 `ctx.get('betterSidebar')?.openFile(scope, path)` 把文件交给它的 CodeMirror 编辑器。**不 fork、不 patch、不覆盖它的 `.md` viewer**（那个 viewer 就是可编辑编辑器本体，见 `plugins/dsh-better-sidebar-src/src/client/builtins/viewers.tsx:56-64`）。

**Q3：已知唯一的差距是什么？**
Obsidian 的 **Live Preview（编辑时行内渲染链接）** 需要往它的 CodeMirror 里注入扩展，而 `ctx.betterSidebar` 没有开放编辑器扩展点（`service.d.ts` 只有 `registerTab` / `registerFileViewer`）。本方案 v1 用**阅读视图**达到"标准 Obsidian"，编辑交给已有编辑器；Live Preview 列为可选 P5（代价是自带 CM6，属于明确取舍，默认不做）。

---

## 1. 交付形态

- 包名：`dsh-obsidian-vault`（本地开发用 `link:` 挂进 profile，稳定后再发布）。
- 宿主：一份 Host 半（索引 + HTTP 路由），一份 Client 半（tsdown 打成 `lib/client.js`，CJS + `window.__ModuleLoader__.load({ id, factory })`，参照 `vision-browser/visb-plugin/tsdown.config.ts:28-34`）。
- 安装：`cordis.patch.yml` 插入一行 + `dsh.client` 声明；用 `plugin_manager install_bundle` 装进当前 profile。
- 不改任何现有包：`git status` 在 DSH 与 better-sidebar 上必须保持干净（作为验收项）。

---

## 2. 架构

```
┌──────────────────────── Host (Node) ────────────────────────┐
│  src/index.ts           插件入口：Config、服务、路由挂载        │
│  src/vault/scanner.ts   遍历 vault（md + 附件，忽略 .obsidian） │
│  src/vault/parser.ts    frontmatter / 链接 / 标签 / 标题行号    │
│  src/vault/resolver.ts  链接解析规则（Obsidian 语义，纯函数）     │
│  src/vault/store.ts     内存索引 + mtime/size 失效 + watch 增量 │
│  src/routes.ts          /obsidian/api/*（薄，仅编排）           │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP (JSON) + 静态断言
┌──────────────┴──────────────── Client (Browser) ─────────────┐
│  src/client/index.ts    apply：注册 main 页 + 左侧栏图标       │
│  src/client/vault/      数据层：fetch 客户端、DTO、缓存         │
│  src/client/ui/         Explorer / NoteView / 侧栏三件套        │
│  src/client/markdown/   Obsidian 语法预处理 + 渲染接线          │
│  src/protocol.ts        两端共享的纯类型（type-only import）    │
└──────────────────────────────────────────────────────────────┘
```

**数据流**：页面打开 → `GET /obsidian/api/tree` 拿目录 → 点开笔记 `GET /obsidian/api/note?path=` 拿 `{ content, frontmatter, links, headings }`，其中 `links` 已由 Host 解析好状态（resolved / unresolved / ambiguous + 目标路径）→ 客户端把 `[[..]]` 改写成占位链接 → 交给 `MarkdownText` 渲染 → 点击走 `MarkdownDelegate` 回调 → 页内导航（不刷新）。

**为什么解析放 Host**：链接解析依赖全库索引（最短路径消歧、别名、未解析判定），客户端不应持有全库；同时这套索引天然可复用给未来的 Agent 工具（"找出这些笔记的引用关系"）。

---

## 3. 模块清单与"禁止重复"清单

| 模块 | 归属 | 说明 |
|---|---|---|
| `vault/parser.ts` | Host + 共享 | 解析 `[[Target\|alias]]`、`![[embed]]`、`#tag`、`#heading`、`^block`、frontmatter。**唯一实现**，Host 索引与 Client 预处理都调它 |
| `vault/resolver.ts` | Host | 纯函数：`(raw, index) => { status, path, anchor }` |
| `vault/store.ts` | Host | 单一索引句柄（挂在插件 fiber 上，模块级单例禁止） |
| `client/vault/api.ts` | Client | 唯一 fetch 层，含错误归一化 |
| `client/markdown/rewrite.ts` | Client | 把 `[[..]]` 改写成标准 Markdown 链接（纯函数，可单测） |
| `client/ui/*` | Client | 纯展示组件，数据靠 props |

**明确复用（不自己写）**：
- Markdown 渲染 → `@deepseek-ai/dsh-client-ui-primitives` 的 `MarkdownText` + `MarkdownDelegateProvider`（GFM、脚注、代码高亮、表格全都有）。
- 控件/图标 → ui-primitives（Button / Menu / Icon）。
- 编辑器 → better-sidebar 的 CodeMirror（可选适配）。
- 文件系统 → Host `ctx.fs`（`resolve/stat/readText/listDir/watch`），不直接 `node:fs`。
- 路由准入 → `ctx.connection.requestRejection(req)`，与 better-sidebar 一致，不自建信任模型。

**明确不写**：自己的编辑器、自己的文件树组件库、自己的 GFM 渲染器、自己的一套 HTTP 框架。

---

## 4. 关键设计

### 4.1 Obsidian 语法 → 标准 Markdown 的改写（客户端）

```
[[笔记]]            → [笔记](<resolved/relative/path.md>)         -> openFile 回调
[[笔记|别名]]        → [别名](<path>)                              -> openFile
[[笔记#标题]]        → [笔记 > 标题](<path#heading>)
[[#本地标题]]        → [#标题](<#heading>)（页内滚动）
![[图片.png]]       → ![](<path>)                                  -> pathImages 解析成 /obsidian/asset?path=
![[笔记]]           → 递归内联内容（深度 ≤ 2，带循环检测）
[[不存在的笔记]]      → [不存在的笔记](https://obsidian.invalid/new?t=...)  -> openExternalLink 回调 = 新建
```

- 用 `https://obsidian.invalid/...` 作为"未解析/新建"的哨兵 URL：`MarkdownAnchor` 只对绝对 HTTP(S) 调用 `openExternalLink`，因此可拦截；未解析样式由 `a[href*="obsidian.invalid"]` 的 CSS 表达（虚线 + 弱色），不依赖 DOM 后处理。
- 代码块 / 行内代码内的 `[[..]]` 不解析（预处理按 fenced/inline code 区间跳过，必须有单测）。

### 4.2 链接解析规则（与 Obsidian 对齐）

1. 去 `|alias`、去 `#anchor`、去 `^block`、去扩展名 `.md`；
2. 精确路径（大小写不敏感）命中 → resolved；
3. 否则按 basename 匹配全部同名笔记 → 取路径层级最少者（Obsidian 的"最短路径"）；并列 → `ambiguous`（UI 提示并提供选择）；
4. frontmatter `aliases` / `alias` 也参与匹配（优先级低于 basename）；
5. 都不中 → `unresolved`；
6. `#heading` 在打开后按标题文本定位（复用现有 heading 索引），找不到 → 顶部 + 提示。

### 4.3 索引与增量

- 启动全量扫描：1088 篇 / 7.6 MB（实测），预期 < 150ms；只缓存「路径、标题、别名、frontmatter、标签、标题列表、出链（含行号）」——**不缓存全文**，正文按需读。
- 失效：`mtime + size` 比对；`ctx.fs.watch` 监听 vault 根与子目录，事件合并（200ms 去抖）后只重解析变化的文件。
- 上限：目录深度、单文件大小（> 2 MB 只索引不渲染）、条目总数（> 50k 拒绝并报错），全部按 Config 可调，无硬编码。

### 4.4 HTTP 接口（前缀 `/obsidian/api`）

| 方法 | 路径 | 返回 |
|---|---|---|
| GET | `/tree` | 目录树（md + 附件，已排序、已过滤） |
| GET | `/note?path=` | `{ content, frontmatter, tags, headings, links[] }` |
| GET | `/links?path=` | 出链（含解析状态） |
| GET | `/backlinks?path=` | 反链（来源 + 行号 + 上下文行） |
| GET | `/unlinked?path=` | 未链接提及（正则在正文找标题/别名，排除已有链接） |
| GET | `/search?q=` | 标题/别名/标签/正文 混合检索（分级排序） |
| GET | `/graph?depth=` | 节点/边，支持局部图（以当前笔记为中心） |
| GET | `/asset?path=` | 二进制（图片/PDF 等，做路径包含校验 + 准入） |
| GET | `/status` | 索引版本号、笔记数、最后刷新时间（客户端据此判断是否需要重取） |

所有响应带 `indexVersion`，客户端按版本缓存，避免轮询抖动。

---

## 5. 验收标准（"标准 Obsidian"清单）

> 每条都要能在测试或手工验收里判真假；P 列 = 目标阶段。

### A. Vault 与导航
| # | 验收项 | P |
|---|---|---|
| A1 | 自动识别 vault（含 `.obsidian/` 的目录），可用 Config 指定；两者都没有时给出明确空状态 | P0 |
| A2 | 左侧栏出现「Obsidian / 知识库」图标，点击在主栏打开整页 | P0 |
| A3 | Explorer 列出全部 `.md` 与附件，忽略 `.obsidian`、`.trash`、点文件；目录可折叠 | P1 |
| A4 | 点击笔记进入阅读视图；面包屑显示 `目录 / 笔记` | P1 |
| A5 | 前进/后退历史（`Alt+←/→`），刷新后保留 | P1 |
| A6 | 快速切换 `Ctrl+O`：按标题/别名模糊匹配，回车打开，`Esc` 关闭 | P3 |

### B. 链接语义
| # | 验收项 | P |
|---|---|---|
| B1 | `[[笔记]]` / `[[笔记\|别名]]` 渲染为可点链接并跳转 | P1 |
| B2 | `[[笔记#标题]]` 跳转并滚动到该标题；找不到时给提示 | P1 |
| B3 | `[[不存在的笔记]]` 显示为未解析样式，点击**创建**该笔记并打开 | P1 |
| B4 | 同名笔记按最短路径解析；真歧义时提示而不是乱跳 | P1 |
| B5 | 别名（frontmatter `aliases`）可被链接命中 | P1 |
| B6 | `![[图片]]` 内联显示（走 `/asset`，跨目录相对路径正确） | P2 |
| B7 | `![[笔记]]` 转写（transclusion），支持 `![[笔记#段落]]`，循环引用不死循环 | P2 |
| B8 | 代码块内的 `[[..]]` 保持原样 | P1 |

### C. 反链与图
| # | 验收项 | P |
|---|---|---|
| C1 | 反链面板：来源笔记 + 行号 + 上下文行，点击跳转 | P2 |
| C2 | 出链面板：本文所有链接及解析状态 | P2 |
| C3 | 未链接提及（正文出现标题但未加链接）可开关显示 | P2 |
| C4 | 局部图（深度 1–2）以当前笔记为中心；点击节点打开 | P3 |
| C5 | 全库图（可开关，节点 > 2000 时降级为局部图并提示） | P3 |

### D. 元数据
| # | 验收项 | P |
|---|---|---|
| D1 | frontmatter 渲染为属性区（字符串 / 数字 / 布尔 / 列表 / 日期），不显示原始 YAML | P2 |
| D2 | 属性里的 `[[链接]]` 与 `#标签` 可点 | P2 |
| D3 | 标签面板：行内 `#tag` + frontmatter tags，支持 `a/b` 嵌套；点击过滤 Explorer | P2 |
| D4 | 大纲（标题树），点击滚动 | P2 |

### E. 编辑（委托，不重复实现）
| # | 验收项 | P |
|---|---|---|
| E1 | 阅读视图右上「编辑」→ `ctx.get('betterSidebar')?.openFile(scope, path)` 打开其编辑器；未安装时不显示按钮 | P2 |
| E2 | 保存后回到阅读视图能读到新内容（索引按 mtime 失效） | P2 |
| E3 | 明确不实现行内 Live Preview（README 与设置页写明） | — |

### F. 工程质量
| # | 验收项 |
|---|---|
| F1 | DSH 与 better-sidebar 的 `git status` 全程干净（不改源码） |
| F2 | 卸载插件后：页面消失、无残留请求、无 console 报错 |
| F3 | better-sidebar 未安装 / 版本不匹配时：核心功能照常，"编辑"按钮隐藏并给出原因 |
| F4 | 解析器、改写器、解析规则 100% 单测覆盖（纯函数，含歧义/循环/代码块用例） |
| F5 | 中文/英文文案齐备；无硬编码颜色（只用 `--dsw-*` 令牌） |
| F6 | 1088 篇笔记全量索引 < 500ms；打开笔记到首屏 < 200ms（本地实测记录在 README） |

---

## 6. 实施阶段

| 阶段 | 交付物 | 验收 | 估时 |
|---|---|---|---|
| **P0 骨架** | 包结构、tsdown（host+client）、`cordis.patch.yml`、空页面 + 左侧栏图标、Config（vault 路径） | A1、A2、F1、F2 | 0.5–1 天 |
| **P1 索引与阅读** | scanner/parser/resolver/store、`/tree` `/note` `/status`、Explorer、阅读视图、`[[..]]` 改写与点击、未解析创建、历史 | A3–A5、B1–B5、B8 | 2–2.5 天 |
| **P2 链接生态** | `/backlinks` `/unlinked`、反链/出链面板、标签、属性、大纲、附件与转写、`/asset`、E1/E2 | B6、B7、C1–C3、D1–D4、E1–E2 | 2 天 |
| **P3 检索与图** | `/search` `/graph`、快速切换、内容搜索、局部/全局图 | A6、C4、C5 | 1.5–2 天 |
| **P4 打磨** | 空状态/错误态、键盘操作、性能、文档、e2e 冒烟 | F3–F6 | 1–1.5 天 |

合计约 **7–8 个工作日**（单人，含测试）。

---

## 7. 测试与质量门

- **单测**（vitest，仓库外跑，不依赖浏览器）：parser（各类边界）、resolver（同名/歧义/别名/大小写/无扩展名）、rewrite（代码块跳过、转义）、store 增量失效。
- **Host 集成**：临时目录造 20 篇互链笔记 → 启动插件 → 断言 `/tree`、`/note`、`/backlinks` 返回；`fs.watch` 改文件后 `indexVersion` 变化。
- **UI 冒烟**：Playwright 打开 `dsh web`，左侧栏点图标 → 页面出现 → 点笔记 → 点 `[[链接]]` → URL 不变、内容切换。
- **每次改动的门**：`tsc --noEmit` + `vitest run` + 构建产物冒烟；发版前跑一次真实 profile 安装/卸载。

---

## 8. 可持续维护

- **版本契约**：`peerDependencies` 钉 `dsh-better-sidebar: >=0.28.0 <0.29.0`（服务 API 未稳定），DSH 钉 `^0.2.1-rc.1`；升级前跑一次能力探针。
- **能力探针**（`src/client/better-sidebar-adapter.ts` 单点）：`ctx.get('betterSidebar')` 存在且含 `openFile` 才启用"编辑"；缺失时降级为"复制路径"。**所有对 better-sidebar 的接触只在这一个文件**。
- **升级路径**：索引与 UI 不依赖 DSH 内部实现，仅依赖 `slots` / `layout` / `locale` / `MarkdownText` 四个稳定面；任一变化只改 adapter 与渲染接线。
- **可复用资产**：Host 索引未来可暴露成 `ctx.obsidianVault` 服务供 Agent 工具（"查反链""按标签找笔记"）使用，届时只需加一个 service，不改 UI。

---

## 9. 风险与取舍

| 风险 | 影响 | 处理 |
|---|---|---|
| vault 在工作区外，沙箱策略可能拒绝读 | 页面空 | Config 指定 vault；启动自检并显示"策略拒绝"明确文案；文档写明需要可读 |
| 转写 `![[..]]` 的循环/重复 | 卡死或重复渲染 | 深度上限 2 + 访问栈 + 截断提示 |
| 大库（> 2000 篇）索引与图 | 卡顿 | 索引只存元数据；图默认局部；超限降级并提示 |
| better-sidebar 服务 API 变动 | "编辑"按钮失效 | adapter 隔离 + 能力探针 + 降级 |
| MarkdownText 渲染细节与 Obsidian 不完全一致 | 观感差异 | 接受；差异项列入 README 的"已知差异" |

---

## 10. 首个可交付切片（建议今天就能开工）

1. 建包 + tsdown 双入口 + `cordis.patch.yml`，装进 profile，左侧栏出现图标、主栏出现空页（P0）。
2. `vault/parser.ts` + `resolver.ts` + 单测（不接 UI，先让语义正确）。
3. 接 `/tree` + `/note`，阅读视图渲染，`[[..]]` 跳转打通（P1 的最小闭环）。

到第 3 步，"这已经是个能用的 Obsidian 阅读器"；之后每加一个面板都是纯增量，不动前两层。

---

## 11. 实现状态（v0.1.0，2026-10-25）

已在 `plugins/dsh-obsidian-vault` 落地，未改动 DSH 与 better-sidebar 任何源码。

| 能力 | 状态 |
|---|---|
| 左侧栏入口 + 主栏页面 | ✅ 已装进 web profile，页面渲染验证 |
| Host 索引（syntax / frontmatter / resolver / watch / 增量失效） | ✅ 559 篇实测索引，版本号仅在内容变化时递增 |
| `/obsidian/api/*`（status/tree/note/backlinks/unlinked/tags/search/graph/create/asset） | ✅ 全部实测 |
| `[[..]]` / 别名 / `[[#标题]]` 定位 / `![[图片]]` / `![[笔记]]` 转写 / 未解析创建 | ✅ 改写器单测 + 浏览器点击跳转实测 |
| `> [!note]` Callout（27 类、可折叠、按类型着色） | ✅ 分割器单测；独立组件渲染 |
| 正文 `#tag` 可点击过滤 + 标签面板 | ✅ 改写器单测 + 浏览器实测 |
| 链接悬停预览 | ✅ 浏览器实测（标题 + 摘要卡片） |
| 反链分「已链接 / 未链接提及」两段 | ✅ 实测 197 / 20 条 |
| 大纲高亮当前阅读位置 | ✅ IntersectionObserver 实测 |
| 快速切换 `Ctrl+O`、前进后退 `Alt+←/→` | ✅ 浏览器实测；排序：标题 > 别名 > 标签 > 路径 > 正文 |
| 搜索面板 `Ctrl+F`（片段高亮 + 键盘操作） | ✅ 浏览器实测（40 条结果、35 处高亮） |
| 力导向关系图（拖拽、悬停、隐藏孤立、缩放平移、自适应画布） | ✅ 浏览器实测 |
| 图谱过滤（文本 / 标签 / 跳数） | ✅ 浏览器实测（24 个标签选项） |
| 文档标签页、属性表、面包屑、`==高亮==`、`%%注释%%` | ✅ 浏览器实测 |
| 单元/集成测试 | ✅ 49 个（node --test，含 CRLF、代码块、Callout、标签、高亮、歧义、增量失效） |
| 编辑（Live Preview） | ⏸ 未做（better-sidebar 未暴露会话级编辑入口；阅读视图为主） |

验证方式：`tsc --noEmit` + `node --test tests/*.test.ts` + `scripts/ui-check.mjs`（Playwright 驱动真实实例：进入页面 → Ctrl+O 打开笔记 → 点击双链跳转 → Alt+← 回退 → 打开关系图，全程无 console 错误）。

# 完整落地方案（执行版）

> 状态：本文件是唯一的执行计划。`ROADMAP.md` 保留为进度日志，`REFERENCE.md` 保留为逆向事实库。
> 结论先行：**我还不掌握 Obsidian 的完整实现**——只掌握了与「阅读 + 导航 + 文件管理」相关的一小部分，且在 §0 中明确划出已知/未知边界。下面所有条目都标注了「已验证依据」。

---

## 0. 我对 Obsidian 的掌握程度（诚实边界）

逆向方式：本机 1.12.7，`resources/obsidian.asar`（22.9 MB，352 文件）解包到 `G:\Software\obsidian-ref\unpacked`，读 `app.css`（20 643 行）、`app.js`（3.6 MB，压缩）、`i18n.js`（2 568 条字符串）。

| 掌握程度 | 内容 | 依据 |
|---|---|---|
| **已确认（数值级）** | 设计令牌（字号/行高/标题比例/圆角/边距/线宽/正文宽度 700px）；图谱默认过滤与力参数（0.1/10/1/250）、渲染参数默认值、Worker 仿真协议；文件列表 4 种排序；搜索算子语义；27 种 Callout 类型 | `app.css`/`app.js` 常量与选择器 |
| **已确认（行为级）** | 预览标签复用、双击固定、每标签历史；反链分组与面板选项；块引用 `^id`；嵌入到标题/段落；图谱幽灵节点与「仅存在文件」 | 官方帮助 + 本地实测 + 我们实现后的对照验证 |
| **部分了解（知道存在、未读实现）** | 链接解析优先级细节、嵌入别名/尺寸语法、属性类型推断、Callout 折叠记忆、图谱分组配色算法、搜索正则、堆叠标签 | `i18n.js` 有对应文案，`app.js` 有实现但未逐段读 |
| **完全未触碰** | 编辑器与 Live Preview、Canvas、Bases、Sync/Publish、插件运行时、PDF 标注、工作区布局持久化、移动端适配、导出/打印 | 属于另一个产品面，且改动量级远超本项目 |

量化：我读过的规则约为 **CSS 的 0.2%、JS 常量的极小部分**；2 568 条 UI 文案里我们覆盖了约 90 条。所以「完整实现逻辑」这个说法不成立——但**剩余可复刻的功能面已经收敛**，见 §2。

---

## 1. 已完成且可验收（作为基线）

| 能力 | 验收证据 |
|---|---|
| 索引 560 篇、链接解析、反链/未链接提及 | `/status` `/backlinks` 实测 |
| 阅读视图：Callout 27 类、高亮、注释、任务、脚注、数学、块引用、嵌入到标题/段落 | 浏览器实测 + 7 个单测 |
| 图谱：局部/全局、幽灵节点、标签/附件节点、分组、四组设置、键盘缩放平移 | 215 节点含 31 幽灵、箭头 338 条、力滑杆生效 |
| 文件列表：4 种排序、扩展名、折叠、右键菜单、新建、删除进 `.trash` | API 全 200 + 浏览器实测 |
| 标签页：预览复用、双击固定、每标签历史与滚动 | 14 个纯模型单测 + 浏览器实测 |
| 搜索：布尔/括号/取反、12 字段算子、属性查询 | 16 个单测 + 真实库 6 组查询 |
| 质量门 | `tsc` 干净、**99 用例全绿**、host 59.7 KB / client 167.6 KB |

---

## 2. 剩余功能路线（按执行顺序）

### M1 文件管理闭环：拖拽移动 + 链接自动改写（✅ 已完成）

**实测**：移动 `ov-move-test/src/target.md` → `dst/target.md`，`ref.md` 的 `[[ov-move-test/src/target]]` 与 `![[...#Section]]` 均改写为新路径，`[[target]]` 保持不动（标题仍唯一），`.trash/move-<ts>/target.md` 生成备份，移动后 `/backlinks` 仍有 3 条命中；目标已存在时返回 409 且不落盘。单测 9 个（改写）+ 6 个（集成）。

**目标**：把笔记/文件夹拖到目标目录，所有指向它的链接自动改写，反链不断。

**步骤**
1. `src/vault/files.ts`：新增 `move(from, to)`（已有 `rename` 可复用，支持跨目录时校验目标父目录存在）。
2. `src/vault/links.ts`（新）：`rewriteLinksForMove(notes, from, to)` 纯函数
   - 收集所有引用 `from` 的笔记（`linkIndex` 已具备）
   - 逐条把 `[[标题]]`/`[[路径]]`/`[[路径|别名]]`/`![[...]]`/`[[...]]` 里指向旧路径的 token 换成新路径（保留别名与锚点）
   - 返回 `{ path, before, after }[]`，不写盘
3. `src/vault/index.ts`：`move(from, to)` 编排
   - 先把 `from` 复制到 `.trash/move-<时间戳>-<名>`（回滚点）
   - 逐个 `writeText` 改写；任一失败即中止并回滚
   - 最后 `files.move` 移动本体 + `refresh()`
4. `src/routes.ts`：`POST /move { path, to }`，返回 `{ moved, rewritten }`。
5. `src/client/api.ts`：`moveEntry(path, target)`。
6. `Explorer.tsx`：行 `draggable`、目录/根 `onDragOver` 高亮、`onDrop` 调 `actions.move`；拖拽时显示目标目录名。
7. `VaultPage`：`actions.move` 实现，成功后 `reload()` 并保持当前标签。

**验收**
- 把被 197 条反链引用的 `外部大脑.md` 移到新目录：`/backlinks` 数量不变、`/search` 链接仍解析、`.trash` 有备份
- 目标已存在同名文件 → 返回 409 且不写任何文件
- 单测：`rewriteLinksForMove` 覆盖别名/锚点/嵌入/跨目录 4 类

**风险**：批量改写出错 → 用 `.trash` 备份 + 逐文件失败即回滚；先跑 dry-run 返回计数供 UI 确认。

---

### M2 图谱量纲对齐 + 大图性能（✅ 已完成）

**实测**：设置面板四个滑杆显示 `0.1 / 10 / 1 / 250`（与 Obsidian 默认一致）；新增「局部图 / 全库图」切换（此前全库图不可达）；400 节点全局图切换期间最长任务 60ms（改动前同场景 267ms），无帧阻塞；标签按度数上限 60 个，避免全库图标签糊成一片。

**与原计划的差异**：仿真没有搬进 Web Worker，而是把 `simulate` 重写为可增量推进的 `LayoutRun`，大图按 16 次迭代/帧切片执行。原因：Worker 需要在客户端产物里额外产出一个可被宿主路由服务的独立 bundle，收益与改动量不成正比；分帧已达成「不阻塞主帧」的目标。若后续确实需要后台线程，再加 bundle 入口。

**步骤**
1. `client/graph/layout.ts`：`LayoutForces` 改为官方量纲
   - `centerStrength 0.1`、`repelStrength 10`、`linkStrength 1`、`linkDistance 250`
   - 重写 `step()` 的力公式使这些值直接生效（不再用倍率）
2. `graph/settings.ts`：滑杆范围/默认值改 `0.01–0.5`、`1–20`、`0.1–2`、`50–400`；迁移旧 localStorage 值（旧值 1 视为默认）。
3. `client/graph/simulation.worker.ts`（新）：接收 `{nodes, links, forces}`，回传位置数组；主线程 `GraphView` 在节点 ≥300 时切换到 Worker，否则内联计算。
4. 面板显示「高级」分组，避免四个滑杆挤在一起。

**验收**
- 局部图节点平均间距与 Obsidian 截图并排差异 <15%（同一笔记同一跳数）
- 559 篇全局图：Chrome Performance 采样 ≥45 FPS，拖拽不卡顿
- 滑杆默认值显示 0.1 / 10 / 1 / 250

---

### M3 搜索与反链尾项（✅ 主体完成）

**实测**：`/TiSenT.*OS/` 正则命中 20 条、`tag:#work` 1 条；结果栏新增「相关度 / 名称」排序与「展开全部」；反链面板新增过滤输入与「名称 / 提及数」排序，过滤「审计」后 138 组收敛到 8 组。

**步骤**
1. `SearchView.tsx`：结果排序（相关度 / 名称 / 修改时间）+ 「折叠全部结果」开关。
2. `query.ts`：支持正则 `/pattern/flags`（`match-case` 兼容）。
3. `Panels.tsx`：反链面板加「排序（路径/行号）」与「过滤输入框」（复用 `query.ts` 的 plain 分支）。
4. 文档内反链：`NoteView` 底部可选区块（设置存 localStorage）。

**验收**：搜索 `/^2026-0[78]/` 命中日期笔记；反链过滤输入即时收敛；文档内反链可开关且刷新后保持。

---

### M4 UI 重构收尾（1 天，纯移动）

| 现在 | 目标 | 验收 |
|---|---|---|
| `VaultPage.tsx` 580 行 | `useVaultData.ts`（status/tree/tags/note/backlinks 拉取与轮询）+ `TabStrip.tsx`（标签栏与右键菜单），目标 ≤300 行 | 用例不减、浏览器冒烟全过 |
| `GraphView.tsx` 484 行 | `GraphCanvas.tsx`（SVG 渲染）+ `useSimulation.ts`（rAF/拖拽/缩放） | 同上 |
| `NoteView.tsx` 376 行 | `HoverPreview.tsx` + `markdown/enhance.ts`（DOM 增强） | 同上 |
| `Panels.tsx` 268 行 / `Explorer.tsx` 310 行 | `panels/{Outline,Backlinks,Properties,Tags,Rail}.tsx`、`explorer/{Tree,Toolbar,Menu}.tsx` | 同上 |

**规则**：一次只拆一个文件，拆完立刻 `tsc` + 全量用例 + 冒烟；`git diff` 应只有移动。

---

### M5 视觉收尾（✅ 主体完成）

**实测**：正文 16px / 行高 24px（1.5）、标题 h4–h6 = 1.188 / 1.076 / 1em、段落间距 1rem、标题上间距 2.5rem、引用边条改强调色、圆角统一 4/8/12、属性按类型渲染（日期只显示 `YYYY-MM-DD`、布尔为 ✓/✗、数组逗号连接）。
**文档内反链区块**：已于第二十四轮落地（`ov-doc-backlinks`：标题「反链 · N」+ 源笔记标题与上下文摘录，点击直达，无反链不渲染）。

**步骤**：`--p-spacing 1rem`、`--heading-spacing 2.5×`、`--h4/h5/h6`、引用边条用强调色、圆角统一 4/8/12、属性按类型渲染（日期/数字/复选框）。

**验收**：与本地 Obsidian 并排截图比对 3 组页面（普通笔记 / 带 Callout 与表格 / 长文），差异项清单为零或已记录。

---

## 3. 逆向研究结论（第三十三轮，源自官方压缩包 `app.js` 直探）

| 主题 | Obsidian 实际行为 | 我们的现状 |
|---|---|---|
| 链接解析 | `getLinkpathDest`：小写规范化 → 精确路径 → `./`/`../` 相对源目录 → 前导 `/` 根锚定（无后缀回退）→ 后缀/basename 候选按源目录邻近 + 路径长度升序，永远确定取第一；**主应用解析不查别名**（别名只在自动补全与 Publish 生效） | 已对齐（`resolver.ts` 重写）；别名保留为末位扩展（超集，文档标注）；仅同桶等长才报 ambiguous |
| 嵌入语法 | `\|300` / `\|300x200` 按**最后一个 `\|`** 切尺寸（`zx` 正则 `([0-9]+)(x([0-9]+))?`），width 恒设、height 仅 y≠0；整串是尺寸则 alt 置空 | 已落地：rewrite 把尺寸编进 alt 的 `\uE000` 标记尾，阅读视图 `annotateImages` 还原 width/height 并清标记；顺手修复了两个存量缺口——附件此前不进解析器（`![[img.png]]` 永远解析失败）且共享 Markdown 渲染器只画绝对 http(s) 图片 URL |
| 属性 | `NL(e)` 推断：null→text；`YYYY-MM-DDTHH:MM`→datetime、`YYYY-MM-DD`→date；number→number；boolean→checkbox；数组→multitext；types.json 的 assignedWidget 优先 | 渲染侧已按类型显示；types.json 读取价值低，**不做**（编辑交互不涉及） |
| Callout | `data-callout-fold` +/- → 可折叠，`-` 初始折叠；折叠态是内存态不落盘；嵌套逐层解析 | 已一致；嵌套渲染本轮补上（`NoteView` 递归 splitCallouts） |
| 图谱分组 | 查询按声明顺序评估，**第一个带色命中即定色**；无色过滤查询不命中则排除文件 | 已一致，无需改 |
| 标签页 | 堆叠标签（`mod-stacked` / `stacked:!0` 持久化在 workspace 布局） | **缺失特性**，成本中—大，暂不做（多标签已有，堆叠是显示模式） |
| 搜索 | 12 个算子；`tag:` 用 `^...($\|\/)` 忽略大小写匹配 frontmatter+行内 | 已一致，无需改 |

新增单测/审核：resolver +4（相对路径、源目录邻近、根锚定无回退、既有 7 项全绿）；vault +1（附件嵌入解析且无反链边）；rewrite +1（尺寸标记）；审核 +3（`note.relative-links-resolve` / `note.embed-image-size` / `note.nested-callout-renders`）。

---

## 4. 排期与验证门

| 里程碑 | 内容 | 工期 | 验证门 |
|---|---|---|---|
| M1 | 拖拽移动 + 链接改写 | 1.5d | 197 反链笔记移动后链接全解析；4 个改写单测；`.trash` 备份存在 |
| M2 | 图谱量纲 + Worker | 1d | 截图 A/B；559 节点 ≥45 FPS |
| M3 | 搜索/反链尾项 | 0.5d | 正则与排序用例；浏览器实测 |
| M4 | UI 重构 | 1d | 99 用例不减；冒烟通过；无逻辑 diff |
| M5 | 视觉收尾 | 0.5d | 三组并排截图 |

合计 **4.5 天**。每步结束固定跑：`tsc -p tsconfig.json --noEmit`、`node --test tests/*.test.ts`、对应 Playwright 探针；改 Host 的阶段需要重启一次宿主。

---

## 5. 明确不做

Canvas、Bases、Sync/Publish、社区插件**运行时**（只做目录与启用状态管理，不执行第三方 JS）、PDF 标注、移动端适配、打印导出。编辑器与 Live Preview 原属本清单，自 v3 起纳入 P7（见 §7）。

---

## 6. 回滚与安全

- M1 的批量改写：先复制原文件到 `.trash/move-<时间戳>/`，失败即逐个还原；路由返回失败明细。
- 所有写操作沿用 `VaultFiles` 的根内校验（`VaultPathError`）。
- 每阶段改动都可单独 revert（无跨阶段耦合）。

---

## 7. v3 阶段计划（2026-10-27 起）

> 用户决策：严格按 P1→P8 全做；UI 在现有基础上迭代（不推翻）；编辑做**真实时预览 Live Preview**；知识库做**多库注册表 + 切换器**；插件文件夹指**库内 `.obsidian/plugins`**。

### 7.0 架构约束（所有阶段共同遵守）

1. **统一注册表**：菜单项、右侧面板、文件类型视图、命令、设置分组各有一份清单常量，渲染与行为由清单驱动，禁止在组件里散写分支。
2. **统一接口**：Host 侧路由集中在 `src/routes.ts` 的注册表；Client 侧所有网络调用只经 `src/client/api.ts`；不允许组件直连 `fetch`。
3. **统一出入口**：`VaultPage` 是唯一入口，`openPath` / `activate` / 保存 / 菜单动作都走同一个 action 分发器（`VaultActions`），便于日志与测试。
4. **统一日志**：新增 `src/log.ts`，Host 与 Client 共用分级日志（`debug/info/warn/error`），每条带 `area` 与 `op`，写操作必须留痕（`审计日志`），默认 `info`。
5. **模块化**：单文件 ≤300 行；新能力各占独立目录；复用优先于新增（先查 `ui/kit/` 与 `graph/render/`）。**唯一例外**：`src/pur-kernel/controller.ts`（`PurController` 门面）——它聚合 49 个公开方法（多数是一行转发到 `controller-*` 八个模块），拆分只能靠原型混入或状态对象间接层，两者都会把调用链拉长而不减少逻辑，因此登记为长期例外；新增方法仍应落在那八个模块里，门面只做接线。
6. 每阶段结束：`tsc` 干净、`npm test` 全绿、`ui-full-audit.mjs` 通过，并给审核脚本补本阶段检查项。

### 7.1 P1 右键菜单统一 + 收纳

- 新增 `ui/menu/`：`ContextMenu.tsx`（渲染 + 键盘导航 + 子菜单 + 分组分隔）、`items.ts`（菜单项类型与构造器）、`registry.ts`（各场景菜单清单）。
- 场景：树-文件 / 树-文件夹 / 树-空白 / 多选 / 标签页 / 标签栏空白 / 窗口栏 / 编辑器 / 图谱节点 / 面板标题。
- 收纳规则：一级 6–8 项，分组「打开 → 编辑 → 移动/复制 → 危险」；低频进子菜单（`移动到…`、`复制为…`）；危险项置底独立分组。
- 迁移 `explorer/ContextMenu.tsx` 与 `TabStrip` 内嵌菜单到统一组件，删除旧实现。
- 验收：每个场景菜单项齐全可点；键盘 ↑↓/→/Enter/Esc 可用；关闭后焦点归位。

### 7.2 P2 UI v2（迭代，不重写）

- 左 rail（图谱/搜索/插件/设置）+ 可拖宽三栏（左 220–480、右 240–520）+ 24px 状态栏（词数/反链/链接/库名/索引状态/行列）。
- 标签栏：拖拽排序、中键关闭、溢出下拉。
- 设计令牌补齐（间距/圆角/字号/动效），统一空态、加载态、错误态三组件。
- 响应式：<1100px 右栏浮层，<860px 左栏抽屉。

### 7.3 P3 多库注册表 + 切换器

- 存储：`vaults: [{id, path, name, lastOpenedAt}]` + `activeVaultId`（存 DSH 设置，不写入 `.obsidian`）。
- Host：`Vault` 可重绑（停 watcher/索引 → 新根 → 重建）；路由 `GET /vault/list`、`POST /vault/open`、`POST /vault/create`、`POST /vault/forget`。
- 选目录复用 `ctx.remote.directoryPicker`（`pick`/`list`/`createDirectory`）。
- UI：知识库页（最近库卡片 + 打开文件夹 + 新建库）；切库时清空 tabs/图谱/搜索状态并重取。
- 非 `.obsidian` 目录询问是否初始化配置目录。

### 7.4 P4 `.obsidian` 配置读写兼容

- `src/vault/obsidian-config.ts`：读写 `app.json`（附件目录/新笔记位置/wiki 链接/严格换行）、`graph.json`（过滤器/颜色分组/力参数/显示开关）、`appearance.json`、`community-plugins.json`、`core-plugins.json`、`hotkeys.json`。
- 原则：以 `.obsidian` 为唯一事实源；读不到时用默认值，写回时保留未知字段。
- 图谱设置与 `graph.json` 双向映射，替代现有自有设置文件。

### 7.5 P5 插件面板（库内 `.obsidian/plugins`）

- 扫描 `plugins/<id>/{manifest.json,main.js,styles.css}`，列出名称/版本/作者/描述/启用状态。
- 启用开关写回 `community-plugins.json`；**不执行**第三方 JS。
- 面板提供「打开插件文件夹」「刷新」。

### 7.6 P6 代码预览

- 文件类型路由注册表：`.md` 阅读/源码、图片、`.pdf` 内嵌、文本白名单 → 代码视图、其余 → 元信息 + 下载。
- 代码视图：行号、语言徽标、语法高亮（自写轻量 tokenizer，零依赖、可单测）、复制、>1MB 截断。
- 笔记内 fenced code 复用同一高亮器。

### 7.7 P7 Live Preview 编辑

- Obsidian Live Preview 语义：光标所在行显示 Markdown 标记，其余行即时渲染；`Ctrl+E` 切阅读/编辑。
- 保存：`POST /note`（`path/content/mtime`），mtime 不匹配返回 409 → 冲突条（重新载入/覆盖）；800ms 防抖 + `Ctrl+S`。
- 外部变更（轮询 mtime）在编辑态提示。
- 待验证：共享 `MarkdownText` 能否按行复用渲染（否则改为自建块级渲染器，需评估成本）。

### 7.8 P8 更多 Obsidian 功能

- 命令面板（QuickSwitcher 扩展为命令 + 文件双模式）、分屏、模板、每日笔记、大纲拖拽调整标题层级、书签。

### 7.9 验收与审核

- 每阶段给 `scripts/ui-full-audit.mjs` 补检查：菜单项齐全、键盘导航、切库后数据源正确、代码视图高亮存在、编辑保存往返、冲突提示、插件开关写回 JSON。
- 汇报口径：本轮改了什么、审核多少项全绿、还剩什么。

## 8. 库内 Obsidian 插件能否适配成 DSH 插件（方案）

> 结论先行：**不能直接运行，也不建议做完整兼容层**。分四层推进，L0/L1 已实现（第十四轮），L2 白名单受控桥接已落地（P9-2 桥接基础设施第三十一轮、P9-3 obsidian shim v0 第三十二轮，P9-4 pur-studio 联调待做），L3 明确不做。

### 8.1 两边的插件模型差别（事实）

| 维度 | Obsidian 插件 | DSH 插件（Cordis） |
|---|---|---|
| 形态 | `<id>/manifest.json` + `main.js`（打包后的 CommonJS/UMD），在渲染进程里 `require('obsidian')` | npm 包（`package.json` 的 `dsh.bundle.patch`）+ `apply(ctx, config)`；客户端半区另声明 `dsh.client` |
| 生命周期 | `onload/onunload`，`registerEvent`/`registerDomEvent` 自动注销 | 一切都是 effect：`ctx.effect()` / `ctx.on()` 返回 disposer |
| UI | 直接操作 `Workspace`/`ItemView`/`addRibbonIcon`/`addCommand`/`Setting`/`Modal` | 通过 slots、primitive props、typed dictionaries 渲染，不能自持 DOM |
| 数据 | `app.vault`（读写文件）、`MetadataCache`、`loadData/saveData` | 服务注入（`ctx.get('fs')`、`remote.directoryPicker` 等），路由集中在 Host |
| 安全 | 与应用同源同进程，拥有完整 Node/Electron 能力 | Host 与 Client 分离，权限由能力注册表决定 |

因此「把 `main.js` 塞进 DSH 跑起来」在技术上需要伪造 `obsidian` 模块、Workspace/ItemView 树、MetadataCache 与持久化 API；这是重写 Obsidian 渲染层，量级远超本项目（见 §5 不做清单）。

### 8.2 分层方案

- **L0 元数据管理（已实现，P5）**：扫描 `.obsidian/plugins`，读 `manifest.json`，展示名称/版本/作者/描述，启用状态写回 `community-plugins.json`，**不执行任何第三方 JS**。这是安全基线，任何情况下都保留。
- **L1 兼容性清单（已实现，只读、零执行）**：
  1. 读 `main.js` 前 2 MB 文本，统计 `require('obsidian')`、`app.vault`、`app.workspace`、`app.metadataCache`、`registerEvent`、`addCommand`、`addRibbonIcon`、`ItemView`、`Setting`、`Modal`、`requestUrl`、`loadData` 等 API 的出现情况；
  2. 结合 `manifest.json` 的 `minAppVersion` / `isDesktopOnly`，给出 `compatible: 'metadata-only' | 'bridgeable' | 'native-only'` 三档判定；
  3. 面板显示兼容徽章与「用到了哪些 API」清单，支持按档位筛选；
  4. ~~输出一份 `plugins-compat.json`~~（落地时改为按需扫描：结果随 `PluginsDto` 返回，`scanned` 计数，不落盘）。
  这一层不改变运行时，但能让用户知道「哪些插件只是展示配置、哪些需要真正移植」。
- **L2 受控桥接（可选，白名单制）**：用 `sandbox="allow-scripts"` 的独立 iframe 承载插件 bundle，注入一个**只实现白名单子集**的 `obsidian` shim：
  - 生命周期：`Plugin`（`onload/onunload/registerEvent/registerDomEvent`）、`loadData/saveData`；
  - UI：`Notice`、`Modal`、`Setting`（渲染进 iframe 自己的 DOM）、`addCommand`、`addRibbonIcon`（通过 `postMessage` 注册到宿主菜单/Ribbon）；
  - 数据：只读 `vault.getMarkdownFiles/cachedRead/read`、`metadataCache.getFileCache`，写入一律拒绝；
  - 未实现的 API **必须抛错**（`UnsupportedObsidianApi`），不允许静默 no-op；
  - iframe 不同源、无凭据、无 Node，消息协议单向受限。
  只有「用到的 API ⊆ shim 集合」的插件才允许装载；首批候选是纯展示/工具类插件（日历、计数器、简单看板只读模式）。
- **L3 完整兼容（不做）**：伪造 Workspace/ItemView/Codemirror、开放 `requestUrl`、Node/Electron 能力。安全与维护成本不可控，且与 DSH 的插件模型冲突。

### 8.3 能力映射：Obsidian 插件能力 → DSH 扩展点

| Obsidian | DSH 落地位置 |
|---|---|
| `addCommand` | `ui/menu/registry.ts` 的命令清单 + 命令面板 |
| `addRibbonIcon` | ~~`ui/Ribbon.tsx` 的插件图标区~~（第三十轮删：入口重复；桥接期暂不落点） |
| `Setting` / `PluginSettingTab` | 设置分组注册表（P8 之后） |
| `ItemView` / `registerView` | 右栏 `RAIL_SURFACES` 或独立主视图 |
| `Vault.adapter.read/write` | Host `src/routes.ts` 的 `note`/`file` 路由（客户端只经 `api.ts`） |
| `MetadataCache` | `VaultIndex` 的 `note()`/`backlinksOf()`/`tags()` |
| `registerEvent(vault, 'modify')` | `vault/watch.ts` 的 watcher + 页面轮询 |
| `loadData/saveData` | `.obsidian` 配置读写（P4 `obsidian-config.ts`） |
| `requestUrl` | 显式拒绝（跨源请求不在白名单） |

### 8.4 L1 的改动清单（已落地，第十四轮）

1. `src/vault/plugins.ts` 增加 `analyzePlugin(folder)`：纯函数，输入 `main.js` 文本与 manifest，输出 `{ apiUsage, compatible, mainSize }`；坏文件/超限返回 `metadata-only`。
2. `protocol.ts` 的 `PluginDto` 增加 `apiUsage?`、`compatible`、`mainSize?`；`PluginsDto` 增加 `scanned` 计数。
3. `PluginPanel` 增加兼容徽章、API 标签、「仅展示可桥接」筛选；保持开关写回不变。
4. 单测：API 探测（含压缩产物）、超限截断、manifest 缺失、三档判定。
5. 审核脚本补 1 项：插件面板能显示兼容徽章且筛选生效。

### 8.5 风险与边界

- **安全**：第三方 JS 与应用同源时可读取 token 与全部 DOM；L2 必须独立 origin/iframe + 受限消息，禁止 `allow-same-origin`。
- **保真度**：Obsidian API 面非常大，shim 只能覆盖子集；宁可让插件报「不支持」，也不要假装成功。
- **版本漂移**：插件按 `minAppVersion` 编写，需在清单里记录我们支持的 shim 版本。
- **维护**：L2 每支持一个新插件都可能要补 API，必须有白名单与回归用例，不能变成无底洞。

### 8.6 实证扫描：真实库的四个插件（第二十一轮补充）

对 `G:\个人知识库` 实测（`plugin-compat.scanPlugin`）：

| 插件 | main.js | 判定 | 阻断性 API |
|---|---|---|---|
| Pur Studio 2.4.0 | 274 KB | native-only | vault 写、workspace/ItemView、requestUrl、Node 内建 |
| Claudian 2.2.5 | 4.8 MB | metadata-only（超 2 MB 扫描上限；AI 聊天实际必走网络与 workspace，实为 native-only） | — |
| Remotely Save 0.5.25 | 4.1 MB | metadata-only（同上；同步盘必走 requestUrl/网络） | — |
| Surfing 0.9.14 | 1.3 MB | native-only | webview/Editor/fetch/Node 内建 |

结论：**L2 shim 白名单对本库覆盖率为 0/4**。继续投入 L2 只能服务假想中的极简插件，对本库无实际价值；L2 维持「可选、不投入」，未来出现纯白名单插件时再启用。

### 8.7 「真正能用」的路线（待用户裁决）

1. **原生能力移植（推荐）**——把插件提供的真实能力做成 DSH 原生功能，与 daily-note / template / bookmark 同模式：
   - AI 侧栏聊天（替 Claudian）：右栏一档 chat，复用 DSH 已配置的模型通道；成本最低、价值最高；
   - 库同步（替 Remotely Save）：WebDAV/S3 push/pull；成本中（网络栈 + 凭据管理）；
   - 网页浏览（替 Surfing）：iframe 主视图；成本低，但 X-Frame-Options/CSP 会挡多数站点，价值存疑。
2. **data.json 级互通（附送）**：`obsidian-config.ts` 白名单按插件 id 放开 `plugins/<id>/data.json` 读写，原生替代功能可直接继承原插件配置（如 Remotely Save 的远端参数）。
3. **L2 shim（原 §8.2，维持可选、不投入）**。

### 8.8 插件面板 UI 方案（✅ P9-1 已落地，第二十一轮）

- 插件管理从 dialog 升级为**右栏一档 `plugins`**（与大纲/反链/书签同注册表 `RAIL_SURFACES`），ribbon 与命令面板入口改为直接打开该档；原 dialog 链路已删除。
- 行内信息（名称/版本/作者/描述/兼容徽章/API 标签/开关）不变；点击行展开详情：ID、`main.js` 大小、「在 DSH 中运行」桥接占位开关（写 `plugins-bridge.json` 待 P9-2 路由，当前禁用）；「打开插件目录」在面板工具行。
- 每个 native-only 行的详情显示「原生替代」引导：映射表按插件 id 指向规划中的 DSH 功能（`remotely-save` → 库同步、`realclaudian` → AI 聊天、`surfing` → 网页浏览、`pur-studio` → 桥接适配），其余 native-only 走通用文案，把「不能用」变成可操作路径。
- 数据层零改动（复用 `PluginsDto`）；纯 client 重组 + rail 注册，审核脚本补 `rail.plugins-panel` 检查。

### 8.9 pur-studio 专用桥接（用户裁决：先做 pur；分 P9-2 → P9-4）

实证（2026-10-29 对 `main.js` 5014 行的调用点分析）：

- 画布/图片管理主干**只需** `obsidian` 12 个解构导出（`Plugin/ItemView/Menu/FuzzySuggestModal/Notice/PluginSettingTab/Setting/normalizePath/addIcon/TFile`）+ vault 读写（含 `readBinary`/`getResourcePath` 图片链路）+ workspace 六个方法 + `loadData/saveData`（303 B 的 `data.json`）——全部可桥接；
- Node 调用全部局限在四个桌面专属功能里：`electron.remote` 弹独立窗（L1737）、`child_process`+`fs`+`os` 跑生成的 Python（L3917+）、写临时 HTML 调系统浏览器预览（L3996+）、扫系统浏览器清单（L3822+）；`fs` 读 `.obsidian/graph.json` 颜色组（L3094）可由配置路由代答。这些路径 shim 抛 `UnsupportedObsidianApi` 并禁用对应按钮，不影响画布主干。
- `pur.studio` URL 只是命名空间，无真实网络请求。

全量精读补全（2026-10-29，main.js 5014 行逐段）：

- **结构图**：L1-17 依赖与默认设置；L20-237 i18n 中英字典；L239-309 generateId/calcNodeHeight/58 个代码节点预设；L311-410 JSON Canvas 双向转换（`__pur` 保留扩展字段）；L412-607 坐标/引脚几何与极简 YAML 解析；L610-700 UAsset IR→画布；L702-4608 PurStudioView（draw 渲染引擎、命中检测 L1644-1810、鼠标/滚轮/双击 L1841-2250、五类编辑器弹层 L2252-2531、粘贴/拖放 L2533-2769、快捷键 L2771-2788、元素操作 L2790-3288、导出 PNG/JPG/MD L3299-3455、代码生成 JS/HTML/PY 拓扑排序 L3457-3751、生成代码预览与执行 L3776-4016、右键菜单 L4032-4372、添加元素 L4374-4497、撤销重做 L4511-4526、UAsset 导入 L4528-4606）；L4611-4997 主插件类（16 个 addCommand、ribbon、file-open 去重、pur.studio 协议后处理器 + MutationObserver、copyImage sha256 去重、dataURL/http/vault 三路 loadImage）；L5000-5014 设置页。
- **文档纠偏**：CLAUDE.md 声称 19 命令实为 16（「显示网格」是设置项文案、`pur-result-dialog` 是 DOM id，均非命令）；main.js 无 HTTP 服务——端口 18991 属外部 Python 桥 `pur_screenshot_server.py`，CLAUDE.md 的「HTTP API 入口」说法误导。
- **源码 bug 清单**（P9-4 复现修正）：① `.replace(/.md$/i,'')` 与 `/.(md|PurStudio)$/i` 未转义点（L2659/2695/2697）；② editCodeNode 的 document mousemove/mouseup 监听 close 时未摘除（L2380-2385 泄漏）；③ editGroupLabel 雅黑选中态永不命中——比较值带引号 `'Microsoft YaHei', sans-serif` 而 option value 不带（L2433）；④ onPaste 纯文本剪贴板 `items[0]` 可能 undefined（L2582）；⑤ editTextElement `const origClose = close` 读到全局 `window.close` 并将其覆盖——从未调用，属死代码但危险（L2947-2948）；⑥ `div.remove()` 连调两次（L3061-3062）；⑦ `if (true)` 死分支（L1932）；⑧ 导出图片只画 text/image，跳过连线、群组与 note-link/code-node（L3317 自述「暂不导出连线」）；⑨ updateNoteLinkInfo 只查顶层元素，群组内 note-link 不刷新反链数（L4500）。
- **桌面专属面**（P9-4 报「桌面版专属」）：electron.remote 置顶/弹窗（L1716-1758）、child_process 跑 Python/打开浏览器（L3864-3945）、fs 扫浏览器清单与 Python 解释器（L3822-3843、L3924-3943）、yt-dlp 视频下载（L1764-1807）、fs 读 graph.json 颜色组（L3092-3103，shim 已由配置路由代答）。

**shim 能力缺口（2026-10-29 实证）**：从 main.js 提取出 22 条 `app.*` 调用路径，对照 P9-3 shim：

| 调用 | shim 现状 | 处置（P9-4） |
| --- | --- | --- |
| `vault` 的 adapter/create/getFiles/getMarkdownFiles/getAbstractFileByPath/getResourcePath/modify/on/process/read | 已实现 | — |
| `workspace` 的 getLeaf/getLeavesOfType/revealLeaf/openLinkText/on/activeLeaf(.view) | 已实现 | — |
| `metadataCache.getFirstLinkpathDest` | 已实现 | — |
| `workspace.getActiveFile()` | **async** | 缺陷：Obsidian 是同步 getter，插件按同步值用（L4164 直接读 `.extension`）→ 改为宿主注入 activePath 快照 + file-open 推送刷新 |
| `metadataCache.getFileCache(file)` | 恒 `null` | 缺陷：`tag:` 过滤（L3112-3119）永远不命中 → 桥补返回 `{ tags }` |
| `metadataCache.getBacklinksForFile(file)` | 恒 `undefined` | 降级为 0，可接受；有索引数据后补 |
| `commands.commands['workspace:move-to-new-window']` / `commands.executeCommandById` | 缺失 | 新增 `app.commands` 门面：`commands` 空映射（桌面命令本就不存在），`executeCommandById` 抛 `UnsupportedObsidianApi` |

另需补的导出面：无（`addIcon`/`setIcon` 待核对 main.js 实际引用后再定）。

**P9-5 内核抽取（2026-10-29 已裁决：抽平台无关内核）**：Pur 不再以「main.js + shim」为唯一形态，改为把纯逻辑抽成无 Obsidian 依赖的内核，Obsidian 与 DSH 各做一层 adapter。分层按耦合度递减：

| 层 | 内容 | 宿主依赖 | 规模 |
| --- | --- | --- | --- |
| 数据 | JSON Canvas ↔ elements（`__pur` 元数据保留）、58 节点预设、`generateId`/`calcNodeHeight`、i18n 字典、`.PurStudio` 序列化 | 零 | ~800 行 |
| 几何 | `wrapText`、世界坐标、引脚坐标、视口裁剪、1/2/5×10ⁿ 网格步进、命中检测 | 只读 elements + 指针 | ~250 行 |
| 算法 | 代码生成拓扑排序 + JS/HTML/PY 模板、`parseSimpleYAML` + `irToElements` | 零 | ~700 行 |
| 渲染 | `draw(ctx, scene, viewport)`：网格/连线/群组/元素/引脚，输出到 `CanvasRenderingContext2D` | 只依赖 canvas 2D 接口 | ~1000 行 |
| 控制器 | 选中/拖拽/缩放/编辑弹层/右键菜单/撤销重做，暴露命令接口（add/delete/group/align/export/…） | 由 adapter 注入宿主能力 | ~1500 行 |

抽取顺序即表中顺序，每步用原 main.js 的输入输出做黄金对照（元素 JSON、生成代码文本、绘制指令序列）。内核包目标：100% 单测覆盖 + 无 `document`/`window`/`app` 引用。adapter 只保留 ItemView 挂载、Vault 读写、settings、ribbon、桌面专属能力的降级分支。

安全模型沿用 §8.5：iframe `sandbox="allow-scripts"`（禁 same-origin），插件代码触碰不到宿主 DOM/cookie/token；vault 访问只能过 postMessage 桥、由 Host 按库根路径约束。

白名单：`.obsidian/plugins-bridge.json` 存用户显式允许桥接的插件 id（默认空）；面板对每插件提供「在 DSH 中运行」开关写回该文件，未入列插件一律只读展示。

分阶段：

- **P9-2 桥接基础设施**：Host 路由增插件 `main.js` 供给（iframe srcdoc/专用端点）、任意路径二进制读写、`plugins/<id>/data.json` 读写、`plugins-bridge.json` 白名单读写；定义 postMessage JSON-RPC 协议（vault/workspace 调用 + 事件推送 + 命令注册）；client 增主视图一格 `pur-studio` iframe 容器。
- **P9-3 obsidian shim v0**：独立 tsdown 入口产出 shim bundle，在 iframe 内定义 `require` 与上述 12 个导出；`registerView` → 宿主主视图容器；`addCommand` → 宿主命令面板；`Modal/Setting/Notice` 渲染进 iframe 自身 DOM；`vault/workspace` 全走桥；`fs/path/os/child_process/electron` 给最小桩（graph.json 读由桥代答，其余抛错）。
- **P9-4 pur-studio 联调**：命令「打开 Pur Studio」→ 画布在主视图打开；图片导入/分类/嵌入笔记（`readBinary`+`getResourcePath`+`openLinkText`）；`.pur` 保存/另存经 vault 写桥；审核脚本补 `bridge.pur-studio-*` 检查（画布渲染、元素增删、保存回读）；桌面专属四功能报「桌面版专属」。

### 8.10 第二十二轮：入口去重、搜索瞬时化、DSH 插件专区（用户裁决后落地）

- **⋯ 菜单去重**：顶栏 ⋯ 菜单只留「快速切换 / 刷新索引」；「关系图 / 切换笔记树 / 切换右侧边栏」从菜单删除——ribbon 与面板右键菜单已有相同入口，命令面板仍保留全部三个命令。
- **搜索瞬时化**：搜索是动作不是状态——ribbon「搜索」`aria-pressed` 恒为 `false`，点击只打开快速切换全文模式；`files` 按压 = 资源管理器可见，`graph` 按压 = 图谱视图打开，`plugins` 按压 = 插件档可见。`VaultPage` 的 `ribbon` state 随之删除。
- **ribbon 插件图标区**：ribbon 下半区（`ov-ribbon-spacer` 之下）列出全局 DSH 目录里每个已安装插件的图标（puzzle 字形，`data-plugin` 属性），点击打开插件面板；Ribbon 自行拉取清单，库切换或插件档开合时刷新。
- **插件包内全局 DSH 目录**（用户裁决，第二十三轮修订）：DSH 适配插件放在插件包内的全局目录 `plugins/dsh-obsidian-vault/plugins/`（`package-root.ts` 由入口深度推包根，源码与构建产物一致），所有库共享同一份；`listPlugins(root, dshFolder)` 由端点注入该目录，返回 `dsh: PluginDto[]`（仅 manifest 元数据，`enabled` 恒 `false`，不做兼容扫描）与 `dshFolder`；「打开插件文件夹」打开该目录（`.obsidian/plugins` 只读展示，不再提供入口）；面板顶部「DSH 插件」一节（路径 + 引导文案 + 无启用开关的行，详情仍有「在 DSH 中运行」桥接占位）。目录已 gitignore。

### 8.11 第二十四轮：入口再查重、文档内反链、导航边界断言

- **空态保持被动**（用户裁决「只删空态按钮」）：库打开但未选笔记时，阅读区只渲染无动作的 EmptyState——ribbon 搜索（全文模式）、顶栏 pill（文件模式）、Ctrl+O、标签栏「+」已覆盖全部打开路径，第五个入口是噪声；`onQuickSwitch` 不再沿 `VaultPage → MainColumn → PaneColumn → MainPane` 下传。
- **文档内反链区块**：阅读视图在 Markdown 正文之后渲染 `.ov-doc-backlinks`（标题「反链 · N」+ 行：源笔记标题与上下文摘录），点击经 `onOpen` 直达；无反链不渲染。数据源与右栏反链档相同（`useVaultData` 的 `backlinks`），两处展示同源不同形。
- **历史按钮边界是审核契约**：← → 按钮的 `disabled` 由 `history.index` 推导；审核固定四个边界——无历史双禁用（`nav.history-buttons-initial`）、最新条目前进禁用、回退到底后退禁用、回退后前进可用（`tabs.select-and-history`）。
- **标签栏分割线调暗**：`.ov-tabbar` 的 `border-bottom` 用 `color-mix(50% transparent)` 压暗，与阅读区留白保持同一视觉权重。

### 8.12 第二十五轮：VaultPage 瘦身（纯重构，行为零改动）

- **布局与状态分家**：新增 `VaultWorkspace.tsx` 纯布局组合组件，承接 TopBar/Ribbon/Explorer/Main/Rail/scrim/StatusBar/Overlays 全部 JSX；`VaultPage.tsx` 276 行（≤300 达标），只留 state、hooks、动作分发与一个 `<VaultWorkspace/>`。
- **props 类型不重复声明**：`VaultWorkspaceProps` 用 `ComponentProps<typeof X>['field']` 索引签名引用子组件 prop 类型，hook 返回（`tabs`/`bookmarks`/`overlays`）整体传入；`labels`/`vaultName`/`widthVars`/历史边界在组件内派生。
- **命令装配收拢**：新增 `useVaultCommands.ts`，合并 `useVaultNotes`、窗格命令与 `useCommandSurface`；`extra` 数组 memo 化，命令面不再每次渲染重建。

### 8.13 第二十六轮：⋯ 菜单再查重、白线根因、← → 点击级验证

- **⋯ 菜单只留「刷新索引」**：「快速切换」与紧邻的顶栏 pill（含 Ctrl O 提示）重复，从 `topbar` 场景删除；pill 仍是唯一入口，Ctrl+O 快捷键不受影响。
- **白线根因是焦点边线不是边框**：浏览器探针实测 `.ov-tabbar` 的 `border-bottom` 在深色下仅 3% 白（不可见）；真正的亮线是 `.ov-pane-active .ov-tabbar` 的 `inset 0 -1px` 阴影——宿主深色主题把 `--dsw-alias-brand-primary` 解析为 `#f9fafb` 近纯白。修复为 `:not(:only-child)` 门控：焦点边线只在分屏时出现（它本来的用途），单窗格不再绘制。
- **← → 是点击级端到端契约**：审核真实点击 ← → 按钮，断言活动标签切换、四个 disabled 边界，以及点击后 `.ov-document` 重新渲染目标笔记正文（回退见「审核夹具标题」、前进见「链接到」）——导航驱动完整重渲染，不止标签条换名。

### 8.14 第二十七轮：插件面板删说明行、头部去重合并行、编辑器只留「阅读」

- **说明行让位给节标题**：插件面板社区节的路径行与提示行删除，「社区插件 · N」节标题保留以区分三节；DSH 节的路径行保留（用户未提）。
- **头部反链按钮是第四处重复**：右栏反链标签、状态栏计数、文档底部反链区块已覆盖其职能，按钮删除并把 `onShowBacklinks`/`backlinkCount` props 链从 VaultPage 到 NoteHeader 整体拆除；`NoteView` 的 `backlinks` prop 保留给文档底部区块。
- **「源码」并入面包屑行**：新增 `.ov-note-head-row`（面包屑 `flex:1` 收折、按钮钉右端），头部从三行压到两行；审核选择器按 `title="源码"` 取按钮，位置变化无感。
- **「保存」按钮无存在理由**：800ms 防抖自动保存、Ctrl+S、退出刷写已覆盖全部保存路径，按钮删除，`saveNow` 键双语同删；审核从不点击该按钮，无需改断言。

### 8.15 第二十八轮：社区插件连根删（用户裁决）

- **裁决覆盖 §8 全部桥接方向**：用户明确「不要有社区插件了」，且选「连根删」——面板社区节、兼容扫描（plugin-compat）、`community-plugins.json` 读写、过滤 chips/徽章/替代建议全部移除。§8.2 分层方案、§8.7 路线、§8.9 pur-studio 桥接自此作废，仅留作历史；DSH 插件节保留「在 DSH 中运行」占位开关，因为它是 DSH 适配插件自己的启用位，与 Obsidian 社区生态无关。
- **能力回退的已知代价**：面板从此不能开关 Obsidian 社区插件；用户在 Obsidian 本体里的启用列表不受影响，本插件也不再读取它。若日后回心转意，恢复点是被删的 `plugins.ts` 社区段 + `plugin-compat.ts`，而不是新设计。
- **删除面清单**：`PluginDto` 瘦身为纯 manifest 元数据（DSH 行恒为已安装、无开关，`installed/enabled/compatible/apiUsage/mainSize` 全删）；`PluginsDto` 删 `configured/folder/folderExists/community/scanned`；`plugins/toggle` 去 `core` 标志；`obsidian-config` 白名单删 `community-plugins`（配置读写路由随之拒绝对它的访问）；i18n 双语删 15 键；样式删 5 个类与两条属性规则。
- **审核收缩**：`plugins.list-scans-folder`/`plugins.toggle-persists` 删除，`plugins.core-toggle-persists` 只保核心开关落盘与 DSH 清单断言；`rail.plugins-panel` 新增反向断言「社区插件标题不存在」，防止社区节复活。

### 8.16 第二十九轮：顶栏再瘦身、分屏分隔条、右键切分/关窗格、← → 根因修复、ribbon 收右栏

- **顶栏只留导航与刷新**：pill 与 ⋯ 菜单都是重复入口（Ctrl+O、标签栏「+」、ribbon 搜索覆盖快速切换；刷新索引是唯一无其他家的菜单项），pill 删除、刷新提成图标按钮、topbar 菜单场景整删；`MenuScene` 少一个分支，菜单注册表只剩树/标签/面板/编辑器四个场景。
- **← → 失效根因在 preview 复用**：`openTab` 复用 preview 标签时曾用 `makeTab` 重建整个标签对象，历史栈被重置为单条；而资源管理器单击全部走 preview 路径，历史永不积累，`canBack/canForward` 恒为 false。修复只动复用分支：保留原标签、`pushHistory` 追加新路径，回退链完整覆盖点击序列。
- **分屏尺寸的份额模型**：`PaneState.size` 记录 flex-grow 份额，切分对半、关窗格随 pane 一并带走，无需并行数组；拖拽在组件层把像素增量换算成 grow 增量（`deltaPx × Σsize / 容器 extent`），钳制 `MIN_PANE_SIZE`（0.05）与 `MIN_PANE_PX`（120px）双下限，键盘方向键步进 48px、双击均分同一对窗格。
- **flex-grow 总和 <1 不归一化（CSS 规范）**：这是本轮唯一被审核实锤的布局 bug——连续切分/关闭后总份额缩到 0.25 时，两个窗格各只剩 70px、长条 75% 留空。修复放在渲染边界：`MainColumn` 把 `size / Σsize` 归一化后作为 `share` prop 传给 `PaneColumn`，模型层的相对份额语义不变，拖拽换算因比例关系保持正确。
- **右键关窗格的作用域**：`PaneColumn` 的 `onPointerDownCapture` 对任意鼠标键先生效聚焦，因此「右键非活动窗格 → 关闭窗格」关的就是被右键的窗格，无需为菜单单独传 pane id。
- **ribbon 收右栏**：`RibbonId` 加 `'rail'`，点击只翻转 `railOpen`、不触碰主视图（关系图开着时收右栏不退出关系图），按压态读 `railOpen && showRail`；审核用「先记初态、点两次、双双复原」的写法避免依赖默认布局。

### 8.17 第三十轮：ribbon 去重与设置对话框（插件开关 + 外观集成）

- **三入口一功能，用户裁决只留右栏开关**：ribbon 的「插件」图标与 spacer 下方每个 DSH 插件的拼图图标都是插件面板入口，全部删除；设置齿轮固定在 spacer 后，action 语义（同搜索：永不按压）。`Ribbon` 的拼图区与 `fetchPlugins`/`PluginDto` 状态整体删除——DSH 插件列表只在对话框打开时由 `PluginPanel` 自取，ribbon 不再参与。
- **设置对话框是库内第一处多节对话框**：骨架复用 VaultManager 的 `dialogLayer`（mousedown 关闭 + Escape）→ `dialog`（stopPropagation）→ `dialogHead` + `dialogBody`；外观区用现成的 `Variant` 机制，`useVaultAppearance` 把 variant 提为 state 并暴露 `setVariant`，按钮点击即落根属性 + localStorage。
- **rail tab 与菜单同步收缩**：`RailId` 删 `'plugins'`、`RAIL_SURFACES` 删一项、`Panels.tsx` 删渲染分支；panel-tabs 场景菜单由注册表派生自动少一项，审核加反断言兜底。`PluginPanel` 本身零改动——只是从 rail 换到对话框挂载。
- **审核增量模式**：`--only=a,b` 在 `check()` 入口跳过未选中项（计入 `skipped`，不算通过也不算失败），页面初始化与夹具清理照跑；有 UI 前置的检查（如 `menu.panel-tabs` 需要开着的笔记与右栏）补自给前置，保证增量模式可独立成立。

### 8.18 第三十一轮：pur 插件方案启动，P9-2 桥接基础设施落地

- **用户裁决恢复 §8.9**：§8.15 的「连根删」作废的是面板社区节与兼容扫描；本轮用户明确「开始启动 pur 插件方案」，P9-2 落地，L2 受控桥接从「可选、不投入」转为「pur-studio 专用、白名单制」。社区清单以**只读 manifest 扫描**回归（`pluginManifests(folder)` 通用化，DSH 目录与库内 `.obsidian/plugins` 共用），不做已删除的兼容分析。
- **数据面**：`plugins-bridge.json` 入 `obsidian-config` 白名单（mergeJson 写回、数组整体替换）；`vault/bridge.ts` 供 id 校验、白名单增删（Set 去重）、`data.json` 往返（缺失/损坏读为 `undefined`）、`main.js` 字节；`VaultFiles` 补 `readBytes/writeBytes`，全部路径经 `absolute()` 越界拒绝。
- **Host 路由**：`plugins/bridge-toggle`（id 校验 + 必须在 community 清单否则 404）、`plugins/script` 与 `plugins/frame`（未入白名单一律 403）、`bridge/read-binary` / `bridge/write-binary`（base64）/ `plugins/<id>/data.json` 的 GET/POST。frame 是同源 HTML 壳：bootstrap 装 `post()`、`frame.ready`、`frame.error` 转发与抛错的 `require`，再以 `<script crossorigin>` 加载插件 bundle——sandbox 禁 same-origin 后 iframe 是 opaque origin，只有 ACAO:* + CORS 模式加载才能让真实错误消息经 postMessage 回宿主。
- **协议与 dispatch 分层**：`bridge-protocol.ts` 定双向 source 标签与 request/event/response 三型；dispatch 是纯函数独立模块（`client/bridge-dispatch.ts`，deps 必传）——`client/api.ts` 含 TS 参数属性、Node strip-only 跑不了，dispatch 若与其同文件则永远进不了单测。`plugin.loadData/saveData` 用挂载时的 pluginId 而非 params 防越权；`attachPluginBridge` 按 `event.source === frame.contentWindow` 过滤消息。
- **主视图容器**：`PluginView` 三态（骨架 / 未桥接 EmptyState+「打开设置」/ 沙箱 iframe + `role="alert"` 错误条）；预查白名单，未入列不挂 iframe（403 不进审核的 HTTP 监听）。`view` 联合加 `'plugin'`，命令面板加「打开 Pur Studio」。设置对话框在 DSH 与核心两节之间插「可桥接插件」节，`BridgeRow` 开关直写白名单。
- **审核自给切库**：新增 `plugins.bridge-toggle-persists` 与 `pur.frame-opens`，经 `ensureVaultB`/`restoreBridgeVault` 在 --only 模式下自行切到 vault B 再切回。本轮实锤：插件段检查此前隐式依赖全量顺序中 `vaults.switch-and-reload` 的切库，增量模式下会把白名单与核心开关写进真实库——有写盘断言的检查必须声明自己的库前置。
- **P9-3 入口已留**：frame 的 `require` 抛 `unsupported module: <name>`，shim bundle 落地时替换该桩；审核 `pur.frame-opens` 以错误条含 'obsidian' 作为沙箱+桥接的端到端证据，P9-3 后该断言随 shim 就绪改写为画布渲染检查。

### 8.19 第三十二轮：P9-3 obsidian shim v0 落地，CJS 插件真实跑通沙箱

- **shim 是独立 tsdown 第四入口**（`shimBundle`，IIFE 48.85 kB / gzip 14.41 kB），`frameDocument` 以 `<script crossorigin>` 加载并内嵌 `__OV_MANIFEST__`/`__OV_GRAPH_JSON__`；frame 内伪造 `module/exports`，`require('obsidian')` 返回解构导出（Plugin/Modal/Setting/Notice/ItemView/TFile/normalizePath…），`module.exports` 的 Plugin 子类由 boot 实例化并跑 `onload`。
- **同步 API 与异步桥的矛盾靠预热缓存化解**：`ShimVault.warmup()` 在 onload 前用 `vault.list` 填满文件缓存，`getFiles()/getAbstractFileByPath()` 是同步 getter 只读缓存（冷缓存返 `[]`/`null` 并后台再 warm）；`create/process` 写路径失效缓存。单测实锤：冷缓存断言会多发一个后台 warmup 请求挤占序号，测试按序应答两个 list。
- **`graph.json` 同步读由宿主内嵌代答**：`require('fs').readFileSync` 只认 `/vault/.obsidian/graph.json` 返内嵌文本；`child_process`/`electron` 等 Node builtins 抛 `UnsupportedObsidianApi`，构成明确的禁能面。
- **命令回环全链**：frame `addCommand` 经 `commands.register` 事件上行 → 宿主 `bridge-commands` store 注册 → `useVaultCommands` 以 `extra` 通道（`useSyncExternalStore`）合并进面板，label 为 `插件名: 命令名`；面板选中下行 `command.run` HostEvent → frame 分发回调。`registerView` 的 `setViewState` 把 ItemView 渲进 frame 自身 DOM 容器。
- **本轮根因级 bug：React effect 竞态抹掉桥接命令**。MainPane 传内联 `onOpenPath` → 每次渲染新引用 → PluginView 的 bridge effect 反复销毁重建；`commands.register` 引发的 store 更新本身触发重渲染，cleanup 的 `unregisterCommands()` 把刚注册的命令抹掉且事件不重发。修法是 ref 穿透（`onOpenPathRef`）+ deps 收窄到 `[bridged, pluginId, title]`。
- **审核 `pur.frame-opens` 重写为全链断言**：夹具 main.js 是真 shim 操练插件（normalizePath/data 往返/getFiles+instanceof/vault.read/create+process/双命令/视图挂载/Node builtins 阻断/graph.json/getResourcePath 图片解码/Notice），14 项结果写进 `#fixture-results`；检查等待 `"done"` 后断言零失败，再经面板下行跑两条命令验证宿主导航与 frame 回调。
- **验证**：tsc 0 错误、260/260 用例、tsdown 四产物、增量审核 3/3（settings.dialog-plugins / plugins.bridge-toggle-persists / pur.frame-opens）+ 面板回归 2/2，console errors 0。

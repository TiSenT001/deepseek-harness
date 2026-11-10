## 第一百一十三轮：从模板新建笔记（2026-11-10）

- **对标 Obsidian Templates**：`模板/` 文件夹下的 Markdown 自动成为模板；命令面板新增「从模板新建笔记…」，选择模板、填写名称后创建到 `收件箱/`，正文展开 `{{title}}`、`{{date}}`、`{{time}}` 与 `{{date:YYYY/MM/DD}}` 这类自定义格式。
- **实现**：`templates.ts` 负责模板发现、占位符展开和目标路径规范化（去掉 `.md`、把斜杠换成连字符）；`TemplatePickerDialog` 用现有 Select/输入框，创建走 `createNote` + `saveNote` 再刷新索引并打开。
- **验证**：`tsc` 0、738/738；新增模板测试覆盖发现、变量展开、路径规范化；真实库临时模板实测生成「模板审核笔记」，内容为 `# 模板审核笔记` 与 `创建于 2026-11-10 23:35（2026/11/10）`，fixture 已清理。

## 第一百一十二轮：PDF / 音频 / 视频内嵌（2026-11-10）

- **对标 Obsidian 附件嵌入**：`![[方案.pdf]]` 在阅读视图渲染为 PDF iframe，`![[录音.mp3]]`/`![[演示.mp4]]` 渲染为原生 `<audio>`/`<video>` 播放器；`|300` 或 `|480x270` 控制宽度，图注保留「打开原文件」。
- **实现**：`media.ts` 只做附件分类；Markdown 重写把媒体嵌入转成 asset 链接，`enhanceMedia.ts` 在渲染后把链接替换成播放器（跳过图注链接，避免重复包裹）。宿主 content-type 补齐 m4a/ogg/flac/aac/mov/ogv/m4v。
- **验证**：`tsc` 0、735/735；真实 vault 临时笔记中 PDF/MP3/MP4 各一，浏览器实测 3 个 `.ov-media-embed`，无重复；新增 media-kind 与 rewrite 测试。

## 第一百一十轮：命名工作区布局（2026-11-10）

- **对标 Obsidian Workspaces**：命令面板新增「工作区布局…」，把当前每个 pane 的标签与顺序、活动标签/pane、分屏方向与比例、视图和右栏保存为一个命名布局，可应用回当前工作区或删除；同名覆盖，最多 20 个。
- **持久化**：布局随 `view-memory` 记录一起存 localStorage 与宿主 `.data/view-memory.json`，两者都做边界校验：名字 1–60 字符、workspace 结构非法或重名的布局单独丢弃、列表上限 20。
- **验证**：`tsc` 0、732/732；新增 workspace-memory 测试覆盖往返、重名/非法布局丢弃、20 条上限；审核新增 `workspace.layouts`（保存、应用、删除并清理）。
## 第一百零九轮：标签/分屏交互补全与拖拽跨窗格（2026-11-09）

- **空新标签页**：`+`/`Ctrl+T` 不再只弹快速切换，而是追加一个无路径的空标签页；标题显示「新标签页」，主区域显示空白启动页，点文件会填进这个空标签而非再开预览；空标签随工作区持久化（`empty: true`），重启后仍在。
- **标签栏可发现性**：右侧新增「⋯」操作菜单（新标签、向右/向下拆分、关闭窗格、关闭全部）；文件列表**中键**打开永久标签；`Ctrl+Tab`/`Ctrl+Shift+Tab` 循环标签；空标签的右键菜单隐藏复制路径/打开关系图等文件项。
- **跨窗格拖拽**：拖拽载荷携带 `{paneId, index}`，所有标签栏接受任意窗格的拖动；拖到另一窗格或空窗格标签栏即移动，目标 pane 获得焦点，源 pane 被拖空时自动收起，目标已有同一文档时只聚焦不重复。
- **拖到窗格边缘分屏**：拖动靠近 pane 四边 48px 内会高亮该边所在的 1/3 区域，松手后按方向拆出新 pane 并放入标签；`tab-drag.ts` 统一 tab strip 与 pane 边缘的载荷解析。
- **验证**：`tsc` 0、729/729；新增 pane 测试覆盖跨窗格移动、源 pane 收起、重复文档聚焦、右/左/下边缘分屏、空新标签页填充与持久化；Playwright 实测空标签、刷新恢复、最近列表与跨窗格拖动。

## 第一百零八轮：完整工作区恢复与最近打开（2026-11-09）

- **工作区记忆**：原先只记一个活动 `path`，现在记录每个 pane 的标签路径/顺序/预览标记/活动标签、pane 大小、分屏方向、活动 pane、视图、右栏和最近 8 篇；`useVaultTabs` 在首帧前应用恢复快照，避免标签闪烁。
- **空白页也记住**：所有标签关闭后保存的是空 pane，重启后停在同一空白页，不会自动打开旧笔记。
- **宿主副本**：`view-memory` 路由把同一记录写入 `.data/view-memory.json`（按 vault 根分键、上限 8 pane/50 标签/20 最近、路径 4k 上限）；localStorage 缺失时从宿主恢复，恢复完成前禁止写回，避免首帧覆盖真实记录。
- **空白启动页**：库名 + 快速切换行 + 新建笔记/打开笔记/新画布/关系图/全库搜索/切换知识库六张卡 + 最近打开 chip；动作在 `VaultPage` 组装后穿透到每个 pane。
- **验证**：`tsc` 0、729/729；新增 workspace-memory 测试覆盖 pane/tab 往返、空页、非法记录丢弃、最近列表校验；Playwright 实测两标签整页刷新恢复、关闭全部后空白页保持、空 localStorage 的新浏览器从宿主恢复、最近列表点击。

## 第一百零七轮：图谱重播波浪动画（2026-11-09）

- **重播重做**：原来按 degree 排序后 `floor(rank * reveal)` 批量 unhide，大图一次跳几百个、节点无缩放、4k 条边同时出现，且每帧 `setReveal` 触发 React 重渲染。现在用确定性 BFS 计划（中心/hub 先出、距离决定波次、路径哈希抖动打散节奏），每节点独立淡入 + 55%→105%→100% 弹性缩放，边按两端较晚者分四档 alpha 渐显，进度放进 ref 由 rAF 驱动，不再每帧重渲染。
- **无障碍修正**：显式重播是用户动作，不再因 `prefers-reduced-motion` 直接跳到最终帧（此前在系统关闭动画的机器上表现为按钮无效）。
- **验证**：`tsc` 0、新增 9 条 reveal 测试；实机 400 节点/4136 边采样 23→86→175→290→400 节点、0→144→700→2042→4136 边；审核 `graph.replay-animates`/`graph.live-loop` 通过。

## 第一百零六轮：插件内硬编码清理与可移植部署（2026-11-08）

- **插件内路径**：brain-console 的 `BRAIN_ROOT`/`PYTHONW` 改为 `BRAIN_ROOT`/`BRAIN_PYTHONW`（或 `OBSIDIAN_VAULT/.brain`），未配置时启动接口返回明确错误；vault 配置从插件 patch 移到 profile；审计从 `/obsidian/api/status` 读 vault 根，39 个探针脚本统一走 `scripts/playwright-env.mjs`。
- **机器配置**：`setup-machine.ps1` 检查依赖、装依赖、克隆并补丁 better-sidebar、按模板渲染 profile（相对 `link:`）、写 `machine.env.ps1` 与 `start-dsh.cmd`；`start-dsh.ps1` 只接受本次启动后新增的 URL，避免打开旧 token。
- **模板与发布**：新建库只种规范（笔记编写规范/kb-conventions/起步说明）与可移植 `.obsidian` 预设；插件补 author/repository/LICENSE/RELEASE.md/release-check，保持 `private: true` 未发布。
- **验证**：`tsc` 0、721+ 测试、`release:check`、临时 DSH_HOME 渲染通过；真实 profile 重渲染后 GUI 与插件正常。

## 第一百零五轮：打印对话框重设计——分页预览与选项记忆（2026-11-08）

- **布局重设计**：对话框从 920px 两栏改为 `min(1160px, 96vw)`，主体 `grid` 拆成 268px 选项栏（独立滚动 + 右边框）与自适应预览区；预览区固定「纸张 · 方向 / 共 N 页」信息条、可滚动的页面栈、底部估算说明；操作按钮回到标准 `dialogFooter`，摘要信息不再与顶栏重复。860px 以下转单列，选项栏限高 42vh。
- **分页预览**：用离屏 iframe 按纸张内容宽（`sheetSizeOf` − `2 × marginPxOf`）测量文档高度，`ceil(total / contentHeight)` 得页数（上限 30）；每页一个白纸盒，内部 iframe 高 `(index+1) × contentHeight` 并 `translateY(-index × contentHeight)` 切片，页下标注「第 N 页」。`printDocumentHtml` 新增 `preview.contentWidth`，用 `@media screen` 收窄 body 宽度，测量与真实打印共用一个文档。`useFitScale` 以 `ResizeObserver` 按预览栏宽度缩放整页。
- **字号语义修正**：`pageRule` 由 `body { zoom }` 改为 `body { font-size: calc(14px * scale) }`——zoom 会把排版撑出纸张内容框、右侧被裁切；`PRINT_CSS` 内固定 px 的字号（`pre/code`、属性区、标签 chip）改为 em，随字号缩。
- **功能完善**：选项用 `localStorage`（`dsh-obsidian-vault:print-options`）逐字段校验后记忆；新增「恢复默认」；Escape 改为 window 监听（原 `dialog` 无 tabIndex 收不到键）；内容筛选抽出 `cloneForPrint`，打印窗口与 PDF/预览现在一致地剔除未勾选区块。
- **缺陷修复**：`PrintDialog` 原先渲染在 `<article>` 内部，`cloneForPrint(article)` 会把对话框连同其预览 iframe 一起克隆（iframe 的 `srcdoc` 再嵌套整篇文档），实测 A4→A5 页数从 2 涨到 10、关闭属性后涨到 25。对话框移到 article 外，并在克隆时兜底移除 `.ov-dialog-layer`；修复后 A4 2 页 / A5 4 页且稳定。
- **验证**：`tsc` 0、706/706、`tsdown` 成功；实机 A4 2 页、A5 4 页（关属性 4 页、正文高度 2420px）、5 个 Toggle 正常，截图 `.artifacts/ui/print-dialog{,-a5,-toggled}.png`；审核 `note.print-command` 改为「工具栏开对话框 → 主按钮打印」，1/1 通过、0 控制台错误。

## 第一百零四轮：打印对话框风格统一（2026-11-08）

- **复选框收编**：「包含内容」三项与「仅 PDF 生效」两项从原生 checkbox（`ov-image-choice`）换成 kit `SettingsRow + Toggle`，与设置页同一开关语言，标签列 104px 对齐其余下拉行；`ov-image-choice` 仅剩 ImageInsertDialog 使用。
- **按钮体系统一**：底栏「打印」升为主按钮 `dialogButtonPrimary`，「导出 PDF」「取消」统一 `dialogButton`（取消此前误用 `css.button`）。
- **布局微调**：`.ov-print-options > .ov-settings-group:first-child` 上边距归零，与设置区规则对齐。
- **验证**：`tsc` 0、699/699、`tsdown` 成功；实机截图确认 5 个 Toggle 渲染与交互正常、标签列对齐、主按钮高亮（`.artifacts/ui/print-dialog*.png`）。

## 第一百零三轮：设置页迭代——双表单隐患修复与共享行组件（2026-11-08）

- **双表单隐患修复**：vault/index 五字段（库路径、忽略列表、单文件上限、索引上限、索引深度）原本同时出现在「通用」区与 pur-studio 插件详情的画布设置里，两份独立草稿各自保存会互相覆盖陈旧值；画布设置区删掉这组字段（`CanvasSettingsDraft`/`draftOf`/`patchOf`/`MB` 常量与对应 JSX），唯一归属留在通用区（其模块注释本就声明 owns 这些字段）。
- **共享行组件**：`SettingsRow` 提进 `ui/kit/controls.tsx` 并导出（104px 标签列 + 控件 + 可选单位后缀）；`GeneralSettings` 的本地 `Row` 与 `PluginPanel` 的本地 `SettingsRow` 两个逐字相同的实现删除，统一从 kit 导入。
- **样式微调**：chrome.ts 设置首组 `margin-top` 归零（`.ov-settings > .ov-settings-group:first-child`）；textarea 所在行顶对齐（`:has(.ov-settings-textarea)` 时 `align-items: start`，标签补 6px 上 padding），多行文本的标签不再垂直漂在中间。
- **设置有效性审核**：逐项核对通用 vault/index 五字段与画布 18 项设置——`src/settings.ts` 有默认值 + zod schema + clamp 解析，`vault/plugin-settings.ts` 的 `PATCH_KEYS` 白名单全部接收并回显，消费方覆盖 pur-kernel（指针/自动平移/手势/背景网格）、导出器、`PurStudioPane`；阅读/搜索/面板宽度等本地偏好走 localStorage，`useInlineBacklinks`/`QuickSwitcher`/`usePaneWidths` 均在消费。结论：全部真实持久化且被消费，无摆设项。
- **验证**：`tsc` 0、**699/699**、`tsdown` 成功；定向审核 `settings.dialog-plugins` + `ui.ribbon-settings-gear` 2/2、0 控制台错误。

## 第一百零二轮：对话里 @ 笔记（2026-11-08）

- **@ 触发源**：客户端 apply 通过 `ctx.inject(['inputTriggers'], …)` 注册一个 `@` 源（`obsidian-notes`，隐藏分组标题）：输入 `@` 后用知识库的 `/search` 路由按标题/路径列出笔记，最多 12 条，带标题、路径与所在文件夹。
- **引用 chip**：选中后插入 `appearance: 'file'` 的引用，剪贴板/持久化形态是 `@[[相对路径]]`；模型序列化在发送时读取笔记，包成 `<obsidian-note path vault>` 块，上限 8000 字符，超出时附总字符数与完整路径。
- **解耦**：只走插件自己的 HTTP API（search/file/status），不 import DSH 客户端包、不依赖宿主改动；服务缺失时 apply 静默跳过，非对话组合不受影响。
- **验证**：7 条纯函数/触发源测试（候选映射、12 条上限、序列化截断、chip 插入、abort 短路）；实机输入 `@工具` 弹出 12 条笔记候选，选中后草稿出现引用 chip；`tsc` 0、`699/699`、审核 102/102。

## 第一百零一轮：大图自适应节奏与图谱基准（2026-11-08）

- **自适应 tick**：新增 `tickIntervalMs(nodeCount)`——≤600 节点 60fps、≤1500 40fps、≤3000 25fps、更大 15fps；inline 与会话 worker 都按它排 tick，持续动画在大图下不再把主线程或 worker 打满，同时不会冻住。
- **图谱基准**：`scripts/graph-scale-bench.mjs`（`npm run bench:graph`）直接驱动 `Simulation`，输出每 tick 耗时、目标间隔、堆增量，默认 80ms/tick 预算。实测 1000 节点 6.57ms/tick（目标 25ms）、5000 节点 64.17ms/tick（目标 66.7ms）、堆 13.4MB。
- **验证**：3 条节奏测试（阈值切换、最小约 15fps）；`tsc` 0、`692/692`、审核 102/102。

## 第一百轮：悬停聚焦与图例折叠（2026-11-08）

- **悬停聚焦**：非邻居节点透明度从 0.2 压到 0.12、非邻居连线从 0.2 压到 0.1，邻居节点与连线保持满亮，焦点一眼可见；`layoutLabels` 新增 `neighbours` 选项，悬停时邻居名称优先进入标签队列，不再被高连接度节点挤掉。
- **图例折叠**：配色桶计算抽成纯函数 `graph/legend.ts`（按文件夹/首标签分组、根目录排除、分组色优先、标签模式无标签回落到文件夹）；图例默认显示前 6 个，其余折叠成「+N」，点开展开全部、再点收起。
- **验证**：5 条图例测试；实测主库图例 6 + 「+3」，展开后 10 条；悬停截图邻居高亮、其余明显变暗；`tsc` 0、`689/689`、审核 102/102。

## 第九十九轮：去掉箭头，图谱持续动画（2026-11-08）

- **箭头移除**：连线只画直线，不再绘制箭头；`display.arrows` 字段、设置面板的「箭头」开关、`graph.json` 的 `showArrow` 映射与 `drawArrow` 一并删除，旧值 `showArrow` 读取时忽略。
- **持续动画**：`display.animate`（默认开，设置里的「持续动画」）。`Simulation` 新增 `animate` 与 `setAnimate`：开启时 alpha 保底 `ANIMATE_ALPHA = 0.015`，永不进入冷却；关闭后恢复原有衰减到睡眠。设置写回 `graph.json` 的插件键 `dshAnimate`。
- **热切换**：inline 与 worker 两种会话都支持运行中开关（worker 新增 `animate` 消息）；关掉后会话会自然冷却，重新打开会把已冷却的会话唤醒。
- **验证**：3 条模拟测试（关闭会冷却、开启不冷却、热关闭后能冷却）；实测开启时 1 秒 61 帧、设置面板显示「持续动画」且无「箭头」；`tsc` 0、`684/684`、审核 102/102。

## 第九十八轮：分组颜色真正生效（2026-11-08）

- **问题**：设置面板写出的分组查询带前缀（`path:项目`、`tag:性能`），但 `groupColorOf` 拿整串做子串匹配（haystack 是标题+路径），前缀永远匹配不到，导致已有分组全部失效、节点只能落到自动配色。
- **修复**：新增 `render/group-color.ts`，按 Obsidian 语义解析 `path:` / `file:` / `tag:`（带引号也支持，tag 可带 #），普通文本仍是标题+路径子串匹配；分组按声明顺序取第一条命中，空查询跳过。场景渲染把节点标签一并传入。
- **图例跟随**：`GraphLegend` 的颜色改为「命中分组取分组色，否则取自动色」，和节点一致；面板分组区加一行说明「分组颜色优先于自动配色」。
- **验证**：6 条分组匹配测试；实测图例色点变为分组色（外部大脑 #cc99ff、工具链 #5cdeff、项目 #d42017…），节点按组着色；`tsc` 0、`681/681`、审核 102/102。

## 第九十七轮：图谱图例、节点尺寸与静止降帧（2026-11-08）

- **配色图例**：工具栏下方新增 `GraphLegend`，按当前配色模式聚合可见笔记，取数量前 6 的文件夹/标签（色点与节点同色）。点击一条把过滤条件设为 `path:<文件夹>`（标签模式则设标签过滤），再点清除；根目录文件不进入图例。
- **节点尺寸**：度数半径从 `sqrt(degree)*2.1` 改为 `degree^0.7*2.4`（上限 14），高连接节点更大；新增 `screenRadius`，缩放时半径不低于 2.2 屏幕像素，避免大图 fit 后节点缩成点；渲染与命中测试共用同一函数，点击区域与视觉一致。
- **静止降帧**：循环不再休眠，但静止（无交互、无镜头移动、无动画值变化）时降到约 15fps（66ms 一帧），一旦 `wake()` 或镜头数值变化立即回到满帧；切后台才停。
- **验证**：`tsc` 0、`675/675`（+3 尺寸测试）、`check:boundaries` 通过、审核 102/102；实测图例 6 条、点击后节点 400→182 且查询为 `path:外部大脑`、清除后恢复。

## 第九十六轮：图谱配色与实时循环（2026-11-07）

- **自动配色**：新增 `display.colorBy`（按文件夹 / 按标签 / 单色，默认文件夹）；`render/colors.ts` 用 FNV-1a 把文件夹或标签哈希成稳定 HSL，显式分组（graph.json 的 colorGroups）仍然优先，标签/附件/未解析/中心节点保留语义色。设置面板在「显示」里加下拉框，选择写回 `graph.json` 的插件键 `dshColorBy`，刷新后不丢。
- **实时循环**：删掉「空闲 60 帧后休眠」的逻辑，画布在可见期间持续用 rAF 重绘；切到后台（`document.visibilityState === 'hidden'`）才停，避免无谓耗电。之前的休眠依赖各交互主动唤醒，悬停空白、镜头滑行等场景会漏唤醒，表现为图谱突然定住。
- **审核**：`graph.idle-sleeps` 改为 `graph.live-loop`（断言 1.2s 内帧数仍增长）；新增 6 条配色/持久化测试。
- **验证**：`tsc` 0、`672/672`、`check:boundaries` 通过、审核 102/102。

## 第九十五轮：属性编辑、打印与大库基准（2026-11-07）

- **属性编辑**：properties 面板的值从只读变可点编辑；保存走 `POST /note` 的 `baseMtime` 409 保护，`frontmatter-edit.ts` 只重写目标键所在行，注释、数组、未触及的行逐字节保留；清空值即删除该键，键不存在时补进现有块，笔记无 frontmatter 时新建块。值按用户输入的原始 YAML 文本写入，`true`/`42`/`[a, b]` 类型不变。6 条纯函数测试 + 审核 `note.property-edit-persists`（写入后读回文件并还原）。
- **打印**：阅读视图新增「打印」；`printNote.ts` 把 `article` 克隆进新窗口，附一套纸面样式（正文宽 760px、白底、表格/代码/标注不跨页），应用外壳与按钮不进入打印件，浏览器打印对话框直接可另存 PDF。审核 `note.print-command` 用 stub 的 `window.open` 断言只开一次。
- **大库基准**：`vault-scale-bench.mjs` 生成 N 篇合成笔记并用宿主 `VaultIndex` 建索引/搜索，输出索引耗时、搜索 p95、堆增量，默认预算 8000ms/400ms，超限退出 1；`npm run bench:vault`。实测 5000 篇：索引 868ms、p95 2.4ms、堆 24.8MB。
- **验证**：`tsc` 0、`666/666`、`check:boundaries` 通过、审核 `102/102`。

## 第九十四轮：源码编辑器补上高亮与查找（2026-11-07）

- **色彩层**：`SourceEditor` 改为「镜像 `<pre>` + 透明 textarea」——两者字体、行高、字距、内边距、换行规则完全一致，token 只改颜色不改字宽，光标与字形不漂移；`markdown-tokens.ts` 按行切 frontmatter / 围栏代码 / 标题 / 列表 / 引用，再叠行内代码、双链、链接、粗斜体、标签，范围不重叠。
- **查找替换**：工具条「查找」与 `Ctrl+F` 打开编辑器内查找条，显示 `当前/总数`，支持上一个/下一个、替换、全部替换、Esc 关闭；编辑器根节点拦截 `Ctrl+F` 并阻止冒泡，避免和页面全文搜索同时打开。
- **编辑快捷键**：`Tab`/`Shift+Tab` 整行缩进/反缩进，`Ctrl+B/I/K` 包裹选区，回车自动续列表/任务/引用并递增序号。
- **纯函数**：查找/替换/缩进/包裹/续行全部落在 `source-edit.ts`，新增 7 条 token 测试 + 7 条编辑测试；审核新增 `note.editor-colour-and-find`（token 数、查找计数、不误开全文搜索）。
- **验证**：`tsc` 0、`660/660`、`check:boundaries` 通过、审核 100/100；真实笔记实测 41117 字符，token 计数 67 标题 / 160 粗体 / 709 代码 / 17 链接，字体与内边距对齐。

## 第九十三轮：把画布与笔记的边界写进代码（2026-11-07）

- **公开入口收敛**：新增 `client/pur/integration.ts`，工作区只通过它使用画布（`PurStudioPane` 与命令注册）；`useAsk`/`AskDialog` 从 `client/ui` 移到 `client/ui/kit`，画布不再 import 工作区内部；宿主对内核的深层 import（`studio-file`、`controller-run`、`types`）全部改走 `pur-kernel/index.ts`。
- **边界校验**：新增 `scripts/check-boundaries.mjs`（`npm run check:boundaries`），按「内核 / 画布 UI / kit / 工作区 / 宿主 / Obsidian 适配器」六层扫描 import，违规即退出 1；规则与理由写在 `docs/BOUNDARIES.md`。
- **审核抗抖**：`ui-full-audit.mjs` 的单条检查失败后先按 Esc 清浮层再重试一次，仍失败才记 FAIL 并截图；此前 `graph.idle-sleeps`、`graph.reset-view`、`note.unresolved-link-creates` 都出现过单次偶发。
- **文档同步**：README「已知差异与限制」改成「能力与已知限制」矩阵，修正了「不做编辑 / 图谱无过滤 / 标签页无历史」三处与代码不符的说明。
- **验证**：`tsc` 0、646/646、`check:boundaries` 通过、审核 99/99。

## 第九十二轮：画布 UI 全部收敛到 kit（2026-11-07）

- **kit 扩展**：新增 `styles/pur.ts`（编辑器对话框框架、分区头/分隔线、栅格与行列、菜单尺寸、悬停提示条、通知 toast）；dialog.ts 增加 `ov-dialog-layer-center`、`ov-input`（带 focus 品牌描边与 `color-scheme: dark`）、`ov-field`、`ov-field-label`、`ov-color-swatch`、`ov-color-value`；shell.ts 增加 `ov-button-danger`；workspace-shell.ts 增加 `ov-menu-separator`。
- **画布侧改走 kit**：`editor-frame.tsx` 的手写对话框壳与 `purInputStyle`/`purLabelStyle`/`purColorStyle` 三个内联样式对象整体删除，改用 `ov-dialog` + `ov-pur-*`；`editors.tsx` 全部输入控件改 `ov-input`、删除键改 `ov-button-danger`；`menu.tsx` 的 z-index 1000/1001 收进 `ov-menu-layer`/`ov-menu-sub` 层叠体系，分隔线走 token；`pane-overlays.tsx` 的 `NOTICE_STYLE`、`PurStudioPane.tsx` 的悬停提示内联样式删除；`PluginPanel.tsx` 两个 iconButton 宽度 hack 改 `ov-dialog-button`。
- **顺手发现**：`ov-button-primary` 此前被编辑器页脚引用但 kit 里**没有对应规则**（主按钮一直渲染成幽灵按钮）；页脚统一改用 `ov-dialog-button`/`ov-dialog-button-primary`。
- **验证**：`tsc` 0、**646/646**、`tsdown` 成功；定向审核 12/13（`plugins.core-toggle-persists` 失败是 `--only` 缺少前置 vault 切换的顺序假象，非回归；已把误写进真库的 graph 开关恢复）。宿主进程反复 exit -1 崩溃且 pnpm 报 disk I/O error（环境问题，与本次改动无关），全量审核与画布渲染抽查待宿主稳定后补跑（抽查脚本 `.artifacts/ui/unify-check.mjs`）。

## 第九十一轮：SourceEditor 自撞冲突竞态修复 + 审核收尾（2026-11-07）

- **竞态修复**：`SourceEditor` 的 `baseMtime` 由 `useState` 改 `useRef` —— 自动保存飞行中排下的防抖定时器捕获旧闭包，拿着保存前的 mtime 去写，与刚完成的自动保存自撞 409（`note.editor-conflict-bar` 误报冲突条）。改为 ref 后定时器永远读最新版本。
- **审核收尾**：定向复跑 `note.source-and-reading-roundtrip` 与 `note.editor-conflict-bar` 通过；全量审核 **99/99、0 控制台错误**（此前的 2 败即该竞态及其级联）。

## 第九十轮：性能基准与两项优化（2026-11-01）

- **基准工具** `scripts/pur-scale-bench.mjs`：生成 N 张互不相同的 640×480 PNG（内容寻址入库），拼成网格画布，测量文档大小、首屏耗时、JS 堆、以及缩放时的真实帧间隔（在页面内用 rAF 采样，不用协议往返）。
- **解码 LRU**：`image-lru.ts` + `PurImageMap` 改为按解码字节数计费（256MB 预算），按最近绘制顺序淘汰；被淘汰的图滚回视野时按需重新解码。附 3 个单测。
- **平铺阈值**：缩放 < 0.5 且屏幕面积 < 90×90 的图片不再解码，直接画色块 —— 缩小查看整版参考图时不再解码上千张全分辨率位图。
- **实测（本机，200 与 1000 张）**：
  | 场景 | 文档 | 首屏 | JS 堆 | 帧间隔 中位/p99 |
  |---|---|---|---|---|
  | 1000 图 @ 适应缩放 0.35 | 168KB | **86ms** | **54MB** | 16.7 / 18.5ms |
  | 1000 图 @ 0.8（真实解码） | 168KB | **143ms** | 45MB | 16.8 / 36.1ms |
  | 200 图 @ 0.35 | 34KB | 100ms | 54MB | 16.6 / 18.4ms |
- **验证**：`tsc` 0、**435/435**、审核 **99/99、0 控制台错误**。

## 第八十九轮：独立窗口 + 打开方式（2026-11-01）

- **弹出为独立窗口（需求 7）**：新增 `lib/popout.js` 独立包（React 打进包内，417KB）与 `client/popout.tsx` 入口，挂载同一个 `PurStudioPane`；宿主新增 `pur/popout`（返回极简 HTML）与 `pur/popout-js`（读磁盘返回 bundle）两条路由；菜单 `supportsPopout: true`，点击 `window.open(..., 'popup,width=1200,height=800')`。**需重启宿主**后该路由才存在。
- **打开方式（需求 2）**：新增 `system-open.ts`，固定列表 `系统默认 / Photoshop / WPS / 画图 / 其他程序…`，用 `where` 探测可用性；`spawn` 传参数组（路径永不拼进命令串），目标必须是库内真实文件或本插件资产。路由 `system/programs` 与 `system/open`；菜单在图片的「打开 ▸」下新增「打开方式 ▸」。实测子菜单 5 项齐全。
- **Obsidian 适配器**：同一动作映射到 `openWithDefaultApp`（官方 API，typings 缺失，用窄化断言补齐）。
- **验证**：`tsc` 0、**426/426**、`tsdown` 成功（client 2.33MB / popout 417KB）、审核 **99/99、0 控制台错误**。

## 第八十八轮：右键收纳（14 → 9 项）、双击卡片进入笔记（2026-10-31）

- **右键栏收纳**：元素菜单从 **14 项收敛到 9 项**。`打开 ▸`（打开/新标签页/右侧/打开关联笔记/跳转到嵌入的笔记）、`外观 ▸`（不透明度/锁定/适应视图）、`引脚 ▸`（增删输入输出）各自成组；`关联` 在只有一个子项时保持平铺，避免"单项子菜单"。实测子菜单内容齐全。
- **小三角与面板宽度**：面板从固定 210px 改为 `max-content`（168–280），三角固定贴右缘且垂直居中；子菜单改为与父项**顶对齐**，越界时上移。
- **双击卡片进入笔记**：`sink.ts` 的 `openLink` 仍走旧的 `noteOpen`（只写日志不导航），现已改为调用面板 `openPath`；实测双击 note-link 卡片 → 标签 `[双击探针]` ✅
- **选中后按 F**：实测「点击选中图片 → F」像素 92 → 303，**聚焦正常**；用户报告的异常需要更具体的复现步骤。
- **测试**：菜单 golden 由模型直接重算生成（9 个场景），**420/420**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十七轮：笔记卡刷新 + 画布索引失效修复（2026-10-31）

- **note-link 卡片随笔记刷新**：新增 `client/pur/refresh-links.ts`，重新解析每个库内 note-link 的目标笔记，文本变了就 `updateElement`；触发点=窗口获得焦点 / 可见性变化 / 命令面板「刷新关联笔记」（后者刷新后立即保存）。
- **根因修复**：`updateElement` 的 `note-link` 分支**漏了 `content`**，只处理 note/font/cardColor/link，所以刷新写不进卡片；补上后实测：外部把笔记改成「第二版内容」→ 执行命令 → 画布文件里卡片内容同步为「第二版内容」✅
- **P4 两处缺口（子 agent 补，我审核）**：
  1. 画布编辑不触发重索引 —— 签名只含附件路径。现在 `ScanResult.canvasKeys` 把画布 `version:size` 纳入签名，删掉 note-link 后旧反链会消失（此前一直残留）。
  2. 文本/代码卡里的 `[[笔记]]` 未提取 —— 现在复用 `scanWikiLinks`，并在模块头写清覆盖范围与不覆盖项。
  顺带把签名从内嵌 NUL/0x01 改成 `JSON.stringify([...])`，`scan.ts` 恢复为可 diff 文本；`rebind()` 清空 `canvasRefs`；protocol 里被截断的 JSDoc 修正。
- **测试**：**420/420**（+2 画布索引失效与 wiki 链接用例）；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。
- 提交：`cba498e187`（笔记卡刷新）、`215fc376e2`（画布索引/wiki 链接）。

## 第八十六轮：保存冲突端到端验证（2026-10-31）

- **接口实测**（重启宿主后）：`read-text` 返回 mtime；用当前版本写 → 200；用过期版本写 → **409 `{conflict:true,mtime}`**，文件内容保持外部版本（`{"v":2}` 而非 `{"v":3}`）。
- **界面实测**：打开画布 → 外部改写文件 → 画布内新建文本触发保存 → 弹出「画布已在外部被修改 … 覆盖会丢弃那边的改动，是否继续？」。
  - 选**取消** → 磁盘保留外部版本（`ext` 元素仍在）✅
  - 选**确定** → 强写画布当前状态（`ext` 被替换，元素数 1）✅
- **修正**：确认框此前不显示，原因是面板只调了 `ask.askConfirm` 却**没渲染 `ask.node`**；补上后对话框正常出现。
- **验证**：`tsc` 0、**418/418**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十五轮：画布保存冲突检测（2026-10-31）

- **协议**：`bridge/read-text` 返回 `mtime`；`bridge/write-text` 接受可选 `expectedMtime`，与磁盘 mtime 相差超过 1ms 时返回 **409 `{conflict:true, mtime}`**，不写入。
- **客户端**：`bridgeReadTextVersion` 读内容+版本；`bridgeWriteText(path, content, expectedMtime?)` 在 409 时抛 `VaultWriteConflict`；`saveStudioDocument(path, doc, force?)` 用载入时记录的版本做比对，成功回写新版本。
- **交互**：保存冲突时弹确认框「画布已在外部被修改 / 覆盖会丢弃那边的改动」，选覆盖才强写（`force`），取消则提示「已保留外部改动，本次未保存」。
- **守卫**：新增纯函数 `vault/write-guard.ts::isStaleWrite(current, expected)`（1ms 容差、任一侧未知则不拦），路由改用该函数，附 3 个单测。
- **测试**：**418/418**（新增 write-guard 3 例 + attachment-name 8 例）；`tsc` 0、`tsdown` 成功、审核 99/99。
- **注意**：`bridge-endpoints` 属宿主代码，**需重启 DSH 宿主**后冲突检测才生效。

## 第八十四轮：笔记坏图占位 + Obsidian 入库内容寻址（2026-10-31）

- **笔记正文坏图占位**：`NoteView` 在正文容器上以捕获阶段监听 `error`/`load`（`error` 不冒泡），失败的 `<img>` 前插入与盒子同尺寸的占位块（虚线 + 「图片不可用」），图片恢复后自动移除；尺寸取 `getBoundingClientRect`，拿不到就用 160×100，不产生布局跳动。文案走 i18n（`noteImageFailed`）。
- **Obsidian 入库按内容去重**：新增 `pur-kernel/attachment-name.ts`（`attachmentName(baseName, hash)` → `hash8-name.ext`，非法字符替换、保留扩展名），`pur-obsidian/paste-drop.ts` 的 `storeFile` 改为 SHA-256 内容寻址：同字节复用同一路径，不再堆 `_1`、`_2`。
- **审核修正**：子 agent 顺带把 `NoteView.tsx` 若干无关多行语句压成单行（+75/-26 的噪音）。已还原提交版本后**只重新插入特性块**，diff 收敛为 **+40/-0**；子 agent 只加了纯函数没接 `storeFile`，由我补齐接线。
- **测试**：新增坏图降级与命名去重用例，**407/407**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十三轮：多 agent 批次（占位/头部菜单/只读视图菜单）+ BOM 清理（2026-10-31）

- **坏图占位**：`PurImageCache` 用带 `failedKeys` 的 Map 记录解码失败，`onerror` 后触发一次重绘且不再重发请求；`render-cards` 对失败或空 key 画**纯几何**占位（虚线内框 + 居中破图标记），kernel 内不出现任何文案。
- **笔记头部右键**：`NoteHeader` 新增可选 `onMenu`，在 `<header>` 上发 `{kind:'tree-file', path}`；`NoteView` 原样透传。实测头部右键得到 打开/新标签页/重命名/移动到…/复制 Wiki 链接。
- **只读视图右键**：图片 / PDF / 二进制 / 代码四个分支统一挂 `onContextMenu`，同样复用文件菜单；`MainPane` 透传 `onMenu`。
- **审核发现并修掉的问题**：仓库里 **50 个源文件带 UTF-8 BOM**（会话中 PowerShell 写入所致），会让每次 diff 的首行都变脏；已全部剥离并复查（0 残留）。
- **测试**：新增 `tests/pur-image-placeholder.test.ts` 等 9 例，**402/402**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十二轮：右栏面板行右键（2026-10-31）

- **反链行 / 书签行**接上共享文件菜单：右键即得 `打开 / 在新标签页打开 / 重命名 / 移动到… / 复制 Wiki 链接 / 在关系图中打开 / 添加书签 / 复制路径 / 删除`。
- 复用 explorer 的 `tree-file` scene（行列出的本来就是真实库内文件，语义完全一致），没有新增一套菜单实现。
- 实测：打开一篇有反链的笔记 → 右栏反链 → 右键首行 → 菜单 6 项齐全。
- **验证**：`tsc` 0、**393/393**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十一轮：画布引用进入反链与图谱（P4，2026-10-31）

- **新模块** `vault/canvas-refs.ts`：解析 `.PurStudio` JSON，收集元素树里的 `link` 字段（含分组子元素），跳过 URL 与资产 id；大于 4 MB 的画布不解析。
- **扫描**：`store.collectCanvasRefs()` 在每次扫描后读一遍画布附件（经 `resolveInVault` 定位），把引用按画布路径缓存；签名不变时跳过（`refresh` 的早退保留）。
- **派生**：`deriveIndex(notes, attachments, canvasRefs)` 新增画布反链 —— 目标必须是现有笔记，条目带 `source: 'canvas'`、`context: '画布引用'`、`line` 为引用序号；同时把画布与笔记连进邻接表。
- **图谱**：`buildGraph` 之前只给「被笔记链接到的附件」建节点，画布因此从不出现；现在邻接表里出现的附件也建节点。
- **界面**：反链面板在画布来源的分组头显示「画布」标记。
- **测试**：`tests/vault.test.ts` 新增 1 例（画布引用 → 目标笔记反链含该画布且 `source==='canvas'`，图谱含画布节点），**393/393**。
- **验证**：`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第八十轮：在右侧打开真分栏（2026-10-31）

- **实现**：`splitPane` 的语义是「把当前活动标签移到新面板并聚焦」，所以顺序为 `openPath(path, { newTab: true })` 再 `splitPane('row')`，新标签自然落到右半边。
- **实测**：右键 note-link →「在右侧打开」→ 面板数 **2**，标签 `[菜单探针.purstudio, 关联探针]`，笔记在右栏 ✅
- 至此「打开 / 在新标签页打开 / 在右侧打开」三种 destination 全部有真实行为，不再退化。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十九轮：新标签页 destination 打通（2026-10-31）

- **根因**：工作区把 `onOpenWithAnchor`（锚点处理器）当作 pane 的 `onOpen`，于是画布传来的 destination（`new-tab`）被当成**标题锚点**解析 → `openPath(path, { anchor: 'new-tab' })`，自然不叠加标签。
- **修法**：`VaultWorkspace` 的 pane `onOpen` 先判断第二个参数是否为 `current/new-tab/right`，命中就转给 `onOpenPath`（destination 语义），否则仍走锚点分支；`MainPane` 的 `onOpen` 类型放宽为 `(path, argument?: string)`。
- **实测**：`打开` → 标签 **[关联探针]**（替换，符合预期）；`在新标签页打开` → 标签 **[菜单探针.purstudio, 关联探针]**（叠加 ✅）。
- **诊断手段**：临时在 `host.openLink` 打 `console.warn('PUR_OPEN', target, destination)` 抓运行时值，确认 destination 到达且 `openPath` 存在，定位到它被误当锚点；问题解决后已移除日志。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十八轮：画布元素「打开」真正导航（2026-10-31）

- **修好「打开」**：`openPurLink` 对 vault 路径只调 `noteOpen()`（只写日志，不导航），且 `destination` 在 host 层被整个丢弃。现在 `openLink(target, destination)`：URL 走浏览器标签；vault 路径走 `openPath(target, destination)`，由工作区决定当前页/新标签。
- **穿线**：`PurStudioPane.onOpenPath` 与 `PurMenuHostDeps.openPath` 增加可选 destination；`FileView`、`VaultWorkspace` 的 prop 类型同步放宽；`VaultPage` 把 `new-tab`/`right` 映射成 `openPath(..., { newTab: true })`。
- **实测**：右键 note-link →「打开」→ 标签页从 `菜单探针.purstudio` 变成 `关联探针` ✅（此前完全无反应）。
- **已知边界**：`在新标签页打开` 目前与「打开」同效（未叠加标签页），已记录待查；`在右侧打开` 同样退化为新标签。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十七轮：审计落地的三个真 bug（2026-10-31）

- **导入/粘贴/拖入图片失效**：`storeImage` 仍按旧契约读 `result.path`，而路由已改为返回 `{id, ref}` → 拿到 `undefined` → `path.length` 抛 TypeError，图片静默不插入。改为返回 `ref`（`pur-asset:<id>`）。
- **不透明度滑块仍"拖不动"**：React 的 `onChange` 在 range 上映射到原生 `input`，**拖动过程中连续触发**，于是第一步提交并关菜单。改为 `onInput` 只做预览、`onPointerUp`/`onKeyUp` 提交并关闭。
- **适应视图遇连线变空白**：`elementBounds` 把连线也算进包围盒，而连线没有 `x/y/w/h`（可选字段）→ 早期版本产生 `NaN`/`-0`。现在连线直接跳过（它没有盒子）。
- **P4 并行任务中断**：子 agent 的 scan/derive 改动使 `index-scan.ts` 参数不匹配、33 个测试失败，已回滚该目录，保持主干绿。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十六轮：图片预览（打开/新标签页/右侧）、适应视图健壮化（2026-10-31）

- **「打开 / 在新标签页打开 / 在右侧打开」重新设计并落地**：`window.open` 在 webview 里被拦、`location.assign` 会把画布整页顶掉，所以三者统一走**应用内预览**：`current`/`new-tab` 居中浮层，`right` 贴右半屏；Esc、点背景、点 × 均可关闭。实测：居中预览出现（dialog=1、img=1），右侧停靠宽 430.5/861 = 半屏，Esc 关闭。
- **适应视图健壮化**：新增 `view-bounds.ts`，用绝对坐标递归求包围盒（分组内元素的相对坐标、缺失 w/h 都有兜底），`fitToView` 对 NaN/零尺寸/零面积做保护。之前分组或缺少尺寸的元素会让 `min/max` 变成 NaN，缩放算成 0 或 NaN。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十五轮：右键三项真 bug + 菜单尺寸（2026-10-31）

- **不透明度滑块拖不动**：遮罩层 `onMouseDown` 会关菜单，滑块没有阻止冒泡 → 一按就关。滑块补 `mousedown`/`pointerdown` 的 `stopPropagation`，实测提交后 `opacity: 0.4` 落盘、菜单才关闭。
- **适应视图失灵（真 bug）**：面板给控制器传的 `canvasWidth/Height` 被**硬编码为 1**，`fitToView` 于是算出 `scale ≈ 1/世界宽`，等于缩到看不见。改为 getter，按实际 canvas 尺寸取。实测适应后画面非背景像素 **46 → 303**。
- **「打开 / 新标签页 / 右侧打开」对插件资产无效**：这些图的 `original` 是 `pur-asset:<id>`，不是库内路径，`openLink` 打不开。新增 `openAsset(id, destination)` 主机能力，`pur-asset:` 引用走 `pur/asset` 路由预览；Obsidian 端提示不支持。
- **菜单尺寸**：主菜单 250 → **210**，子菜单 200 → **180**，配合标签省略号，三角贴右侧不再空一大截。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十四轮：子菜单可点 + 逐项实测（2026-10-31）

- **又一个层叠问题**：子菜单 portal 出来后被遮罩层（`z-index: 1000`）盖住，**看得见但点不到**（点击落到遮罩上 → 菜单直接关闭）。子面板补 `z-index: 1001` 后正常。
- **逐项实测**（真实磁盘校验，不是看面板）：
  - `层级 → 置于底层`：元素顺序 `["i1","i2"]` → `["i2","i1"]` ✅
  - `排列与对齐 → 左对齐`：两个元素 x 从 `40 / 300` 变为 `40 / 40` ✅
  - `统一缩放` 子项：`等高`/`等宽` 存在且可点
  - 子菜单实测清单：层级 `置于顶层/上移一层/下移一层/置于底层`；排列与对齐 `顶对齐/左对齐/居中对齐/水平等距`；保存导出 6 项
- **补齐认知**：`排列与对齐`/`统一缩放`/`连线`/`创建群组` **只在多选时出现**（单选菜单没有），这解释了之前"找不到"的现象。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十三轮：修好画布右键的三角子菜单（2026-10-31）

- **现象**：右键菜单里带 ▸ 的项（层级、保存/导出、排列与对齐…）悬停后**完全看不见**子菜单。
- **根因**：子菜单用 `position: absolute; left: 100%` 渲染在父菜单**内部**，而父菜单是 `overflow-y: auto` 的滚动容器（CSS 里就有），后来我又加了 `overflow-x: hidden` —— 绝对定位的子面板被父容器裁剪，等于永远不可见。
- **改法**：子菜单改用 `createPortal` 渲染到 `document.body`，配合 `position: fixed` 与悬停项的 `getBoundingClientRect()` 定位（右侧 +2px，并对视口做夹取）。嵌套层用同一套逻辑，每层各自 portal。
- **实测**：悬停「保存/导出」→ 出现第二个面板 210×193，位置在父菜单右侧（x=1000 vs x=729），内容为 保存为 .PurStudio / 保存为 Markdown / 生成可运行代码 / 导出为 PNG / 导出为 JPG / 导出 JSON Canvas；截图确认可见。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十二轮：图片→笔记跳转、菜单滚动条、右键菜单收敛（2026-10-31）

- **「跳转到嵌入的笔记」**（新增，图片菜单常驻）：画布右键任意图片 → 反查哪篇笔记引用了它。实现 `pur/embedders`：先用搜索索引缩小候选，再只读这几篇校验 `pur.studio/<画布>/<文件>`，实测 `{"notes":["嵌入探针.md"]}`；点击后笔记在标签页打开（探针确认 tabs 变成 `嵌入探针`）。
- **修掉导航断点**：面板把 `onOpenPath` 塞进 host deps，但 deps 类型叫 `openPath`，导致 `openLinkedNote`/跳转全部静默无效；键名改对后跳转生效。
- **菜单滚动条**：`.ov-menu` 补 `overflow-x: hidden`，`.ov-menu-item` 补 `white-space: nowrap`，横向滚动条不再出现（截图里底部那条）。
- **菜单收敛**：`弹出为独立窗口`/`启动系统置顶`/`在资源管理器中显示` 在 DSH 侧不再出现（能力位），Obsidian 侧保留。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十一轮：标签栏右键补全（2026-10-31）

- **问题**（审计记录）：`tabbar-empty` 场景名义接线，但守卫 `event.target !== event.currentTarget` 让它只能命中标签栏 6px 内边距 / 2px 间隙，`+` 按钮与溢出按钮右键全无反应。
- **改法**：守卫换成「命中 `.ov-doctab` 才放行给标签页自己的菜单」，其余位置（内边距、`+`、溢出）统一打开 `tabbar-empty`。
- **实测**：右键 `+` 按钮 → 菜单 `["新标签页","快速切换Ctrl O","关闭全部标签页"]` ✅
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第七十轮：外部化实测 + 画布右键「打开关联笔记」（2026-10-31）

- **实测（真实 119MB 画布 `Pinterest收藏4`）**：

| 指标 | 改造前 | 改造后 |
|---|---|---|
| 画布文件 | 119.3 MB | **126 KB** |
| 打开耗时 | 9308 ms | **98 ms** |
| JS 堆 | 468 MB | **58 MB** |
| 平移 p99 | 50 ms | **16.8 ms** |

  261 张图全部搬进插件资产目录（`.data/images`，262 文件 / 89.4 MB），知识库无新增图片；原文件留 `.bak`（119.3 MB）。截图确认图片正常渲染。
- **新功能**：画布右键选中带 `link` 的图片 → 菜单出现「打开关联笔记」，直接跳回笔记；`嵌入当前笔记` 成功后会把目标笔记回写到元素的 `link`，形成画布→笔记的反向入口。
- **测试**：golden 菜单期望同步（图片场景新增 `openLinkedNote`），**392/392**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第六十九轮：画布右键菜单去掉假选项、修尺寸（2026-10-31）

- **「点了没反应」的根因**：`弹出为独立窗口`、`启动系统置顶`、`在资源管理器中显示` 在 DSH 面板里只有 `unsupported` 占位实现，点了只弹「不支持」。现在给 `PurMenuContext` 加三个能力位（`supportsPopout` / `supportsPinTop` / `supportsReveal`），DSH 面板全部置 false，菜单模型直接不生成这些条目；Obsidian 适配器置 true，功能照旧。
- **菜单尺寸**：宽度 180 → 260，横向溢出改 `overflow-x: hidden`，纵向 `max-height: calc(100vh - 24px)` 可滚动，不再出现底部横向滚动条。
- **实测动作**：右键文本卡片 → `创建副本` 元素数 **2 → 3**，`删除` **3 → 2**，落盘确认；`层级▸`、`保存/导出▸` 子菜单正常展开（menus=2）。
- **验证**：`tsc` 0、**392/392**、`tsdown` 成功、审核 **99/99、0 控制台错误**。

## 第六十八轮：图片资产归插件所有，知识库只做预览（2026-10-31）

- **架构改正**：图片不再写进知识库。资产放在**插件包内** `plugins/dsh-obsidian-vault/.data/images/<sha256前16位>.<ext>`，`.data/` 已加入 `.gitignore`。
- **引用方式**：画布元素 `original` 记为 `pur-asset:<id>`；渲染经 `pur/asset?id=<id>` 取字节；笔记里的 `pur.studio` 引用同样从这份资产解析（`resolvePurImage` 增加 `readAsset` 通道）。
- **外部化**：`pur/externalize` 把老画布里内嵌的 dataURL 搬进插件资产目录，元素改写成 `pur-asset:<id>`，写回前留 `.bak`；同字节共享同一资产。
- **知识库零污染**：不再创建 `附件/`，也不再往库里写任何图片文件。
- **测试**：`tests/pur-image.test.ts` 7/7（同字节去重、越权 id 拒绝、外部化含备份/改写/体积缩小/幂等），全量 **392/392**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。
- **待生效**：三个路由（`pur/store-image`、`pur/asset`、`pur/externalize`）都在主机侧，需重启宿主。

## 第六十七轮：附件统一到 Pur 目录 + 旧画布外部化命令（2026-10-31）

- **附件位置改了**：从库根 `附件/` 改为 **`Pur画布/附件/`**（插件自己的目录），文件名 `sha256(内容)前16位.<扩展名>`，同图复用同一文件。
- **解析端同步**：`pur/image` 的候选路径增加 `Pur画布/附件/<original>`，老 `附件/` 仍作兜底。
- **旧数据迁移**：新增 `pur/externalize` 端点 + 命令面板条目「外部化画布图片（存入 Pur画布/附件）」。做法：读画布 → 逐个 dataURL 入库 → 元素只留路径 → 写回前先存 `<名>.PurStudio.bak`。幂等（第二次跑 replaced=0）。
- **测试**：`tests/pur-image.test.ts` 7/7（新增外部化：备份、路径改写、体积缩小、幂等），全量 **392/392**；`tsc` 0、`tsdown` 成功、审核 **99/99、0 控制台错误**。
- **待生效**：`pur/store-image` 与 `pur/externalize` 都是主机侧路由，需重启宿主。

## 第六十六轮：图片落盘存储（第一段，2026-10-31）

- **目标**：Web 端粘贴/拖入/选择的图片不再以 base64 塞进 `.PurStudio`，改为落盘到 `附件/` 并让元素只存路径。这是「122MB 画布 / 468MB 堆 / 9.3s 打开」的结构性修复。
- **新端点** `pur/store-image`：收到 `{ name, dataUrl }`，校验必须是 base64 data URL，按 **sha256 前 16 位**命名（`附件/<hash>.<ext>`），已存在则直接复用（内容寻址去重），否则写入。
- **三处插入路径改造**：剪贴板粘贴、文件拖入、文件选择器，统一走 `insertStoredImage` —— 先入库拿路径，`insertImage(x, y, path)`；**宿主没有该端点时自动回退**为原来的内联 dataURL，保证重启前后都不会坏。
- **测试**：`tests/pur-image.test.ts` +2（同字节两次入库返回同一路径且只写一次、非 data URL 拒绝入库），全量 **391/391**。
- **验证**：`tsc` 0、`tsdown` 成功、全量审核 **99/99、0 控制台错误**。
- **下一步**：旧数据迁移（把已有画布里的 dataURL 抽到附件）与渲染端缩略图/按需加载。

## 第六十五轮：修好笔记图片不显示的根因（2026-10-31）

- **现象**：笔记里 `![明暗-素描关系.jpeg](https://pur.studio/附件图管理/明暗-素描关系.jpeg)` 显示成一行文字，不是图片。
- **根因**：导出时画布名写的是**桶名**（`附件图管理`），而那份画布实际在 `Pur画布/附件图库/附件图管理.PurStudio`。解析器只查 `Pur画布/<名>` 与 `<名>` 两个固定位置，子目录里的画布找不到 → 404 → 裂图。
- **修法**：`PurFileReader` 增加可选 `locate(fileName)`（按文件名在库内查找），`routes.ts` 用 `vault.tree()` 实现；`readCanvas` 在固定目录落空后用它兜底。
- **实测（真实库）**：`附件图管理` 画布 12.2MB / 156 张图，`明暗-素描关系.jpeg` 解析出 **image/jpeg 15370 字节**，不存在的图返回 undefined。
- **测试**：新增「画布在子目录时按名找到」1 例，`tests/pur-image.test.ts` 4/4，全量 **389/389**。
- **验证**：`tsc` 0、`tsdown` 成功、全量审核 **99/99、0 控制台错误**。
- **注意**：`locate` 在主机侧，需重启宿主后笔记图片才会真正渲染。

## 第六十四轮：右键菜单可用性修复（2026-10-31）

- **「移动到…」子菜单跑出屏幕**：文件夹列表把全库目录都列出来，菜单高度 902px 超出 900 视口，底部条目点不到。面板加 `max-height: calc(100vh - 24px)` + `overflow-y: auto`，并扣掉 padding（实测 886px，落在视口内）。现在列表可滚动，所有条目可达。
- **「右键功能点了没反应」根因**：`window.prompt` / `window.confirm` 在嵌入式 webview 里被静默阻断，重命名、新建笔记、新建文件夹、从模板新建、删除全都返回 null 直接 return。新增 `useAsk` + `AskDialog`（应用内对话框），把 5 处原生调用全部替换；对话输入框自动聚焦、Enter 提交、Esc 取消。
- **穿线**：`VaultPage → useVaultActions / useVaultCommands → useVaultNotes`，`askText`/`askConfirm` 显式传递，不再有隐式全局弹窗。
- **审核**：新增 `answerAsk(text)` / `confirmAsk()` 两个辅助，把 6 处依赖原生 prompt 的检查改成驱动应用内对话框。
- **验证**：`tsc` 0、**388/388**、全量审核 **99/99、0 控制台错误**；真实交互探针确认重命名弹框可提交、删除可取消、移动到子菜单点得到且移动成功、在关系图中打开生效。

## 第六十三轮：笔记里的画布图片可点击跳回画布（2026-10-31）

- **闭环**：`rewritePurImages` 现在把 `![名](https://pur.studio/<画布>/<名>)` 改写成「图片包在指向画布的链接里」——`[![名](pur/image?…)](open?p=Pur画布/<画布>.PurStudio)`。阅读视图既显示真实图片，点击又回到那张画布。
- **测试**：改写用例期望同步为带链接的形态。**388/388**。
- **验证**：`tsc` 0、`tsdown` 成功、全量审核 **99/99、0 控制台错误**。
- 至此「画布 → 嵌入笔记 → 笔记显示图 → 点图回画布」四段全部接通（显示那一段仍等宿主重启，因为 `pur/image` 在主机侧）。

## 第六十二轮：嵌入当前笔记（B 阶段）+ 解析器改走文件服务（2026-10-31）

- **B 阶段（前端，立即生效）**：`embedInActiveNote` 从「不支持」改成真实实现——取画布中选中的图片元素（含 group 内嵌套），拼成 `![名](https://pur.studio/<画布>/<名>)`，通过笔记选择器选定目标笔记，读原文→追加（空行分隔）→保存。画布自身占着活动标签，所以目标笔记走选择器，而不是上游的「活动文件」。
- **抽纯函数**：`src/pur-kernel/embed-note.ts`（`purImageReference` / `selectedImageReferences` / `appendReferences`），导出器与嵌入动作写同一种引用，可单测。
- **A 阶段的修正**：`pur/image` 之前用 `vault.readAsset`，受索引门控——刚保存的画布不在索引里会 404。改为注入 `PurFileReader`（根内文件读取），`routes.ts` 用 `VaultFiles` 实现；已用真实库文件验过（70 字节 PNG 解析成功，缺失返回 undefined）。
- **i18n**：新增 `pur.embedNoSelection`（中/英）。
- **测试**：`tests/rewrite.test.ts` +2（引用生成含中文/空格编码、追加语义）、`tests/pur-image.test.ts` 改为注入 reader。**388/388**。
- **验证**：`tsc` 0、`tsdown` 成功、全量审核 **99/99、0 控制台错误**。
- **仍需重启**：`pur/image` 路由改动要再重启宿主一次；嵌入动作与菜单项刷新页面即可用。

## 第六十一轮：导出/嵌入的 pur.studio 图片不再裂图（2026-10-31）

- **问题（审计 #4/#8）**：导出器按上游格式写 `![x](https://pur.studio/<画布>/<文件>)`，但阅读视图没有解析器——自家导出的大纲里每张图都是裂图，还会向 `pur.studio` 发真实请求。
- **主机侧**：新增 `src/vault/pur-image.ts` + `pur/image` 路由。按 `https://pur.studio/<画布>/<文件>` 找到 `Pur画布/<画布>.PurStudio`，深度遍历元素树（含 group children）匹配 `original` 的文件名，优先取元素内联 `dataURL`（base64 解码 + 取 MIME），否则读 `original` 指向的库内文件。
- **客户端**：`rewrite.ts` 增加可选 `purImageUrl` 上下文与 `rewritePurImages` 后处理（正则匹配导出格式），`NoteView` 传入 `purImageUrlFor`；没有解析器的宿主保持原 URL 不变。
- **测试**：`tests/rewrite.test.ts` +2（解析改写、无解析器时不动），新增 `tests/pur-image.test.ts` 3 例（嵌套 dataURL、磁盘文件、缺失回落）；`tests/helpers/memfs.ts` 补 `readBytes` 让资产读取路径可测。**386/386**。
- **验证**：`tsc` 0、`tsdown` 成功、全量审核 **99/99、0 控制台错误**。
- **注意**：新路由要**重启宿主**才生效；未重启前打开含 pur.studio 图的老笔记仍会 404。

## 第六十轮：修好画布右键菜单 + 键盘操作（2026-10-31）

- **真 bug**：Pur 画布右键菜单「闪一下就消失」。菜单在 pointerup 里打开，而浏览器紧接着在**同一手势**后触发 `contextmenu`，落在菜单的全屏遮罩上，遮罩的处理函数把菜单关了。改为遮罩只 `preventDefault`（不关闭），关闭仍走 mousedown/Esc/选中条目。这就是用户报的「右键菜单栏没有」。
- **键盘**：菜单获得焦点后支持 Esc 关闭、↑↓ 在条目间移动、Enter/空格激活；条目补 `role="menuitem"`/`tabIndex`，容器补 `role="menu"` —— 之前这套完全为零（只能点外面关）。
- **审核**：`ui.ribbon-pur-icon` 扩写为「新建画布 → 右键出菜单 → Esc 关闭 → 关标签 → 删文件」，把画布菜单重新纳入覆盖。
- **验证**：`tsc` 0、**381/381**、全量审核 **99/99、0 控制台错误**。

## 第五十九轮：移除插件桥接 + 精简设置面板（2026-10-31）

- **删除桥接子系统**：`src/shim/**`（19 文件，Obsidian API 垫片）、`client/bridge.ts`/`bridge-commands.ts`/`bridge-dispatch.ts`、`client/ui/PluginView.tsx`、`bridge-protocol.ts`、`vault/bridge.ts`、`plugins/bridge-toggle`/`plugins/frame`/`plugins/script` 路由、`bridge/data` 路由与 `shim.js` 路由；`tsdown` 去掉 shim 包（构建入口少一个）。`bridge-endpoints.ts` 保留文件读写路由，因为 **DSH 侧 Pur 面板自己用它们读写库文件**。
- **设置面板**：移除「外观」（舒适/紧凑）整段与「可桥接插件」整段；DSH 插件行里那个「在 DSH 中运行」占位开关一并删掉。面板现在只剩 DSH 插件列表与核心插件开关。
- **Pur Studio 入口改造**：原先点 ribbon 打开的是被桥接的插件 frame。改为**新建一个真实画布文件**（`Pur画布/<名>_N.PurStudio`）并打开——`client/ui/newCanvas.ts`。
- **修掉一个真 bug**：打开任何 `.PurStudio` 文件都会让主视图崩溃（React #185 无限更新）。根因是 `PurStudioPane` 把「刷新 hostDeps」和「注册面板命令」写在同一个 effect 里，`t`/`onOpenPath` 等 prop 身份变化就会注销→注册→通知面板→重渲染→再注销…… 拆成两个 effect 后修复；`registerPurPaneCommands` 也改为同路径重复注册不再通知。
- **审核**：删掉 `plugins.bridge-toggle-persists`、`pur.frame-opens` 两条桥接检查；`settings.dialog-plugins` 改为断言「外观/桥接段已消失、DSH 与核心段仍在」；`ui.ribbon-pur-icon` 改为断言新建画布并清理。
- **验证**：`tsc` 0 错误、**381/381**（少掉的 20 条来自删除的 shim/bridge 测试）、`tsdown` 四入口构建成功、全量审核 **99/99、0 控制台错误**。

## 第五十八轮：搜索面板排序 / 折叠（P8 尾项收口，2026-10-31）

- **功能**：搜索模式底部再加两个控件——「相关度 / 名称」排序切换、以及「折叠」（隐藏每条命中的摘要行，只留标题与路径）。
- **实现**：`searchPrefs.ts` 的 `SearchOptions` 扩到四个字段（`matchCase`/`regex`/`sort`/`compact`），新增纯函数 `orderSearchHits`（相关度保持 Host 排名、名称按标题排序）；`QuickSwitcher` 把 `toggleOption` 收窄成布尔三键，另加 `toggleSort`。
- **测试**：`tests/ui-prefs.test.ts` 增 2 例（排序两种模式、新字段往返与坏数据回退）——用例数 **398 → 400**。
- **审核**：`quick.ctrl-f-search-mode` 再加入排序与折叠断言（切换后 `localStorage` 落 `"sort":"name"`；折叠后 `.ov-quick-snippet` 计数归零；再点回来摘要恢复）。
- **验证**：`tsc` 0 错误、**400/400**、`tsdown` 成功、全量审核 **101/101**。
- P8 至此无未勾选项。

## 第五十七轮：NoteView 回到预算内（2026-10-31）

- 上一轮加反链开关让 `NoteView.tsx` 从 299 涨到 320，破了 300 行预算。两个小抽取把它拉回**274 行**：
  - `client/ui/useInlineBacklinks.ts`：反链开关的状态 + 持久化做进 hook；
  - `client/ui/note/enhanceHighlights.ts`：`==高亮==` 的后置装饰函数独立成模块。
- **验证**：`tsc` 0 错误、**398/398**、`tsdown` 成功、全量审核 **101/101**。
- 说明：`note.highlight-mark` 这类检查依赖前序检查已打开夹具，用 `--only` 单跑会假失败（单独跑时页面没有夹具），必须整跑判定。

## 第五十六轮：搜索面板开关（P8 收口，2026-10-31）

- **功能**：快速切换面板的全文搜索模式加了两个开关——`Aa`（区分大小写）与 `.*`（正则）。开关状态存 `localStorage` 的 `ov.search.options.v1`，默认都关（对齐 Obsidian 默认）。
- **实现**：`client/ui/searchPrefs.ts` 把开关组合成 Host 已有的查询语法——大小写用 `match-case:(…)`（括号保证多词整组被包裹），正则把输入变成 `/pattern/`；**服务端零改动**，不需要新参数。
- **测试**：`tests/ui-prefs.test.ts` 增 2 例（五种组合的查询拼装、选项往返与坏数据回退）——用例数 **396 → 398**。
- **审核**：扩展现有 `quick.ctrl-f-search-mode` 检查——点 `Aa` 断言 `aria-pressed` 翻转且 `localStorage` 落 `"matchCase":true`，点 `.*` 同理，再依次关回；单项通过，全量 **101/101、0 控制台错误**。
- 至此 P8 剩余项（搜索面板开关与正则）完成；正则此前只能靠手写 `/…/`，现在有开关。

## 第五十五轮：文档内反链开关——P11 收口（2026-10-31）

- **功能**：笔记头部新增「显示反链 / 隐藏反链」按钮（`aria-pressed`），控制阅读视图底部的内嵌反链区。选择写入 `localStorage` 的 `ov.note.inlineBacklinks.v1`，默认开启（对齐 Obsidian 默认设置）。
- **实现**：`client/ui/notePrefs.ts`（解析/序列化两个纯函数）、`NoteHeader` 新增可选 `onToggleBacklinks`/`backlinksVisible`（无参时不渲染按钮，其它调用方零改动）、`NoteView` 持有状态并在无存储时回退默认值。
- **测试**：`tests/ui-prefs.test.ts` 增 1 例（默认值、`'1'`/`'0'` 解析、往返）—— 用例数 **395 → 396**。
- **审核**：扩展现有 `note.inline-backlinks` 检查——点「隐藏反链」后断言区块消失且 `localStorage` 落 `'0'`，再点「显示反链」断言恢复。单项通过后全量复跑 **101/101、0 控制台错误**。
- 至此 P11 两条验收（反链可搜可排、属性类型正确显示）与唯一缺口（文档内反链开关）全部完成。

## 第五十四轮：行数债收尾——13 → 1（2026-10-31）

- **pur/PurStudioPane 303 → 288**：`pointerEventOf`（React 事件 → 内核指针事件）抽到 `client/pur/pane-events.ts`；顺带删掉因此失效的 `import type React`。
- **routes 322 → 263**：`routes-shared.ts`（83）承接 `RouteHost`/`TrustGate` 契约、`CONTENT_TYPES` 表、`logNoteOpen` 与 `extensionOf`/`dispositionOf`；`routes.ts` 只留挂载与 `dispatch` 分派，`RouteHost` 继续从其 re-export。
- **client/api 427 → 10**：按领域拆成五个文件——`api-core.ts`（47，`ApiError` + `request`）、`api-vault.ts`（188，状态/树/笔记/文件/反链/标签/搜索/图 + 写操作）、`api-registry.ts`（86，库注册表 + 六个 Obsidian 配置）、`api-plugins.ts`（130，插件与桥），`api.ts` 变纯 barrel（10 行）。所有调用方的 `import ... from './api.ts'` 不变。
- **controller.ts 登记例外**：467 行、49 个公开方法，几乎全是转发。写入 `PLAN.md §7 第 5 条` 与模块 JSDoc：新行为落 `controller-*`，门面只接线。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- **结果**：全插件超 300 行的文件从 **13 个降到 1 个（已登记例外）**。

## 第五十三轮：pur-obsidian/exporter 327 → 190（2026-10-31）

- 拆成「管道 + 流程」两半：`exporter-host.ts`（193，`PurExporterHost` 契约、`TextPrompt` 模态、`promptText`/`safeName`/`ensureFolder`/`uniquePath`/`writeText`/`dataURLToArrayBuffer`/`exportedNotice`、两个导出目录常量），`exporter.ts`（190，`savePur`/`createEmptyCanvas`/`exportMarkdown`/`exportImage`/`exportCanvasDocument`/`generateCode`）。
- `exporter.ts` 继续 re-export `PurExporterHost` 与 `promptText`，`view-menu.ts` 等调用方不用改导入。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。

## 第五十二轮：graph/layout 324 → 190（2026-10-31）

- 按「词汇 / 播种 / 模拟」三段拆：`layout-types.ts`（65，节点与边形状、`WORLD`、`LayoutForces`、`DEFAULT_FORCES`、`LayoutSeed` 与四个能量常数）、`layout-seed.ts`（92，`jiggle`/`spreadSeed`/`seedPositions`）、`layout.ts`（190，`Link` + `Simulation` 类）。
- `jiggle` 放在 seed 模块并导出，因为模拟的零长连线分支也要用它；这样避免为 4 行函数再开一个文件。
- `layout.ts` 继续 re-export 两个新模块，`ui/graph/*` 的导入不用改。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。

## 第五十一轮：workspace 样式表 419 → 12（2026-10-31）

- `workspace.ts` 原本是一个 419 行的单一 CSS 模板字符串。按区域切成三份：`workspace-shell.ts`（150，框架与资源管理器）、`workspace-note.ts`（154，笔记头/正文排版/标注）、`workspace-panel.ts`（127，大纲/反链/标签/分栏），`workspace.ts` 只剩 12 行的拼装。
- **逐字节校验**：把 git HEAD 里的原文件写回临时模块，import 两版比较 `WORKSPACE_STYLE`——长度 12148 = 12148，`identical: true`。中途差 1 个字符，原因是模板尾部少了一个换行，加上后一致。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- 剩余：`controller.ts` 467、`client/api.ts` 427、`exporter.ts` 327、`graph/layout.ts` 324、`routes.ts` 322、`PurStudioPane.tsx` 303。

## 第五十轮：行数债收尾（vault 全部达标）——index 524 → 289、registry 314 → 259（2026-10-31）

- **index 拆分（状态 / 门面分离）**：这是全项目最大的一个文件，做法是把**状态**与**公开 API** 分开——
  - `store.ts`（167）：`VaultStore` 持有全部集合、`rebind`、串行 `refresh`/`scan`、`parse`、`reindex`；
  - `index.ts`（289）：`VaultIndex` 只剩门面，方法逐条转发；
  - `projections.ts`（状态/树/标签三个纯投影）、`index-read.ts`（`fileOf`/`readAssetOf`/`resolveInVault`）、`index-write.ts`（`createNote`/`saveNoteTo` + `WriteContext`）、`index-ops.ts`（rename/remove/move/makeFolder + `OpsContext`）、`index-types.ts`（`FsLike`/`VaultOptions`/`SaveNoteResult`，仍从 `index.ts` re-export）。
  - 关键约束：`VaultIndex` 的公开 API 一个字没变，`tests/` 与 `src/routes.ts` 的 `import { VaultIndex } from './vault/index.ts'` 全部照旧。
- **registry 拆分**：持久化下沉到 `registry-file.ts`（97，`readRegistry`/`writeRegistry`/`VaultRecord`/`StoredRegistry`/`STORE_VERSION`），`registry.ts` 变 259，只留注册表状态机与索引绑定。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- **结果**：`src/vault/` 25 个文件全部 ≤300 行；全插件超限文件从 13 个降到 **7 个**（`controller.ts` 467、`client/api.ts` 427、`kit/styles/workspace.ts` 419、`exporter.ts` 327、`graph/layout.ts` 324、`routes.ts` 322、`PurStudioPane.tsx` 303）。

## 第四十九轮：行数债第五刀——query 384 → 103、syntax 359 → 71（2026-10-31）

- **query**（`src/vault/`）：`query-tokenize.ts`（112，词法）、`query-match.ts`（153，求值器与字段分发）、`query-types.ts`（44，`QueryNode`/`QueryField`/`QueryDoc`/`ParsedQuery`/`Token`），`query.ts` 只留 `parseQuery`（103）。三者由 `query.ts` 全量 re-export，`tests/query.test.ts` 的 `import { matchesQuery, parseQuery, tokenize, type QueryDoc } from '../src/vault/query.ts'` 无需改动。
- **syntax**：`syntax-shared.ts`（40，三个 token 形状 + `FENCE`）、`syntax-links.ts`（136，`parseWikiTarget`/`tokensOfLine`/`scanWikiLinks`）、`syntax-scan.ts`（153，块 ID / 标题 / 标签扫描），`syntax.ts` 只留 `headingAnchor` 与 `replaceWikiLinks`（71）。`FENCE` 下沉到 shared 是为了让三个模块**单向依赖、无环**。
- **顺带修**：`headingAnchor` 前面的 JSDoc 与 `export` 挤在同一行（`*/export function …`），已拆开。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。

## 第四十八轮：行数债第四刀——adapter 359 → 208（2026-10-31）

- **切法**：这是一个「契约 + 执行器」文件，按角色拆成三份——
  - `adapter-types.ts`（105）：`PurEffectSink`、`PurMenuHost`、`PurMenuAction`、`PurMenuPoint`、`PurOpenDestination`；
  - `adapter-effects.ts`（58）：`executeEffects` + `assertNever` 穷尽守卫；
  - `adapter.ts`（208）：`runMenuAction` 与四个私有解析器（`requireTarget`/`requireElement`/`openTarget`/`unlinkNote`）。
- **对外 API 不变**：`index.ts` 三个模块全部 re-export，两端 adapter 的导入语句无需改动。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- 剩余债（`src` 内 >300 行）：`vault/index.ts` 524、`controller.ts` 466、`client/api.ts` 427、`kit/styles/workspace.ts` 419、`vault/query.ts` 384、`vault/syntax.ts` 359、`exporter.ts` 327、`graph/layout.ts` 324、`routes.ts` 322、`vault/registry.ts` 314、`PurStudioPane.tsx` 303。

## 第四十七轮：行数债第三刀——controller-pointer 411 → 260（2026-10-31）

- **切法**：把三个指针入口之外的手势子程序抽到 `controller-gestures.ts`（177 行）：`local` 坐标投影、`finishPinDrag`（引脚拖拽收尾：重连 / 新建）、`reparentDragged`（落点归组）、`momentumStep`（惯性衰减）、`wheel`（指针锚定缩放）。
- 留在 `controller-pointer.ts`（260 行）的是三个分派入口 `pointerDown` / `pointerMove` / `pointerUp`，函数体逐字未改。
- **导入调整**：`controller.ts` 的 `momentumStep` / `wheel` 改从 gestures 取；`index.ts` 增加 gestures 的 re-export，对外 API 不变。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- 剩余债（`src` 内 >300 行）：`vault/index.ts` 524、`controller.ts` 466、`client/api.ts` 427、`kit/styles/workspace.ts` 419、`vault/query.ts` 384、`adapter.ts` 359、`vault/syntax.ts` 359、`exporter.ts` 327、`graph/layout.ts` 324、`routes.ts` 322、`vault/registry.ts` 314、`PurStudioPane.tsx` 303。

## 第四十六轮：行数债第二刀——controller-edits 498 → 181（2026-10-31）

- **切法**：按命令族拆成三个模块，原文件只留创建与编辑器提交——
  - `controller-clipboard.ts`（135）：copy / paste / duplicate / group / ungroup + `clone`；
  - `controller-pins.ts`（87）：`editableCode` + 增删输入/输出引脚；
  - `controller-props.ts`（113）：`PurElementPatch` + `updateElementProps`（按元素类型分派的属性补丁）；
  - `controller-edits.ts`（181）：`addTextBlock`、`addCodeNode`、`commitCodeNode`、`deleteElementWithLines`、`applyTextInput`、`commitTextEdit`。
- **顺手去重**：本文件原先自带一份与 `controller-selection.ts` 完全相同的私有 `commit`，改为复用共享实现，行为不变。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功。
- 剩余债：`controller.ts` 466、`PurStudioPane.tsx` 303。

## 第四十五轮：Obsidian 发行包——与上游并存（2026-10-31）

- **上游基准冻结**：`upstream/pur-studio-2.4.0/`（6 文件 289 KB），`main.js` SHA-256 `B1C9F967…C2EF2`，与知识库运行时副本逐字节一致；`upstream/.gitattributes` 用 `-text -diff` 保证 blob 不被换行转换。知识库 `工具/Pur Studio/` 相应改成索引页（不再放源码），指向本仓库。
- **发行包**：新增 `obsidian/`（`manifest.json` id `dsh-pur-studio` / `styles.css` / `README.md`），`main.js` 由 `lib/pur-obsidian.js` 复制；已装进 `.obsidian/plugins/dsh-pur-studio/`。
- **并存改造**：视图类型 `pur-studio` → `dsh-pur-studio`，否则两个插件共用同一 leaf 类型、由加载顺序决定归属；`.purstudio` 扩展名改为 `ownFileExtension` 开关（默认关），并存期由上游继续接管。
- **验证**：`tsc` 0 错误、395/395、tsdown 成功（pur-obsidian 296.82 kB）；用桩件 `obsidian` 模块跑通 `onload` —— 视图 `dsh-pur-studio`、扩展名未注册、ribbon 1、设置页 1、**命令 16 条齐全**。
- **待办**：在真 Obsidian 里启用并目视验证（需要手动开第三方插件）。

## 第四十四轮：行数债第一刀——controller-commands 359 → 153（2026-10-31）

- **切法**：按职责拆出三个纯模块，原文件只留元素编辑命令——
  - `controller-selection.ts`（36 行）：`commit` 历史尾巴 + `getSelectedElements` 树序选择；
  - `controller-view.ts`（53 行）：`selectAll`、`fitToView`；
  - `controller-layers.ts`（141 行）：四个 z-order + `resetTransform` + `toggleLock`/`setSelectionLocked`/`setSelectionOpacity`；
  - `controller-commands.ts`（153 行）：对齐 / 等比 / 重排 / 连线 / 删除。
- **依赖单向**：`selection ← view ← commands`、`selection ← layers`，无环；`controller.ts` 与 `index.ts` 的导入同步拆分。
- **零行为变更**：只搬函数与改 import，函数体逐字保留。
- **验证**：`tsc` 0 错误、**395/395**、`tsdown` 三 bundle 成功（index 121.08 kB / pur-obsidian 295.88 kB / client 806.66 kB）。
- 剩余债：`controller.ts` 466、`controller-edits.ts` 498、`PurStudioPane.tsx` 303。

## 第四十三轮：审核收口——101/101 全绿（2026-10-31）

- **结论**：`ui-full-audit` 全量 **101 项全过、0 控制台错误**，第四十二轮遗留的「audit-1 待收」到此关闭。
- **两条 FAIL 的真实性质**：`audit-r43.log` 里的 2 条不是代码缺陷，是环境性失败——`note.source-and-reading-roundtrip` 的 409 来自编辑器持有的过期 mtime（夹具在同一次长跑里被前序检查改动过）；`note.editor-conflict-bar` 与 `audit-r43-fix.log` 的定位超时，是复跑时 URL 里的 token 已随宿主重启轮换（401），页面根本没渲染出工作台，却先撞上 30 秒定位超时。
- **证据**：`--only` 单跑两项通过；随后全量 `checks: 101, failed: 0`（新 token）；`tsc` 0 错误、395/395 不变。
- **脚本加固**：工作台没渲染时先读页面标题并抛明确错误（提示用 `.dsh-home/dsh_web_token.txt` 里的完整 URL），不再用 30 秒定位超时掩盖真因。
- 遗留：行数债 `controller.ts` 465 / `controller-edits.ts` 498 / `controller-commands.ts` 359 / `PurStudioPane.tsx` 303，均超 300 行约束。

## 第四十二轮：任务 4 收尾——双端 15 条命令注册 + 三处上游行为偏差修复

- **裁决落地**（第四十一轮待裁决 ①-⑤）：①② 双端都补——Obsidian adapter 注册全部 16 条 addCommand；DSH 命令面板也加 pur 命令，但仅当活动文件是 `.purstudio` 时显示（避免全局面板里 15 条无视图静默命令的 UX 退步）；③④⑤ 三处偏差全修。
- **字典**：pur-zh/pur-en 新增 19 键（15 条命令名 `pur.cmd*` + `pur.newCanvasName`/`pur.createdTo`/`pur.savedTo`/`pur.noOpenCanvas`/`pur.copySuffix`），zh 值用上游原命令名，en 自译；`PUR_EN: Record<keyof typeof PUR_ZH, string>` 编译期强制键对齐。
- **Obsidian adapter**：`exporter.ts` 新增 `createEmptyCanvas`（ensureFolder + `_N` 递增 + 空文档写盘 + `pur.createdTo` Notice），`savePur` 默认名补 `_副本`（空 base 回退 `pur.newCanvasName`）、成功 Notice 改 `pur.savedTo`，`exportMarkdown` 加 `promptName`/`fixedName` 参数；`view-menu.ts` 的 newCanvasFlow 改回上游不 prompt 流程（创建后 `openFile`），菜单 `export-md` 补回名称 prompt；`plugin.ts` 全量重写注册 16 条（`pur-studio-open` 保留 + 15 新增），view 级命令经 `firstView()`（`getLeavesOfType(PUR_VIEW_TYPE)[0]`，对齐上游 `v()`）+ `dispatch` 助手（controller 空守卫后 `runEffects`），`save-pur-studio-as` 限定活动 leaf 是 Pur 视图否则 `pur.noOpenCanvas` Notice（上游语义），`pur-export-md` 固定名 `pur-studio-export` 无 prompt。
- **DSH client**：`host-export.ts` 新增 `writeFreshDocument`（`Pur画布/` 下不 prompt 建空画布 + createdTo Notice + `openPath?.()`），`exportMarkdownFlow` 同步 `promptName`/`fixedName` 参数；`PurMenuHostDeps` 新增 `openPath?`（DSH 面板本无导航能力，由 MainPane 既有 `onOpen` 经 FileView 穿入 PurStudioPane）；`host.ts` 的 `newCanvas`/`savePur` 默认名/菜单 export-md prompt 与 Obsidian 侧对齐。新增 `pane-commands.ts`（React-free 注册表，仿 bridge-commands：`Map<path, PurPaneHandlers>` + 订阅 + 缓存快照；`createPurPaneHandlers` 把 14 动词接到 live controller/menuHost/hostDeps，controller 动词经 `run` 排 effects），PurStudioPane 挂载注册、卸载或换 path 注销（view 切走时命令自动消失）；`commands.ts` 新增 `buildPurPaneCommands`（15 条，两条 save 都调 `saveStudioAs`，对齐上游两 id 同一链路）；`useVaultCommands` 新增 `purPath` 输入（`notePath` 仅 Markdown 有值，故独立判断 `/\.purstudio$/i`）经 `useSyncExternalStore` 并入 extra。
- **兼容性修复**：`api.ts` 的 `ApiError` 参数属性（`readonly status`）改显式字段赋值——`--experimental-strip-types` 不支持 parameter properties，此前无测试导入 api.ts 未暴露。
- 测试 +15：`tests/pur-commands.test.ts`（zh/en 键对齐 + en 抽查；注册表注册/注销/订阅/快照身份/防误删守卫；`buildPurPaneCommands` 15 条 id 唯一、label 取自字典、逐条 dispatch、handlers undefined 为空；`savePur` 默认名 `_副本` 与空路径回退；`writeFreshDocument` 经 `globalThis.fetch` 打桩断言 `_N` 递增、createdTo Notice、`openPath`、无 `openPath` 降级；`exportMarkdownFlow` 菜单变体 prompt / 命令变体固定名无 prompt / 中止静默；`createPurPaneHandlers` 的 run 路由、controller null 静默、固定名导出）
- 验证：`tsc` 0 错误、**395/395**、`tsdown` 五 bundle 成功（pur-obsidian 295.12 kB / client 805.89 kB）
- 遗留：`audit-1` 全量审核后台结果待收（有回归则修）；行数债保留待拆分：controller.ts 463、controller-edits.ts 498、controller-commands.ts 359、PurStudioPane.tsx ≈301

## 第四十一轮：任务 4——上游 16 条命令逐条完整性审核

- **审核对象**：上游 main.js L4623-4641 的 16 个 `addCommand`（`v()` = `getLeavesOfType('pur-studio')[0]?.view`，即首个 Pur 视图；无视图时静默无操作），逐条对照内核与双 adapter。
- **结论总览**：16/16 的行为在内核或 adapter 中存在（13 条 view 级全部经第四十/三十九轮黄金对照；3 条 plugin 级在 adapter）；差距集中在**命令面板注册面**（上游 16/16，Obsidian adapter 1/16，DSH 1/16）与一处内核 API 缺口。
- 逐条（✅=完整 / ⚠️=行为可达但入口或细节偏 / ❌=缺口）：
  1. `open-pur-studio`（→`activateView`：有 leaf 则 reveal，无则新 tab）——✅ 双端（adapter `pur-studio-open` + ribbon；DSH `plugin.purStudio`）
  2. `new-pur-studio`（→`createNewStudio`：不 prompt、固定「新画布」`_N` 递增、Notice 已创建、openLinkText 打开）——⚠️ 双端只经菜单 `new-canvas`，且都**先 prompt 名称**（上游不 prompt）、无成功 Notice；命令未注册
  3. `save-pur-studio-as`（→`saveCurrentStudioAs`：活动 leaf 非 Pur 视图时 Notice「没有打开的画布」，否则 `saveStudioAs` prompt，默认名 `<base>_副本`）——⚠️ 双端只经菜单 `save-pur`（exporter.ts `savePur` 有 prompt + `_N` + rebind），默认名缺 `_副本` 后缀；命令未注册
  4. `pur-delete`——✅ 内核 `deleteSelection()`（黄金对照）+ Delete/Backspace + 元素菜单 `delete`；命令未注册
  5. `pur-group`——✅ 内核 `group()` + Ctrl+G + 菜单；命令未注册
  6. `pur-ungroup`——✅ 内核 `ungroup()` + 菜单；命令未注册
  7. `pur-duplicate`——✅ 内核 `duplicate()` + 菜单；命令未注册
  8. `pur-fit-view`——✅ 内核 `fitToView()` + F 键 + 菜单；命令未注册
  9. `pur-export-md`（→`exportAsText()` 无 customName → 名 `pur-studio-export`）——⚠️ 内核 `buildExportOutline` 黄金对照过；菜单 `export-md` 上游走 `exportAsTextWithName`（**prompt**）而双端 adapter `exportMarkdown(false,false)` 不 prompt；命令未注册
  10. `pur-select-all`——✅ 内核 `selectAll()` + Ctrl+A（上游无菜单项）；命令未注册
  11. `pur-undo`——❌→✅ 内核实现此前只嵌在 keyDown，facade 无公开 `undo()`，命令无法接线；本轮已补（见下）
  12. `pur-redo`——同上，facade 补 `redo()`
  13. `pur-copy`——✅ 内核 `copy()` + Ctrl+C + 菜单；命令未注册
  14. `pur-paste`——✅ 内核 `paste()`（无参 +50/+50）+ Ctrl+V + 原生 paste；命令未注册
  15. `pur-popout`（→`popOutAndPin`：saveData + `workspace:move-to-new-window`）——⚠️ 双端按裁决降级为 `pur.unsupportedFeature` notice（菜单一致）；命令未注册
  16. `pur-save-as`——与 3 同一 `savePur` 链路；命令未注册
- **本轮修复**：内核 facade 补公开 `undo()`/`redo()`（keyDown 的 ctrl+z/y 改为调用它们，行为逐项不变）；测试 +1（facade 边界与选中清除）。验证：`tsc` 0 错误、**380/380**、`tsdown` 五 bundle 成功（pur-obsidian 289.23 kB）
- **待裁决（①-⑤ 已落地于第四十二轮）**：① Obsidian adapter 补齐其余 15 条 `addCommand`（命令名进 pur-zh/pur-en 字典，view 级经首个 Pur 视图接线）；② DSH pur 命令进命令面板、仅活动文件为 `.purstudio` 时显示；③ `new-canvas` 双端改回上游「不 prompt + Notice」；④ 菜单 `export-md` 补回上游的 prompt；⑤ `savePur` 默认名补 `_副本`；⑥ 行数债保留：controller.ts 463 行、controller-edits.ts 498 行、controller-commands.ts 359 行已超 300 行约束，待拆分
- 遗留：`audit-1` 全量审核后台结果待收（有回归则修）

## 第四十轮：P9-5 收尾——Obsidian 与 DSH 双 adapter 接线

- **Obsidian adapter**（`src/pur-obsidian/`，13 文件全部 ≤300 行）：`obsidian.d.ts`（`declare module 'obsidian'` 最小声明面：ItemView/Plugin/Menu/Modal/FuzzySuggestModal/Notice/TFile/Vault/Workspace/Setting 等）、`labels.ts`（`readerFor`/`labelsFor`/`PurLang`）、`settings.ts`（`PurSettings`/`resolvePurSettings`/`PurStudioSettingTab`）、`paste-drop.ts`（`handlePaste`/`handleDrop`/`insertVaultNote`/`readNoteRaw`）、`editors-dom.ts`+`editors.ts`（DOM 脚手架与五个编辑器弹层拆分）、`menu.ts`（`showPurMenu` 树形菜单 + 透明度滑块 overlay）、`exporter.ts`（save-as `.PurStudio`/Markdown 大纲/PNG/JPG/JSON Canvas/JS/PY 生成，落 `收件箱/` 与 `Pur画布/`，重名 `_N` 递增）、`view-menu.ts`（`PUR_VIEW_TYPE`、`createViewMenuHost`、`NotePicker` 模糊选笔记）、`view.ts`（`PurStudioView` 生命周期与 400ms 防抖持久化、自写保存旗标抑制重水合、无文件时回退 `settings.canvasData`）、`view-paint.ts`（ResizeObserver + rAF 绘制循环、DPR 同步、vault 图像走 object URL）、`view-hosts.ts`（sink 与菜单/导出/插入 deps 工厂）、`view-events.ts`（事件接线，wheel 非 passive）、`plugin.ts`+`index.ts`（`PurStudioPlugin` default export、`registerExtensions(['PurStudio','purstudio'])`、ribbon `brain`、命令与设置页）
- **DSH client adapter**（`src/client/pur/`）：`sink.ts`（`createPurSink`：effects→React 状态/notice/光标/`noteOpen`）、`loader.ts`（桥读写文档、`PurImageCache`、`listMarkdownNotes`/`resolveNoteLink`）、`labels.ts`（`purReader`/`purBundles`）、`menu.tsx`（`PurContextMenu` 树 + 透明度滑块）、`editors.tsx`（四编辑器）、`picker.tsx`（`PurPrompt`/`PurNotePicker` 对话框）、`paste-drop.ts`（`pasteIntoCanvas`/`dropIntoCanvas`）、`host.ts`+`host-export.ts`（`createPurMenuHost`，popout/pin-top/embed 降级为 `pur.unsupportedFeature` notice，导出流经桥写盘）、`PurStudioPane.tsx`（控制器宿主：ref 袋延迟求值、`openMenuRef` 修复 sink 对 `openMenu` 的前向引用）、`pane-paint.ts`（rAF 绘制循环与非 passive wheel、原生 drop 接线）、`pane-overlays.tsx`（菜单/编辑器/prompt/picker/notice 覆盖层栈）
- **路由**：`FileView.tsx` 对 `/\.purstudio$/i` 路径直渲 `PurStudioPane`，hooks 无条件执行、`isPur` 时 effect 跳过 `fetchFile`（`MainPane` 不给 key，path 切换不重挂载）
- **打包**：tsdown 新增第五入口 `obsidian`（cjs/node、`obsidian` 外部化、`exports: 'default'`），产物 `lib/pur-obsidian.js` 尾为 `module.exports = pur_obsidian_default`，正合 Obsidian 插件加载器
- 类型修正两处：`dblclick` 发 `MouseEvent` 而非 `PointerEvent`——`pointerEvent`/`pointerEventOf` 参数放宽到 `MouseEvent`/`React.MouseEvent`；`TextPrompt.onOpen/onClose` 补 `override`
- 测试 +12（双 adapter 用例）；验证：`tsc` 0 错误、**379/379**、`tsdown` 五 bundle 成功（index 121.08 kB / client 797.23 kB / worker 19.53 kB / shim 51.70 kB / pur-obsidian 288.70 kB）
- 遗留：`audit-1` 全量审核后台结果待收（有回归则修）；`pur-4` 16 条命令逐条完整性审核

## 第三十九轮：P9-5 步 5——控制器层（`PurController` 与 40+9 场景 151 步黄金对照）

- 内核新增 9 文件（全部 ≤300 行、零 `document`/`window`/`app`）：`controller-types.ts`（指针/滚轮/键盘事件、`PurControllerEnv`、`PurControllerLabels`、`PurControllerEffect` 副作用枚举、菜单模型、共享状态与 `PurHistory`）、`history.ts`（JSON 快照栈：栈顶去重、分支截断、上限 50）、`note-raw.ts`（笔记原文水合引脚与内容）、`paste-drop.ts`、`controller-commands.ts`（对齐/等比/重排/层序/锁定/透明度/连线/删除）、`controller-edits.ts`（增删元素与引脚、复制/粘贴/成组、编辑器提交）、`controller-pointer.ts`（引脚拖拽与重连、缩放手柄、元素拖拽与群组重挂、框选、平移）、`controller-menu.ts`（空白/元素两棵菜单树为纯数据）、`controller.ts`（`PurController` 门面：事件进、effects 出，状态与 history 只读暴露）
- 副作用全部枚举化：`render`/`save`/`notice`/`cursor`/`open-link`/`edit-text|group|line|note-link`/`context-menu`/`export-text`；文案经 `PurControllerLabels` 注入（内核零中文），环境经 `PurControllerEnv`（画布尺寸、id 源、时钟、`hasOpenDialog`）注入
- 黄金生成器（临时脚本，不在仓库）：从 main.js 切出 34 个方法跑真实上游码；切片器补上正则字面量识别与正确转义处理（此前把 `/...\/\//i` 结尾的 `//` 误判为行注释，`showContextMenu` 提前闭合到 L4133，修复后切到 L4031–L4372 全量）；录制桩件 `saveData`→`save`、`requestRender`/`draw`→`render`、`Notice`→`notice:<text>`、canvas style→`cursor:<v>`、编辑弹层四件→`edit-*:<id>`、`showAtMouseEvent`→`menu:x,y`、`Date.now` 固定 1000、id 计数 `id0001…`；三处场景坐标修正（`pin-relink-from` 按下点落在输出引脚容差内避免被 pin-first 分支吞掉、`dblclick-line` 与 `line-click-edit` 的 clientX 200→250 避开 t1 右边界）
- 本轮两处忠实性修正：生成器 `buildView` 补 `hoveredLineId = null`（上游在构造函数初始化，此前缺失导致首次 move 的 `undefined !== null` 多记一个 render 伪影）；内核 `pointerUp` 平移分支末尾同步跑第一帧动量（对齐上游 `onMouseUp` 尾部同步调用 `_startMomentum()`，`up` 步 calls 由 `render,cursor:default,render` 逐项吻合，`momentumStep` 仍由 adapter 驱动后续帧），黄金 `skipCompare` 随之移除
- 早前核对补丁：`_lockTime` 时间窗→`lockPulseIds` 由 `now()` 注入判定；`toggle-lock` 菜单图标按命中元素 `locked` 取 `unlock`/`lock`
- 测试 +51：`tests/pur-kernel-controller.test.ts`（40 命令/指针场景逐步对拍 calls/elements/selected/view/historyIndex/historyLength/clipboard/zoomUntil/handled、9 菜单场景树形对拍——`t()` 键直等、`PRESET_TITLES`/`CATEGORY_TITLES`/`LITERAL_TITLES` 映射中文、引脚子菜单回退 `输入N`/`输出N`、`separatorAfter`↔`s`、`icon`↔`i`、`children`↔`c` 递归——以及 history 去重与 undo/redo 边界单测）
- 验证：`tsc` 0 错误、**367/367**、`tsdown` 成功（index 121.08 kB / client 495.91 kB）
- 遗留：P9-5 收尾 Obsidian 与 DSH 双 adapter 接线（`pur-58`）；`audit-1` 全量审核后台结果待收；`pur-4` 16 条命令逐条审核

## 第三十八轮：P9-5 步 4——渲染层（`drawScene` 与录制式黄金对照）

- 内核新增 10 文件（全部 ≤300 行、零 `document`/`window`/`app`/`Image`）：`render-types.ts`（`PurCanvasContext` 最小 2D 接口、`PurScene`、`PurRenderEffects`、`PurRenderLabels`、引脚 hover/拖拽描述）、`render-shared.ts`（`screenX`/`screenY`、`fillRoundedCard`/`roundedRectPath`/`pillPath` 的 `roundRect` 与 `arcTo` 双实现、`wrappedLines`）、`render-background.ts`、`render-lines.ts`、`render-groups.ts`、`render-text.ts`、`render-cards.ts`、`render-code-node.ts`、`render-overlays.ts`、`render-elements.ts`（展平群组、视口裁剪、旋转/翻转/透明度/选中框）、`render-scene.ts`（`drawScene` 顺序：背景→网格→连线→群组框→卡片→选择框→引脚拖拽→端点圆点→缩放徽章→预加载）
- **绘制副作用外置**：图像解码不再在绘制层 `new Image()`，改为 `PurRenderEffects.loadImages`（键为 `dataURL || original`，顺序＝卡片请求序 + 视口外 2 倍范围预加载，每帧上限同上游 21 次）；`lockPulseIds` 取代上游 `_lockTime` 时间窗，`editingIds` 取代 `isEditing`，`zoomBadgeAlpha` 取代 `_showZoomUntil`
- 黄金对照：新增临时脚本（不在仓库）从 main.js 切出 `draw()` 方法体（起止标记行）与 L412–491 的 `wrapText`/`findElementById`/`getWorldPos`/`getPinPosForElement`/`getPinWorldPos`，`new Function` 注入 `getComputedStyle`/`Image`/固定 `Date.now` 与假图像缓存，以录制 ctx（每次属性赋值与调用各记一条字符串，文本按 10 单位/字符测宽）跑真实上游码，产出 `tests/helpers/pur-render-golden.ts`（4 场景：基础绘制 484 条、交互叠加 207 条、引脚拖拽 174 条、群组/编辑/裁剪 353 条）
- 逐条对齐的既有缺陷：text 引脚 hover 读 `hoverPin.isInput`（`getPinAt` 只回 `isOutput`，故文本输入引脚 hover 实际上永不放大）；文本引脚标签 `-pinR*scale` 双重缩放；note-link 标题 `titleSize + 10` 不随 scale；`.replace('.md','')` 只替换首个匹配；note-link 折行宽度 `screenW - 20` 不缩放；代码节点输出标签 `screenW - pinR - tw` 的 `pinR` 不缩放；group 框虚线 `[8,4]` 不随 scale
- 与上游的三处有意差异（均在 JSDoc/本轮记录）：`relink-from` 拖拽的目标引脚不存在时上游把 `null` 传给 `bezierCurveTo`（真实 canvas 当 0 处理），内核回退到指针位置；背景 `obsidian`/`default` 的 `getComputedStyle` 读取由 adapter 解析为具体颜色（内核只认 `transparent` 与给定色值）；`worldRect` 对 line 不返回矩形（沿用几何层裁决）
- 测试 +12：`tests/pur-kernel-render.test.ts`（4 场景逐调用 + 解码请求逐项对拍、无 `roundRect` 的 `rect` 回退、图像占位文案、编辑态跳过主体与引脚、旋转/翻转/透明度、锁定脉冲只在窗口内、缩放徽章按 alpha 显隐、群组标题在框描边之后）；录制器见 `tests/helpers/pur-render-recorder.ts`
- 验证：`tsc` 0 错误、**316/316**、`tsdown` 成功（index 121.08 kB / client 495.91 kB / shim 51.70 kB）
- 遗留：P9-5 步 5 控制器层（选中/拖拽/缩放/编辑弹层/命令接口）、Obsidian 与 DSH 双 adapter 接线；`audit-1`（全量审核后台结果）待收

## 第三十七轮：P9-5 步 3——算法层（YAML/IR 导入、拓扑排序、JS/HTML/PY 生成）

- 内核新增 8 文件：`yaml.ts`（`parseSimpleYAML`）、`ir.ts`（`irToElements(ir, baseX, baseY, {createId, formatLabel})`）、`pipeline.ts`（`buildPipeline`：扁平化群组 → 筛选代码节点 → 引脚连线 → Kahn 拓扑 → `safeName`/输入映射，失败区分 `no-code-nodes` | `cycle`）、`codegen-labels.ts`（四组 labels 接口）、`codegen-shared.ts`（`nameMapOf`/`outputsLookup`/`jsInputLine`）、`codegen-js.ts`、`codegen-html.ts`、`codegen-py.ts`；全部零 `document`/`window`/`app`，单文件 ≤200 行
- 文案外置：生成的 JS/HTML/PY 里此前硬编码的中文与 `zh-CN` 全部改为 adapter 注入的 `PurCodegenCoreLabels`/`JavaScriptLabels`/`HtmlLabels`/`PythonLabels`；`ir.ts` 的群组标签也改为 `formatLabel` 注入（默认英文 `📦 name (n nodes, m links)`）
- 黄金对照：新增临时脚本（不在仓库）从 main.js 切出 L495–L700（`parseValue`/`parseKV`/`parseSimpleYAML`/`irToElements`）与 `generateRunnableCode` 方法体，`new Function` 注入 `Notice`/`t`/`Date`（`toLocaleString` 固定为 `FIXED`）与假 `crypto.randomUUID`，以 `{elements, app}` 作 `this` 跑真实上游码，产出 `tests/helpers/pur-algo-golden.ts`（2 份 YAML、IR、元素夹具、循环图、JS/HTML/PY 全文、上游中文 labels）
- 方法体提取方式修正：本文里有模板字符串与正则，按大括号配对切分必然错位（首次运行 `SyntaxError: missing ) after argument list`）；改为「起始标记行切片 + 结束标记行（`// 按格式生成并展示代码`）」，并去掉末尾 `}` 与空行
- 逐字节对齐：JS 的节点闭包/`executePipeline`/`try-catch` 尾、HTML 的 20 行 CSS + 卡片 + `pretty`/`renderNode`/运行按钮、PY 的 `def *_process` + 缩进 4 空格的 `execute_pipeline` 全部与上游一致；`safeName` 仍为 `node_<i>_<title>`（`[^a-zA-Z0-9_\u4e00-\u9fa5]` 过滤）
- 有意修的上游缺陷：
  - `parseSimpleYAML` 的 `lines.indexOf(line)` 按首次出现定位后一行——重复裸键会把后一个键挂到错误的深层（用例 `a:/p:/…/b:/p:/keep:` 复现并断言不再产生空列表）
  - `irToElements` 的 `baseX || 20`、`n.x || ni*320+20` 把坐标 0 替换为默认值（用例断言 `x=0`/`baseX=0` 原样保留，`y` 仍按上游 `Math.max(48, y)` 下限）
  - 无 `title` 的 text / note-link 节点上游生成 `// [节点 1] undefined`；内核归一为 `''`（`safeName` 回落 `node_0_node`）
  - HTML/PY 两个渲染器此前（上游）只读 `content || code`，忽略 note-link 解析出的代码，导致生成的浏览器页/Python 里塞进笔记原文；本轮三个渲染器统一为 `linkedCode || content || code`
- 另两处语义偏差（记入本层）：表头「N 条连线」上游按全部带引脚的线计数（含端点不是代码节点的线），内核按真正进入流水线的边计数；输入映射上游对非代码节点的来源也建连（生成 `results['undefined']`），内核只建代码节点之间的边
- 测试 +14：`tests/pur-kernel-algo.test.ts`（YAML 逐文档对拍、重复裸键用例、IR 逐字段对拍、0 坐标修正、无图/非对象、拓扑顺序与边/输入映射、无节点拒绝、循环拒绝、JS/HTML/PY 逐字节、链接笔记代码注入三格式、卡片已含 `function` 时不再读文件、无标题节点不再输出 `undefined`）
- 验证：`tsc` 0 错误、**304/304**、`tsdown` 成功
- 遗留：P9-5 步 4 渲染层（`draw(ctx, scene, viewport)`）、步 5 控制器层

## 第三十六轮：P9-5 步 2——几何层（视图变换、引脚坐标、网格步进、命中检测）

- 内核新增 3 文件：`wrap.ts`（`wrapText(text, maxWidth, measure)` 注入式测量，字符级折行）、`geometry.ts`（`screenToWorld`/`worldToScreen`/`worldViewport`/`findElement`/`worldRect`/`gridStep`/`rectsIntersect`/`pinPosition`/`pinWorldPosition`）、`hit-test.ts`（`elementAt`/`pinAt`/`lineEndpointAt`）；三文件均 ≤200 行，仍零 `document`/`window`/`app`
- 黄金对照扩面：除上次的顶层纯函数外，本轮把上游**类的原型方法**也纳入——用 `extractMethod` 按大括号配对切出 `getElementAt`/`getPinAt`/`getLineEndpointAt` 的方法体，`new Function` 注入其依赖并以 `{elements, viewState}` 作 `this` 调用真实上游码；连同 `wrapText`（用 `measureText` 假上下文）、`getWorldPos`、`getPinPosForElement`、`getPinWorldPos` 一并产出 `tests/helpers/pur-geometry-golden.ts`
- 语义对齐要点：连线命中按**两端中心的中点**、半径 `25/scale`（`scale||1`，与上游不对称地容忍 0）；引脚半径 `14/scale`，**输出先于输入**、只搜 code-node 与带引脚的 text/note-link；端点半径 `16/scale` 且只对带 `fromPin`/`toPin` 的连线生效；群组仅在 `!locked` 时递归、子元素优先于群组本身；`pinPosition` 行距 `(0.85h-0.15h)/(rows-1)`、单行取 `h/2`；`gridStep` 仍是 1/2/5×10ⁿ 吸附到 50 屏幕像素
- 类型模型修正：`inputs`/`outputs` 从 note-link/code-node 上移到 `PurElementBase`——上游引脚检测对 text、note-link 同样生效，`getPinWorldPos` 也不限元素种类，原声明比上游窄；`PurPinHost` 仍是 `pinPosition` 的结构化入参
- 唯一有意的偏离：`worldRect` 对 line 返回 `null`（上游对无坐标的连线会算出 `NaN`，没有调用方依赖该值），已在 JSDoc 标注
- 测试 +9：`tests/pur-kernel-geometry.test.ts`（折行逐例、空段落折成空行、18 档缩放的网格步进、嵌套世界矩形、引脚偏移、引脚世界坐标、三类命中逐点对拍、屏幕/世界往返 + 视口、矩形相交含贴边不算）
- 验证：`tsc` 0 错误、**290/290**、`tsdown` 成功
- 遗留：P9-5 步 3 算法层（代码生成拓扑排序 + JS/HTML/PY 模板、`parseSimpleYAML` + `irToElements`）

## 第三十五轮：P9-5 步 1——平台无关内核的数据层 + 上游黄金对照

- 裁决落地方向（PLAN §8.9）：Pur 不再只以「main.js + shim」存在，纯逻辑抽成无 Obsidian 依赖的 `src/pur-kernel/`，Obsidian 与 DSH 各写 adapter；本轮只做**数据层**（表中第一层，宿主依赖为零）
- 内核文件 13 个：`types.ts`（元素联合与 `PurViewState`/`PurStudioDocument`）、`canvas-types.ts`（JSON Canvas 与 `PUR_META`）、`errors.ts`、`guards.ts`（`asRecord`/`numberOr`/`nonZeroNumberOr`/`stringOr`/`sideOr`）、`ids.ts`、`nodes.ts`（`codeNodeHeight`）、`presets.ts`（58 条预设）、`merge.ts`、`pins.ts`、`canvas-export.ts`、`canvas-import.ts`（导出/导入各一文件，均在 300 行内）、`studio-file.ts`、`index.ts`；全部零 `document`/`window`/`app` 引用
- 黄金对照做法：从上游 `main.js` L238-410 原样切出 `generateId`/`calcNodeHeight`/`CODE_NODE_PRESETS`/`elementsToJSONCanvas`/`elFromNode`/`jsonCanvasToElements`，用 `new Function` 执行真实上游码而非手抄期望值，产物落 `tests/helpers/pur-golden.ts`（`GOLDEN_ELEMENTS`/`GOLDEN_CANVAS`/`GOLDEN_IMPORTED`/`GOLDEN_LEGACY_ELEMENTS`），CI 无需访问 `G:\个人知识库` 的源码路径
- 对齐要点：`__pur` sidecar 只装 wire 之外的字段（`id/x/y/w/h/children` 剔除，边装 `fromPin`/`toPin`/`style`/`arrow`/`arrowSize`）；导出时**省略**值为 undefined 的 `color`（写死 `color: undefined` 会与上游 JSON 化后的黄金不等）；群组子元素按绝对坐标 export、带 `parentGroupId`，import 先建 group map 再挂 children 并换算回相对坐标；`width||fallback` 保留「0 取默认」语义；`.PurStudio` 序列化仍是 `JSON.stringify({elements, viewState}, null, 2)` 字节一致
- 修上游导出/导入两处缺陷：① 导入后子群组元素体残留 `parentGroupId`（新增 `withoutParent()` 在 merge 前删除）；② 元素模型未声明的字段（第三方或新版本写入的键）必须原样穿透保留，靠 `mergeExtras`（`Object.hasOwn` + `Reflect.set`）实现，不引入 `as unknown`
- 内核不含中文：58 预设标题改消息键 `preset.<id>`、分类改 `presetCategory.<key>`，中文文案仍只在客户端 `zh.ts`
- 测试 +16：`tests/pur-kernel-data.test.ts` 9 用例（id 后缀、节点高度 88/116、58 预设唯一且 classify 正确、math-add 逐字节、serialize 字面量、往返含 extras/pins、未知属性、line 无 `x`、5 类坏文档）与 `tests/pur-kernel-canvas.test.ts` 7 用例（导出=黄金、导入=黄金、未知属性穿透、无 `__pur` 的旧 canvas 默认值、0 尺寸回退、非对象拒绝、再导出语义等价）
- 验证：`tsc` 0 错误、**281/281**、`tsdown` 成功（index 121.08 kB / client 495.91 kB / shim 51.70 kB）
- 遗留：P9-5 步 2 几何层（`wrapText`/引脚坐标/视口裁剪/命中检测），之后算法、渲染、控制器与双 adapter；任务 4（16 条命令逐条审核）待内核/adapter 落地后执行

## 第三十四轮：pur 桥接联调（一）——左栏图标 + shim 三处语义缺陷

- 左栏图标：Pur 的 `addRibbonIcon('pur-icon', …)` 回调只做 `activateView()`，与宿主「打开插件视图」等价，故不新增 ribbon 注册通道，而在 `Ribbon.tsx` 的 `ENTRIES` 加 `plugin` 条目（`Icon name="plugin"`、`aria-label` 复用 `openPurStudio`）指向 `VaultPage.selectRibbon` 的 action 分支；顺手删掉 `pressed` 里 `search` 的特例（`active` 只可能是 `files`，其余条目自动恒 false）
- **shim 缺陷①同步语义**：`workspace.getActiveFile()` 在 Obsidian 是同步 getter，shim 却返回 Promise，插件 L4164 直接读 `.extension` 永远拿到 undefined → 改为「宿主预取快照 + `file.open` 推送刷新」：`refreshActiveFile()` 在 `onload` 前拉一次，`setActiveFile()` 供 `file.open` 事件更新，`getActiveFile()` 同步返回
- **shim 缺陷②元数据**：`getFileCache()` 恒 `null`，`tag:` 过滤（L3112-3119）永不命中 → 新增桥方法 `metadata.fileCache`（宿主用 `fetchNote` 取 tags 并补 `#` 前缀），shim 侧冷读启动后台拉取并答「未索引」，热读同步返回，与 vault 冷缓存同款
- **shim 缺陷③命令门面**：`app.commands` 完全缺失，L1718 访问即 TypeError → 新增 `src/shim/commands.ts`（`commands` 空映射对应「无桌面命令」的降级分支，`executeCommandById` 抛 `UnsupportedObsidianApi`）
- 夹具：`pur.frame-opens` 的 shim 操练新增 5 条记录（`getActiveFile-sync` 断言返回 TFile/null 而非 Promise、`commands-empty`、`executeCommandById-throws`、`fileCache-cold`/`fileCache-warm`）；该检查末尾在切回主库**前**关闭标签页，避免 `夹具打开链接` 留下的 vault B 路径在恢复后的库里 404
- 审核 +1：`ui.ribbon-pur-icon`（图标唯一、action 语义恒 false、点击开出 `[data-plugin="pur-studio"]`、关闭后消失）
- 验证：`tsc` 0 错误、**265/265**、`tsdown` 成功；**全量审核 101/101 通过、0 console error**（新增项已并入全量序列）

## 第三十三轮：逆向直探官方 `app.js`——resolver 对齐 `getLinkpathDest`、附件解析缺口、嵌入尺寸、嵌套 Callout

- 逆向方式：`obsidian.asar` 解包后直读压缩 `app.js`，围绕 `getLinkpathDest` / 嵌入尺寸正则 / Callout 折叠 / 图谱分组取色 / 搜索算子逐段定位，结论落 PLAN §3 对照表；types.json 与堆叠标签评估后**决定不做**（价值低/成本中大），别名解析保留为末位扩展（超集，文档标注）
- resolver 对齐（`resolver.ts` 重写）：小写规范化 → 精确路径 → `./`/`../` 相对源目录 → 前导 `/` 根锚定（**无后缀回退**）→ 后缀/basename 候选按「源目录邻近 + 路径长度升序」永远确定取第一；`decide` 改为直白的「与胜者同桶且等长才平局」，仅此种情况报 ambiguous；`move.ts` 改写链接时闭包捕获被移动笔记自身路径作 `from`
- **存量缺口修复①：附件不进 LinkResolver**——`![[img.png]]` 历史上永远解析失败、渲染成新建链接；`deriveIndex(notes, attachments)` 把附件加进 identities（title=basename、aliases=[]），但反链/邻接跳过附件（图谱附件节点本就走独立路径，不进 adjacency 是对的）
- **存量缺口修复②：共享 Markdown 渲染器只画绝对 http(s) 图片**——`imageSource` 用 `new URL()` 拒绝相对路径，嵌入图片从未真正显示；`assetUrlFor` 在浏览器内改为 `new URL(relative, location.origin).href` 绝对化
- 嵌入尺寸：对齐 `zx` 正则 `([0-9]+)(x([0-9]+))?` 按最后一个 `|` 切，width 恒设、height 仅 y≠0、整串是尺寸则 alt 置空；落地为 `SIZE_MARK='\uE000'` 编进 markdown 图片 alt 尾（rewrite 侧），DOM 增强 `annotateImages` 还原 width/height 并清标记（曾踩不可见字面量坑，一律用转义写法 + 测试导入常量拼期望值）
- 嵌套 Callout：`NoteView` 的 `Rendered` 联合加 `callout` 分支带 `children`，`segments(source)` 递归 splitCallouts，模块级 `Segments` 组件按 prefix 路径作 key 递归渲染
- NoteView 行数压回 300：合并 react 导入为单行
- 单测：resolver +4（`../` 上跳、`./` 当前目录、源目录邻近优先、根锚定无回退）→ 10/10；vault +1（`![[pic.png]]` 解析到附件且无反链边）；rewrite +1（尺寸标记三态）→ 全套 **265/265**；`tsc` 0 错误、`tsdown` 成功（client 494.93 kB）
- 审核 +3：`note.relative-links-resolve`（`[[../审核链接者]]`/`[[./审核大纲]]` 的 open 参数）、`note.embed-image-size`（`img[width=300][height=200]` 且 alt 无标记泄漏）、`note.nested-callout-renders`（`.ov-callout .ov-callout` 存在）
- 首轮全量审核暴露 3 项失败，全部为夹具/断言设计问题而非产品回归：① 新夹具的相对链接指向主夹具，多挂一条反链污染 `note.inline-backlinks` 计数 → 改指 `审核大纲`；② `config.obsidian-roundtrip` 断言 vault B 的 graph.json 初始为 null，与第三十二轮 shim 夹具播种的 colorGroups 冲突（此前只跑增量从未暴露）→ 重写为「接受播种值，且每次 config/write 后断言 colorGroups 保留」，顺带把两处写 graph.json 的检查补 `ensureVaultB()` 自给切库（否则 `--only` 会误写真实库）；③ `graph.settings-persist-to-vault` 是 ② 的级联失败，并补自给播种未知键
- 修 ② 时发现一处真实产品 bug：图谱设置面板每个颜色分组行的删除按钮也标 `aria-label="关闭"`，与面板关闭按钮撞名（playwright strict mode 报 2 个元素；对读屏用户同样是错误语义）→ i18n 新增 `removeGroup`（zh 删除分组 / en Remove group）并改用之
- 验证：`tsc` 0 错误、**265/265**、`tsdown` 成功；增量 `--only=` 六项 6/6 通过、0 console error；**全量审核 100/100 通过、0 console error**

## 第三十二轮：P9-3 obsidian shim v0——frame 内 `require('obsidian')` 真身、命令回环进宿主面板

- Shim bundle：`tsdown` 第四入口 `src/shim/index.ts` → `lib/shim.js`（IIFE，48.85 kB），`routes.ts` 新增 `shim.js` 路由（ACAO:*，与 worker.js 同款）；`frameDocument` 删旧 `window.require` 桩，内嵌 `__OV_MANIFEST__`/`__OV_GRAPH_JSON__`（`</script>` 防注入转义），以 `<script crossorigin src="…/shim.js">` 引导
- Shim 模块 13 个：`transport`（注入式 IO 可单测；request 相关 + `onEvent` 收宿主推送）、`obsidian.ts`（`createShim` 组装，app.workspace 用 getter 破循环引用，无断言）、`plugin.ts`（`Plugin`：loadData/saveData 走桥、addCommand 全量重发 `commands.register`、registerView 注进 ViewRegistry 并随插件卸载）、`views.ts`（Component/ItemView/WorkspaceLeaf.setViewState 挂载进 frame 自身 DOM）、`vault.ts`（warmup 预填缓存撑住同步 getter；create 先 exists 查重、process 读改写、写入即失效缓存；getResourcePath 走新 `bridge/raw` 路由保 canvas 读像素）、`metadata.ts`（getFirstLinkpathDest 精确→basename 小写）、`modals.ts`（Notice/Modal/FuzzySuggestModal/Menu 全部渲染进 frame DOM）、`setting.ts`（Setting 链式构建器 + 抽象 PluginSettingTab）、`node-stubs.ts`（path 真实现；crypto 给 randomUUID + 同步 sha256（`sha256.ts` 纯 JS 参考实现）；fs 只答内嵌 graph.json 的同步读，其余与 child_process/electron/os 全抛 `UnsupportedObsidianApi`；`installBuffer` 供 Buffer.from/toString base64|hex|utf8）、`files.ts`（TFile/TFolder + DTO 装配）、`errors.ts`、`normalize.ts`
- Server：`VaultFiles.list()`（递归、跳 dot 目录、产 `BridgeFileDto`）；`bridge-endpoints` 新增 `bridge/read-text` / `bridge/write-text` / `bridge/list` / `bridge/exists` / `bridge/raw`（原始字节 + ACAO:* + 按扩展名的 content-type）；`plugins/frame` 404 于 community 清单缺失
- 协议：`BridgeMethod` 4 → 10（新增 vault.readText/writeText/list/exists、workspace.getActiveFile/openLinkText）；新增 `HostEvent`（host→frame 通知，`HostMessage = BridgeResponse | HostEvent`）；dispatch 覆盖全部 10 方法，参数校验失败抛错且不达 vault
- 命令回环：frame `addCommand` → `commands.register` 上行 → `bridge-commands.ts`（React-free store：registerBridgedCommands 全量替换 + setCommandRunner + useSyncExternalStore 三件套）→ `useVaultCommands` 的 extra 追加 `bridge.<plugin>.<id>`（label `Pur Studio: <名>`）→ 面板运行 → `handle.notify('command.run', {id})` 下行 → shim 调插件 callback
- **本轮实锤的 effect 竞态**：MainPane 给 PluginView 传内联 `onOpenPath` → 每次渲染新引用 → bridge effect 反复销毁重建；`commands.register` 引发的 store 更新本身触发重渲染，cleanup 把刚注册的命令抹掉（面板里永远搜不到桥接命令）。修法与组件内既有 `activePathRef` 同款：`onOpenPathRef` 穿透，effect deps 收窄为 `[bridged, pluginId, title]`
- 单测：`tests/bridge.test.ts` 的 recordingDeps 扩六字段并补 readText/writeText/list/exists/getActiveFile/openLinkText 的校验与调用断言；新建 `tests/shim.test.ts`（10 用例：normalizePath、sha256 已知向量、Node stubs 抛错面、transport 相关与事件、vault 门面冷缓存与写序列、Plugin 数据往返与命令重发、fileFromDto、metadataCache、ViewRegistry）——冷缓存 `getFiles()` 会触发后台 warmup 挤占请求序号，测试须按序应答两个 list 请求
- 审核：pur-studio 夹具 main.js 换为真实 shim 操练（Plugin 子类 onload 依序：normalizePath、loadData/saveData 往返、getFiles/TFile instanceof、读 远端笔记、create+process 写回、addCommand×2、registerView+setViewState 挂载、child_process/electron 抛 UnsupportedObsidianApi、fs 读内嵌 graph.json、getResourcePath 加载 1×1 PNG、Notice），结果写进 frame DOM `#fixture-results`；`pur.frame-opens` 重写为：等 `#fixture-results` 含 `"done"` → 逐条断言全 ok → 无错误条 → 面板跑「夹具命令」断言 frame 内 `#fixture-command` 落字 → 跑「夹具打开链接」断言宿主导航到 远端笔记 且插件视图关闭 → 关白名单未桥接空态（保留）
- 验证：`tsc` 0 错误、260/260、`tsdown` 成功（shim 48.85 kB / client 493.11 kB）、重启宿主后增量审核 `settings.dialog-plugins`+`plugins.bridge-toggle-persists`+`pur.frame-opens` **3/3 通过、0 console error**；面板回归 `note.daily-note-command`+`note.template-command` 2/2 通过（首次失败系调试探针把宿主留在一次性临时库所致，切回主库后转绿，非产品回归）

## 第三十一轮：pur 插件方案启动——P9-2 桥接基础设施（白名单 + 沙箱 iframe + postMessage 桥）

- Server：新建 `vault/bridge.ts`（白名单读写 / `plugins/<id>/data.json` 往返 / `main.js` 字节读取 / id 校验 `^[A-Za-z0-9][A-Za-z0-9._-]*$`），`VaultFiles` 补 `readBytes/writeBytes`（写自动 mkdir 父目录），`obsidian-config` 白名单加 `plugins-bridge`；路由新增 `plugins/bridge-toggle`（未安装 404）、`plugins/script`（未入白名单 403；200 带 `access-control-allow-origin: *`）、`plugins/frame`（内联 bootstrap 的 HTML 壳）、`bridge/read-binary` / `bridge/write-binary` / `bridge/data` GET/POST（越界 400、ENOENT 404）；`plugins.ts` 的 DSH 扫描重构为通用 `pluginManifests(folder)`，`PluginsDto` 加 `community`（只读）+ `bridge`
- Client：`bridge-protocol.ts`（双向 source 标签 + request/event/response 三型 + `isFrameMessage` 守卫）；`bridge-dispatch.ts` 纯 dispatch（deps 注入可单测；`plugin.loadData/saveData` 锁挂载时的 pluginId 而非 params，防越权）；`bridge.ts` 收 API_DEPS + `attachPluginBridge`（按 `event.source === frame.contentWindow` 过滤，返回析构）
- 关键拆分原因：`client/api.ts` 用 TS 参数属性，Node strip-only 模式跑不了，dispatch 必须独立成模块才能进单测
- UI：`PluginView.tsx` 主视图容器（头部图标+标题+关闭；骨架 / 未桥接 EmptyState+「打开设置」action / 沙箱 iframe + `role="alert"` 错误条三态）；`view` 联合加 `'plugin'`，`onOpenSettings` 经 VaultPage→Workspace→MainColumn→PaneColumn→MainPane 下传；命令面板加「打开 Pur Studio」，状态栏视图标签加「插件」；设置对话框在 DSH 与核心两节之间插「可桥接插件」节（计数 + hint + 空态 + `BridgeRow` 开关写白名单）
- 不透明 origin 报错细节：sandbox 禁 same-origin 后跨源脚本错误会被浏览器洗成 "Script error."，故 script 响应加 ACAO:*、frame 以 `<script crossorigin>` 加载；错误经 postMessage 转发后 handler 调 `preventDefault()`，不进控制台
- 审核：新增 `plugins.bridge-toggle-persists`（community 含 pur-studio、白名单起始空、toggle 落盘、script 200+CORS 头、未入列 403、ghost toggle 404、对话框 UI 开关双向落盘）与 `pur.frame-opens`（命令开视图 → iframe `sandbox="allow-scripts"` → 夹具 `require('obsidian')` 抛错经桥回错误条含 'obsidian' → 关闭 → 白名单关 → 未桥接提示无 iframe）；两者经 `ensureVaultB`/`restoreBridgeVault` 自给切库——本轮实锤插件段检查此前依赖全量顺序里的切库，--only 模式下会误写真实库
- 验证：`tsc` 0 错误、`node --test` 249/249、`tsdown` 成功（client 487.25 kB）、重启宿主后增量审核 `--only=plugins.bridge-toggle-persists,pur.frame-opens` **2/2 通过、0 console error**（同轮 `settings.dialog-plugins` 亦过；真实库被误改的 `core-plugins.json` 恢复待用户确认）

## 第三十轮：ribbon 去重（只留右栏开关）、设置对话框集成插件开关与外观

- ribbon 去重：「插件」入口与 spacer 下方每个 DSH 插件的拼图图标功能重复（都是开插件面板），两者全删，只保留「切换右侧边栏」；spacer 后固定一个设置齿轮按钮（action 语义，aria-pressed 恒 false）
- 新增 `SettingsDialog.tsx`：外观区（舒适/紧凑两个变体按钮，选中态 primary 高亮 + aria-pressed，选择即写 localStorage `dsh.obsidian.variant` 并落根元素 `data-ov-variant`，无需刷新）+ 插件区（`PluginPanel` 整体迁入：DSH 插件列表、核心插件开关、刷新、打开文件夹均不变）
- 右栏 `plugins` tab 删除：`RailId`/`RAIL_SURFACES`/`Panels.tsx` 同步移除，插件管理只进设置对话框；`Ribbon` 删 `fetchPlugins`/`PluginDto`/拼图区状态与 props（`pluginsOpen`/`root`）
- `useVaultAppearance` 的 variant 从只读改为 state + `setVariant`；`useOverlayState` 加 `settingsOpen`/`openSettings`/`closeSettings`，`closeTransient` 一并关设置；命令面板 `plugins.open` → `settings.open`，`tests/commands.test.ts` 同步
- 审核支持增量：`--only=name1,name2` 只跑指定检查（setup/teardown 照跑），汇总行报 skipped 数；`rail.plugins-panel` → `settings.dialog-plugins`（齿轮开对话框、变体切换落盘 + 根属性、两节断言、DSH 行展开/桥接占位、核心开关与 `plugins/list` 对齐、刷新不丢行、Escape 关闭）；`ui.ribbon-plugin-icons` → `ui.ribbon-settings-gear`（无插件入口/无拼图图标/恰一个 spacer/齿轮在 spacer 后/点击开关对话框）；`menu.panel-tabs` 加「菜单无插件项」反断言并补自给前置（开笔记 + 开右栏），增量模式可独立成立
- 验证：`tsc` 0 错误、`node --test` 240/240、`tsdown` 成功（client 472.89 kB）、重启宿主后增量审核 `--only=menu.panel-tabs,settings.dialog-plugins,ui.ribbon-settings-gear` **3/3 通过、0 console error**（其余 92 项按用户要求跳过）

## 第二十九轮：顶栏再瘦身、分屏分隔条、右键切分/关窗格、← → 根因修复、ribbon 收右栏

- 顶栏：右上角快速切换 pill 删除（Ctrl+O、标签栏「+」、ribbon 搜索已覆盖）；「⋯」溢出按钮与 topbar 菜单场景整体删除，其唯一残留项「刷新索引」提成顶栏图标按钮（放在 ← → 之后）；`Icon` 删 `more` 图形（`moreActions` 键保留，它同时是 ContextMenu 的 aria-label）
- ← → 根因修复：preview 复用分支此前用 `makeTab` 重建标签（历史重置为单条），资源管理器点文件永不积累历史导致按钮恒禁用；改为复用时 `pushHistory` 入栈，← → 可遍历整个点击链，回退后再点新文件自动丢前向分支
- 分屏可调宽高：`PaneState` 新增 `size`（flex-grow 份额，切分对半分）；新组件 `PaneSplitter`（增量像素 delta、pointer capture、方向键步进 48px、双击均分），`MainColumn` 负责 px→grow 换算（钳制 `MIN_PANE_SIZE` 与 120px）；分屏白线规则 `.ov-pane-active:not(:only-child) .ov-tabbar` 整条删除（任何情况都不再画）
- flex-grow 陷阱修复：关窗格带走份额后总份额 <1，CSS 规定 grow 总和 <1 时不归一化，窗格缩成实际份额宽度、长条剩余空间留空（审核实锤：0.125+0.125 时两窗格各 70px）；`MainColumn` 渲染前归一化（`share = size / Σsize`）再下发给 `PaneColumn`
- 标签右键菜单新增「向右拆分/向下拆分/关闭窗格」（仅 1 窗格时关闭窗格禁用）；右键先经 `onPointerDownCapture` 聚焦所在窗格，关窗格作用域正确
- ribbon 新增「切换右侧边栏」图标（panelRight），按压态跟随右栏可见性，切右栏不动主视图（关系图保持打开）
- 审核同步：`rootMenu`/`menuLabels` 上移到 helpers 区供分屏段复用；`nav.quick-pill-opens`→`nav.topbar-refresh`（断言 pill/⋯ 不存在 + 刷新按钮可用）；新增 `panes.splitter-resize`（拖 120px 两窗格此消彼长、双击均分）、`tabs.context-menu-split-close-pane`（菜单三项、单窗格禁用、切分后关回）；`panes.split-down-and-close` 补横向分隔条 ×2 断言；`menu.topbar-and-panel`→`menu.panel-tabs`（删顶栏右键部分）；新增 `ui.ribbon-toggles-rail`（可见性与 aria-pressed 双翻转）；`tabs.select-and-history` 注释更新
- 验证：`tsc` 0 错误、`node --test` 240/240、`tsdown` 成功（client 470.70 kB）、重启宿主后 `ui-full-audit` **95/95 通过、0 console error**

## 第二十八轮：社区插件连根删（用户裁决）

- 用户裁决「不要有社区插件了（连根删）」：插件面板只剩 **DSH 插件** 与 **核心插件** 两节，社区节（含全部/可桥接/仅元数据/原生专用过滤 chips、兼容徽章、API 标签、原生替代建议行）整节删除
- 扫描器删除：`src/vault/plugin-compat.ts`（main.js 文本分析、三档判定）与其单测 `tests/plugin-compat.test.ts` 整文件移除；`PluginDto` 瘦身为 `{id,name,version?,author?,description?}`，`PluginsDto` 删 `configured/folder/folderExists/community/scanned`，`PluginCompatibility` 类型删除
- `community-plugins.json` 读写路径整段移除：`setCommunityPluginEnabled`、`pluginsFolder`、`obsidian-config` 白名单与 `ObsidianConfigFile` 联合删 `community-plugins`；`plugins/toggle` 路由不再收 `core` 标志，永远写 `core-plugins.json`（`togglePlugin(id, enabled)` 同步去参）。**注意**：面板从此不能开关 Obsidian 社区插件，Obsidian 本体的启用列表不受影响
- i18n 双语同删 15 键：`communityPlugins/pluginNotInstalled/pluginEnabled/pluginDisabled/pluginTier{All,Metadata,Bridgeable,Native}/pluginApiUsage/pluginScanHint/pluginAlt{PurStudio,Claudian,RemotelySave,Surfing,Generic}`；样式同删 `pluginTag/pluginFilters/pluginBadge/pluginApis/pluginAlt` 与 `[data-installed]`、`[data-active]` 规则
- 审核同步：`plugins.list-scans-folder`/`plugins.toggle-persists` 删除，新增 `plugins.core-toggle-persists`（核心开关落盘 + DSH 夹具清单断言）；`rail.plugins-panel` 改写——断言**只剩两节**且「社区插件」标题不存在，DSH 行展开/收起、核心开关跟随 `core-plugins.json`、刷新不丢行、离开标签 ribbon 取消按压保留；DSH 夹具 `audit-dsh` 创建上移到脚本头部（92 项）
- 验证：`tsc` 0 错误、`node --test` 237/237、`tsdown` 成功（client 466.14 kB）、重启宿主后 `ui-full-audit` **92/92 通过、0 console error**

## 第二十七轮：插件面板删说明行、笔记头部去重合并行、编辑器只留「阅读」

- 插件面板社区节删两行：`G:\…\plugins` 路径行与「只管理插件文件夹与启用状态」提示行（i18n `pluginsHint` 键双语同删）；「社区插件 · N」节标题保留以区分 DSH/核心两节
- 笔记头部去重：「反链 · N」按钮删除（右栏反链标签、状态栏计数、文档底部反链区块已是其家），`onShowBacklinks`/`backlinkCount` props 链跨 7 个文件拆除；「源码」按钮移入面包屑行（新增 `.ov-note-head-row`：面包屑 `flex:1` 收折、按钮 `flex:0 0 auto` 钉在右端），头部从三行压到两行
- 编辑器只留「阅读」：「保存」按钮删除（800ms 自动保存 + Ctrl+S + 退出刷写已是保存路径），i18n `saveNow` 键双语同删
- 审核同步：`note.backlink-shortcut-opens-rail` 检查随头部反链按钮删除（93 项），rail 覆盖由 `rail.backlinks-panel` 保留；`button[title="源码"]`/`aria-label="阅读"` 选择器均不受位置影响
- 验证：`tsc` 0 错误、`node --test` 246/246、`tsdown` 成功（client 473.92 kB）、重启宿主后 `ui-full-audit` **93/93 通过、0 console error**

## 第二十六轮：⋯ 菜单再查重、白线根因修复、← → 点击级验证

- ⋯ 菜单删「快速切换」：顶栏右侧 pill（带 Ctrl O 提示）已是它的家，菜单项是重复入口；`registry.ts` 的 `topbar` 场景只留「刷新索引」，审核 `menu.topbar-and-panel` 反转为「含刷新索引、不含快速切换/关系图/切换笔记树/切换右侧边栏」
- 白线根因定位（浏览器探针实测）：不是 `.ov-tabbar` 的 `border-bottom`（深色下计算值仅 3% 白、不可见），而是 `.ov-pane-active .ov-tabbar` 的 `inset 0 -1px` 焦点阴影——宿主深色主题把 `--dsw-alias-brand-primary` 解析为 `#f9fafb` 近纯白，整条亮线横贯主区。修复：焦点边线改为 `.ov-pane-active:not(:only-child)`，只在分屏（2+ 窗格）时显示，单窗格不再有这条线；浅色主题下同位置原本是近黑线，一并消除
- ← → 真机验证结论：审核 `tabs.select-and-history` 本就是点击驱动（真实点击 ← → 按钮并断言活动标签切换 + 四个 disabled 边界），本轮再补正文级断言——点 ← 后 `.ov-document` 必须渲染回退目标笔记标题、点 → 后必须渲染前进目标正文，证明导航驱动的是完整重渲染而非仅标签条变化
- 验证：`tsc` 0 错误、`node --test` 246/246、`tsdown` 成功（client 475.13 kB）、`ui-full-audit` **94/94 通过、0 console error**；深色探针复核 `tabbarBoxShadow: none`，白线目视消失

## 第二十五轮：VaultPage 瘦身至 ≤300 行（纯重构）

- M4 残余收尾：`VaultPage.tsx` 从 420 行降到 **276 行**——DOM 结构、类名、aria-label、行为零改动，审核 94 项全过即为证明
- 新增 `VaultWorkspace.tsx`（271 行）纯布局组合组件：TopBar/Ribbon/ExplorerColumn/MainColumn/RailColumn/scrim/StatusBar/VaultOverlays 全部 JSX 移入；props 用 `ComponentProps<typeof X>['field']` 索引签名，不重复声明子组件类型；hook 返回整体传入（`tabs`/`bookmarks`/`overlays`），`labels`/`vaultName`/`widthVars`/历史边界在组件内派生；`WidthVars` 类型随迁并导出
- 新增 `useVaultCommands.ts`（62 行）：`useVaultNotes`（日记/模板）+ 窗格命令（split/close）+ `useCommandSurface` 三者收进一个 hook，`folders`/`bookmarkPaths`/`extra` 的 memo 一并迁入；`extra` 数组从此 memo 化，不再每次渲染重建
- `VaultPage` 只保留：全部 state/hooks、`selectRibbon`/`onVaultSwitched`/`createTarget`、`openNewTab`/`openPlugins`/`openEdit`/`openReading`、根 div + 样式注入 + 一个 `<VaultWorkspace/>`
- 验证：`tsc` 0 错误、`node --test` 246/246、`tsdown` 成功（client 475.06 kB）、`ui-full-audit` **94/94 通过、0 console error**

## 第二十四轮：入口再查重、阅读视图文档内反链、导航按钮边界

- 图一去重（用户裁决「只删空态按钮」）：空态的「快速切换」按钮删除——ribbon 搜索（全文模式）、顶栏 pill（文件模式）、Ctrl+O、标签栏「+」各有其职，空态保持被动；`MainPane`/`PaneColumn`/`MainColumn`/`VaultPage` 的 `onQuickSwitch` 链路整体拆除
- M5 收尾：阅读视图文档底部新增反链区块（`ov-doc-backlinks`：标题「反链 · N」+ 行 = 源笔记标题 + 上下文摘录），点击直达源笔记，无反链不渲染；`NoteView` 的 `backlinks` prop 从「仅供头部计数」升级为文档内列表数据源
- 图二：主区顶部白线调暗——`.ov-tabbar` 的 `border-bottom` 改 `color-mix(50% transparent)`，分割线仍在但不跳脱
- 图三（前进后退验证补全）：顶栏 ← → 按钮本就接 `canBack/canForward`；审核新增 `nav.history-buttons-initial`（无历史时双禁用 + 空态无动作按钮），`tabs.select-and-history` 补四个边界断言（最新条目前进禁用、回退到底后退禁用、回退后前进可用、返回最新后前进再禁用）
- 顺手修正：`protocol.ts` 的 `dsh` 字段注释还写着已废弃的 `.obsidian/plugins-dsh`，改为包内全局目录
- 验证：`tsc` 0 错误、`node --test` 246/246、`tsdown` 成功（client 471.70 kB）、`ui-full-audit` **94/94 通过、0 console error**

## 第二十三轮：DSH 插件目录迁至插件包内（全局共享）

- 用户裁决：「只需要 dsh 内的 obsidian 插件内的插件文件夹，之后的插件位置都在这里面」——DSH 适配插件从每库的 `.obsidian/plugins-dsh/` 改为插件包内全局目录 `plugins/dsh-obsidian-vault/plugins/`，所有库共享同一份
- 实现：新增 `src/package-root.ts`（源码入口 `src/` 与构建产物 `lib/` 都恰好在包根下一层，`import.meta.url` 上溯一级即包根）；`listPlugins(root, dshFolder)` 与 `revealPluginsFolder(folder)` 改为注入式，端点统一传 `DSH_PLUGINS_FOLDER`；vault 层不再知道目录位置；`plugins/` 加入包 .gitignore
- 测试/审核：单测注入每轮临时目录；审核夹具落到真实包目录 `plugins/audit-dsh`（收尾清理），`dshFolder` 断言改为包路径；i18n 提示改为「全局插件文件夹」
- 验证：`tsc` 0 错误、`node --test` 246/246、`tsdown` 成功（client 469.78 kB）、重启宿主后 `ui-full-audit` **92/92 通过、0 console error**

## 第二十二轮：入口去重、搜索瞬时化、DSH 插件专区

- 菜单去重：顶栏 ⋯ 菜单只留「快速切换 / 刷新索引」，删掉与 ribbon/面板右键菜单重复的「关系图 / 切换笔记树 / 切换右侧边栏」三项（命令面板保留全部命令，动作与 i18n 键不动）
- 搜索瞬时化：ribbon「搜索」从粘滞按压改为纯动作（`aria-pressed` 恒 `false`，点击仅打开快速切换全文模式），修掉「搜索+关系图+插件三亮」的错误高亮；`VaultPage` 的 `ribbon` state 删除，文件项按压 = 资源管理器可见
- ribbon 插件图标区：下半区（`ov-ribbon-spacer` 之下）列出 `.obsidian/plugins-dsh` 已安装插件的 puzzle 图标（`data-plugin` 属性），点击打开插件面板；Ribbon 自行 `plugins/list`，库切换或插件档开合时刷新；Icon 增 `puzzle` 字形
- `.obsidian/plugins-dsh/` 专属目录（用户裁决：文件夹只放适配 DSH 的插件）：`PluginsDto` 增 `dsh: PluginDto[]`（仅 manifest 元数据、`enabled` 恒 `false`、不跑兼容扫描）与 `dshFolder`；「打开插件文件夹」改开 DSH 目录；面板顶部新增「DSH 插件」节（路径 + 引导文案 + 无启用开关的行，详情保留「在 DSH 中运行」桥接占位）
- 审核脚本：`menu.topbar-and-panel` 反转为「含两项、不含三项」；`ui.ribbon-search-opens-quick` 断言搜索不再按压；`plugins.list-scans-folder` 增 `audit-dsh` 夹具与 `dsh`/`dshFolder` 断言；`rail.plugins-panel` 增 DSH 节断言（无启用开关 + 桥接占位详情）；新增 `ui.ribbon-plugin-icons`（图标出现 + 点击开面板）
- 验证：`tsc` 0 错误、`node --test` 246/246（`tests/plugins.test.ts` 增 DSH 目录用例）、`tsdown` 成功（client 469.71 kB）、重启宿主后 `ui-full-audit` **92/92 通过、0 console error**

## 第二十一轮：P9-1 插件面板迁入右栏

- 注册表：`RAIL_SURFACES` 增 `plugins` 一档（与大纲/反链/书签同源），`RailId` 随之扩展；面板右键菜单的档位列举由硬编码三项改为从 `RAIL_SURFACES` 派生，新档自动出现在勾选菜单
- 面板重组：`PluginPanel` 从 dialog 重写为右栏面板（`Panels.tsx` 渲染分支）——工具行（兼容层级过滤 chips + 刷新 + 打开插件文件夹图标按钮）、库内插件目录路径、提示行、社区/核心两节；行点击展开详情（ID、`main.js` 大小、「在 DSH 中运行」桥接占位开关〔禁用态，提示运行时开发中〕、native-only 行显示原生替代引导——`pur-studio`/`realclaudian`/`remotely-save`/`surfing` 按 id 映射，其余走通用文案）；行内信息（名称/版本/作者/描述/兼容徽章/API 标签/启用开关）不变
- 入口改线：ribbon 与命令面板 `plugins.open` 改为 `setRail('plugins') + setRailOpen(true)`；ribbon 按压态跟随 `rail === 'plugins' && railOpen`；`showRail` 放宽为「有 Markdown 笔记」或「插件档」（无笔记时插件档仍可打开）；dialog 链路（`useOverlayState` 的 pluginOpen 与 `VaultOverlays` 的 PluginPanel 渲染）整体删除
- 样式归位：`.ov-plugin-*` 从 dialog.ts 迁入 chrome.ts（面板 chrome 的家），行改纵向卡片（信息区为展开按钮 + 独立开关列，避免嵌套交互），新增 `pluginTools/pluginLine/pluginDetail/pluginAlt` 规则；顺手补上过滤 chips 激活态样式（原 `.ov-plugin-filter[data-active]` 选择器从不命中 `ov-dialog-button`，激活态只有属性没有视觉）
- i18n：zh/en 增 `pluginDetail/pluginBridgeRun/pluginBridgePlanned/pluginAlt{PurStudio,Claudian,RemotelySave,Surfing,Generic}`
- 审核脚本：`plugins.panel-ui` 重写为 `rail.plugins-panel`（rail 打开 + 徽章/API 标签/启用开关持久化 + 行展开详情与桥接占位开关 + native-only 引导 + 过滤 chips + 刷新 + 切档后 ribbon 取消按压）；`plugins.list-scans-folder` 增 native-only 夹具 `audit-native`（`require('fs')`），过滤芯片从此两个方向都有真行可验
- 验证：`tsc` 0 错误、`node --test` 245/245、`tsdown` 成功、`ui-full-audit` **91/91 通过、0 console error**

## 第二十轮：P8-5 分屏（split panes）

- 纯模型层：新增 `ui/panes.ts`——`PanesState`（`panes[]` + `active` + 整组 `direction` + 稳定自增 `nextId` 供 React key），`splitPane` 把活动窗格的活动标签移入紧随其后的新窗格并聚焦（空窗格则原地加空窗格），`closePane` 丢弃活动窗格及其标签（最后一个拒绝），`mapPane` 关到空窗格自动坍缩；复用 `tabs.ts` 全部标签动词
- hook 层：`useVaultTabs` 重写为多窗格版——内部 state 换 `PanesState`，原动词全部 `mapActive` 作用于活动窗格，移除 `setTabs` 改暴露 `mapTabs`（`useVaultActions` 的 rename/remove/move 随之改写）；新增 `activatePane`/`splitPane`/`closePane`
- 组件层：新增 `PaneColumn.tsx`（每窗格独立 `useNoteBundle` 数据与 `useScrollMemory` 滚动记忆；活动窗格用页面共享 bundle，非活动窗格自拉；根节点 `onPointerDownCapture` 焦点跟随点击；`register` 向页面注册 `onHeading/clear` 处理器）；`MainColumn` 重写为窗格列表（`data-direction` 行列方向，稳定 `register` useCallback）
- 页面层：`VaultPage` 的 `useScrollMemory`/`scrollRef` 迁入 PaneColumn，改 `paneHandlers: Map<paneId, handlers>` 注册表路由大纲跳转与清滚动；`note/backlinks/unlinked` 加 `note.path === path` 守卫防陈旧渲染；命令面板追加 `split.right`/`split.down`/`pane.close`（单窗格时隐藏后者）
- 样式/i18n：`.ov-main-column[data-direction]` 行列布局、`.ov-pane` 均分 + 分隔线、`.ov-pane-active` 标签条品牌色下沿；zh/en 增 `splitRight`/`splitDown`/`closePane`
- 审核脚本：新增 `panes.split-right`（拆分 → 活动标签迁入右窗格并聚焦）/`panes.independent-tabs`（右窗格开新笔记不影响左窗格）/`panes.focus-follows-click`（点击左窗格标签激活之）/`panes.split-down-and-close`（列向拆分 → 两次关闭回单窗格 → 单窗格时命令面板不再列出「关闭窗格」）；补 `runPalette` 助手
- 验证：`tsc` 0 错误、`node --test` 245/245（新增 `tests/panes.test.ts` 8 例）、`tsdown` 成功、`ui-full-audit` **91/91 通过、0 console error**

## 第十九轮：P8-4 大纲拖拽调整标题层级

- 纯函数层：新增 `vault/heading-level.ts`——`shiftedHeadings`（目标标题 + 其后更深的子标题，遇到同级即止）、`clampHeadingShift`（钳制到全组 1..6 合法区间，动不了返回 0）、`shiftHeadingLevel`（在含 frontmatter 的原文上按正文行号改写 `#` 前缀；frontmatter 行数偏移由 `parseFrontmatter` 推导，围栏代码不触碰，行非标题/越界/no-op 一律返回 undefined）
- 交互层：`panels/Outline.tsx` 从渲染函数改为组件，指针拖拽（`setPointerCapture`，24px/级，4px 点击容差，拖动后抑制 click 触发滚动跳转），拖动中实时预览缩进（子树行同步偏移）并显示 `H2→H3` 徽标（`.ov-outline-badge`）
- 保存层：新增 `useHeadingShift` hook——`fetchFile` 取原文与 mtime → 纯函数改写 → `saveNote`（409 时重载索引并上报错误横幅）→ `reload`；VaultPage 只接线一行，Panels/RailColumn 透传 `onShiftHeading`
- 审核脚本：新增夹具 `审核大纲.md`（H1/H2/H3/H2 嵌套）与 `rail.outline-drag-level` 检查（拖 30px 降级 → 断言徽标与子树改写 → 拖回升级复原；`finally` 保证断言失败也松开鼠标，收尾重开夹具笔记防级联）；首跑暴露 36px=2 级的步长误判与后续 3 项级联失败，修复后通过
- 验证：`tsc` 0 错误、`node --test` 237/237（新增 `tests/heading-level.test.ts` 6 例）、`tsdown` 成功、`ui-full-audit` **87/87 通过、0 console error**

## 第十八轮：组合根瘦身（i18n / tokenize / VaultPage 拆分）

- i18n 拆分：`client/i18n.ts`（414 行字典）拆为 `i18n/zh.ts` 与 `i18n/en.ts`（EN 以 `Dict` 类型反向约束 ZH 的键集，缺键编译期报错），`i18n.ts` 只留 `Lang`/`Dict`/`Translate`/`createT`/`detectLang`（36 行）；所有既有 `from '../i18n.ts'` 导入不变
- tokenize 拆分：`ui/files/tokenize.ts`（334 行）拆出 `files/lang-data.ts`（18 语言关键词表 + 注释/markup/属性/纯文本语言集合）与 `files/tokenize-markdown.ts`（Markdown 行级高亮 + 行内扫描），主文件剩类型、规则推导与通用/markup 扫描器
- VaultPage 452→345 行：浮层状态（quick/menu/vault/plugin + newTabPending + 14 个开关回调）抽为 `useOverlayState.ts`；菜单分组与命令面板的 memo 装配抽为 `useCommandSurface.ts`（`buildMenu`/`buildCommands`/`runCommand` 一处）；TabStrip+MainPane 组合为 `MainColumn.tsx`（与 ExplorerColumn/RailColumn 对称）；`vaultNameOf`/`folderPaths` 移入 `ui/paths.ts`；两处重复的「标签 → 全文搜索」内联回调统一为 hook 的 `openTagSearch`
- 验证：`tsc` 0 错误、`node --test` 231/231、`tsdown` 成功、`ui-full-audit` **86/86 通过、0 console error**

## 第十七轮：模块化拆分与死代码清理

- 样式层拆分：`kit/styles/layout.ts`（546 行 CSS）拆为 `styles/shell.ts`（SHELL_STYLE：根布局/滚动条/顶栏/按钮/图标按钮/pill/浮层遮罩/banner）与 `styles/workspace.ts`（WORKSPACE_STYLE：资源管理器/标签 chips/右键菜单/文件树/笔记区/右栏面板/快速切换/悬停预览/大纲/面包屑），`kit/index.ts` STYLE 数组原位替换，级联顺序不变
- 死样式清理：删除 SVG 图谱时代的 `.ov-graph/.ov-edge*/.ov-node*/.ov-label*` 全部 CSS（图谱已改 Canvas 渲染，只渲染 `ov-graph-canvas`）与 classes.ts 对应 13 个键；删除无组件使用的 `.ov-props/.ov-prop/.ov-prop-key`（属性面板用 `ov-properties` 系列）及 classes.ts 4 个键；删除与 content.ts 重复的 `.ov-document a`、`.ov-unresolved`
- 样式归位：`.ov-document` 最大宽度并入 content.ts 既有规则；`.ov-ambiguous`（改 `.ov-document a.ov-ambiguous`，与 unresolved 对称）、标签链接 `a[href*="/tag?"]`、`.ov-callout*` 整块迁入 content.ts
- vault 第二层拆分：`vault/index.ts` 652→525 行；`move()` 抽到 `vault/move.ts`（`moveEntry(state, from, to)` 纯依赖注入：files/notes/backlinks/resolver，index.ts 留薄封装负责 refresh）；目录遍历抽到 `vault/scan.ts`（`scanVault()` 返回 ScanResult 含签名，isIgnored 随迁）；`readText` 复用 `resolveRelative` 去掉重复的分隔符拼接
- 验证：`tsc` 0 错误、`node --test` 231/231、`tsdown` 成功、重启宿主后 `ui-full-audit` **86/86 通过、0 console error**

## 第十六轮：P8-3 书签（面板整合）

- 书签数据层：`ui/bookmarks.ts` 解析 `bookmarks.json` 的 `items[]`，只把 `file` 项作为展示条目并按路径去重，`folder`/`group` 项与其他键原样保留；`withBookmark()` 一次增删一条，重复添加幂等
- 书签状态：`ui/useVaultBookmarks.ts` 随活动库读取配置，`toggle`/`remove` 写回后以 Host 返回的文档重算条目，失败经页面 `setError` 上报
- UI 整合（按用户要求不新增浮层）：书签复用右栏面板注册表 `RAIL_SURFACES`（新增 `bookmarks` 一档）与既有 `.ov-item` 结构，只补 `.ov-bookmark-row` / `.ov-bookmark-remove` 两个类；入口合并到文件右键菜单「添加/移除书签」、命令面板 `bookmark.toggle` 与 `bookmarks.show`、面板右键菜单勾选项，全部经 `useVaultActions` / `buildCommands` 统一分发
- Host 白名单：`ObsidianConfigFile` 与 `CONFIG_FILES` 增 `bookmarks`
- 审核脚本：新增 `rail.bookmarks-toggle`（右键添加 → `bookmarks.json` 条目校验 → 右栏「书签」标签页出现行 → 点击打开 → × 移除 → 空态），`menu.tree-file-items` 补「书签」断言；夹具备份并恢复 `bookmarks.json`
- 结果：审核首跑暴露「客户端 bundle 已更新、Host 仍用旧白名单」→ `config/read?file=bookmarks` 400；重启宿主后通过（Host 侧白名单在进程内，改 `CONFIG_FILES` 必须重启）
- 验证：`tsc` 0 错误、`node --test` 231/231（新增 `tests/bookmarks.test.ts`，`tests/commands.test.ts` 补书签命令断言）、`tsdown` 成功、`ui-full-audit` **86/86 通过、0 console error**

## 第十五轮：P8 命令面板 + 每日笔记/模板

- 命令面板（P8-1）：新增 `ui/commands.ts` 注册表（`buildCommands`，含 Ctrl+O/Ctrl+F/Ctrl+E 提示与 `extra` 注入位），`QuickSwitcher` 增 `commands` 模式（`>` 前缀 / `Ctrl+P`），`useVaultShortcuts` 增 `onCommands`；命令统一经 `VaultPage.runCommand`（先关浮层再执行）分发，不新增第二条变更路径
- 每日笔记与模板（P8-2）：`ui/daily-note.ts` 纯函数（`daily-notes.json` 的 folder/format/template 解析 + `YYYY/YY/MM/M/DD/D` 展开），`ui/useVaultNotes.ts` 把今日笔记与模板文件夹内的笔记注册为命令；`ObsidianConfigFile` 与 `CONFIG_FILES` 白名单增 `daily-notes`/`templates`
- 修真实 bug：面板在输入过滤后高亮索引仍指向旧位置，Enter 命中空项导致浮层不关闭（每日笔记命令因此「无反应」）；`QuickSwitcher` 抽出 `cursor = min(active, shown-1)` 统一用于键盘导航、Enter 与高亮，并在每次输入时 `setActive(0)`
- 审核脚本：新增 `note.daily-note-command`（写入临时 `daily-notes.json` → `Ctrl+P` 运行 → 断言 `审核每日/<YYYY-MM-DD>.md` 正文等于模板、标签页与阅读视图就位）与 `note.template-command`（`templates.json` → 命令 → prompt 命名 → 种子正文）；夹具在 `finally` 恢复原配置并清理目录
- 验证：`tsc` 0 错误、`node --test` 224/224（新增 `tests/commands.test.ts`、`tests/daily-note.test.ts`）、`tsdown` 成功、`ui-full-audit` **85/85 通过、0 console error**

## 第十四轮：P7 编辑器 + L1 插件兼容

- P7 Live Preview 编辑（首版为全文源码编辑 + 防抖保存）：新增 `ui/editor/SourceEditor.tsx`，`.ov-editor-view/.ov-editor-area`，800ms 自动保存、`Ctrl+S` 立即保存、`Ctrl+E` 回阅读、卸载时兜底写入未落盘草稿
- Host 写入通道：`VaultIndex.saveNote(path, content, baseMtime)` + `POST /obsidian/api/note`（`src/note-write.ts`）；陈旧 mtime 返回 409 与当前 mtime，客户端显示冲突条（重新载入 / 覆盖保存）；mtime 按毫秒取整比较，避免 JSON 浮点误差误报
- 客户端 API：`saveNote()` 与 `ApiError`（带 `status`），`FileView → MainPane → VaultPage` 接线，保存成功后触发 `reload()` 重取索引
- L1 插件兼容分析（对应的 PLAN §8.2 方案落地）：`vault/plugin-compat.ts` 只读扫描 `main.js`（2MB 上限、零执行），三档 `metadata-only / bridgeable / native-only` 与 API 标签；`PluginDto` 增 `compatible/apiUsage/mainSize`，`PluginsDto` 增 `scanned`
- 面板：兼容徽章 + API 标签 chips + 全部/可桥接/仅元数据/原生专用 四档筛选（纯客户端过滤，不写盘）
- 审核脚本：`note.source-and-reading-roundtrip` 改为编辑器往返（断言正文/围栏、自动保存经 API 校验、`Ctrl+S` 复原、回阅读）；新增 `note.editor-conflict-bar`（外部写入 → `Ctrl+S` → 409 → 冲突条 → 重新载入取磁盘文本 → 复原夹具）；`plugins.panel-ui` 补徽章、chips 与筛选断言；`plugins.list-scans-folder` 恢复 core 默认断言
- 审核脚本放行「故意触发」的 409：仅 `note.editor-conflict-bar` 的 `/obsidian/api/note` 409 与 Chromium 资源错误不计入 console error
- 验证：`tsc` 0 错误、`node --test` 215/215、`tsdown` 成功、`ui-full-audit` **82/82 通过、0 console error**

## 第十三轮：UI 整合 + 模块化拆分

- UI 去重：Ribbon 的「搜索」不再另做一套过滤逻辑，统一打开快速切换的全文搜索模式；标签 chip 同样进入全文搜索；`notesTree` 死键删除
- 拆分：`GraphView` 811 → 182 行（`useGraphData` / `useGraphLayout` / `useGraphCamera` / `GraphToolbar` / `graph/TagPicker`）、`VaultPage` 489 → 385 行（组合根，保留）、`NoteView` 325 → 256 行（`note/NoteHeader` / `note/NoteMeta`）
- 新增组合层：`useVaultAppearance`（语言 + 密度）、`useResponsivePanes`（窄屏抽屉）、`useVaultShortcuts`（快捷键）、`VaultOverlays`（快速切换/菜单/知识库/插件四个浮层）、`ExplorerColumn` / `RailColumn`（左右栏壳）
- 修真实 bug：窄屏下关闭态的抽屉仍有可点击区域（`transform: translateX(-102%)` 后盒子仍覆盖 Ribbon），改 `.ov-explorer/.ov-rail:not(.ov-pane-open) { visibility: hidden }`
- 审核脚本随行为同步：`ui.ribbon-search-opens-quick`（断言浮层 + 模式 + 焦点 + Esc）、`ui.narrow-drawers` 改用「文件」按钮并在 `finally` 恢复视口、`graph.culls-offscreen` 先等相机静止再放大 8 次
- 验证：`tsc` 0 错误、`node --test` 203/203、`tsdown` 成功（client 404.02 kB）、`ui-full-audit` **81/81 通过、0 console error**

## UI 精简（按用户要求）

- 去掉文件列表的排序下拉、`.md` 扩展名开关、顶栏密度按钮
- 连带清理：`ExplorerSort` 类型、sort/showExtension 状态与 props、7 条 i18n 文案、`.ov-explorer-toggle` 样式
- 保留：右栏反链面板自己的排序（不在红框内），密度变体机制仍在 kit 内可编程使用
- 验证：工具栏只剩 新建笔记/新建文件夹/全部折叠；顶栏无密度按钮；文件名不带 `.md`；0 报错

## Canvas 渲染层拆分

- `ui/GraphCanvas.tsx` 349 → **156 行**：只保留 React 宿主、rAF 循环、ResizeObserver
- 绘制拆到 `graph/render/`：`scene`(111) / `input`(139) / `labels`(50) / `hit`(33) / `palette`(39)
- 验证：缩放 1.000→1.098（pan 0,0→-13,11）；拖拽 dataset.drag 记录节点路径；0 控制台错误

## G4 已完成（Canvas 2D 渲染）

- 渲染从 SVG/React 迁到 Canvas 2D：`ui/GraphCanvas.tsx` 每帧直绘，React 只渲染外壳
- 自带命中测试：悬停高亮邻居、按下拖拽、空白处平移、滚轮锚定光标缩放、点击打开笔记
- 实测：400 节点 2778 边正常；zoom 1.000→1.098；拖拽 dataset.drag 有值；0 报错
- 删除 `GraphElements.tsx`（SVG 版本），无重复实现

## G3 已完成（稳定布局 + 相机）

- 增量布局：`LayoutRun` 接受 seed，新节点落在邻居质心；节点集不变时跳过重排
- 修复真实 bug：首次布局把全部节点堆在原点（seed 退化导致 fit 崩溃），已加 seed 展布校验
- 首次布局改为内联、后续走 worker：实测 123/123、216/216 节点坐标正常
- 缩放范围 0.125–8，滚轮光标锚点生效

## UI kit 已完成（统一管理 + 风格切换）

- 样式模块迁入 `ui/kit/`：tokens / classes / styles / variants / registry
- 新增密度风格：宽松 / 紧凑，写 `data-ov-variant` 并持久化（实测 `.ov-item` 7px→3px，刷新后保持）
- 右栏面板标签改由 `RAIL_SURFACES` 清单生成，增删面板 = 改清单一行
- `theme.ts` 变为 re-export，业务组件不再直接依赖样式目录

## G1/G2 已完成（图谱 Worker + 时间流逝动画）

- 图谱仿真搬进真 Web Worker（第二个 bundle + Host 路由 + 单例复用 + 内联降级）
- 主线程长任务从 50–60 ms 降到 **0**；400 节点全局图正常
- 「重播」时间流逝动画：节点按度数依次显现（32/123 → 123/123）
- 逆向结论见 `GRAPH.md`：Obsidian 用 PIXI(WebGL) 渲染 + alpha 驱动增量仿真 + 手动渲染调度

> 本文件是进度日志；**唯一的执行计划见 [PLAN.md](PLAN.md)**。

# 插件路线图 v2：完整性差距 · 代码拆分 · 落地计划

> 依据：`REFERENCE.md`（本地 Obsidian 1.12.7 实测）+ 当前插件实测（559 篇库、99 个用例全绿）。

## M4 已完成（UI 拆分）

- `GraphView` 516 → 458：`GraphElements.tsx` 负责边/节点/标签与拖拽回调
- `Explorer` 363 → 271：`explorer/Toolbar.tsx`（排序/扩展名/新建/折叠）+ `explorer/ContextMenu.tsx`
- 文档内反链：`NoteView` 头部开关 + 底部区块，偏好存 localStorage
- 验证：图谱 123 节点悬停/点击跳转正常；拖拽菜单正常；反链区块渲染 50 行；116 用例全绿

## M4 进行中（UI 拆分）

- `VaultPage` 590 → 452：抽出 `useVaultData.ts`（status/tree/tags/note/backlinks/轮询/重载）与 `TabStrip.tsx`（标签栏 + 右键菜单，菜单状态收进组件）
- `Panels` 299 → 68：拆成 `panels/{Rail,Outline,Backlinks,Properties,Tags,shared}`
- 验证：116 用例全绿；浏览器冒烟：预览/复用/固定/新标签/右键菜单全过；四个右栏面板渲染正常（大纲 22、反链 354、属性 5、标签 900）
- `NoteView` 376 → 309：抽出 `useHoverPreview.ts`（防抖 + 缓存 + 坐标）与 `HoverPreviewCard.tsx`
- 验证：悬停链接弹出 `个人知识库` 卡片，标题与摘要正常
- 剩余：`GraphView` 516 → `GraphCanvas` + `useSimulation`；`Explorer` 361 → `{Tree,Toolbar,Menu}`

## M5 已完成（视觉收尾，主体）

- 标题 h4–h6 补齐官方比例；标题上间距 2.5rem、段落间距 1rem
- 引用左边条改用强调色；圆角统一 4 / 8 / 12
- 属性按类型渲染：日期取 `YYYY-MM-DD`、布尔 ✓/✗、数组逗号连接（仍可点击复制）
- 验证：读页面实测 16px/24px、h4 1.188em；属性面板输出 `created 2026-07-09`
- 未做：文档内反链

## M3 已完成（搜索与反链尾项）

- 查询解析器支持正则 `/pattern/flags`（大小写默认不敏感，`match-case:` 生效），新增 2 个用例
- 搜索结果支持「相关度 / 名称」排序与「展开全部」（默认前 20 条）
- 反链面板新增过滤输入 + 「名称 / 提及数」排序
- 实测：正则 20 条、`tag:#work` 1 条、反链 138 → 8 组
- 未做：文档内反链（留 M5）

## M2 已完成（图谱量纲 + 大图性能）

- 四力改用 Obsidian 量纲：中心 0.1 / 斥力 10 / 连线力 1 / 连线距离 250，滑杆范围与默认值同步
- `layout.ts`：`simulate` 重写为可增量的 `LayoutRun`（`advance(n)` + `result()`），大图按帧切片
- 新增「局部图 / 全库图」切换按钮（此前全库图不可达，属于功能缺口）
- 大图标签按度数上限 60，避免全库图标签互相压盖
- 验证：400 节点切换最长任务 60ms（原 267ms）；滑杆默认值实测 0.1/10/1/250

## M1 已完成（拖拽移动 + 链接改写）

- `vault/links.ts`：按解析结果改写链接，保留别名/标题锚点/块引用/嵌入前缀；唯一标题的裸链接保持原样
- `VaultFiles`：新增 `readText`/`writeText`/`exists`/`move`/`backup`
- `VaultIndex.move`：冲突检测 → 计算受影响笔记 → 预改写 → 写回（失败回滚）→ `.trash` 备份 → 移动 → 重建索引
- `POST /move` 路由 + `moveEntry` 客户端 + Explorer 拖放（行可拖、目录/根可放、高亮、拖动变暗）
- 验证：单测 15 个；真实库移动后反链仍解析；备份与清理正常

## 本轮（第二次逆向）已完成

- 阅读宽度对齐：`max-width: 700px`、页面留白 32px、正文字号 16px / 行高 1.5、标题 1.618/1.462/1.318em
- 文件排序补齐为官方 4 项（名称 A→Z、Z→A、修改 新→旧、旧→新）
- 图谱默认值对齐：附件默认关、局部图默认 1 跳
- **搜索算子全量实现**：`src/vault/query.ts`（tokenizer + 解析 + 求值，12 种字段 + 布尔 + 括号 + 属性），搜索与图谱过滤共用
- 代码拆分三刀：
  1. `ui/tabs.ts`（纯模型 + 14 用例）
  2. `client/theme/`（classes + layout/content/chrome/graph 五个模块，`theme.ts` 变 barrel）
  3. **`vault/index.ts` 848 → 555 行**：抽出 `tree.ts`（72）、`search.ts`（123）、`graph.ts`（213），并删除随拆分失效的 `edgesWithin`/旧匹配器
> 执行顺序按「用户可感知差距 ÷ 改动成本」排序，每阶段结束跑 `tsc` + `node --test` + Playwright 冒烟。

---

## 一、功能完整性矩阵

图例：✅ 完成 · 🟡 部分 · ⬜ 未做

### 图谱

| 能力 | Obsidian | 我们 | 备注 |
|---|---|---|---|
| 局部/全局图、中心节点、跳数 | ✅ | ✅ | |
| 未解析幽灵节点 / 仅存在文件 | ✅ | ✅ | 实测 31 个幽灵节点 |
| 标签节点 / 附件节点 | ✅ | ✅ | 默认均关闭，与官方一致 |
| 搜索过滤（含算子） | ✅ | 🟡 | 仅 `file:`/`path:`/`tag:` |
| 分组着色 | ✅ | ✅ | 多组、首个匹配生效 |
| 箭头 / 文字阈值 / 节点大小 / 连线粗细 | ✅ | ✅ | |
| 力参数（中心/斥力/连线/距离） | ✅ | 🟡 | 我们是倍率，不是官方量纲 |
| 拖拽、缩放、平移、键盘 | ✅ | ✅ | `+`/`-`、方向键 |
| 时间流逝动画（Animate） | ✅ | ⬜ | 低优先 |
| 大图性能（Worker 仿真） | ✅ | ⬜ | 全局图会掉帧 |

### 文件列表

| 能力 | Obsidian | 我们 | 备注 |
|---|---|---|---|
| 排序（名称 A→Z / Z→A / 修改新→旧 / 旧→新） | ✅ | ✅ | 本轮补齐 |
| 显示扩展名、全部折叠 | ✅ | ✅ | |
| 右键（打开/新标签/复制路径/重命名/删除） | ✅ | ✅ | |
| 新建笔记 / 文件夹 | ✅ | ✅ | |
| 删除进 `.trash` | ✅ | ✅ | |
| 拖拽移动 + 链接自动改写 | ✅ | ⬜ | 最大剩余缺口，见 P9 |
| 文件夹笔记（folder note） | ✅ | ⬜ | |
| 定位当前文件（reveal） | ✅ | ✅ | 自动展开祖先 |

### 标签页

| 能力 | Obsidian | 我们 | 备注 |
|---|---|---|---|
| 预览标签 / 双击固定 | ✅ | ✅ | 本轮抽成纯模型 + 14 个用例 |
| 每标签历史 / 滚动位置 | ✅ | ✅ | 900→900 实测 |
| 右键关闭 / 关闭其他 / 关闭全部 | ✅ | ✅ | |
| 拖拽排序 / 堆叠标签 | ✅ | ⬜ | |

### 阅读视图

| 能力 | Obsidian | 我们 | 备注 |
|---|---|---|---|
| Callout（27 类、可折叠） | ✅ | ✅ | |
| `==高亮==` / `%%注释%%` / 任务清单 / 脚注 / 数学 | ✅ | ✅ | |
| 属性表（类型图标） | ✅ | 🟡 | 只读 + 点击复制；不可编辑 |
| 反链按来源分组 + 展开上下文 | ✅ | ✅ | |
| 反链面板选项（排序/搜索过滤） | ✅ | ⬜ | |
| 文档内反链 | ✅ | ⬜ | |
| 块引用 `^id` 跳转高亮 | ✅ | ✅ | |
| 嵌入到标题 / 段落 | ✅ | ✅ | |

### 搜索

| 能力 | Obsidian | 我们 | 备注 |
|---|---|---|---|
| 关键词 / 短语 | ✅ | ✅ | |
| 布尔 `OR` `-` 括号 | ✅ | ✅ | 本轮实现 |
| 字段算子 12 种 | ✅ | ✅ | 12 种全部实现（含 task/task-todo/task-done） |
| 属性搜索 `[key:value]` | ✅ | ✅ | 本轮实现 |
| 结果排序 / 折叠 | ✅ | 🟡 | 有分级排序，无折叠（P8 尾项） |

**整体完成度估算**：阅读 + 导航面约 **82%**；文件管理面约 **70%**（缺拖拽与链接改写）；搜索面约 **88%**（缺结果折叠与正则）；图谱约 **88%**（缺量纲对齐与 Worker 性能）。

---

## 二、代码结构审计与拆分映射

| 现状文件 | 行数 | 问题 | 目标模块 |
|---|---|---|---|
| ~~`src/vault/index.ts`~~ | 848 → **555** | 已完成：树/搜索/图各自独立模块 | 剩余：扫描与 refresh 仍偏长，可再拆 `scan.ts` |
| ~~`src/client/ui/theme.ts`~~ | 840 → **5 个文件** | 已完成拆分：`theme/{classes,layout,content,chrome,graph}.ts` + barrel | 令牌仍在 CSS 中，后续单独提 `tokens.ts` |
| `src/client/ui/VaultPage.tsx` | 580（原 668） | 数据拉取 + 标签模型 + 快捷键 + 布局 | **已抽 `tabs.ts`（-88 行）**；再抽 `useVaultData.ts`、`TabStrip.tsx` |
| `src/client/ui/GraphView.tsx` | 485 | 状态机 + rAF 循环 + SVG 渲染耦合 | `graph/useSimulation.ts` + `GraphCanvas.tsx` |
| `src/client/ui/NoteView.tsx` | 376 | 渲染 + DOM 增强 + 悬停预览 | `ui/HoverPreview.tsx` + `markdown/enhance.ts` |
| `src/client/ui/Panels.tsx` | 268 | 四个面板同文件 | `panels/{Outline,Backlinks,Properties,Tags}.tsx` |
| `src/client/ui/Explorer.tsx` | 310 | 树 + 工具栏 + 右键菜单 | `explorer/{Tree,Toolbar,ContextMenu}.tsx` |
| `src/vault/syntax.ts` | 359 | 扫描 + 解析 + 替换 | 可拆 `syntax/{scan,parse,replace}.ts`（低优先） |
| `src/routes.ts` | 220 | 单一分发器 | 保持（统一出入口，符合既定架构） |

**已完成的第一刀**：`src/client/ui/tabs.ts`（纯函数模型，14 个用例），`VaultPage` 从 668 → 580 行，行为回归通过浏览器实测。

**拆分原则**：纯逻辑（可单测）先抽 → 再抽纯展示组件 → 最后拆样式。每抽一步跑一次 `tsc` + 全量用例。

---

## 三、落地计划（P6–P11）

### P6 图谱量纲对齐（0.5 天，客户端）
- 把 `layout.ts` 的 `REST_LENGTH`、斥力、重力换成 Obsidian 量纲：`centerStrength .1` / `repel 10` / `link 1` / `linkDistance 250`
- 设置面板的四个滑杆改为直接对应上述数值（删除「归一化倍率」语义）
- 验收：局部图节点平均间距接近 Obsidian 截图；滑杆数值与官方默认一致（0.1 / 10 / 1 / 250）

### P7 大图性能（0.5–1 天，客户端）
- 把 rAF 力学循环搬进 Web Worker（`layout.worker.ts`），主线程只接收坐标
- 全局图按帧分片，节点 ≥300 时降级为「只算 2 轮 + 缓存布局」
- 验收：559 篇全局图悬停/拖拽 ≥45 FPS（DevTools Performance 采样）

### P8 搜索算子（✅ 主体完成，剩尾项）
- [x] `src/vault/query.ts`：tokenizer + 布尔/括号/取反 + 12 种字段算子 + 属性 `[k:v]`
- [x] `search()` 走解析器；图谱过滤复用同一 parser（删除了旧的 `compileGraphQuery`）
- [x] 16 个用例覆盖每个算子；真实库验证 `tag:#work` / `file:TiSenT` / `line:(GPU 优化)` / `task-todo:`
- [x] 搜索面板「排序 / 折叠」开关
- [x] 正则 `/.../` 支持（Obsidian 支持，优先级低）

### P9 文件管理闭环（✅ 已完成，2026-10-26 审计修复）
- [x] 拖拽移动文件/文件夹：HTML5 拖放 + 目标高亮 + 冲突提示（409）
- [x] 移动后**自动改写**指向它的 `[[链接]]`（含 `#标题`、`![[嵌入]]`、别名、块引用）；文件夹移动逐子孙笔记改写
- [x] 文件夹笔记：目录同名 `.md` 优先展示
- [x] 审计修复：rename 走 move 管线（冲突检查 + 链接改写 + .trash 备份）；文件夹禁止移入自身子孙；空目录进索引签名；标签页 `remapPath` 跟随重命名/移动；`removePath` 活动索引与文件夹前缀；`.md.md` 双后缀；轮询副作用移出 updater
- 验收：122 用例全绿；把一个被 197 条反链引用的笔记移动到新目录，所有链接仍可解析；`Alt+←` 不丢历史

### P12 界面重设计（✅ 已完成，2026-10-26）
- [x] 顶栏收纳：9 个文字按钮 → 品牌计数 + ←/→ 图标 + 「快速切换 Ctrl O」pill + 图谱/搜索图标 + ⋯ 溢出菜单（刷新索引）
- [x] 内联 SVG 图标组件（feather 风格，stroke currentColor），替代 unicode 字符与 ⚙
- [x] 按钮 ghost 化：透明底、hover 浮层、激活态品牌色
- [x] 图谱工具栏两行并一行：重播/重置/阅读收成图标按钮
- [x] 无笔记时隐藏右栏（两栏布局），不再显示空占位
- [x] 右键菜单视口边界钳制
- 验收：`tsc` 干净、122 用例全绿、浏览器冒烟（笔记/图谱/菜单/空态）无控制台错误

第二轮·面板整合（✅ 2026-10-26）：
- [x] 右栏 4→2：只留大纲/反链；属性由笔记头部属性表承担，标签移入左栏（`RAIL_SURFACES` 同步裁剪）
- [x] 左栏底部加可折叠「标签」区：chip + 计数，点击即 `#tag` 过滤树，激活 chip 高亮
- [x] 搜索入口 3→1：命令面板双模式（Ctrl+O 文件切换 / Tab 或 `?` 前缀切全文搜索，Ctrl+F 直接进全文模式），删除独立搜索视图与顶栏搜索按钮；面板底部加模式/结果数/Tab 提示条
- [x] Explorer 工具行图标化（新建笔记/新建文件夹/折叠全部 SVG ghost 图标，与顶栏一致）
- [x] 滚动条统一：`.ov-root` 作用域 6px、透明轨道、`--dsw-alias-border-l2` thumb，webkit 与 `scrollbar-width/color` 双写
- [x] 查询语言支持裸 `#tag` 简写（`pushWord` 映射到 `tag:` 字段）——修复标签 chip 过滤零结果，顺带让图谱/笔记内点标签过滤生效
- 验收：`tsc` 干净、123 用例全绿、`tsdown` 重建、浏览器冒烟（文件/全文双模式、标签过滤、右栏双 tab）无控制台错误

第三轮·图谱对标 Obsidian（✅ 2026-10-26）：
- [x] 修「0 节点·0 连线」幽灵图：refetch 失败保留旧数据 + 横幅提示（不再清空 graph）；空结果同步清空 positions（画布与统计一致）；索引 `version` 变化自动重取（VaultPage 传 prop，扫描中途的空结果自愈）
- [x] 「全部标签」原生 select → 自定义 TagPicker popover：搜索输入过滤全量标签（不再截断 24 个）、计数徽标、↑↓/Enter/Esc 键盘导航、点击外部关闭、当前项品牌色标记
- [x] 渲染对标（canvas）：普通节点中性灰、标签节点绿、附件节点琥珀、中心/hover 节点品牌色 + hover 亮环；hover 邻接边品牌色加粗、其余边压暗至 0.05、非邻接节点压暗至 0.15；`arrows` 设置补齐箭头绘制；`textFade` 接入标签显隐（阈值 0.3+0.55×textFade，下方只剩 hover 标签，上方 0.25 区间淡入）
- [x] 节点大小随度数：半径 2.8 + min(13, √degree × 2.1)（小库基准 6.5），枢纽节点明显更大
- [x] 加载动画：新节点从中心黄金角小环绽放（bloom）平滑落位，替代原 0.3× 目标点起步；删除 GraphView 死代码（positionOf/labels/labelOpacity/labelVisible/neighbors/hover 状态/panningRef）
- 验收：`tsc` 干净、123 用例全绿、`tsdown` 重建、浏览器冒烟（局部图 3/6 一致、TagPicker 过滤 #研究、全库图 39/98 与计数吻合）无控制台错误

第四轮·动画内核 + 设置面板对标（✅ 2026-10-26，GRAPH.md §10 G5/G6）：
- [x] 新增 `graph/render/anim.ts`（damp/dampColor/settled/parseColor，等价 Obsidian `mQ`/`vQ`）与 `graph/render/stage.ts`（GraphStage：每节点 fade/dim/lift/tint、每边 alpha、两趟 hover passes，全部逐帧 damp 0.9）
- [x] scene.ts 全面接入 stage：节点入场淡入（fade 0→1）、hover 压暗系数 0.15→0.2 且不再跳变、tint 逐帧 RGB 插值、hover 标签下移 15/zoom（lift damp）；边 ≤800 逐条 damp，>800 两趟 passes 的 fg/bg 强度 damp；箭头 alpha 乘 clamp(2×(zoom−0.3),0,1)
- [x] 标签公式换 Obsidian 原版 clamp(log2(zoom)+1−textFade, 0, 1)；zoom<1 时标签反向缩放保持屏幕尺寸（labelScale 同时进避让盒与字号）
- [x] 相机：zoom 缓动改逐帧 damp 0.85（对齐 `mQ(scale,targetScale,.85)`），缩放范围 1/128–8；pan 加惯性——拖动中速度 mQ 0.8 平滑，松手 100ms 窗口内保留速度滑行、每帧衰减 0.92；点击/拖拽以 5px 阈值区分
- [x] 新增 `ui/kit/controls.tsx`：Toggle（隐藏原生 checkbox 的滑动开关）+ Slider（轨道/填充/滑块、拖动 tooltip、←→ 键盘、role=slider aria 完整），注册进 kit（styles/controls.ts）
- [x] 设置面板：宽度 300→240px、`overflow-y:auto + overflow-x:hidden` + `box-sizing:border-box` 消灭横向滚动条（实测 sw=cw=240）；头部关闭改图标按钮；力参数滑杆接 SJ/MJ 非线性映射（`curveFor` 二分求解 t 使默认值落在滑杆中点，实测四个力默认值均 50%）；清掉 `t as unknown as` 强转（schema label/section title 改 `keyof Dict`）
- [x] 新增 `tests/graph-anim.test.ts`：damp 收敛、parseColor/dampColor、stage 淡入/剪枝、log2 标签公式、SJ/MJ 往返 + curveFor 中点断言
- 验收：`tsc` 干净、130 用例全绿、`tsdown` 重建、浏览器冒烟（图谱渲染、设置面板截图、滑杆拖动 tooltip）无控制台错误

第五轮·拖拽释放与点击逻辑对标 Obsidian（✅ 2026-10-26）：
- [x] 修复拖拽释放回弹：`GraphView` 新增 `liveRef`，`onDragEnd` 置 `targetRef=null` 并启动 120 tick 实时力学沉降（`step()` 无 fixed），节点在松手位置附近弹簧入新平衡，而非插值回初始布局；`onDragStart` 取消进行中的沉降
- [x] 修复局部图谱点击：新增 `onCenter` prop（更新打开路径但不切视图）；`activate` 在 `center!==undefined` 时改为将点击节点设为新中心——先把相机平滑 glide 到该节点屏幕位置，再触发 refetch（新布局把中心节点放在世界原点，fetch 副作用把 panTarget 设回 {0,0}），全程停留在图谱视图；全局图仍走 `onOpen` 导航
- [x] 相机加 `panTargetRef`：点击重定位、fetch 复位均走逐帧 damp（EASE 0.16）；手动 pan/缩放/拖拽开始时清空 panTarget，避免与用户手势冲突
- [x] `VaultPage` 接线 `onCenter={(next)=>openPath(next)}`（不 `setView('note')`）
- 验收：`tsc` 干净、130 用例全绿、`tsdown` 重建；浏览器探针确认拖拽后节点距原位 230px（noSnapBack=true）、局部图点击后仍在图谱视图（stillGraphView=true）、pan 从 156,100 平滑回归 0,0、节点数 4→17（refetch 新邻居生效）

第六轮·G7 仿真语义对齐 d3（✅ 2026-10-27，GRAPH.md §10 G7）：
- [x] `layout.ts` 重写为 d3 语义：`SimNode` 带 `vx/vy/fx/fy`，`velocityDecay 0.6`、alpha 冷却 `1-0.001^(1/300)`、reheat 0.3；力 = 向心 + 连线（bias `degS/(degS+degT)`、强度 `1/min(deg)`）+ 斥力 + collide(radius 60, 0.5)；jiggle 换确定性 sin hash（无 Math.random）
- [x] 新增 `graph/quadtree.ts`：Barnes-Hut 斥力（>300 节点启用，theta²=0.81、distanceMin 30）+ collide 四叉树配对；纯函数可单测，O(n²) 版本留作测试 oracle
- [x] worker 协议改持续运行：`start/forces/pin/movePin/unpin/stop` 消息、每 tick 平铺 `number[]` 位置回传、冷却自停、reheat 唤醒；<120 节点或无 Worker 走 rAF 内联；1500ms 首 tick 看门狗失败自动降级内联并保留已布局位置
- [x] GraphView 集成：模拟器持有位置（`setPositions` 只在图变更时调一次）；相机改 zoom-to-fit（fit 到 onCooled 或用户接管；局部图居中 focus 节点）；拖拽 = pin/movePin/unpin（松开 `alphaTarget=0` 平滑回弹）；力滑杆 = `setForces` reheat 不重建；删除 fit-to-box、`targetRef` 插值、`liveRef`；GraphCanvas 诊断 dataset 补 `hover`
- [x] 新增 `tests/graph-sim.test.ts` 9 用例：alpha 冷却节奏、收敛、link 距离 250、BH≈naive、pin/unpin、中心节点不钉死、setForces reheat、确定性、种子接受/拒绝
- 验收：`tsc` 干净、139 用例全绿、`tsdown` 重建；浏览器探针（graph-click-drag-probe + graph-forces-probe）——拖拽松手无回弹（距原位 25px）、点击邻节点 refetch 且 focus-fit 居中（4→15 节点）、repel 滑杆 10→18.5 实时 reheat 无 refetch/无重建（冷却后像素 diff 0 → 1812）、400 节点全库图 worker 布局主线程长任务 0

第六轮补·全库图塌缩修复（✅ 2026-10-27，用户报 bug「全库图一团灰」）：
- 根因：`collideForce` 误按「直接改坐标」实现（且吃了 alpha），与连线速度对冲，把 400 节点全库图压成 ~211×281 的团；d3 的 forceCollide 是**调速度**、在**预测位置**（x+vx）上求值、**不吃 alpha**、等半径各分一半（k=0.5）
- 修复：`quadtree.ts` collide 改回 d3 语义；顺带修正 BH 张角判断 `width²·theta² < dist²`（原写法比 d3 更严）
- 验证：与真 d3-force 同数据对拍，400 tick 后 bbox 我们 2503×2420 vs d3 2336×2374（修复前 211×281）；新增回归用例（320 节点稠密图 400 tick 后 bbox 宽高 >1000），140 用例全绿；浏览器实测 zoom-to-fit 从锁死 1.000 变为 0.429→0.207 缩出全图、7s 收敛、截图可见多个聚簇；拖拽/点击/滑杆探针全过

第七轮·G8 按需渲染 + 视口裁剪（✅ 2026-10-27，GRAPH.md §10 G8）：
- [x] 全量 UI 审核修复至 49→53 全绿：修复真产品 bug「键盘接管相机不清 `panTargetRef`」（方向键平移后被残留的 fit 目标滑回；指针路径早已双清，属不对称遗漏）；审核脚本修复标签页历史探针（改走 QuickSwitcher 永久打开）与拖拽回程探针（根文件行在树滚动区底缘半裁剪，`boundingBox` 中心点实际命中标签区头，拖拽前 `scrollIntoViewIfNeeded` + dragstart 校验 + 重试）
- [x] `stage.ts`：每帧变更追踪（`beginFrame`/`frameMoved`）——节点/边/通道的任何 damped 值变化都置位
- [x] `scene.ts`：`drawScene` 返回 `SceneStats`；`worldViewport` 反推相机变换得世界坐标视口；边同侧 trivial-reject（批量 pass 与逐边路径一致剔除，被剔边动画暂停）、节点按半径剔除、标签按基线 y 剔除；canvas 暴露 `data-drawn-nodes/drawn-edges/frames`
- [x] `GraphCanvas`：按需渲染循环——`stage.frameMoved()` 为假累计 60 帧后停 rAF 休眠，`wake()` 挂到全部指针回调/resize/主题切换，并经 `loop` prop 暴露给页面；标签布局前按视口 + 300px 屏幕余量预过滤
- [x] `GraphView`：`loopRef` 唤醒接线——仿真 `onTick`、相机 tick 有运动（zoom 差/fling/fit/panTarget）、reveal 逐帧、settings/visible 变更、键盘方向键均 poke
- 验收：`tsc` 干净、141 用例全绿、`tsdown` 重建；审核 53/53、0 控制台错误，新增 G8 专属检查全过——`graph.idle-sleeps`（静止后 data-frames 冻结）、`graph.culls-offscreen`（全局图放大后 drawn < positions，重置后恢复全绘）、`graph.drag-node`（中心命中拖拽改画面）、`graph.forces-slider-reheats`（力滑杆唤醒循环，检查后恢复原值）

第八轮·P2 UI v2 框架迭代（✅ 2026-10-28，PLAN §7.2）：
- [x] 三栏重排：`grid` → `flex` 外壳（`.ov-shell` = ribbon + `.ov-body`），左右 `Splitter`（拖拽 16px 步进、双击复位 248/288、键盘 ←→、`aria-valuenow`、宽度持久化到 `ov.layout.widths.v1`）
- [x] Ribbon 入口：文件（开合文件树，`aria-pressed` 跟随 `treeOpen`）/搜索（开树并聚焦过滤框）/关系图（切换阅读↔图谱）
- [x] 状态栏：库名、词/字符/行、反链/出链、笔记数·索引版本、阅读/图谱模式，窄屏隐藏次要指标
- [x] 标签栏增强：拖拽重排（`reorderTabs`，选区跟随）、溢出 ▾ 菜单（打开/关闭，选中态）
- [x] 空态统一为 `EmptyState`（`.ov-state`），替换旧 `.ov-empty`
- [x] 响应式：≤1100px 右栏浮层 + scrim，≤860px 左栏抽屉，断点变化重置开合
- [x] 修产品 bug（本阶段新增审核项暴露）：
  - `.ov-main` 缺 `flex: 1 1 auto`——grid→flex 后打开关系图时 main 塌成 41px、canvas 0 高（此前 5 项 graph 检查连锁失败）
  - `.ov-pane-hidden` 与 `.ov-explorer`/`.ov-rail` 同特异性且样式块在其后，`display:none` 被覆盖——点「文件」只改 `aria-pressed`、面板实际不隐藏；改为 `.ov-explorer.ov-pane-hidden, .ov-rail.ov-pane-hidden`
  - zoom-to-fit 在仿真已冷却时不会终止（`onCooled` 早于 fit 请求）——画布循环永不休眠；改为「相机到达目标且布局已静止」时自清 `fitRef/panTarget`
- [x] `scripts/ui-full-audit.mjs` 新增 9 项 P2 检查（ribbon 3 项、splitter 2 项、statusbar、标签重排/溢出、窄屏抽屉），check 总数 59 → 68；并修正 3 处旧断言（空态选择器、溢出触发器与 `scrollWidth` 测量一致、窄屏几何相对 `.ov-body`）
- 验收：`tsc` 干净、154 用例全绿、`tsdown` 重建、审核 68/68、0 控制台错误

第九轮·P3 多库注册表 + 切换器（✅ 2026-10-28，PLAN §7.3）：
- [x] `src/vault/registry.ts`：`$DSH_HOME/obsidian-vault/vaults.json` 持久化（`.tmp` + rename 原子写）；`start/list/active/open/create/forget/close`；`inspect(path)` 只读预检（`exists`/`configured`/`registered`/`name`，不改状态）
- [x] `VaultIndex.rebind(root)`：清空 notes/attachments/linkIndex/backlinks/tagCounts/adjacency 并 `revision += 1`，页面轮询据此自动重取
- [x] `src/vault-endpoints.ts`：`vault/list`、`vault/inspect`、`vault/open`（`init` 建 `.obsidian`）、`vault/create`、`vault/forget`（遗忘当前库自动回退最近库，全空回退空库）
- [x] 客户端 `ui/vaults/VaultManager.tsx`：最近库列表（当前库徽章、移除）、打开文件夹、新建知识库、未配置目录的内联确认卡（初始化并打开 / 直接打开 / 取消）、Escape 与遮罩关闭
- [x] 顶栏 `.ov-vault-switch`（库名按钮）→ 发 `onSwitched`：清空 tabs/搜索/滚动位置并 `reload()`
- [x] `src/client/ui/kit/styles/dialog.ts`：遮罩/对话框/按钮/错误/确认卡/库行样式
- [x] 修真实接线 bug：`ctx.get('remote.directoryPicker')` 在 `apply` 时取不到——网关按 `inject` 顺序后挂载 `remote.*` 命名空间；改为调用时懒解析 + `hasPicker()` 每次渲染探测，弹窗打开即为最新可用性
- [x] `tests/registry.test.ts` 9 用例：种子激活、inspect 不改状态、open 注册+激活+rebind、`init` 建配置目录、create、list 倒序且恰一 active、forget 回退、全空回退空库、跨重启恢复
- [x] `scripts/ui-full-audit.mjs` 新增 3 项（`vaults.manager-lists-recent` / `vaults.inspect-unconfigured` / `vaults.switch-and-reload`，切库前先关标签避免旧路径 404 污染 consoleErrors），check 68 → 71；finally 补第二库兜底 `forget` + `rmSync`
- 验收：`tsc` 干净、163 用例全绿、`tsdown` 重建、审核 71/71、0 控制台错误

第十轮·P4 `.obsidian` 配置读写（✅ 2026-10-28，PLAN §7.4）：
- [x] `src/vault/obsidian-config.ts`：六个文件白名单（`app`/`graph`/`appearance`/`community-plugins`/`core-plugins`/`hotkeys`）；缺失与坏 JSON 一律读作 `undefined`；写入先读旧文档 → 深合并（对象按键、数组整体替换）→ `.tmp` + rename 原子落盘，未知字段原样保留
- [x] `src/config-endpoints.ts`：`config/read`（`?file=` 白名单校验，越界 400）、`config/write`（`{file, value}`，返回合并后的文档）；路由前缀 `config/`，目标根跟随当前激活库
- [x] `src/client/graph/graph-json.ts`：`graph.json` ↔ 面板设置双向映射（`search`/`hideUnresolved`/`showTags`/`showAttachments`/`showOrphans`、`showArrow`/`textFadeMultiplier`/`nodeSizeMultiplier`/`lineSizeMultiplier`、`centerStrength`/`repelStrength`/`linkStrength`/`linkDistance`、`colorGroups`↔分组）；`centerStrength` 按 5.18713248970312 换算到 d3 `forceCenter`；`filters.tag` 在 graph.json 无对应键故不映射
- [x] `src/client/graph/persist.ts`：首屏仍取 localStorage，挂载后读库内 `graph.json` 覆盖（`baselineRef` 防「加载即回写」、`touchedRef` 防迟到加载覆盖用户改动）；改动 400ms 防抖写回，卸载时 flush
- [x] `GraphView`：三处设置写入统一走 `updateSettings` 标记用户改动；新增持久化副作用
- [x] `tests/obsidian-config.test.ts`（6 用例）与 `tests/graph-json.test.ts`（7 用例）：缺文件/坏 JSON、未知键穿透磁盘、深合并与数组替换、默认与完整设置往返、`hideUnresolved` 反向、颜色整数 ↔ hex、非对象文档忽略
- [x] `scripts/ui-full-audit.mjs` 新增 3 项：`config.obsidian-roundtrip`（缺文件→null、未知键穿透深合并、白名单拒绝越界）、`graph.settings-persist-to-vault`（面板改箭头/节点大小后 `graph.json` 真被改写且保留未知键）、`vaults.switch-back`（自 `vaults.switch-and-reload` 拆出）；并修 2 处旧断言：分组行改相对计数（真实库 graph.json 自带 13 个 Obsidian 分组）、设置面板检查补 `finally` 复原与关闭
- 验收：`tsc` 干净、177 用例全绿、`tsdown` 重建、审核 74/74、0 控制台错误

第十一轮·P5 插件面板（✅ 2026-10-28，PLAN §7.5）：
- [x] `src/vault/plugins.ts`：扫描 `<激活库>/.obsidian/plugins` 下的目录，读 `manifest.json`（id/name/version/author/description，缺失或坏 JSON 回退目录名）；`community-plugins.json` 只取字符串数组；`core-plugins.json` 同时支持对象格式（每项布尔）与旧数组格式（只列启用项），缺文件时用 Obsidian 默认 31 项
- [x] 写回：`setCommunityPluginEnabled` 增删 id 数组；`setCorePluginEnabled` 按原文件格式写回（数组仍写数组、对象/缺文件写对象），全程复用 P4 的深合并 + `.tmp` + rename；**不加载任何第三方 JS**
- [x] 可见状态：`enabled` 但目录不存在的插件以「未安装」列出（真实库 `tisent-dashboard` 即此情形），安装的按名称排序在前
- [x] `src/plugin-endpoints.ts`：`plugins/list`、`plugins/toggle`（`{id, enabled, core}`，返回刷新后清单）、`plugins/reveal`（建目录后交系统文件管理器打开，路径由 Host 计算不接受客户端输入）；`routes.ts` 挂 `plugins/` 前缀
- [x] 客户端：`Ribbon` 新增「插件」入口（feather package 图标）；`ui/plugins/PluginPanel.tsx` 对话框分「社区插件 / 核心插件」两段，行内显示名称/版本/作者/描述 + 启用开关，顶部「打开插件文件夹」与「刷新」，底部固定显示 `.obsidian/plugins` 绝对路径与「不执行第三方脚本」说明
- [x] `kit/controls.tsx`：`Toggle` 增加可选 `ariaLabel`（行内开关没有可见文案时仍可被读出）
- [x] `tests/plugins.test.ts` 8 用例：未配置目录回退默认、扫描含未安装 id、排序、社区开关写盘、旧数组格式保持、缺文件时以默认值生成对象、未知 id 保留、坏 manifest 回退目录名
- [x] `scripts/ui-full-audit.mjs` 新增 3 项：`plugins.list-scans-folder`、`plugins.toggle-persists`（社区与核心两路写盘断言）、`plugins.panel-ui`（对话框开合、开关往返、核心开关跟随 `core-plugins.json`、刷新不丢行）；check 74 → 77
- 验收：`tsc` 干净、185 用例全绿、`tsdown` 重建、审核 77/77、0 控制台错误

第十二轮·P6 代码预览（✅ 2026-10-28，PLAN §7.6）：
- [x] `src/filetypes.ts` 扩展名注册表（Host/Client 共用，纯函数）：`kind: markdown|image|pdf|code|binary` + `language`/`mime`/`previewable`；`extensionOf`（点文件与无扩展名返回空）/ `fileTypeOf` / `isPreviewableFile` / `normalizeLanguage`（`ts`→`typescript`、`h`→`cpp`、`yml`→`yaml` 等别名）
- [x] Host：`VaultIndex.file(path)` 返回 size/mtime + 文本前缀；`vault/files.ts` 新增 `info`/`readPrefix`（1 MB 上限，字节截断后去掉半个多字节序列的替换符），Markdown 与白名单文本带 `text`/`truncated`，图片/PDF/二进制只回元数据；`tree()` 开始列出库内附件（点目录仍忽略），空目录保留
- [x] 客户端 `ui/files/FileView.tsx`：按注册表 kind 路由——图片预览（字节数徽标）、PDF `<iframe>`、二进制元信息卡 + `?download=1`、文本走 `CodeView`；Markdown 源码模式也在这里承载
- [x] `ui/files/CodeView.tsx`：语言徽标、右侧行号、`tokenizeLines` 逐行高亮、`行数 · 体积`、复制按钮（1.2 s 后回落「复制」）、>1 MB 与 6000 行上限两条提示
- [x] `ui/files/tokenize.ts`：零依赖 tokenizer，按语言族分派（clike/hash/markup/markdown/sql/lua/stylesheet/plain），识别注释/字符串/数字/关键字/字面量/调用/属性/标签/标点
- [x] `ui/files/highlight.ts`：笔记内 `pre > code` 渲染后原地装饰，与代码视图共用同一 tokenizer；用 `WeakMap` 以源文本为签名，节点内容变化才重绘（幂等，React 复用节点也不会重复处理）
- [x] `NoteView` 头部新增「源码」按钮；`VaultPage` 增加 `sourceMode`（切文件、切库复位），右栏只跟随阅读视图
- [x] 测试：`tests/filetypes.test.ts`（4 用例：路由、未知扩展、`extensionOf` 边界、别名）、`tests/tokenize.test.ts`（7 用例：plain/JS/Python/CSS/HTML/Markdown/分行的行数与种类）、`tests/vault-file.test.ts`（5 用例，真实临时目录：附件与空目录进树、代码文件 text/language/size/mtime、图片与二进制无 text、目录/缺失/越界返回 undefined）、`tests/vault-files.test.ts` 补 `info`/`readPrefix`；同步改 `vault.test.ts` 里「附件不进树」的旧断言
- [x] `scripts/ui-full-audit.mjs` 新增 4 项：`files.code-view-highlight`（徽标/行号/token 分类/复制内容，Windows 剪贴板 CRLF 归一）、`files.image-preview`（1×1 PNG 真解码 + `PNG` 徽标）、`files.binary-download-card`（下载链接带 `download=1`、元信息含「大小」）、`note.source-and-reading-roundtrip`（源码徽标 `markdown`、正文与 fence 可见、点「阅读」回到阅读视图）；check 77 → 81
- [x] 审核脚本两处既有检查改为距离无关：`files.drag-move-into-dir-and-back` 改用相邻排序的 `审核拖拽源`/`审核拖拽目标`（附件入树后根级笔记与文件夹常隔一屏，`dragTo` 自动滚动会错位）；`tabs.drag-reorder` 先「关闭全部标签页」再开三个固定标签，避免继承上一轮的六标签拖距跨屏
- 验收：`tsc` 干净、203 用例全绿、`tsdown` 重建、审核 81/81、0 控制台错误

### P10 重构（✅ 完成，2026-10-31 复核）
- [x] `vault/index.ts` → `tree.ts` / `search.ts` / `graph.ts`（848 → 555 行，99 用例全绿，Host 端点实测正常）
- [x] `theme.ts` → `theme/` 五个模块 + barrel
- [x] `VaultPage` 抽 `tabs.ts`（668 → 580 行）
- [x] `VaultPage` 再抽 `useVaultData.ts`（75 行）+ `TabStrip.tsx`（212 行）—— `VaultPage.tsx` 现 297 行
- [x] `GraphView` 抽 `GraphCanvas` + `useSimulation`（`GraphView.tsx` 现 192 行）
- [x] `NoteView` 抽 `HoverPreview`（`NoteView.tsx` 现 299 行）
- [x] `Panels`/`Explorer` 按面板拆文件（`panels/` 四个文件，最大 152 行）
- 验收：用例数不减（395）、`tsc` 干净、`ui-full-audit` 101/101

### P11 阅读视图补全（✅ 完成，2026-10-31 复核）
- [x] 反链面板加「排序 / 搜索过滤」——`panels/Backlinks.tsx` 有 `filterText` 与 `sortMode`（按名/按提及数）
- [x] 文档内反链开关——内嵌 `docBacklinks` 已渲染，但**没有开关**（Obsidian 的 backlinks in document 设置项），列为待做
- [x] 属性行加「按类型渲染」——`note/NoteMeta.tsx` 按数组/布尔/数字/日期/对象给图标并格式化
- 验收：反链可搜可排 ✅；属性类型正确显示 ✅

---

## 四、建议顺序与理由

1. **P10 先做一半**（已完成 tabs 抽取）——重构越晚成本越高，但不要一次全拆。
2. ~~**P9 优先于 P8**~~：P9 已完成（含审计修复），P8 剩搜索面板开关与正则。
3. P6/P7 属于观感与性能，放在功能之后。
4. P8 与 P11 可以并行（都依赖同一套 query 解析）。

## 五、不做（复刻边界）

- Live Preview 编辑器、Canvas、Bases、社区插件运行时、主题市场：这些是另一个产品面，接入成本远高于收益。

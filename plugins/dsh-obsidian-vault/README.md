# dsh-obsidian-vault

DeepSeek Harness 的 Obsidian 风格知识库工作区：以**独立插件**形式加载，不改 DSH 与 `dsh-better-sidebar` 的任何源码。

左侧栏出现「知识库」入口，主栏是 Obsidian 式的三栏工作区：笔记树 / 阅读视图 / 大纲·反链·属性·标签；支持 `[[双链]]`、`[[笔记#标题]]`、`![[嵌入]]`、别名解析、快速切换（`Ctrl+O`）、全文搜索和局部/全库关系图。

## 安装

```sh
dsh plugin --profile <profile> add /path/to/plugins/dsh-obsidian-vault
```

或让 DSH 安装本地包目录（`plugin_manager install_bundle`）。安装后**重启 DSH**（Host 侧路由需要重启生效），页面刷新即可看到左侧栏入口。

### 配置（`cordis.patch.yml`）

```yaml
- insert:
    - id: obsidian-vault
      name: dsh-obsidian-vault
      config:
        vault: 'G:\个人知识库'
```

| 字段 | 默认 | 说明 |
|---|---|---|
| `vault` | 最近的 `.obsidian` 祖先目录，否则进程工作目录 | 知识库根目录 |
| `ignore` | `.obsidian` `.trash` `.git` `node_modules` `.DS_Store` `__pycache__` | 跳过的目录名；点开头的名字一律忽略（与 Obsidian 一致） |
| `maxFileBytes` | 2 MiB | 超过此大小的笔记只索引元数据 |
| `maxIndexBytes` | 64 MiB | 正文常驻内存的总预算；超出后按需读取 |
| `maxDepth` | 12 | 目录遍历深度上限 |

## 功能与 Obsidian 对照

| Obsidian 行为 | 本插件 |
|---|---|
| `[[笔记]]` / `[[笔记\|别名]]` | 渲染为链接，点击在页内跳转 |
| `[[笔记#标题]]` / `[[#本文标题]]` | 跳转到目标笔记并滚动到该标题 |
| `[[不存在的笔记]]` | 虚线样式，点击创建空笔记并打开 |
| 同名笔记 | 取路径最短者；真歧义时标记并打开第一个候选 |
| frontmatter `aliases` | 参与链接解析 |
| `![[图片]]` | 走 `/obsidian/api/asset` 内联显示 |
| `![[笔记]]` | 以引用块转写（深度 1，避免循环） |
| `#tag` 与 frontmatter `tags` | 正文标签可点击过滤；标签面板汇总 |
| `==高亮==` | 渲染为 `<mark>`，代码块内不处理 |
| `%%注释%%` | 单行/多行注释隐藏，代码块内保留 |
| Callout `> [!note]` | 按类型着色、可折叠（`+`/`-`），支持 27 种类型 |
| 链接悬停预览 | 悬停 `[[..]]` 跟随鼠标弹出目标笔记标题与摘要 |
| 反链 | 按来源笔记分组，组头显示提及数，默认 2 条上下文可展开；分「已链接 / 未链接提及」 |
| 块引用 | `^block-id` 标记隐藏、渲染为锚点；`[[笔记#^id]]` 跳转并高亮闪烁 |
| 嵌入范围 | `![[笔记]]` 整篇、`![[笔记#标题]]` 只嵌该小节、`![[笔记#^id]]` 只嵌该段落 |
| 大纲 | 标题树，点击滚动定位，并高亮当前阅读位置 |
| 属性 | 类型图标 + 键值；日期只显示日期、布尔显示 ✓/✗、数组逗号连接；点击复制 |
| 面包屑 | 路径分段可点，点目录即过滤笔记树 |
| 文档标签页 | 预览标签（斜体、复用）、双击固定、每标签独立历史与滚动位置、右键关闭/关闭其他/关闭全部/固定、`+` 新标签、中键关闭 |
| 搜索面板 | `Ctrl+F` 或顶栏「搜索」：算子语法（布尔/字段/属性/正则）、相关度或名称排序、展开全部、命中片段高亮、↑↓/Enter |
| 反链面板 | 按来源分组、可展开上下文、按名称或提及数排序、面板内过滤 |
| 文件列表 | 名称升序（目录优先）、全部折叠、新建笔记/文件夹、右键菜单（打开/新标签/复制路径/重命名/删除） |
| 删除语义 | 删除是移动到 `.trash/<时间戳>-<名字>`，不是物理删除 |
| 拖拽移动 | 把笔记/文件夹拖到目录（或树根）即移动，自动改写指向它的 `[[链接]]`（保留别名/锚点/块引用），原文件备份到 `.trash/move-<时间戳>/` |
| 阅读排版 | 15px/1.68 行高、代码块与表格样式、任务清单复选框 |
| 快速切换 | `Ctrl+O`，标题 > 别名 > 标签 > 路径 > 正文分级排序 |
| 局部/全库图 | 力导向布局；**Canvas 2D 渲染**（400 节点 2778 边流畅），悬停高亮邻居、拖拽随动、滚轮锚定光标缩放 |
| 图谱悬停 | 悬停节点放大高亮，非邻居节点与连线淡出（CSS 过渡） |
| 图谱设置 | ⚙ 面板：搜索（`file:`/`path:`/`tag:`）、仅存在文件、标签/附件节点、孤立节点、分组着色、箭头、文字淡出阈值、节点大小、连线粗细、四个力参数；设置持久化 |
| 未解析与附件节点 | 未解析链接显示为虚线幽灵节点（点击创建），嵌入的附件显示为独立节点 |
| 前进/后退 | `Alt+←` / `Alt+→`，刷新后保留 |
| 图谱键盘 | `+` / `-` 缩放，方向键平移（`Shift` 加速） |
| 图谱范围 | 顶栏「局部图 / 全库图」一键切换；力参数按 Obsidian 量纲（0.1 / 10 / 1 / 250） |
| 大图性能 | 布局按帧切片推进，400 节点切换无长任务尖峰；标签按热度限量 |
| 窄屏 | ≤1080px 时笔记树与右栏变抽屉，顶栏「笔记树 / 大纲」切换，无横向滚动 |
| 加载状态 | 笔记请求期间显示脉冲骨架；属性值点击即复制并提示「已复制」 |

## 架构

```
Host（Node）                          Client（浏览器）
src/index.ts     插件入口/Config       src/client/index.tsx  注册左侧栏图标 + 主栏页面
src/routes.ts    /obsidian/api/*      src/client/api.ts     唯一的 fetch 层
src/vault/index.ts   索引与查询        src/client/ui/        页面、树、阅读、面板、图
src/vault/syntax.ts  语法扫描  ←共享→  src/client/markdown/rewrite.ts  [[..]] 改写
src/vault/resolver.ts 链接解析规则     src/client/primitives.ts 复用宿主 MarkdownText
src/vault/frontmatter.ts YAML 子集
src/vault/watch.ts   目录监听 + 去抖
```

- **语法只有一份实现**：`vault/syntax.ts` 同时服务 Host 索引与浏览器改写。
- **渲染不重写**：`[[..]]` 被改写成哨兵链接（`https://dsh-obsidian.invalid/open|new`），交给宿主共享的 `MarkdownText`（来自 `@deepseek-ai/dsh-client-ui-primitives`，属于 shell 模块表，不重复打包）。
- **不落盘状态**：客户端只持有导航历史；索引全部在 Host，按 `版本 + 大小` 失效，目录监听 250ms 去抖，内容无变化不递增版本。

## 开发

```sh
node --test tests/*.test.ts     # 34 个单元/集成用例（Node 类型剥离，无需构建）
tsc -p tsconfig.json --noEmit   # 类型检查
tsdown --config tsdown.config.ts # 构建 lib/index.js 与 lib/client.js
```

UI 手动检查（Playwright，指向任意运行中的实例）：

```sh
CHROMIUM_PATH=<chrome.exe> node scripts/ui-check.mjs 'http://127.0.0.1:3080/?token=...' --click
```

截图输出到 `.artifacts/ui/`。

## 已知差异与限制

- **编辑**：不做行内 Live Preview。定位是「Obsidian 阅读视图 + 链接语义」；编辑交给 `dsh-better-sidebar` 的 CodeMirror（服务未暴露会话级 `openFile` 入口，故未接线）。
- **附件**：附件只用于 `![[嵌入]]`，不出现在笔记树里。
- **歧义**：不弹选择器，直接打开最短路径候选并以点状下划线提示。
- **图谱**：力导向布局每 30 个节点内显示全部标签，更多节点只显示当前深度与悬停节点；不做聚类着色，也没有 Obsidian 的「按搜索/标签过滤」面板。
- **标签页**：只保留路径，不保留每个标签各自的滚动位置与历史（历史是全局的）。

## 版本与兼容

- DSH 基线：`0.2.1-rc.1+`（依赖 `slots`、`layout`、`locale` 四个稳定面与 `ui-primitives` 的 `MarkdownText`/`MarkdownDelegateProvider`）。
- 与 `dsh-better-sidebar` **零耦合**：不 import、不注册其 tab、不改其 viewer；未安装时功能完整。
- 升级 DSH 前先跑 `tsc --noEmit`；`MarkdownText` 的 props 或 `MarkdownDelegateProvider` 的 delegate 字段若变化，只需调整 `src/client/primitives.ts` 与 `NoteView.tsx`。

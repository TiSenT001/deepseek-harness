# Obsidian 逆向参考（本地 1.12.7 实测）

> 来源：本机 `G:\Software\Obsidian`（1.12.7）。`resources/obsidian.asar`（22.9 MB，352 个文件）解包到 `G:\Software\obsidian-ref\unpacked`，只读参考，不把其代码/CSS 复制进插件。
> 解包方式：自写 asar 解析器（头 16 字节 + JSON 树，见 `G:\Software\obsidian-ref\asar-extract.mjs`）。

## 1. 设计令牌（`app.css` 实测）

| 令牌 | 值 | 我们此前 | 处理 |
|---|---|---|---|
| `--font-text-size` | **16px** | 15px | ✅ 已改 |
| `--line-height-normal` | **1.5** | 1.68 | ✅ 已改 |
| `--h1-size` | **1.618em** | 1.75em | ✅ 已改 |
| `--h2-size` | **1.462em** | 1.38em | ✅ 已改 |
| `--h3-size` | **1.318em** | 1.16em | ✅ 已改 |
| `--font-ui-small` | 13px | 12–13px | 保持 |
| `--font-ui-medium` | 15px | — | 可选 |
| `--radius-s / m / l` | 4 / 8 / 12px | 5/6/10 混用 | 待统一 |
| `--border-width` | 1px | 1px | ✅ |
| `--header-height` | 40px | 约 41px | ✅ 近似 |
| `--titlebar-height` | 30px | 无 | 不适用（宿主提供标题栏） |
| `--ribbon-width` | 44px | 无 | 不适用（宿主左侧栏） |
| `--size-4-1/2/3` | 4 / 8 / 12px | 4/6/8 混用 | 待统一 |
| `--file-line-width` | **700px**（正文最大宽度） | 820px | ✅ 已改 |
| `--file-margins` | **32px**（x/y 同为 `--size-4-8`） | 12/20px | ✅ 已改 |
| `--p-spacing` | 1rem | 无 | 待补 |
| `--heading-spacing` | 2.5 × p-spacing | 无 | 待补 |
| `--h4 / h5 / h6` | 1.188em / 1.076em / 1em | 无 | 待补 |
| `--blockquote-border-color` | `--interactive-accent` | 中性色 | 待补 |

## 2. 图谱（`app.js` 实测）

**默认过滤选项**（内部对象 `wQ`）：

```js
{ showAttachments: false, hideUnresolved: false, showOrphans: true, showTags: false,
  localFile: null, localJumps: 1, localInterlinks: false,
  localForelinks: true, localBacklinks: true }
```

→ 我们改了：附件默认关（原为开）、局部图默认 1 跳（原为 2）。

**默认力参数**（`IJ`）：

```js
{ centerStrength: 0.1, repelStrength: 10, linkStrength: 1, linkDistance: 250 }
```

→ 我们的四个力是**归一化倍率**（1 = 现状），没有照搬绝对值。要真正对齐需要把 `layout.ts` 的 `REST_LENGTH`(88)、斥力系数、重力系数换成 Obsidian 的量纲，并用截图 A/B 校准；已列入 P6。

**渲染参数**（`setRenderOptions`）：`nodeSizeMultiplier` / `lineSizeMultiplier` / `showArrow` / `textFadeMultiplier`，默认 `1 / 1 / false / 1`。

**实现方式**：力学仿真跑在 **Web Worker** 里（`worker.postMessage({nodes, links, alpha: .3, run: true})`，`{forces}` 另行下发），主线程只做渲染。我们的 rAF 主线程循环在 ≤200 节点时够用，全局图（559+）会掉帧——这是 P7 的性能项。

## 3. 文件列表（`i18n.js` + `app.js`）

排序是 **4 项**：`File name (A to Z)`、`File name (Z to A)`、`Modified time (new to old)`、`Modified time (old to new)`。

→ 我们原来只有 2 项（名称升序、修改时间降序），本轮补齐为 4 项。

## 4. 搜索算子（官方帮助，已在本地版本核对文案）

| 类别 | 支持 |
|---|---|
| 布尔 | `OR`、`-term`、括号分组 |
| 字段 | `file:` `path:` `content:` `tag:` `line:` `block:` `section:` `task:` `task-todo:` `task-done:` |
| 匹配 | `match-case:` `ignore-case:`、`"精确短语"` |
| 属性 | `[key:value]` / `[key]` |

**已完成**：`src/vault/query.ts` 实现 tokenizer + 递归下降解析 + 求值，覆盖短语、`OR`、`-`、括号、`file/path/content/tag/line/block/section/task/task-todo/task-done`、`match-case/ignore-case`、属性 `[key:value]`；16 个用例；搜索与图谱过滤共用同一份解析器。
实测（559 篇库）：`tag:#work`→1、`file:TiSenT`→14、`line:(GPU 优化)`→20、`path:工具链 研究`→21、`task-todo:`→19。

## 5. 反链面板（官方帮助）

面板级设置：折叠结果、显示更多上下文、排序、面板内搜索过滤（支持全部搜索算子）。
另有：文档内反链（`Backlinks: Toggle backlinks in document`）、固定某笔记的反链标签页。

我们已做「按来源分组 + 展开上下文」，缺「排序 / 搜索过滤 / 文档内反链 / 固定标签页」。

## 6. 代码结构观察（供重构参考）

- `app.js` 单包 3.6 MB，说明官方也把核心插件打成一个 bundle；但内部按 **View / ViewPlugin / Options / Renderer** 分层，图谱的 interaction、render options、forces 是三组独立状态。
- 搜索解析与求值分离（parse → AST → match），我们的 `query.ts` 采用同样分层，因此搜索/图谱/未来的反链过滤都能复用。
- CSS 20 643 行，按「tokens → 组件 → 平台覆盖（移动端/打印）」分层，最后 3 000 行是响应式与触摸覆盖。
- 我们的 `theme.ts`（840 行）把 tokens 与组件样式混在一个字符串里，应按同样方式拆：`tokens` / `components` / `responsive`。

# Obsidian 关系图实现研究 + 落地计划

> 样本：本机 Obsidian 1.12.7，`resources/obsidian.asar`（`app.js` 3.6 MB、`pixi.min.js` 476 KB、`app.css` 20 643 行）。
> 下面每条都标注了依据；**没能确认的地方明确写「未确认」**，不推测成事实。

## 1. 代码角度

### 1.1 渲染：PIXI（WebGL），不是 SVG/DOM

`app.js` 中关系图构建：

```js
new PIXI.Application({ view: canvas, antialias: true, backgroundAlpha: 0, autoStart: false })
```

- `PIXI.Graphics` 先画一个圆（模板纹理），节点以 **sprite** 复用该纹理，`eventMode="static"` 让 PIXI 自己做命中测试。
- 边由 PIXI Graphics 批量绘制（同一容器内），不是每根线一个 DOM 节点。
- `autoStart: false` + 自己的渲染循环：只有需要时才 render（数据变、相机动、悬停变）。

**结论**：Obsidian 之所以能同时画几千节点且悬停流畅，靠的是 GPU 批渲染 + 手动调度，而不是 DOM。

### 1.2 仿真：alpha 驱动的增量求解

```js
this.worker.postMessage({ nodes, links, alpha: 0.3, run: true })
this.worker.postMessage({ forces, alpha: 0.3, run: true })
```

- 语义与 d3-force 一致：**alpha 是能量/温度**，数据变化时重新加热（`alpha: .3`），`run: true` 继续迭代直到冷却。
- 力参数（同 §1.3）通过 `{forces}` 热更新，不需要重建整个图。
- **未确认**：`this.worker` 是否为真正的 Web Worker。asar 里只有一个 `worker.js`（Metadata Cache Worker，233 KB，无 force 相关代码），而 bundle 内存在一个 `new Worker(URL.createObjectURL(new Blob([fetchedSource])))` 的辅助函数（`Vz`/`Hz`），说明官方确实有「把脚本 fetch 下来再起 worker」的机制，但我没有找到关系图调用它的位置。

### 1.3 参数与单位

```js
{ centerStrength: 0.1, repelStrength: 10, linkStrength: 1, linkDistance: 250 }
{ showAttachments: false, hideUnresolved: false, showOrphans: true, showTags: false,
  localJumps: 1, localInterlinks: false, localForelinks: true, localBacklinks: true }
```

渲染参数：`nodeSizeMultiplier`、`lineSizeMultiplier`、`showArrow`、`textFadeMultiplier`（默认 1/1/false/1）。

### 1.4 初始布局（新节点落点）

`app.js` 里重建时对新节点：

- 有邻居 → 放在**邻居坐标的质心** + 随机抖动；
- 无邻居 → 放在半径由「面积/节点数」推出的圆上；
- 抖动幅度 `sqrt(area/π) ` 量级。

这解释了我们没有的一个细节：**新增节点从邻居附近淡入**，而不是从中心飞出去。

### 1.5 相机

```js
this.targetScale = Math.min(8, Math.max(1/8, targetScale))
```

- 缩放范围约 `0.125 – 8`，带 `targetScale` 与 `scale` 两套值（缓动）；
- `panX/panY` 独立于缩放。

## 2. 动画角度

| 动画 | 实现 | 我们的现状 |
|---|---|---|
| 相机缓动 | `targetScale`/`scale` 双值插值 | ✅ 已有（ZOOM_EASE） |
| 节点落位缓动 | 位置每帧向仿真目标插值 | ✅ 已有（EASE 0.18） |
| 悬停 | 命中节点 + 邻居集高亮，其余淡出 | ✅ 已有（dim 0.22） |
| 拖拽 | 拖动节点钉住，力继续作用于邻居 | ✅ 已有（`step(fixed)`） |
| **时间流逝动画** | `renderProgression()`：`progression` 从 0→1，按 `clamp(0.5*sqrt(nodes), 5, 100)` 每秒的节奏**逐节点显现**整张图 | ⬜ 未做 |
| 标签随缩放淡出 | `textFadeMultiplier` 参与标签 alpha | 🟡 有阈值但默认关 |

## 3. 优化角度

| 手段 | Obsidian 做法 | 我们的现状 / 计划 |
|---|---|---|
| 渲染批处理 | PIXI sprite + 单容器，GPU 一次绘制 | SVG，每个节点一个 `<g>`：**≤500 节点够用，上千会掉帧** |
| 仿真线程 | worker 接口 + alpha 增量 | 主线程分帧（`LayoutRun.advance`）→ **计划改 worker** |
| 只在需要时重算 | `autoStart:false` + `changed()` 触发 | rAF 常驻但空转时不 setState（可接受） |
| 标签 LOD | 文字随缩放淡出 | 已按度数限量 60，缺缩放联动 |
| 邻居高亮 | 预计算邻居集 | 已有 |
| 重排（数据结构） | 每次数据变化重建索引 | 已有 |

## 4. 落地计划（按优先级）

### G1 仿真进 Worker（✅ 已完成）

**实测**：`/obsidian/api/worker.js` 返回 200 / `text/javascript` / 6.5 KB；全局图 400 节点切换时**只有 1 次** worker 请求（单例复用）、控制台 0 错误、**主线程长任务 0 个**（此前 50–60 ms）。

**实现**：`simulation.worker.ts` 打包成独立 IIFE（`lib/worker.js`），Host 用 `/obsidian/api/worker.js` 提供；客户端 `graph/simulation.ts` 维护单例 worker + 请求 id，节点 < 120 或 Worker 不可用时退回 `LayoutRun` 分帧。

原始计划：
- 新增客户端第二个 bundle：`src/client/graph/simulation.worker.ts`，tsdown 输出 `lib/worker.js`
- Host 新增 `GET /obsidian/worker.js`（`content-type: text/javascript`）
- Worker 协议：`{ type:'layout', nodes, edges, world, forces }` → 分片回传 `{ type:'progress', positions }` → `{ type:'done', positions }`
- 主线程 API 不变（`LayoutRun` 保留为降级路径：Worker 不可用或节点 < 120 时内联）
- 验收：559 节点全局图布局期间主线程最长任务 < 30ms；Worker 失败时自动降级且无报错

### G2 时间流逝动画（✅ 已完成）

**实测**：点「重播」后 180 ms 时只渲染 32/123 个节点，2.6 s 后回到 123 个；节点按度数从高到低依次出现。

原始计划：
- `renderProgression` 等价物：`reveal` 从 0→1，`revealCount = floor(progressionSpeed * t)`
- 节点/边按度数排序显现；按钮放在图谱工具栏「重播」
- 验收：点击后 1–3 秒内节点依次出现，可中途取消

### G3 初始落点与相机细节（✅ 已完成）

**实测**：首次进入图谱 123/123 个节点都有非零坐标（此前全部堆在 0,0）；切到 2 跳后 216/216 正常；滚轮缩放从光标位置开始（transform 由 `translate(340 396) scale(1)` 变为 `translate(320 405) scale(1.098)`）。

**实现**
- `LayoutRun` 支持 `seed`：已有节点沿用旧坐标，新增节点落在**已放置邻居的质心** + 抖动
- 防御：seed 若所有点重合则整体忽略（这是本轮踩到的真实 bug——第一次布局把 123 个节点全堆到原点）
- 节点集合不变时直接跳过重排（筛选/标签切换不再抖动）
- 缩放范围对齐 `0.125 – 8`，滚轮以光标为锚点
- 首次布局走内联路径（保证首屏可见），后续重排走 worker

原始计划：
- 新节点落在邻居质心 + 抖动（替代现有的中心环）
- 缩放范围对齐 `0.125 – 8`；双指/滚轮中心缩放
- 验收：切换跳数时新节点从邻居处出现，不再整体重排

### G4 渲染升级：Canvas 2D（✅ 已完成，按用户要求直接上 Canvas）

**实测**：全库图 400 节点 / 2778 连线正常绘制；点击节点可跳转（实测打开「量子认知增强偏好引擎」）；滚轮缩放 `zoom 1.000 → 1.098` 且以光标为锚（pan `0,0 → -13,7`）；按下节点 `dataset.drag` 记录其路径、松开清空；控制台 0 报错。

**实现（已分层）**：
- `ui/GraphCanvas.tsx`（156 行）：React 宿主——canvas 元素、帧循环、尺寸监听
- `graph/render/scene.ts`（111）：一帧的绘制（边 → 节点 → 标签）
- `graph/render/input.ts`（139）：悬停/拖拽/平移/滚轮，命中测试接入
- `graph/render/labels.ts`（50）：标签避让与限量
- `graph/render/hit.ts`（33）：世界坐标命中测试
- `graph/render/palette.ts`（39）：从 `:root` 读主题色

React 不再逐帧重渲染，rAF 只读 refs；`GraphElements.tsx`（旧 SVG 渲染）已删除。标签每 6 帧重算一次并按度数限量（>200 节点 26 个、>120 节点 60 个、缩放 <0.45 时不画）。颜色从 `:root` 的 `--dsw-*` 读取，中心节点用 success 色、普通节点品牌色、悬停 warning 色。

原始计划：
- 节点 > 800 时切到 Canvas 2D 渲染层（保留 React 外壳），或引入 PixiJS
- 验收：2000 节点 ≥30 FPS

## 5. UI 统一管理（✅ 已实施）

**实测**：`.ov-item` 内边距在宽松/紧凑之间从 `7px 10px` 变为 `3px 6px`；`data-ov-variant` 在刷新后保持；控制台 0 错误。

结构：
- `ui/kit/tokens.ts`：间距/圆角/时长/版心宽度令牌 + 发布为 `--ov-*` CSS 变量
- `ui/kit/classes.ts` + `ui/kit/styles/{layout,content,chrome,graph}.ts`：类名与规则（从 `theme/` 迁入）
- `ui/kit/variants.ts`：`comfortable` / `compact` 两种风格，仅列差异；`applyVariant` 写 `data-ov-variant` 并持久化
- `ui/kit/registry.ts`：右栏面板与顶层视图的**界面清单**，右栏标签现在由 `RAIL_SURFACES` 生成
- `ui/theme.ts` 只做 re-export，业务组件不再直接引用样式目录

原始设计：

目标：所有 UI「可增删、可换风格」，不再散落在各组件里。

- `ui/kit/tokens.ts`：唯一的设计令牌入口（间距/圆角/字号/时长），映射到 `--dsw-*`
- `ui/kit/classes.ts`：类名表的唯一来源（现 `theme/classes.ts` 迁入）
- `ui/kit/variants.ts`：风格变体（`comfortable` / `compact`），通过根节点 `data-ov-variant` 切换，仅覆盖差异
- `ui/kit/registry.ts`：**界面清单**——每个 UI 面（主页面/右栏/图谱/覆盖层）登记 id、标题、组件、可见性开关；插件启动时按清单挂载，删除一个面 = 删一行
- 验收：新增一个面板只需在 registry 加一项；切换 variant 全站生效；`theme/` 目录不再被业务组件直接引用

## 6. 执行顺序

G1 → G2 → G3 → UI kit → G4（可选）。每步 `tsc` + `node --test` + 浏览器探针。

---

# 第二轮逆向（2026-10-26）：动画与渲染逐帧级对标

> 样本同 §0（本机 Obsidian 1.12.7 `obsidian.asar` 全量解包：`app.js` 3.7 MB 单行压缩 + `sim.js` 17 KB 图仿真 worker + `app.css`）。以下为本轮**新**挖到的事实，全部带源码依据。

## 7. sim.js：仿真 worker 的真实架构

### 7.1 WebAssembly 物理内核

worker 内嵌 base64 WASM 模块，导出 `init / simulate / complete / visitCharge / visitCollide / manyBody`。内存布局：节点每个 5 个 float（x,y,vx,vy,保留），连线每个 3 个 int32（sourceIndex,targetIndex,保留）；`init` 时按需 `memory.grow`。WASM 不可用时回退到 bundle 内的 d3-force JS 实现（控制台打 `Using fallback d3 simulator`）。

### 7.2 力模型（与 d3-force 语义一致，不是 FR）

| 力 | 实现 | 参数 |
|---|---|---|
| 向心 | forceX + forceY | strength 0.1（两轴各自） |
| 连线 | d3 forceLink | distance 250，strength = `1/min(degA,degB)` × linkStrength |
| 斥力 | d3 forceManyBody，**Barnes-Hut 四叉树** | strength -1000（repelStrength 10 → -10？否：源码 `x=-B` 即 -10，默认传 -1000 是 JS 回退的初值；实际由 `{forces}` 消息覆写为 -repelStrength），distanceMin 30，theta 0.81 |
| 碰撞 | d3 forceCollide | radius 60，strength 0.5 |

运动学：`x += vx *= 0.6`（velocityDecay 0.6）；alpha 衰减 `B = 1 - 0.001^(1/300)`（≈300 tick 冷却），每 tick `alpha += (alphaTarget - alpha) * B`；`alpha > 0.001` 时 `setTimeout(1000/60)` 持续 tick。数据/力参数/拖拽变化都通过 `postMessage({alpha:.3, run:true})` **重新加热**，仿真永不"完成"，只是冷却休眠。

### 7.3 位置回传：SharedArrayBuffer 零拷贝

支持 SAB 时：位置写入共享 buffer（末尾 4 字节是 Uint32 版本号），主线程每帧自查版本号，有变化才读——**无 postMessage 开销**。不支持则退回 ArrayBuffer transfer。

## 8. 渲染器（app.js `AQ` 类）的动画机制

### 8.1 一个函数驱动所有动画

```js
mQ = (cur, target, f = 0.9) => cur * f + target * (1 - f)   // 每帧指数平滑
vQ = (rgbA, rgbB) => 各通道 mQ                               // 颜色也逐帧插值
fQ = 0.2                                                     // 非邻接压暗系数
```

被 mQ 驱动的量：节点 `fadeAlpha`（0.9）、节点 tint 颜色（vQ 0.9）、hover 标签下移 `moveText`（0.9，目标 15）、连线 alpha（0.9）、相机 scale（**0.85**）、平移速度（0.8/0.9）。**Obsidian 的"丝滑"不是 easing 曲线库，就是这一个一阶低通**。60fps 下 0.9 ≈ 150ms 时间常数。

### 8.2 按需渲染

`changed()` → `idleFrames=0` → rAF；`idleFrames > 60` 后渲染循环休眠。任何变化（悬停/拖拽/仿真新坐标/调参）都走 `changed()` 唤醒。我们的 rAF 常驻空转可对齐此项。

### 8.3 相机

- 缩放范围 **1/128 – 8**（不是此前记录的 1/8）；`updateZoom` 每帧 `scale = mQ(scale, targetScale, .85)` 并绕 `zoomCenter` 锚点修正 pan。
- **平移惯性**：拖动中 `panv = mQ(panv, delta, .8)` 平滑速度；松手时若末段窗口 <100ms 则保留速度继续滑行，每帧 `pan += 1000*v/60`。
- 键盘：方向键平移（shift 3 倍速），`+/-` 以画布中心为锚缩放。

### 8.4 节点与连线绘制

- 节点尺寸：`clamp(3*sqrt(weight+1), 8, 30) × nodeSizeMult`；`nodeScale = sqrt(1/zoom)`（放大时节点相对世界变小，枢纽不糊屏）。
- 标签 alpha：`textAlpha = clamp(log2(zoom) + 1 - textFadeMultiplier, 0, 1)`（textFade 默认 0 → zoom≥1 全显，0.5–1 区间淡出）；hover 节点标签恒 alpha=1，且 zoom<1 时标签反向缩放保持屏幕尺寸。
- 节点**入场淡入**：`fadeAlpha` 初值 0，每帧向目标 mQ —— 新节点不是瞬现，是淡入。
- hover：邻接边换 `lineHighlight`（品牌色）且 alpha mQ 到 1，其余 mQ 到 0.2；节点 tint 用 vQ 逐帧过渡（无跳变）。
- 箭头：独立 Graphics，`alpha = 基础 × clamp(2*(zoom-0.3), 0, 1)`（缩小即淡出）；尺寸 `2*sqrt(lineSizeMult)/zoom`（恒定屏幕大小）。
- 连线厚度：`lineSizeMult / zoom`（恒定屏幕像素），白色纹理 sprite 拉伸，长度扣除两端节点半径。
- 双向边去重：`!(reverse.has(id) && id < 对端id)`。
- 视口裁剪：节点/边出视口即 `visible=false`；标签额外留 300px 余量。
- 懒初始化：每帧只为距视口中心最近的 50 个未初始化节点建图形。
- 拖拽点击区分：位移 >5px 才算拖拽。
- 局部图权重：中心 30，第 p 跳 `30 - (30/jumps)*p` —— 局部图里节点大小编码跳数而非度数。

### 8.5 颜色来源

`testCSS()` 创建 `.graph-view.color-*` 假元素读计算样式（色值 × opacity 分别进 rgb/a）：

| 键 | CSS 变量 |
|---|---|
| fill | `--graph-node`（= text-muted） |
| fillTag / fillAttachment | `--graph-node-tag`（绿）/ `--graph-node-attachment`（黄） |
| fillUnresolved | `--graph-node-unresolved`（text-faint, opacity .5） |
| fillFocused / circle | `--graph-node-focused`（= text-accent） |
| fillHighlight / lineHighlight | `--interactive-accent` |
| line | `--graph-line`（≈ base-35） |
| arrow | text-normal @ 0.5 |
| text | `--graph-text`（text-normal） |

## 9. 设置面板（app.css `.graph-controls`）

宽 240px、绝对定位右上、圆角+边框+阴影；`is-close` 时收成三个悬浮图标（关闭/动画/重置）。内部用 Obsidian setting-item 组件：toggle 是隐藏 checkbox 的滑动开关、slider 带动态 tooltip、`mod-search-setting` 搜索行无标题。**没有对标项**：我们的面板用原生 checkbox/range，且出现了横向滚动条（截图红框问题）。

---

# 10. 可执行方案（G5–G9）

> 排序原则：先动画手感（用户最敏感），再面板 UI（截图问题），再仿真架构（大图性能）。每阶段独立可验收、可回滚。

## G5 动画内核对标（✅ 已完成，实测见 ROADMAP P12 第四轮）

1. 新增 `graph/render/anim.ts`：`damp(cur, target, f = 0.9)` 与 `dampColor(cur, target)`（按通道），等价 mQ/vQ。
2. 渲染态对象化：每个可见节点持有 `{fade, tint, lift}`，每条边持有 `{alpha}`，全部每帧 damp 到目标值：
   - 节点入场 `fade: 0 → 1`（替代瞬现；配合现有黄金角绽放）；
   - hover 切换时邻接/非邻接的压暗 0.15→0.2 系数与 tint 都走 damp，**消灭跳变**；
   - hover 节点标签下移 15/zoom（`moveText` 等价物）。
3. 标签 alpha 换公式：`clamp(log2(zoom)+1-textFade, 0, 1)`（替换现有分段阈值），hover 标签恒 1 且 zoom<1 时保持屏幕尺寸。
4. 相机：scale 缓动因子 0.85；缩放范围改 **1/128–8**；pan 加惯性（速度 mQ 0.8 平滑、松手 100ms 窗口内保留甩动）。
5. 箭头 alpha 乘 `clamp(2*(zoom-0.3),0,1)`。
- 验收：录制 hover/缩放/拖拽 GIF 与 Obsidian 并排对比；控制台 0 报错；`node --test` 全绿（damp 纯函数加用例）。

## G6 设置面板重构（✅ 已完成，实测见 ROADMAP P12 第四轮）

1. `GraphSettingsPanel` 拆出 `ui/kit/controls.tsx`：`Toggle`（滑动开关，隐藏原生 checkbox）与 `Slider`（自定义轨道+滑块+拖动 tooltip，指针事件实现，键盘 ←→ 可调）两个受控组件，全插件复用。
2. 面板样式对齐 `.graph-controls`：固定 240px、`overflow-y: auto` + `overflow-x: hidden`（**消灭横向滚动条**）、section 间距/标题层级对齐、头部「关闭」改图标按钮。
3. 力参数滑杆换 Obsidian 的非线性映射：`SJ(e,t)=1-log(e*(1-t)+t)/log(t)` 与其逆 `MJ`，滑杆手感与官方一致（0.1/1 这些默认值落在滑杆中点附近）。
4. 顺带清掉面板里的 `t as unknown as` 强转（Dict 已全 key，直接索引）。
- 验收：截图对比——无横向滚动条、toggle/slider 无原生控件外观；键盘可操作；123 用例全绿。

## G7 仿真语义对齐 d3（✅ 已完成，实测见 ROADMAP P12 第六轮；第 4 项 SharedArrayBuffer 未启用，保留 ArrayBuffer 回传）

1. `layout.ts` 从 FR（固定 320 轮、温度限幅）改为 d3 语义：节点带 `vx/vy`，`velocityDecay 0.6`，`alpha` 冷却 `1-0.001^(1/300)`，力 = 向心(0.1) + 连线(distance, `1/min(deg)` 强度) + 斥力 + **collide(radius 60, 0.5)**。
2. 斥力在节点数 >300 时切 Barnes-Hut 四叉树（新 `graph/quadtree.ts`，纯函数可单测），否则保留 O(n²)。
3. worker 协议从一次性 `progress/done` 改为持续运行：`{nodes, links, alpha, run}` / `{forces, alpha, run}` / `{forceNode}` 消息 + 每 tick 回传位置；`alpha>0.001` 自旋，冷却自停。调力参数 = reheat，不再重排。
4. 位置回传可选升级 SharedArrayBuffer + 版本号（Chromium 可用即可，fallback 保留 ArrayBuffer）。
5. 拖拽：按下即 `alpha=alphaTarget=0.3` + fx/fy，松开清 fx/fy + `alphaTarget=0`（对齐源码）。
- **不做**：WASM 内核（收益主要在 >2000 节点，ROI 低；记录在案即可）。
- 验收：400 节点全库图布局期间主线程长任务 0；拖节点松手后邻簇平滑回弹；力滑杆实时生效无重建闪烁；123 用例全绿 + 新增 quadtree/alpha 用例。

## G8 渲染调度与大数据量（0.5 天）

1. `changed()`/`idleFrames>60` 按需渲染，替换常驻 rAF（省电、消风扇噪）。
2. 视口裁剪：边/节点出视口跳过绘制；标签保持现有避让预算。
3. 节点图形懒初始化窗口（每帧 50 个）——Canvas 下等价物是 fade 入场队列，G5 的 `fade` 已覆盖，此处只加裁剪。
- 验收：静置 5s 后 rAF 不再触发绘制（DevTools 验证）；2000 节点合成图 ≥30 FPS。

## G9 模块化收尾（0.5 天）

1. `TagPicker` 从 `GraphView.tsx` 抽到 `ui/TagPicker.tsx`（与 GraphSettingsPanel 平级）。
2. `GraphView` 抽 `useGraphData.ts`（fetch/version/错误横幅状态机），组件只留装配。
3. 全仓扫 `as unknown` 与死代码；`pnpm run duplication` 过一遍渲染层。
- 验收：GraphView ≤300 行；tsc 干净；123 用例全绿。

## 执行顺序

G5 → G6 → G7 → G8 → G9。G5/G6 互不依赖可并行；G8 依赖 G5 的 fade 队列；G9 随时可做。每步 `tsc` + `node --test` + `scripts/ui-check.mjs` 冒烟，动画项附 GIF（record-browser-gif）。

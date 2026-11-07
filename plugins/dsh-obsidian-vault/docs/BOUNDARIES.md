# 模块边界：笔记工作区 / 画布 / 宿主

画布（Pur Studio）是插件里的独立产品面：它有自己的内核、渲染、控制器和状态。笔记工作区不应该依赖画布内部实现，画布也不应该复用工作区的笔记逻辑。两边只通过三个**公开入口**打交道，其余目录一律视为私有。

## 分层

| 层 | 目录 | 可以依赖 | 禁止依赖 |
|---|---|---|---|
| 画布内核 | `src/pur-kernel/**` | 只允许自己 | 任何 `src/client/**`、Node 内置模块、`src/vault/**` |
| 画布 UI | `src/client/pur/**` | 内核、`client/ui/kit/**`、`client/i18n/**`、`client/api*.ts`、`protocol.ts` | `client/ui/**`（kit 之外）、`vault/**`、宿主代码 |
| 共享视觉层 | `src/client/ui/kit/**` | React、i18n、自身 | 画布或工作区的业务模块 |
| 笔记工作区 | `src/client/ui/**`（kit 之外）、`src/client/*.ts` | kit、i18n、api 客户端、`pur-kernel/index.ts`、`client/pur/integration.ts` | 画布内部文件（`client/pur/**` 除 integration）、内核深层路径 |
| 宿主 | `src/index.ts`、`src/routes*.ts`、`src/vault/**`、`src/settings.ts` 等 | Node 内置、`pur-kernel/index.ts`（只读写画布文档） | 任何 `src/client/**`、内核深层路径 |
| Obsidian 适配器 | `src/pur-obsidian/**` | 内核、Obsidian API | 浏览器 UI（`client/ui/**`、`client/pur/**`） |

## 三个公开入口

1. **`src/pur-kernel/index.ts`** —— 画布文档格式与内核的公共面。工作区和宿主需要解析/序列化 `.PurStudio` 时从这里导入，不直接深入 `studio-file.ts` 等文件。
2. **`src/client/pur/integration.ts`** —— 画布对工作区开放的唯一 UI 面：`PurStudioPane` 组件与画布命令注册函数。工作区通过它渲染画布标签页、转发命令，其余画布组件不对外。
3. **`src/client/ui/kit/**`** —— 双向共享的视觉层（类名、token、`useAsk` 对话框、Toggle 等）。画布和工作区都只依赖 kit，不互相依赖。

## 为什么这样切

- **画布可以整体替换**：内核与 UI 都在 `src/client/pur` + `src/pur-kernel` 内，只要保持 `integration.ts` 与内核 barrel 的签名，工作区不受影响。
- **宿主只需要文档格式**：宿主的 `.PurStudio` 维护（外置图片、图像解析、代码节点执行结果序列化）只用到内核的解析/序列化函数，不执行画布控制器。
- **`useAsk` 上移**：它原本在工作区 UI 里，画布为弹确认框不得不 import 工作区内部；移到 kit 后两边都只依赖共享层。
- **不要复制粘贴**：需要新共享能力时，先判断它属于画布（放内核）、工作区（放 `client/ui`）还是两者共享（放 kit），不要一边 import 另一边的私有文件。

## 校验

```sh
node scripts/check-boundaries.mjs   # 或 npm run check:boundaries
```

脚本扫描 `src/**` 的 import，按上表判定；发现违规时打印文件:specifier 并以 1 退出。新增合法的公开入口时，改 `scripts/check-boundaries.mjs` 的规则并把理由写进本文件。

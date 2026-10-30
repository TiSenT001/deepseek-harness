# Pur Studio — 创作工作台 Obsidian 插件

> **项目路径**: `G:\个人知识库\工具\Pur Studio\`
> **插件路径**: `G:\个人知识库\.obsidian\plugins\pur-studio\` (运行时)
> **父级规则**: `G:\.claude\CLAUDE.md`（全局规则优先）
> **版本**: v2.4.0 / 2026-06-23

## Obsidian 命令 (19 个)

- `Show Grid`
- `new-pur-studio`
- `open-pur-studio`
- `pur-copy`
- `pur-delete`
- `pur-duplicate`
- `pur-export-md`
- `pur-fit-view`
- `pur-group`
- `pur-paste`
- `pur-popout`
- `pur-redo`
- `pur-result-dialog`
- `pur-save-as`
- `pur-select-all`
- `pur-undo`
- `pur-ungroup`
- `save-pur-studio-as`
- `显示网格`

## 架构

```
Pur Studio 插件 (Obsidian)
   ├── plugin/main.js          (~4674行, 单文件插件源码)
   ├── plugin/manifest.json    (插件元数据)
   ├── plugin/styles.css       (样式)
   └── src/renderers/C4DRenderer.ts  (C4D 节点图渲染器, TypeScript)

外部桥接代码 (不在本目录):
   ├── C4D_Bridge/c4d_to_pur.py          C4D IR → Pur 画布
   ├── C4D_Bridge/pur_integration.py     C4D 视口快照 → Pur 画布
   ├── UAssetAI_Bridge/pur/ir_to_pur_studio.py   UE IR → Pur 画布
   ├── UAssetAI_Bridge/pur/pur_to_ir.py          Pur 画布 → IR
   ├── UAssetAI_Bridge/pur/pur_screenshot_server.py  截图服务
   └── UAssetAI_Bridge/pur/ue_collab.py           UE 协作层

tisent_os 集成:
   └── .brain/tisent_os/integration/pur_adapter.py  画布读/写/搜索
```

## 文件说明

| 文件 | 职责 |
|------|------|
| `plugin/main.js` | 插件主源码 — 无限画布/图片管理/可视化编程/笔记嵌入 |
| `plugin/manifest.json` | Obsidian 插件注册 |
| `plugin/styles.css` | 画布 UI 样式 |
| `src/renderers/C4DRenderer.ts` | C4D 节点图 → Pur 画布渲染 (TypeScript) |

## 同步说明

`plugin/` 目录是从 `.obsidian/plugins/pur-studio/` **手动同步**的源码镜像。
同步文件: `main.js`, `manifest.json`, `styles.css`
不同步: `data.json` (运行时状态), `main.js.bak` (备份)

## 入口点

- **Obsidian 加载**: 通过 manifest.json 注册，`main.js` 为入口
- **HTTP API**: 端口 18991 (画布数据读写)
- **文件格式**: `.PurStudio` (JSON, 包含 elements + viewState)

## 端口

| 端口 | 用途 |
|------|------|
| 18991 | Pur Studio HTTP API + Viewer |

**端口真相源**: `G:\个人知识库\工具\ToolchainManager\data\bridge_ports.json`

## 开发注意事项

- `main.js` 是纯 JavaScript 单文件 — 修改后需重启 Obsidian 生效
- 使用 `node --check` 验证 JS 语法
- 避免 Bash sed 做复杂替换 (中文/Unicode 问题)
- 优先使用 Write + node 脚本方式编辑

## 自检清单

- [ ] 插件是否加载？→ Obsidian 设置 → 社区插件 → Pur Studio
- [ ] 画布数据在哪？→ `G:\个人知识库\Pur画布\` (.PurStudio 文件)
- [ ] KB 笔记在哪？→ `G:\个人知识库\工具链\Pur Studio\` (5篇文档)

[[Pur Studio]]

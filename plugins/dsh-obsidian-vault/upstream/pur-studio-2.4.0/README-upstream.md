# Pur Studio — 创作工作台

Obsidian 无限画布插件。图片管理 + 可视化编程 + 笔记嵌入 + 管线可视化。

## 能力

- **无限画布**: 元素自由拖拽、分组、连线
- **图片管理**: 导入/粘贴/拖拽 → 统一入库 + 去重
- **可视化编程**: 引脚 + 连线 + 代码节点 (58 预制节点)
- **Bridge 集成**: C4D/UE IR → Pur 画布可视化
- **pur.canvas 协议**: 笔记内嵌画布

## 版本

v2.4.0 (2026-06-23)

## 文件结构

- `plugin/main.js` — 插件主源码 (~4674 行)
- `src/renderers/C4DRenderer.ts` — C4D 节点图渲染器
- 插件运行时: `.obsidian/plugins/pur-studio/`

## 外部桥接代码

Pur Studio 的画布数据由以下外部 Python 模块生成:

| 文件 | 方向 |
|------|------|
| `C4D_Bridge/c4d_to_pur.py` | C4D IR → Pur |
| `UAssetAI_Bridge/pur/ir_to_pur_studio.py` | UE IR → Pur |
| `UAssetAI_Bridge/pur/pur_to_ir.py` | Pur → IR |

## 相关资源

- [CLAUDE.md](./CLAUDE.md) — Claude Code 自动感知
- [Pur Canvas 开发规范](../../.claude/projects/G--/memory/pur-canvas-dev.md)
- [功能手册 (KB)](../../工具链/Pur Studio/Pur Studio 功能手册.md)

[[Pur Studio]]

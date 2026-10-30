# 上游基准：Pur Studio 2.4.0（冻结）

本目录是从知识库 `工具/Pur Studio/` 复制过来的**上游原版**，只作行为基准，不参与构建、不接受修改。

| 文件 | 来源 | 说明 |
|---|---|---|
| `main.js` | `工具/Pur Studio/plugin/main.js` | 4683 行 CommonJS，`require('obsidian')`，未压缩 |
| `manifest.json` | 同上 | 上游插件清单，id `pur-studio`，v2.4.0 |
| `styles.css` | 同上 | 上游样式 |
| `C4DRenderer.ts` | `工具/Pur Studio/src/renderers/` | C4D 节点图渲染器 |
| `README-upstream.md` / `CLAUDE-upstream.md` | 同上 | 上游自己的说明 |

## 校验

```
main.js  SHA-256 B1C9F967A6C6FE9601F6B731B8C4DAB2F6042BA919A9E69F36658D12ED4C2EF2
```

与知识库运行时副本 `.obsidian/plugins/pur-studio/main.js` 逐字节一致。

## 为什么冻结

`tests/helpers/pur-golden.ts` 里的黄金向量是从这份 `main.js` 的数据层实际跑出来录制的，内核复刻必须逐项对齐它。这份文件一旦被替换，黄金对照就失去意义（尺子变成了被测物）。

需要重新录制黄金时，从这里取文件，不要从知识库取——那边已经改成指向本实现的索引页。

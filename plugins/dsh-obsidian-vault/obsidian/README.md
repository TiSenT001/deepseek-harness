# Obsidian 发行包

本目录是 Obsidian 侧的插件清单与样式；`main.js` 由构建产物 `lib/pur-obsidian.js` 复制而来，不在这里保存副本。

## 安装

```powershell
$vault = 'G:\个人知识库\.obsidian\plugins\dsh-pur-studio'
New-Item -ItemType Directory -Force -Path $vault | Out-Null
Copy-Item .\lib\pur-obsidian.js  "$vault\main.js" -Force
Copy-Item .\obsidian\manifest.json, .\obsidian\styles.css "$vault\" -Force
```

然后在 Obsidian → 设置 → 第三方插件 里启用 **DSH Pur Studio**。

## 与上游并存

| 项 | 上游 `pur-studio` | 本插件 `dsh-pur-studio` |
|---|---|---|
| 插件 id | `pur-studio` | `dsh-pur-studio` |
| 视图类型 | `pur-studio` | `dsh-pur-studio` |
| `.purstudio` 扩展名 | 注册 | **默认不注册** |
| 命令 id | `pur-*` | `pur-*`（同名命令会并列出现两条） |

`ownFileExtension` 默认关闭：两个插件都在时抢同一个扩展名会让加载顺序决定谁打开画布文件。要由本插件接管，先在设置里打开它、再禁用上游插件、然后重载 Obsidian。

## 已知差异

- 命令面板里 `Pur Studio: …` 会各有一条，来自两个插件，属并存期的正常现象。
- 上游的 popout / pin-top 在本实现里降级为「当前环境不支持此功能」提示。

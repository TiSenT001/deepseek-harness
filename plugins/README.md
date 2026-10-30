# plugins/

本地 DSH 插件的唯一存放处。插件源码、构建产物、加载配置说明都留在这里，不再散落到 `.dsh-home/`。

| 目录 | 作用 | 加载方式 |
|---|---|---|
| `brain-memory-logger/` | 对话自动入脑：用户消息 POST `/learn`、agent 回复 POST `/reply` 到 brain_server `:19995`，失败落 `.brain-outbox.jsonl` 离线重放 | profile patch 直接引用 TS 文件 |
| `dsh-obsidian-vault/` | Obsidian 风格库工作区（wikilink、反链、标签、属性、关系图、Pur Studio 画布），双端 adapter：DSH client + Obsidian 插件 | 自身 `cordis.patch.yml` |
| `dsh-better-sidebar-src/` | 侧边栏插件源码（独立 git 仓库、独立 pnpm workspace） | `profiles/web/node_modules/dsh-better-sidebar` 软链到本目录 |

## 加载引用

`brain-memory-logger` 由两个 profile 的 patch 以相对路径引用，改目录必须同步改这两处：

- `.dsh-home/profiles/web/cordis.patch.yml` → `'../../../plugins/brain-memory-logger/index.ts'`
- `.dsh-home/profiles/headless/cordis.patch.yml` → `'../../../plugins/brain-memory-logger/index.ts'`

路径相对 profile 目录计算：`profiles/<name>/` 上三级即仓库根，再进 `plugins/`。

## 约定

- 新插件一律建在本目录下，不要再往 `.dsh-home/plugins/` 放东西（该目录已移除）。
- 带构建产物的插件把 `lib/` 一起留在自己目录内，方便 `cordis.patch.yml` 直接指过去。
- `dsh-better-sidebar-src` 目前保留 `-src` 后缀，因为它被 profile 的 `node_modules` 软链按名字引用；改名需同步重建软链。

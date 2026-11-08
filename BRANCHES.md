# 分支规范与用途

本仓库是 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 fork
（`TiSenT001/deepseek-harness`），承载自研插件。远端：`origin` 指向上游官方库，`fork` 指向本仓库。

## 命名规则

- 主分支固定 `master`，是**插件主线**：官方基线 + 本仓库插件集成。
- 子分支名 = 父分支名 + `-` + 模块 slug：`master` → `master-obsidian` → `master-obsidian-pur`。
  git 分支没有父子关系，层级只由命名和本文件约定。
- 只用 `[a-z0-9-]`：小写、连字符、英文；不用中文、空格、大写、下划线。
- 官方相关分支用 `upstream-` 前缀：它的父分支是 `origin/master`，不是 `master`。
- 临时分支用 `tmp-` 前缀，合并后立即删除。
- 新分支必须登记到下面的分支清单；删除分支时同步删除对应行。

## 分支清单

| 分支 | 父分支 | 用途 | 生命周期 |
|---|---|---|---|
| `master` | — | 插件主线：官方基线 + 插件集成 | 永久 |
| `master-obsidian` | `master` | DSH-obsidian 插件开发（`plugins/dsh-obsidian-vault`） | 永久 |
| `master-brain` | `master` | TiSenT Brain 插件开发（`plugins/dsh-brain-console`） | 永久 |
| `master-obsidian-pur` | `master-obsidian` | pur 子插件（`plugins/dsh-obsidian-vault/plugins/pur-studio`、`src/pur-*`） | 永久 |
| `master-upstream` | `master` | 合并官方 `origin/master` 的临时落点 | 每次同步新建，合完删除 |
| `upstream-eval-<topic>` | `origin/master` | 只读评估官方新特性，不合回 | 用完删除 |
| `tmp-<topic>` | 任一 | 临时实验 | 用完删除 |

## 同步官方

```bash
git fetch origin
git switch -c master-upstream
git merge origin/master
# 解冲突并跑验证
git switch master
git merge --ff-only master-upstream
git branch -d master-upstream
```

## 部署

`setup/README.md` 的部署流程从 `master` 或对应插件分支检出即可；`setup/setup-machine.ps1`
接受 `master` 与 `master-<plugin>` 形式的任何分支。

## 提交约定

- 一个提交只改一个插件的目录，便于 cherry-pick 和回滚。
- 短任务分支用 `<父分支>-<任务>`（如 `master-brain-fix-retry`），合并后删除。

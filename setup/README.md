# 新机器一键部署

目标：在新 Windows 机器上克隆仓库后，**一条命令**得到和当前机器一致的环境，并且仓库里不残留
任何写死的盘符。

## 前置

- Windows 10/11、Windows PowerShell 5.1+（`pwsh` 7 亦可）
- Node.js ≥ 24.9（`node --version`）
- pnpm（`corepack enable` 或 `npm i -g pnpm`）
- Git
- Obsidian 仓库目录（例如 `G:\个人知识库`），可以稍后再建
- 模型凭证：`DEEPSEEK_API_KEY` 环境变量，或启动后在 GUI 里登录账号

## 一键

```powershell
git clone https://github.com/TiSenT001/deepseek-harness.git
cd deepseek-harness
git checkout feat/pur-studio-canvas
powershell -File setup\setup-machine.ps1 -Vault "G:\个人知识库" -Shortcut
```

结束后双击生成在仓库根目录的 `start-dsh.cmd`（或桌面快捷方式）即可。

常用参数：

| 参数 | 作用 |
|---|---|
| `-Vault <路径>` | Obsidian 仓库；省略时读 `OBSIDIAN_VAULT` |
| `-DshHome <路径>` | DSH home，默认 `<仓库>\.dsh-home`（自包含） |
| `-LspDir <路径>` | 可选，LSP 语言服务器目录；省略则不写 LSP 行 |
| `-BrainRoot <路径>` | TiSenT brain 目录，默认 `<vault>\.brain` |
| `-BrainPythonw <路径>` | 可选，拉起 brain_manager 用的 pythonw.exe |
| `-SkipInstall` | 跳过 `pnpm install` |
| `-SkipSidebar` | 不克隆/打补丁 better-sidebar |
| `-Force` | 已有 profile 也重新渲染（先备份） |
| `-DryRun` | 只打印动作，不写文件、不安装 |

## 脚本做了什么

1. 检查 `node` / `pnpm` / `git` 和 vault 目录
2. `pnpm install`（仓库依赖）
3. 克隆 `dsh-better-sidebar` 到 `plugins/dsh-better-sidebar-src`（固定 `83faf70`），
   并应用 `setup/patches/dsh-better-sidebar.patch`（本机对它的修改）
4. 生成 `$DSH_HOME/profiles/web/`：
   - `package.json`：用**相对路径** `link:` 指向本仓库的 4 个插件/包
   - `cordis.patch.yml`：大脑 MCP、memory-logger、vault 路径、better-sidebar 配置、
     agent 默认模型、Claude Code 子智能体、关 HMR、主题、可选 LSP
   - `cordis.yml` / `pnpm-workspace.yaml`
5. `pnpm install`（profile 依赖）
6. 写 `setup/machine.env.ps1`（本机专属：vault、终端目录、LSP 目录）
7. 生成 `start-dsh.cmd`；`-Shortcut` 时再建桌面快捷方式

## 本机专属配置放哪

| 内容 | 位置 | 是否进 git |
|---|---|---|
| vault 路径、终端目录、LSP 目录 | `setup/machine.env.ps1` | 否（已在 `.gitignore`） |
| profile 里的绝对路径 | `$DSH_HOME/profiles/web/cordis.patch.yml` | 否（`.dsh-home/` 已忽略） |
| 会话、账号凭证、截图附件 | `$DSH_HOME/` | 否 |
| 插件源码、DSH 内部改动 | 仓库分支 `feat/pur-studio-canvas` | 是 |

## 环境变量

| 变量 | 用途 | 必需 |
|---|---|---|
| `OBSIDIAN_VAULT` | vault 路径；`start-dsh.ps1` 会读 machine.env.ps1 | 是（或 `-Vault`） |
| `DSH_HOME` | DSH home；`start-dsh.ps1` 默认 `<仓库>\.dsh-home` | 否 |
| `DEEPSEEK_API_KEY` | 模型密钥；也可在 GUI 登录账号 | 二选一 |
| `ANTHROPIC_AUTH_TOKEN` | Claude Code 子智能体；通常等于上面的 key | 否 |
| `BRAIN_ROOT` | TiSenT brain 目录，默认 `<vault>\.brain` | 是（brain 面板用） |
| `BRAIN_PYTHONW` | brain_manager 启动器使用的 pythonw.exe | 否（默认走 PATH） |
| `DSH_LSP_DIR` | LSP servers 目录，启用 LSP 时需要 | 否 |
| `PLAYWRIGHT_MODULE` | 开发脚本（audit/probe）找不到 Playwright 时的手动路径 | 否 |

`DSH_HOME` 不再依赖用户级环境变量：`start-dsh.ps1` 每次启动都会把它设成仓库内的
`.dsh-home`（或 `-DshHome`），所以同一台机器上的其它 DSH 安装不会互相干扰。

## 被修改过的第三方 / DSH 内部代码

- **DSH 内部**：不改。分支里保留你原有的本地行为（终端 cwd 固定 `G:\` 等），
  新机器克隆切分支即可复现，不需要额外补丁，也不要为本仓库的部署去改它。
- **dsh-better-sidebar**：它是独立仓库，本机有未提交改动，已导出为
  `setup/patches/dsh-better-sidebar.patch`，脚本在干净 checkout 上执行 `git apply`。
  以后继续改它时，重新导出：
  ```powershell
  git -C plugins\dsh-better-sidebar-src diff > setup\patches\dsh-better-sidebar.patch
  ```
- **dsh-brain-console / dsh-obsidian-vault / brain-memory-logger**：都在本仓库里，随分支走。
  brain 目录与 pythonw 不再写死：读 `BRAIN_ROOT`（或 `OBSIDIAN_VAULT/.brain`）与
  `BRAIN_PYTHONW`；vault 路径由 profile 提供，插件本身不含盘符。

## 不复制的东西

- 会话记录、附件、账号凭证：留在旧机器，避免隐私与凭证跨机复制；新机器登录账号即可
- `node_modules`：重新安装
- 旧机器的 `.dsh-home`：只把它当作参考；脚本会生成新的 profile

## 验证

```powershell
powershell -File setup\setup-machine.ps1 -Vault "G:\个人知识库" -DryRun   # 先看动作
powershell -File setup\start-dsh.ps1 -NoOpen                             # 起服务并打印 URL
```

插件自检（可选）：

```powershell
cd plugins\dsh-obsidian-vault
npm test
node scripts\ui-full-audit.mjs <带 token 的 URL>
```

审计脚本会自动从 `/obsidian/api/status` 读取当前 vault 根目录，不再假设 `G:\个人知识库`；
Playwright 通过 `scripts/playwright-env.mjs` 解析（`PLAYWRIGHT_MODULE` 可覆盖）。

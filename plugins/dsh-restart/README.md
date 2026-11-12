# dsh-restart

DeepSeek Harness 的重启插件：侧栏底部一个「重启 DSH」按钮，点击后会：

1. 让当前 Host 退出；
2. 通过外部 launcher 在隐藏窗口中启动同一条 `dsh web` 命令；
3. 浏览器轮询到同源恢复后自动刷新，保留原来的登录 cookie。

没有控制台弹窗，不依赖用户手动开终端。典型耗时约 4 秒。

## 为什么需要外部 launcher

Host 的子进程位于 DSH 的 Tool Sandbox / Windows Job 中；Host 退出时这些子进程会被一起清掉（实测普通 detached 子进程活不过 Host）。因此插件把重启请求和 helper 路径写入
`<DSH_HOME>/logs/restart-request.json` 与 `.vbs`，再用 PowerShell 的 `Shell.Application.ShellExecute`
交给 Explorer 启动 `wscript`；wscript 以窗口模式 0 运行 Node helper，helper 不在 Host job 内，
才能先杀掉旧 Host、再启动新 Host。

## 行为

- `POST /restart/api/restart` 受当前 Web 的 `connection` 信任门保护；重复点击返回 `429`。
- **点击即重启**：不再等待运行中的对话或后台任务；按钮立即请求 Host 启动 helper。正在生成的回答或后台任务会被结束，未写入回答的内容可能丢失。
- 按钮位于 `sidebar.footer.action`，窄侧栏只显示图标，宽侧栏显示「重启 DSH」。
- 等待期间显示「等待服务恢复…」；超过 120 秒或登录凭据失效会给出中文提示。
- helper 先 `taskkill /F /T` 结束旧进程树，再最多重试 10 次启动新 Host；端口被旧进程短暂占用时会自动重试。
- 日志：`<DSH_HOME>/logs/restart-helper.log`、`<DSH_HOME>/logs/restart-host.log`。

## 安装

插件已放在 `plugins/dsh-restart`，构建产物在 `lib/`。当前 Web profile 已通过 junction 链接：

```
.dsh-home/profiles/web/node_modules/dsh-restart -> plugins/dsh-restart
```

并在 `.dsh-home/profiles/web/package.json` 的 `bundles` 中加入 `dsh-restart`。

**首次启用需要重启一次 Host**（存量页面不会热加载新的客户端 bundle）。之后每次改配置/插件都可以直接点侧栏按钮。

## 构建

```sh
cd plugins/dsh-restart
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec tsdown --config tsdown.config.ts
```

## 已知边界

- Linux/macOS 分支使用普通 detached 启动，未在真实机器上验证；
- 只重启 Web Host，不重启正在运行的浏览器页面或后台任务；
- 强制结束进程树，未完成的最后一个 turn 可能丢失（会话日志按事件落盘，已写入部分保留）。

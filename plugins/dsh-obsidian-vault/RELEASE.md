# 打包与发布（当前状态：未发布）

`package.json` 仍是 `"private": true`，**npm publish 会被阻止**。这个文件是发布前的准备清单：
准备好之后，在专门的发布提交里去掉 private，再执行发布。

## 发布前必须决定

1. **公开署名**
   - npm 账号 / scope：`dsh-obsidian-vault` 是未占用名，还是 `@your-scope/dsh-obsidian-vault`？
   - `author`：现在是 `TiSenT001`；如果要用组织名，改这里
   - `repository` / `homepage` / `bugs`：现在指向 `TiSenT001/deepseek-harness`
   - `LICENSE`：当前为 MIT，版权人 `TiSenT001`；换成组织名时一起改
   - npm 发布者用户名无法隐藏；git 历史里的提交邮箱也公开
2. **DSH 兼容范围**
   - 测试基线是 DSH `0.2.2-rc.1`、Node `>=24.9`
   - 插件依赖 `slots`、`ui-primitives` 两个稳定面
   - `engines` 只声明了 Node；DSH 自身没有可用的 engines 字段，兼容性写在 README
3. **第三方归属**
   - Obsidian 是 Obsidian.md 的商标；README 已用「Obsidian-style」描述，不要暗示官方关联
   - `upstream/pur-studio-2.4.0` 仅作参考，不进入 tarball
   - 发布前确认没有复制第三方源码片段

## 发布步骤

```powershell
cd plugins\dsh-obsidian-vault

# 1) 版本与变更记录
#    修改 package.json version，更新 README 的版本段/新增 CHANGELOG 条目

# 2) 本地全量校验（prepublishOnly 也会跑这三步）
npm run typecheck
npm test
npm run build

# 3) 发布预检：检查 tarball 内容和元数据，不会发布
npm run release:check

# 4) 单独一个发布提交：去掉 "private": true
#    （保留 private 时 npm publish 会直接失败，这是有意的保险）

# 5) 登录并发布
npm login
npm publish --access public
# 可选的来源证明（需要 GitHub Actions + id-token: write）：
# npm publish --access public --provenance

# 6) 验证
npm view dsh-obsidian-vault version
# 在一个干净 profile 里用「添加插件」输入包名安装，确认侧栏出现「知识库」
```

## 发布后

- GitHub Release 附一份 `npm pack` 的 tarball，供不用 npm 的机器离线安装
- 升级 DSH 后：跑 `npm run typecheck`、`npm test`、审核脚本，再发 patch 版本
- 需要撤回时优先 `npm deprecate` + 发新版本；npm 的 unpublish 窗口很短且会破坏已安装用户

## 当前预检输出

```
release check for dsh-obsidian-vault@0.1.0
  tarball: 14 files, 1526.6KB packed, 6566.9KB unpacked
  warn: package.json still has "private": true — publish is blocked until a release commit removes it
  ok (with warnings)
```

tarball 只包含 `lib/`、`scaffold/`、`cordis.patch.yml`、`README.md`、`LICENSE`、`package.json`；
`src/`、`tests/`、`scripts/`、`docs/`、`.data/`、`.artifacts/` 都不会进包。

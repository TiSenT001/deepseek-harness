import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
//#region src/config.ts
/**
* 面板宿主配置：Brain 根目录与管理器地址。
*
* 持久化到 JSON（默认 `<cwd>/.dsh-home/brain-console.config.json`，可用
* `BRAIN_CONSOLE_CONFIG` 覆盖），宿主按 Brain 根目录自动派生 launcher、脚本等
* 路径，浏览器可在设置页读写。环境变量作为文件缺失时的兜底来源。
*/
/** 配置文件位置。 */
function configFile() {
	return process.env.BRAIN_CONSOLE_CONFIG ?? join(process.cwd(), ".dsh-home", "brain-console.config.json");
}
/** 读已保存配置；文件缺失或损坏时返回空对象。 */
function readStored() {
	try {
		const raw = JSON.parse(readFileSync(configFile(), "utf8"));
		return typeof raw === "object" && raw !== null ? raw : {};
	} catch {
		return {};
	}
}
function envBrainRoot() {
	if (process.env.BRAIN_ROOT !== void 0 && process.env.BRAIN_ROOT !== "") return process.env.BRAIN_ROOT;
	if (process.env.OBSIDIAN_VAULT !== void 0 && process.env.OBSIDIAN_VAULT !== "") return join(process.env.OBSIDIAN_VAULT, ".brain");
	return "";
}
/** 计算生效配置与派生路径。 */
function effectiveConfig() {
	const stored = readStored();
	const fileRoot = typeof stored.brainRoot === "string" ? stored.brainRoot.trim() : "";
	const envRoot = envBrainRoot();
	const brainRoot = fileRoot !== "" ? fileRoot : envRoot;
	const fileUrl = typeof stored.managerUrl === "string" ? stored.managerUrl.trim() : "";
	const envUrl = process.env.BRAIN_MANAGER_URL ?? "";
	const managerUrl = fileUrl !== "" ? fileUrl : envUrl !== "" ? envUrl : "http://127.0.0.1:19998";
	const launcherDir = brainRoot === "" ? "" : join(brainRoot, "tools", "launcher");
	const namedLauncher = launcherDir === "" ? "" : join(launcherDir, "py", "brain_manager.exe");
	const launcherPath = launcherDir === "" ? "" : join(launcherDir, "brain_manager.exe");
	return {
		brainRoot,
		managerUrl,
		namedLauncher,
		launcherPath,
		scriptPath: brainRoot === "" ? "" : join(brainRoot, "services", "brain_manager.py"),
		logPath: brainRoot === "" ? "" : join(brainRoot, "logs", "brain_manager.log"),
		namedLauncherExists: namedLauncher !== "" && existsSync(namedLauncher),
		launcherExists: launcherPath !== "" && existsSync(launcherPath),
		scriptExists: brainRoot !== "" && existsSync(join(brainRoot, "services", "brain_manager.py")),
		pythonw: process.env.BRAIN_PYTHONW ?? "pythonw.exe",
		configFile: configFile(),
		sources: {
			brainRoot: fileRoot !== "" ? "file" : envRoot !== "" ? "env" : "none",
			managerUrl: fileUrl !== "" ? "file" : envUrl !== "" ? "env" : "default"
		}
	};
}
/**
* 保存配置（只接受 brainRoot / managerUrl）。
* @param patch - 待写入字段；空字符串表示清除该字段（回退环境变量/默认值）
* @returns 保存结果与新的生效配置
*/
function saveConfig(patch) {
	const next = { ...readStored() };
	if (patch.brainRoot !== void 0) {
		const root = String(patch.brainRoot).trim();
		if (root !== "" && !isAbsolute(root)) return {
			ok: false,
			error: "Brain 根目录必须是绝对路径（或留空回退环境变量）"
		};
		if (root === "") delete next.brainRoot;
		else next.brainRoot = root;
	}
	if (patch.managerUrl !== void 0) {
		const url = String(patch.managerUrl).trim();
		if (url !== "" && !/^https?:\/\/\S+$/i.test(url)) return {
			ok: false,
			error: "管理器地址必须是 http(s) URL（或留空回退默认）"
		};
		if (url === "") delete next.managerUrl;
		else next.managerUrl = url.replace(/\/+$/, "");
	}
	try {
		const file = configFile();
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, JSON.stringify(next, null, 1), "utf8");
	} catch (error) {
		return {
			ok: false,
			error: `写入配置失败: ${String(error)}`
		};
	}
	return {
		ok: true,
		config: effectiveConfig()
	};
}
//#endregion
//#region src/index.ts
/**
* Host half of dsh-brain-console.
*
* 浏览器半部直接调 brain_manager（127.0.0.1:19998）做启停；这里只补一个缺口：
* **管理器自己没在跑时，浏览器没法拉起它**（面板是它的前端，循环依赖）。
*
* 因此宿主侧提供 `/brain-console/api/manager/start`：探活 → 未运行则 detached 拉起
* 命名启动器（brain_manager.exe）→ 轮询到健康为止。这是"人工控制台"唯一允许的
* 自启动动作，且必须由用户点击触发，不做开机自启。
*/
const name = "dsh-brain-console";
const inject = ["webServer"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function managerAlive() {
	const config = effectiveConfig();
	if (config.managerUrl === "") return false;
	try {
		return (await fetch(`${config.managerUrl}/health`, { signal: AbortSignal.timeout(1500) })).ok;
	} catch {
		return false;
	}
}
/**
* 读取并解析 JSON 请求体（上限 8KB）。
* @param req - 宿主请求
* @returns 解析结果；空体/超限/坏 JSON 返回 {}
*/
async function readJsonBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.from(chunk);
		size += buffer.length;
		if (size > 8 * 1024) break;
		chunks.push(buffer);
	}
	try {
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}
function send(res, code, body) {
	const payload = JSON.stringify(body);
	res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
	res.end(payload);
}
/**
* 本进程内「正在启动管理器」的时刻。
*
* 管理器启动要恢复 7 个服务，约 30s 才在 :19998 上线；在这段窗口里连点两次按钮、
* 或脚本与面板同时请求，会各 spawn 一个管理器（实测出现过双实例）。用这个时间戳
* 在进程内去抖：窗口内的后续请求只回 202 starting，不再重复拉起。
*/
let managerStartingSince = null;
/** 去抖窗口要覆盖管理器恢复服务的耗时。 */
const MANAGER_START_WINDOW_MS = 12e4;
async function startManager(res) {
	if (effectiveConfig().brainRoot === "") {
		send(res, 500, { error: "Brain 根目录未配置：在面板设置页填写，或设置 BRAIN_ROOT / OBSIDIAN_VAULT" });
		return;
	}
	if (await managerAlive()) {
		managerStartingSince = null;
		send(res, 200, {
			running: true,
			started: false
		});
		return;
	}
	const now = Date.now();
	if (managerStartingSince !== null && now - managerStartingSince < MANAGER_START_WINDOW_MS) {
		send(res, 202, {
			running: false,
			starting: true
		});
		return;
	}
	managerStartingSince = now;
	try {
		await spawnManager(res);
	} finally {
		managerStartingSince = null;
	}
}
async function spawnManager(res) {
	const config = effectiveConfig();
	const script = config.scriptPath;
	const named = config.namedLauncher;
	const launcher = config.launcherPath;
	const PYTHONW = config.pythonw;
	if (!existsSync(script)) {
		send(res, 500, { error: `manager script missing (${script})` });
		return;
	}
	if (existsSync(named)) {
		const logPath = config.logPath;
		mkdirSync(dirname(logPath), { recursive: true });
		const fd = openSync(logPath, "a");
		try {
			spawn(named, [script], {
				detached: true,
				stdio: [
					"ignore",
					fd,
					fd
				],
				windowsHide: true,
				cwd: config.brainRoot,
				env: {
					...process.env,
					PATH: `${PYTHONW.includes("\\") || PYTHONW.includes("/") ? `${dirname(PYTHONW)};` : ""}${process.env.PATH ?? ""}`
				}
			}).unref();
		} finally {
			closeSync(fd);
		}
	} else if (existsSync(launcher)) spawn(launcher, [PYTHONW, script], {
		detached: true,
		stdio: "ignore",
		windowsHide: true,
		cwd: config.brainRoot
	}).unref();
	else {
		send(res, 500, { error: `launcher or named python missing (${launcher})` });
		return;
	}
	for (let i = 0; i < 120; i++) {
		await sleep(500);
		if (await managerAlive()) {
			send(res, 200, {
				running: true,
				started: true
			});
			return;
		}
	}
	send(res, 504, { error: "manager did not become healthy within 60s" });
}
function apply(ctx) {
	console.log("[brain-console] host apply: registering /brain-console/api");
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: "/brain-console/api",
		handler: async (req, res) => {
			const url = new URL(req.url ?? "/", "http://localhost");
			if (url.pathname.endsWith("/config")) {
				if (req.method === "POST") {
					const body = await readJsonBody(req);
					const result = saveConfig({
						brainRoot: typeof body.brainRoot === "string" ? body.brainRoot : void 0,
						managerUrl: typeof body.managerUrl === "string" ? body.managerUrl : void 0
					});
					send(res, result.ok ? 200 : 400, result);
					return;
				}
				send(res, 200, effectiveConfig());
				return;
			}
			if (url.pathname.endsWith("/manager/status")) {
				send(res, 200, { running: await managerAlive() });
				return;
			}
			if (url.pathname.endsWith("/manager/start") && req.method === "POST") {
				await startManager(res);
				return;
			}
			send(res, 404, { error: "not found" });
		}
	}), "brain-console: manager routes");
}
//#endregion
export { apply, inject, name };

//# sourceMappingURL=index.js.map
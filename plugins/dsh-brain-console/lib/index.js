import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
const MANAGER_URL = "http://127.0.0.1:19998";
const BRAIN_ROOT = process.env.BRAIN_ROOT ?? "G:\\个人知识库\\.brain";
const PYTHONW = process.env.BRAIN_PYTHONW ?? "C:\\Users\\Administrator\\AppData\\Local\\Programs\\Python\\Python311\\pythonw.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function managerAlive() {
	try {
		return (await fetch(`${MANAGER_URL}/health`, { signal: AbortSignal.timeout(1500) })).ok;
	} catch {
		return false;
	}
}
function send(res, code, body) {
	const payload = JSON.stringify(body);
	res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
	res.end(payload);
}
async function startManager(res) {
	if (await managerAlive()) {
		send(res, 200, {
			running: true,
			started: false
		});
		return;
	}
	const exe = join(BRAIN_ROOT, "tools", "launcher", "brain_manager.exe");
	const script = join(BRAIN_ROOT, "services", "brain_manager.py");
	if (!existsSync(exe) || !existsSync(script)) {
		send(res, 500, { error: `launcher or script missing (${exe})` });
		return;
	}
	spawn(exe, [PYTHONW, script], {
		detached: true,
		stdio: "ignore",
		windowsHide: true,
		cwd: BRAIN_ROOT
	}).unref();
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
export { apply, name };

//# sourceMappingURL=index.js.map
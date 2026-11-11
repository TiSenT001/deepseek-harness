window.__ModuleLoader__.load({
	id: "dsh-brain-console",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region src/icon.tsx
		function BrainConsoleIcon({ size = 16, title = "TiSenT Brain" }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				role: "img",
				"aria-label": title,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.6,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "4.5",
						r: "2.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m10.2 6.3-3.9 3.9" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "4.5",
						cy: "12",
						r: "2.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M7 12h10" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "19.5",
						cy: "12",
						r: "2.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m13.8 17.7 3.9-3.9" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "19.5",
						r: "2.5"
					})
				]
			});
		}
		//#endregion
		//#region src/api.ts
		/** brain_manager 的 HTTP 地址。 */
		const API = "http://127.0.0.1:19998";
		/** 单元动作的中文名。 */
		const ACTION_LABEL = {
			start: "启动",
			stop: "停止",
			restart: "重启"
		};
		/** 从 `<name>:<action>` 里取出正在执行的动作；不属于该单元则为 null。 */
		function busyActionOf(busy, name) {
			if (busy === null) return null;
			const [unit, action] = busy.split(":");
			if (unit !== name) return null;
			return action === "start" || action === "stop" || action === "restart" ? action : null;
		}
		/** GET 并解析 JSON（失败抛 HTTP 状态）。 */
		async function jget(path) {
			const res = await fetch(`${API}${path}`, { cache: "no-store" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		}
		/** POST 并解析 JSON 应答（清理备份要读回删了哪些、释放多少）。 */
		async function postJson(path, body) {
			const res = await fetch(`${API}${path}`, {
				method: "POST",
				headers: body === void 0 ? void 0 : { "Content-Type": "application/json" },
				body: body === void 0 ? void 0 : JSON.stringify(body)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		}
		/** POST 且不关心响应体（启停/设置类动作）。 */
		async function postManager(path, body) {
			await postJson(path, body);
		}
		/** 备份对话框的回调做成模块级常量：引用稳定，对话框只在挂载时拉一次列表。 */
		const loadBackups = () => jget("/actions/backups");
		const pruneBackups = (keep) => postJson("/actions/prune-backups", { keep });
		/** 清理代码里已不存在的僵尸心跳；返回删除的名字列表。 */
		const pruneZombieHeartbeats = () => postJson("/crons/prune-zombies", {});
		/** 趋势告警阈值。 */
		const loadTrendThresholds = () => jget("/trend/thresholds");
		/** 设置/清除某个指标的告警阈值（value 传 null 表示不画线）。 */
		const saveTrendThreshold = (metric, value) => postJson("/trend/thresholds", {
			metric,
			value
		});
		/** 自愈记录：最近 20 次自动恢复尝试。 */
		const loadAutoRecover = () => jget("/auto-recover");
		/** 从备份快照恢复（停服 → 安全备份 → 覆盖 → 恢复运行）。 */
		const restoreBackup = (name) => postJson("/actions/restore", { name });
		/** 失败边明细：KPI 点开时读一次实时清单。 */
		const loadFailedEdges = () => jget("/quality/failed-edges?limit=80");
		/** 索引与嵌入状态：只读覆盖与新鲜度。 */
		const loadIndexHealth = () => jget("/index/health");
		/** 把一条失败边加入忽略名单（不删边，只从待消解清单隐藏）。 */
		const ignoreFailedEdge = (source, target) => postJson("/quality/failed-edges/ignore", {
			source,
			target
		});
		/** 补嵌/重建任务状态。 */
		const loadEmbedStatus = () => jget("/embed/status");
		/** 启动补嵌/重建任务（vec:fill / vec:rebuild / chunk:fill / chunk:rebuild）。 */
		const startEmbed = (mode) => postJson("/embed/start", { mode });
		/** 请求取消当前任务（当前笔记处理完即停）。 */
		const cancelEmbed = () => postJson("/embed/cancel", {});
		/** 诊断包下载地址（zip：状态 + 单元 + 趋势 + 各单元日志尾部）。 */
		const DIAGNOSTICS_URL = `${API}/diagnostics/bundle`;
		/** 已落盘诊断包的下载地址（自愈记录里点路径即下载）。 */
		const diagnosticsFileUrl = (name) => `${API}/diagnostics/file?name=${encodeURIComponent(name)}`;
		/** 指标趋势：一次取满一年，对话框里再按 7/30/90/365 天切窗口。 */
		const loadHistory = () => jget("/status/history?days=365");
		/** 缓存对话框的回调同样模块级（引用稳定）。 */
		const loadCaches = () => jget("/actions/caches");
		const pruneCaches = (ids) => postJson("/actions/caches/prune", { ids });
		//#endregion
		//#region src/ui/errors.ts
		/**
		* 把未知异常收敛成一句话。
		*
		* 浏览器 fetch 的网络失败只有 TypeError（连接被拒绝/超时），换成中文便于阅读；
		* 其余异常直接用 message。
		*/
		function reasonOf(error) {
			if (error instanceof TypeError) return "连接被拒绝或超时";
			return error instanceof Error ? error.message : String(error);
		}
		//#endregion
		//#region src/hooks/useConsoleActions.ts
		/**
		* 面板的写操作：单元启停、分组批量、随管理器启动、接管、备份。
		*
		* 所有动作都走同一套节奏：置 busy → 请求管理器 → 重新拉 /units（以管理器为准）
		* → 清 busy。失败收敛成一行提示放在 actionError 里。
		*
		* 「停止有在跑依赖者的单元先确认」是页面层的交互决策，不放在这里：
		* 这里只负责真正下发。
		*/
		/**
		* 组装面板写操作。
		* @param params - 单元列表、刷新入口与日志读取
		* @returns busy/error 状态与各动作
		*/
		function useConsoleActions({ units, load, log, readLog }) {
			const [busy, setBusy] = (0, react.useState)(null);
			const [actionError, setActionError] = (0, react.useState)(null);
			return {
				busy,
				actionError,
				setActionError,
				act: (0, react.useCallback)(async (name, action) => {
					setBusy(`${name}:${action}`);
					setActionError(null);
					try {
						await postManager(`/units/${name}/${action}`);
						await load();
						if (log?.name === name) await readLog(name);
					} catch (error) {
						setActionError(`${name} ${ACTION_LABEL[action]}失败：${reasonOf(error)}`);
					} finally {
						setBusy(null);
					}
				}, [
					load,
					log,
					readLog
				]),
				startGroup: (0, react.useCallback)(async (group) => {
					const targets = units.filter((unit) => unit.group === group && !unit.running);
					if (targets.length === 0) return;
					setBusy(`group:${group}`);
					setActionError(null);
					const failures = [];
					try {
						const batch = await postJson("/units/start-batch", { group }).catch((error) => {
							if (error instanceof Error && error.message === "HTTP 404") return null;
							throw error;
						});
						if (batch === null) for (const unit of targets) try {
							await postManager(`/units/${unit.name}/start`);
						} catch (error) {
							failures.push(`${unit.name}：${reasonOf(error)}`);
						}
						else for (const item of batch.failed) failures.push(`${item.name}：${item.error}`);
						await load();
					} catch (error) {
						setActionError(`${group}批量启动失败：${reasonOf(error)}`);
						return;
					} finally {
						setBusy(null);
					}
					if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没启动：${failures.join("；")}`);
				}, [load, units]),
				stopGroupNow: (0, react.useCallback)(async (group, names) => {
					setBusy(`stop-group:${group}`);
					setActionError(null);
					const failures = [];
					try {
						const batch = await postJson("/units/stop-batch", { group }).catch((error) => {
							if (error instanceof Error && error.message === "HTTP 404") return null;
							throw error;
						});
						if (batch === null) for (const name of names) try {
							await postManager(`/units/${name}/stop`);
						} catch (error) {
							failures.push(`${name}：${reasonOf(error)}`);
						}
						else for (const item of batch.failed) failures.push(`${item.name}：${item.error}`);
						await load();
					} catch (error) {
						setActionError(`${group}批量停止失败：${reasonOf(error)}`);
						return;
					} finally {
						setBusy(null);
					}
					if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没停下来：${failures.join("；")}`);
				}, [load]),
				restartGroupNow: (0, react.useCallback)(async (group, names) => {
					setBusy(`restart-group:${group}`);
					setActionError(null);
					const failures = [];
					try {
						const batch = await postJson("/units/restart-batch", { group }).catch((error) => {
							if (error instanceof Error && error.message === "HTTP 404") return null;
							throw error;
						});
						if (batch === null) for (const name of names) try {
							await postManager(`/units/${name}/restart`);
						} catch (error) {
							failures.push(`${name}：${reasonOf(error)}`);
						}
						else for (const item of batch.failed) failures.push(`${item.name}：${item.error}`);
						await load();
						if (log !== null && names.includes(log.name)) await readLog(log.name, true);
					} catch (error) {
						setActionError(`${group}批量重启失败：${reasonOf(error)}`);
						return;
					} finally {
						setBusy(null);
					}
					if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没重启：${failures.join("；")}`);
				}, [
					load,
					log,
					readLog
				]),
				setUnitEnabled: (0, react.useCallback)(async (name, enabled) => {
					setBusy(`${name}:enabled`);
					setActionError(null);
					try {
						await postManager(`/units/${name}/enabled`, { enabled });
						await load();
					} catch (error) {
						setActionError(`${name} 设置失败：${reasonOf(error)}`);
					} finally {
						setBusy(null);
					}
				}, [load]),
				adoptUnit: (0, react.useCallback)(async (name) => {
					setBusy(`${name}:adopt`);
					setActionError(null);
					try {
						await postManager(`/units/${name}/adopt`);
						await load();
					} catch (error) {
						setActionError(`${name} 接管失败：${reasonOf(error)}`);
					} finally {
						setBusy(null);
					}
				}, [load]),
				backup: (0, react.useCallback)(async () => {
					setBusy("backup");
					setActionError(null);
					try {
						await postManager("/actions/backup");
						await load();
					} catch (error) {
						setActionError(`备份失败：${reasonOf(error)}`);
					} finally {
						setBusy(null);
					}
				}, [load])
			};
		}
		//#endregion
		//#region src/ui/format.ts
		/**
		* 展示层格式化：计数、容量的千分位与单位、时刻、相对时间、运行时长。
		*
		* 这里只做格式化，不参与状态判断 —— 单元是否运行一律以 `/units` 的 `state` 为准。
		*/
		/**
		* 千分位计数。
		* @param value - 计数；null 表示管理器没给值
		* @returns 形如 `54,081`；null 返回破折号
		*/
		function formatCount(value) {
			return value === null ? "—" : value.toLocaleString("zh-CN");
		}
		/**
		* 容量：不足 1 MB 用 KB，不足 1024 MB 用 MB，否则换成 GB 并保留一位小数。
		* @param value - 兆字节数；null 表示未知
		* @returns 形如 `512 KB` / `605 MB` / `1.4 GB`；null 返回破折号
		*/
		function formatMegabytes(value) {
			if (value === null) return "—";
			if (value < 1) return `${Math.round(value * 1024)} KB`;
			if (value < 1024) return `${Math.round(value)} MB`;
			return `${(value / 1024).toFixed(1)} GB`;
		}
		/**
		* 解析管理器给的本地时间文本（无时区后缀），按浏览器本地时区理解。
		* @param text - 形如 `2026-11-07 17:00:30`
		* @returns Date；缺失或不可解析返回 null
		*/
		function parseLocalTime(text) {
			if (text === null) return null;
			const parsed = new Date(text.replace(" ", "T"));
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}
		/**
		* 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前。
		* @param text - 管理器给的本地时间文本
		* @param now - 当前毫秒时间戳
		* @returns 相对描述；缺失或不可解析返回破折号
		*/
		function formatRelative(text, now) {
			const at = parseLocalTime(text);
			if (at === null) return "—";
			const seconds = Math.max(0, Math.round((now - at.getTime()) / 1e3));
			if (seconds < 60) return "刚刚";
			const minutes = Math.round(seconds / 60);
			if (minutes < 60) return `${minutes} 分钟前`;
			const hours = Math.round(minutes / 60);
			if (hours < 24) return `${hours} 小时前`;
			return `${Math.round(hours / 24)} 天前`;
		}
		/**
		* 运行时长，用于运行中单元的元信息行。
		* @param startedAt - 启动时间文本；未运行为 null
		* @param now - 当前毫秒时间戳
		* @returns 形如 `2 小时 31 分`；缺失或不可解析返回 null
		*/
		function formatUptime(startedAt, now) {
			const at = parseLocalTime(startedAt);
			if (at === null) return null;
			const minutes = Math.floor((now - at.getTime()) / 6e4);
			if (minutes < 1) return "不到 1 分钟";
			if (minutes < 60) return `${minutes} 分钟`;
			const hours = Math.floor(minutes / 60);
			const rest = minutes % 60;
			if (hours < 24) return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分`;
			return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
		}
		/**
		* 短时刻：省略年份，用于指标卡副标题这类窄位置。
		* @param text - 形如 `2026-11-07 17:01`
		* @returns 形如 `11-07 17:01`；缺失或不可解析返回破折号
		*/
		function formatShortMoment(text) {
			if (text === null) return "—";
			const match = /^\d{4}-(\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(text);
			return match === null ? text : `${match[1]} ${match[2]}`;
		}
		/**
		* 24 小时制时钟文本。
		* @param now - 当前毫秒时间戳
		* @returns 形如 `19:32:05`
		*/
		function formatClock(now) {
			const date = new Date(now);
			const pad = (value) => String(value).padStart(2, "0");
			return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
		}
		//#endregion
		//#region src/hooks/useConsoleFeed.ts
		/**
		* 面板数据源：轮询管理器（单元列表 / 概览 / 开机启动状态）。
		*
		* 5 秒一次；手动刷新时额外触发一次外部回调（趋势历史也顺手刷新）。
		* 连接失败只记录错误、保留上一份数据，避免面板闪成空白。
		*/
		/** 自动刷新间隔（毫秒）。 */
		const POLL_MS = 5e3;
		/**
		* 轮询管理器状态。
		* @param onManualRefresh - 手动刷新时的额外回调（例如刷新趋势历史）
		* @returns 单元列表、概览与刷新入口
		*/
		function useConsoleFeed(onManualRefresh) {
			const [units, setUnits] = (0, react.useState)([]);
			const [overview, setOverview] = (0, react.useState)(null);
			const [autostart, setAutostart] = (0, react.useState)(null);
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [connectionError, setConnectionError] = (0, react.useState)(null);
			const [updatedAt, setUpdatedAt] = (0, react.useState)(null);
			const manualRefresh = (0, react.useRef)(onManualRefresh);
			manualRefresh.current = onManualRefresh;
			const load = (0, react.useCallback)(async (manual = false) => {
				if (manual) setRefreshing(true);
				try {
					const [unitsAnswer, status, boot] = await Promise.all([
						jget("/units"),
						jget("/status"),
						jget("/autostart").catch(() => null)
					]);
					setUnits(unitsAnswer.units);
					setOverview(status);
					setAutostart(boot);
					setConnectionError(null);
					setUpdatedAt(formatClock(Date.now()));
					if (manual) manualRefresh.current?.();
				} catch (error) {
					setConnectionError(reasonOf(error));
				} finally {
					setLoaded(true);
					if (manual) setRefreshing(false);
				}
			}, []);
			(0, react.useEffect)(() => {
				load();
				const timer = setInterval(() => void load(), POLL_MS);
				return () => clearInterval(timer);
			}, [load]);
			return {
				units,
				overview,
				autostart,
				loaded,
				refreshing,
				connectionError,
				updatedAt,
				load
			};
		}
		//#endregion
		//#region src/hooks/useHistory.ts
		/**
		* 趋势历史：一次取满一年，对话框里再按 7/30/90/365 天切窗口。
		*
		* 采样一天四次（6 小时一行），不需要跟着 5 秒轮询走；挂载时和手动刷新时各拉一次。
		*/
		/**
		* 指标历史数据源。
		* @returns 历史序列与刷新入口
		*/
		function useHistory() {
			const [history, setHistory] = (0, react.useState)(null);
			return {
				history,
				refreshHistory: (0, react.useCallback)(async () => {
					try {
						setHistory(await loadHistory());
					} catch {}
				}, [])
			};
		}
		//#endregion
		//#region src/hooks/useLogDock.ts
		/**
		* 日志控制台状态：打开/关闭、4 秒静默刷新、暂停、行数切换、清空。
		*
		* 刷新只更新「还开着的那个单元」——轮询回来时面板可能已经关了或换了单元。
		*/
		/** 日志一次读取的行数档位（点「N 行」循环）。 */
		const LOG_LINE_OPTIONS = [
			120,
			300,
			1e3
		];
		/** 日志面板打开时的静默刷新间隔（毫秒）。 */
		const LOG_POLL_MS = 4e3;
		/**
		* 日志控制台状态机。
		* @returns 当前日志、刷新/暂停/行数/清空入口
		*/
		function useLogDock() {
			const [log, setLog] = (0, react.useState)(null);
			const [lines, setLines] = (0, react.useState)(LOG_LINE_OPTIONS[0]);
			const [paused, setPaused] = (0, react.useState)(false);
			const [clearing, setClearing] = (0, react.useState)(false);
			const readLog = (0, react.useCallback)(async (name, silent = false, readLines = lines) => {
				if (!silent) setLog((previous) => previous?.name === name ? {
					...previous,
					loading: true
				} : {
					name,
					text: "",
					at: "",
					loading: true
				});
				try {
					const answer = await jget(`/units/${name}/log?lines=${readLines}`);
					setLog((previous) => previous !== null && previous.name === name ? {
						name,
						text: answer.log || "（暂无日志）",
						at: formatClock(Date.now()),
						loading: false
					} : previous);
				} catch (error) {
					if (silent) return;
					setLog((previous) => previous !== null && previous.name === name ? {
						name,
						text: `读取失败：${reasonOf(error)}`,
						at: formatClock(Date.now()),
						loading: false
					} : previous);
				}
			}, [lines]);
			const logName = log?.name ?? null;
			(0, react.useEffect)(() => {
				if (logName === null || paused) return;
				const timer = setInterval(() => {
					readLog(logName, true);
				}, LOG_POLL_MS);
				return () => clearInterval(timer);
			}, [
				logName,
				paused,
				readLog
			]);
			const toggleLog = (0, react.useCallback)((name) => {
				if (log !== null && log.name === name) {
					setLog(null);
					return;
				}
				setPaused(false);
				readLog(name);
			}, [log, readLog]);
			const cycleLines = () => {
				const next = LOG_LINE_OPTIONS[(LOG_LINE_OPTIONS.indexOf(lines) + 1) % LOG_LINE_OPTIONS.length] ?? LOG_LINE_OPTIONS[0];
				setLines(next);
				if (log !== null) readLog(log.name, true, next);
			};
			const closeLog = () => setLog(null);
			return {
				log,
				logName,
				lines,
				paused,
				clearing,
				readLog,
				toggleLog,
				cycleLines,
				setPaused,
				closeLog,
				clearLogNow: (0, react.useCallback)(async () => {
					if (log === null) return;
					setClearing(true);
					try {
						await postManager(`/units/${log.name}/truncate-log`);
						await readLog(log.name, true);
					} finally {
						setClearing(false);
					}
				}, [log, readLog])
			};
		}
		//#endregion
		//#region src/ui/primitives.ts
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		/** 宿主的按钮原子。 */
		const Button = primitives.Button;
		/** 宿主的锚定菜单：分组线、勾选态、键盘走位与关闭都由它负责。 */
		const Menu = primitives.Menu;
		/** 宿主的模态框原子：遮罩、Esc、焦点归还都由它负责。 */
		const Modal = primitives.Modal;
		/** 宿主的状态灯原子。 */
		const StateDot = primitives.StateDot;
		/** 宿主的悬停提示。 */
		const Tooltip = primitives.Tooltip;
		/** 列表图标：查看日志。 */
		const IconList = primitives.IconFlatListOutlineRegular;
		/** 刷新图标：刷新状态、重启单元。 */
		const IconRefresh = primitives.IconRefreshOutlineRegular;
		/** 方块图标：停止单元。 */
		const IconStop = primitives.IconStopFillRegular;
		/** 三角图标：启动单元。 */
		const IconPlay = primitives.IconPlayOutlineRegular;
		/** 下箭头图标：收起面板。 */
		const IconChevronDown = primitives.IconChevronDownOutlineRegular;
		/** 省略号图标：收纳更多操作的菜单入口。 */
		const IconEllipsis = primitives.IconEllipsisOutlineRegular;
		/** 盾牌图标：受保护、不可清理。 */
		const IconShield = primitives.IconShieldOutlineRegular;
		/** 复制图标：复制当前看得到的日志。 */
		const IconCopy = primitives.IconCopyOutlineRegular;
		/** 对勾图标：复制成功的瞬时反馈。 */
		const IconCheck = primitives.IconCheckOutlineRegular;
		/** 暂停图标：日志面板停止自动刷新。 */
		const IconPause = primitives.IconPauseOutlineRegular;
		/** 垃圾桶图标：清空日志。 */
		const IconTrash = primitives.IconTrashOutlineRegular;
		//#endregion
		//#region src/ui/Dialog.tsx
		/**
		* 渲染一个限高、内容可滚动的对话框。
		* @param props - 与共享 Modal 相同的字段
		* @returns 对话框元素
		*/
		function Dialog({ children, ...rest }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
				...rest,
				className: "bc-dialog-capped",
				contentClassName: "bc-dialog-content",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-dialog-scroll",
					children
				})
			});
		}
		//#endregion
		//#region src/ui/BackupDialog.tsx
		/**
		* 备份清理对话框：**先列出、再确认**，不做静默删除。
		*
		* 清理是不可逆操作，所以这里刻意多一步：
		*   1) 打开即拉 `/actions/backups`，把每个快照标成「保留 / 将删除」；
		*   2) 保留数可调，但下限是 1 —— 永远留一个回滚点；
		*   3) 只有点确认才调用 `/actions/prune-backups`，删完重新列一遍并显示释放了多少。
		*
		* 删除永远由管理器执行（它才是唯一执行器），本组件只下发 keep 值。
		*/
		/** 默认保留数，与管理器 `prune_backups` 的默认值一致。 */
		const DEFAULT_KEEP = 2;
		/**
		* 渲染备份清理对话框。
		* @param props - 读写回调与关闭命令
		* @returns 对话框元素（挂载即打开，由父组件条件渲染）
		*/
		function BackupDialog({ load, prune, restore, onChanged, onClose }) {
			const [listing, setListing] = (0, react.useState)(null);
			const [keep, setKeep] = (0, react.useState)(DEFAULT_KEEP);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [result, setResult] = (0, react.useState)(null);
			const [armed, setArmed] = (0, react.useState)(null);
			const [restoring, setRestoring] = (0, react.useState)(null);
			const [restoreNote, setRestoreNote] = (0, react.useState)(null);
			/** 重新拉列表；保留数收进 [1, 快照数] 区间，避免列表变短后停在上一次的大值。 */
			const refresh = (0, react.useCallback)(async () => {
				try {
					const answer = await load();
					setListing(answer);
					setKeep((current) => Math.min(Math.max(1, current), Math.max(1, answer.files.length)));
					setError(null);
				} catch (e) {
					setError(reasonOf(e));
				}
			}, [load]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			const files = listing?.files ?? [];
			const totalMb = listing?.total_mb ?? 0;
			const doomed = files.slice(keep);
			const keptMb = files.slice(0, keep).reduce((sum, file) => sum + file.size_mb, 0);
			const doomedMb = files.slice(keep).reduce((sum, file) => sum + file.size_mb, 0);
			const canPrune = !busy && doomed.length > 0;
			const confirm = async () => {
				setBusy(true);
				setError(null);
				setResult(null);
				try {
					const answer = await prune(keep);
					if (!answer.ok) {
						setError(answer.error ?? "清理失败");
						return;
					}
					setResult(answer);
					onChanged();
					await refresh();
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setBusy(false);
				}
			};
			const runRestore = async (name) => {
				setRestoring(name);
				setError(null);
				setRestoreNote(null);
				try {
					const answer = await restore(name);
					if (!answer.ok) {
						setError(answer.error ?? "恢复失败");
						return;
					}
					const failed = answer.failed ?? [];
					setRestoreNote(`已用 ${answer.restored} 恢复；当前库已备份为 ${answer.safety}` + (failed.length > 0 ? `；未能重启：${failed.join("、")}` : ""));
					onChanged();
					await refresh();
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setRestoring(null);
					setArmed(null);
				}
			};
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				disabled: busy,
				onClick: onClose,
				children: "取消"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "primary",
				disabled: !canPrune,
				onClick: () => void confirm(),
				children: busy ? "清理中…" : doomed.length === 0 ? "没有可删的" : `删除 ${doomed.length} 个 · 释放 ${formatMegabytes(doomedMb)}`
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose: busy ? () => {} : onClose,
				title: "清理备份",
				closeLabel: "关闭",
				description: listing === null ? "读取快照列表…" : `${files.length} 个快照 · 共 ${formatMegabytes(totalMb)} · 保留 ${keep} 个后剩 ${formatMegabytes(keptMb)}`,
				footer,
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-error",
						children: error
					}),
					listing === null && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "读取中…"
					}),
					listing !== null && files.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "还没有快照——点标题行的「立即备份」生成第一个。"
					}),
					files.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-backup-keep",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "保留最近" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-stepper",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-stepper-btn",
										"aria-label": "少保留一个",
										disabled: busy || keep <= 1,
										onClick: () => setKeep((current) => Math.max(1, current - 1)),
										children: "−"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-stepper-value",
										"aria-live": "polite",
										children: keep
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-stepper-btn",
										"aria-label": "多保留一个",
										disabled: busy || keep >= files.length,
										onClick: () => setKeep((current) => Math.min(files.length, current + 1)),
										children: "+"
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "个（至少 1 个，保住回滚点）" })
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "bc-backup-list",
						children: files.map((file, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "bc-backup-row",
							"data-doomed": index >= keep || void 0,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-backup-main",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-backup-name",
										title: file.name,
										children: file.name
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-backup-tag",
										children: index < keep ? "保留" : "将删除"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-backup-sub",
									children: [
										file.at,
										" · ",
										formatMegabytes(file.size_mb)
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "bc-backup-actions",
									children: armed === file.name ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-backup-restore bc-backup-restore-danger",
										disabled: restoring !== null || busy,
										onClick: () => void runRestore(file.name),
										children: restoring === file.name ? "恢复中…" : "确认覆盖（先备份当前库）"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-backup-cancel",
										disabled: restoring !== null,
										onClick: () => setArmed(null),
										children: "取消"
									})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-backup-restore",
										disabled: restoring !== null || busy,
										title: "停止所有服务，用此快照覆盖 brain.db（当前库会先另存）",
										onClick: () => setArmed(file.name),
										children: "恢复…"
									})
								})
							]
						}, file.name))
					})] }),
					restoreNote !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-done",
						role: "status",
						children: restoreNote
					}),
					result !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-done",
						role: "status",
						children: result.removed.length === 0 ? "没有删除任何文件（已经只剩保留数）" : `已删除 ${result.removed.length} 个快照，释放 ${formatMegabytes(result.freed_mb)}`
					})
				]
			});
		}
		//#endregion
		//#region src/ui/CacheDialog.tsx
		/**
		* 缓存清理对话框：只清**大脑自己的**缓存，先列出、再勾选、最后确认。
		*
		* 范围边界：Python 字节码 / ruff / 临时文件 / 图谱与联网缓存。
		* 外部工具的缓存（HF 下载、Codex 运行时、DSH 临时目录）归各自工具所有，这里不碰。
		*
		* 三条安全规则：
		*   1) 受保护条目（图像向量库等）展示但不可选——让人看到「为什么不能删」；
		*   2) 「需确认」条目默认不勾（可疑孤儿、大件）；
		*   3) 只有点确认才下发，删完重新统计并显示释放多少。
		*/
		/** 风险标签的文案。 */
		const RISK_LABEL = {
			safe: "可删",
			confirm: "需确认",
			protected: "受保护"
		};
		/**
		* 渲染缓存清理对话框。
		* @param props - 读写回调与关闭命令
		* @returns 对话框元素（挂载即打开）
		*/
		function CacheDialog({ load, prune, onClose }) {
			const [listing, setListing] = (0, react.useState)(null);
			const [selected, setSelected] = (0, react.useState)({});
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [result, setResult] = (0, react.useState)(null);
			const refresh = (0, react.useCallback)(async () => {
				try {
					const answer = await load();
					setListing(answer);
					const defaults = {};
					for (const item of answer.items) if (item.default_on && !item.protected && item.available) defaults[item.id] = true;
					setSelected(defaults);
					setError(null);
				} catch (e) {
					setError(reasonOf(e));
				}
			}, [load]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			const items = listing?.items ?? [];
			const selectable = items.filter((item) => !item.protected && item.available);
			const protectedItems = items.filter((item) => item.protected);
			const chosen = selectable.filter((item) => selected[item.id] === true);
			const chosenMb = chosen.reduce((sum, item) => sum + item.size_mb, 0);
			const canPrune = !busy && chosen.length > 0;
			const toggle = (id) => {
				setSelected((current) => ({
					...current,
					[id]: current[id] !== true
				}));
			};
			const confirm = async () => {
				setBusy(true);
				setError(null);
				setResult(null);
				try {
					const answer = await prune(chosen.map((item) => item.id));
					if (!answer.ok) {
						setError(answer.error ?? "清理失败");
						return;
					}
					setResult(answer);
					await refresh();
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setBusy(false);
				}
			};
			const failed = result === null ? [] : result.items.flatMap((entry) => entry.failed.map((reason) => `${entry.label}：${reason}`));
			const notice = error ?? listing?.error ?? null;
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				disabled: busy,
				onClick: onClose,
				children: "取消"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "primary",
				disabled: !canPrune,
				onClick: () => void confirm(),
				children: busy ? "清理中…" : chosen.length === 0 ? "未选择" : `清理 ${chosen.length} 项 · 释放 ${formatMegabytes(chosenMb)}`
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose: busy ? () => {} : onClose,
				title: "清理缓存",
				closeLabel: "关闭",
				description: listing === null ? "统计中…" : `大脑自己的缓存 · 共 ${formatMegabytes(listing.total_mb)}，其中可清 ${formatMegabytes(listing.reclaimable_mb)}`,
				footer,
				children: [
					notice !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-error",
						children: notice
					}),
					listing === null && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "统计中…"
					}),
					selectable.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "bc-cache-list",
						children: selectable.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "bc-cache-row",
							"data-risk": item.risk,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "bc-cache-main",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "bc-cache-check",
										checked: selected[item.id] === true,
										disabled: busy,
										onChange: () => toggle(item.id)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-label",
										children: item.label
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-size",
										children: formatMegabytes(item.size_mb)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-tag",
										children: RISK_LABEL[item.risk]
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "bc-cache-note",
								children: item.note
							})]
						}, item.id))
					}),
					selectable.length === 0 && listing !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "没有可清理的缓存"
					}),
					protectedItems.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-cache-section",
						children: "受保护（不是缓存或在用，不可清理）"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "bc-cache-list",
						children: protectedItems.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "bc-cache-row",
							"data-risk": "protected",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-cache-main",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-lock",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconShield, { size: 14 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-label",
										children: item.label
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-size",
										children: formatMegabytes(item.size_mb)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-cache-tag",
										children: RISK_LABEL.protected
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "bc-cache-note",
								children: item.note
							})]
						}, item.id))
					})] }),
					listing !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-cache-dir",
						children: ["统一位置：", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: listing.cache_dir })]
					}),
					result !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-backup-done",
						role: "status",
						children: [result.items.length === 0 ? "没有清理任何条目" : `已清理 ${result.items.length} 项，释放 ${formatMegabytes(result.freed_mb)}`, failed.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-cache-failed",
							children: [
								"（",
								failed.length,
								" 项失败：",
								failed.slice(0, 2).join("；"),
								"）"
							]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/ui/ConfirmDialog.tsx
		/**
		* 通用确认框：不可撤销的动作（清空日志等）先讲清后果再执行。
		*/
		/**
		* 渲染确认框。
		* @param props - 文案与回调
		* @returns 对话框元素（挂载即打开）
		*/
		function ConfirmDialog({ title, description, note, confirmLabel, busyLabel = "处理中…", busy, onCancel, onConfirm }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Dialog, {
				open: true,
				onClose: busy ? () => {} : onCancel,
				title,
				closeLabel: "关闭",
				description,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					disabled: busy,
					onClick: onCancel,
					children: "取消"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "primary",
					disabled: busy,
					onClick: onConfirm,
					children: busy ? busyLabel : confirmLabel
				})] }),
				children: note !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-stop-note",
					children: note
				})
			});
		}
		//#endregion
		//#region src/ui/FailedEdgesDialog.tsx
		/**
		* 失败边明细：指标带里「失败边」数字点开后的只读清单。
		*
		* 数据来自管理器 `/quality/failed-edges`（读 brain.db 的 neural_edges.failure_count）。
		* 只读——降权/清理策略由 edge_reinforcer 与指标快照的阈值机制负责，面板不在这里改库。
		*/
		/** 把 `note:目录/文件.md` 压成文件名，长路径靠 title 查看。 */
		function shortName(id) {
			const withoutScheme = id.startsWith("note:") ? id.slice(5) : id;
			const parts = withoutScheme.split("/");
			return parts[parts.length - 1] ?? withoutScheme;
		}
		/**
		* 渲染失败边明细。
		* @param props - 读取回调与关闭命令
		* @returns 对话框元素（挂载即打开并读取）
		*/
		function FailedEdgesDialog({ load, onClose }) {
			const [listing, setListing] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const [ignoring, setIgnoring] = (0, react.useState)(null);
			const reload = async () => {
				try {
					setListing(await load());
				} catch (e) {
					setError(reasonOf(e));
				}
			};
			const ignoreOne = async (source, target) => {
				setIgnoring(`${source}\n${target}`);
				try {
					await ignoreFailedEdge(source, target);
					await reload();
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setIgnoring(null);
				}
			};
			(0, react.useEffect)(() => {
				(async () => {
					try {
						setListing(await load());
					} catch (e) {
						setError(reasonOf(e));
					}
				})();
			}, [load]);
			const copyList = async () => {
				if (listing === null || listing.edges.length === 0) return;
				const header = "source	target	failures	weight	confidence	origin	last_seen";
				const rows = listing.edges.map((edge) => [
					edge.source,
					edge.target,
					String(edge.failures),
					String(edge.weight),
					String(edge.confidence),
					edge.origin ?? "",
					edge.last_seen ?? ""
				].join("	"));
				try {
					await navigator.clipboard.writeText([header, ...rows].join("\n"));
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				} catch {}
			};
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [listing !== null && listing.edges.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => void copyList(),
				children: copied ? "已复制" : `复制清单（${listing.edges.length} 条）`
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onClose,
				children: "关闭"
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose,
				title: "失败边",
				closeLabel: "关闭",
				description: listing === null ? "读取中…" : `failure_count > 0 的边 · 实时 ${listing.total ?? "—"} 条`,
				footer,
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-error",
						children: error
					}),
					listing === null && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "读取中…"
					}),
					listing !== null && listing.edges.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "没有失败边"
					}),
					listing !== null && listing.edges.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "bc-failed-list",
						children: listing.edges.map((edge) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "bc-failed-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-failed-main",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "bc-failed-name",
										title: `${edge.source}\n→ ${edge.target}`,
										children: [
											shortName(edge.source),
											" → ",
											shortName(edge.target)
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "bc-failed-count",
										children: ["失败 ", edge.failures]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bc-failed-ignore",
										disabled: ignoring !== null,
										title: "加入忽略名单：不删除边，只从待消解清单隐藏",
										onClick: () => void ignoreOne(edge.source, edge.target),
										children: ignoring === `${edge.source}\n${edge.target}` ? "处理中…" : "忽略"
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-failed-sub",
								children: [
									edge.origin ?? "未知来源",
									" · 权重 ",
									edge.weight.toFixed(3),
									" · ",
									"置信 ",
									edge.confidence.toFixed(2),
									" · ",
									edge.last_seen ?? "—"
								]
							})]
						}, `${edge.source}→${edge.target}`))
					}),
					listing !== null && listing.total !== null && listing.edges.length < listing.total && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-failed-more",
						children: [
							"只显示前 ",
							listing.edges.length,
							" 条，共 ",
							listing.total,
							" 条"
						]
					})
				]
			});
		}
		//#endregion
		//#region src/ui/AutoRecoverDialog.tsx
		/**
		* 自动恢复记录：崩溃自愈线程最近 20 次尝试的时间线。
		*
		* 数据来自管理器 `/auto-recover`（自愈线程每 20 秒巡视一次）；只读展示，
		* 不做任何操作。每条记录带单元名、尝试序号、结果、退出码与诊断包路径。
		*/
		/** 秒级时间戳 → 本地可读时间。 */
		function when(at) {
			const stamp = /* @__PURE__ */ new Date(at * 1e3);
			if (Number.isNaN(stamp.getTime())) return "—";
			return stamp.toLocaleString("zh-CN", { hour12: false });
		}
		/**
		* 渲染自愈记录对话框。
		* @param props - 关闭回调
		* @returns 对话框元素（挂载即拉一次，可手动刷新）
		*/
		function AutoRecoverDialog({ onClose }) {
			const [status, setStatus] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const load = async () => {
				try {
					setStatus(await loadAutoRecover());
					setError(null);
				} catch (e) {
					setError(reasonOf(e));
				}
			};
			(0, react.useEffect)(() => {
				load();
			}, []);
			const events = [...status?.events ?? []].reverse();
			const counters = Object.entries(status?.counters ?? {}).filter(([, n]) => n > 0);
			const summary = counters.length === 0 ? "还没有发生过自动恢复" : counters.map(([unit, n]) => `${unit} × ${n}`).join(" · ");
			const copyBundles = async () => {
				const paths = events.map((event) => event.bundle).filter((path) => Boolean(path));
				if (paths.length === 0) return;
				try {
					await navigator.clipboard.writeText(paths.join("\n"));
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				} catch {}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose,
				title: "自动恢复记录",
				closeLabel: "关闭",
				description: `每小时最多 ${status?.max_per_hour ?? 3} 次 · 退避 ${(status?.backoff_s ?? [
					30,
					120,
					600
				]).join(" / ")} 秒`,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					events.some((event) => event.bundle) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => void copyBundles(),
						children: copied ? "已复制" : "复制诊断包路径"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => void load(),
						children: "刷新"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onClose,
						children: "关闭"
					})
				] }),
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-error",
						children: error
					}),
					status === null && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "读取中…"
					}),
					status !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-auto",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "bc-auto-summary",
								children: summary
							}),
							events.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "bc-backup-empty",
								children: "没有恢复记录——进程都在正常运行。"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: "bc-auto-list",
								children: events.map((event, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: "bc-auto-row",
									"data-ok": event.ok ? "true" : "false",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "bc-auto-main",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-auto-dot",
													"aria-hidden": "true"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-auto-unit",
													children: event.unit
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "bc-auto-attempt",
													children: [
														"第 ",
														event.attempt,
														" 次"
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-auto-ok",
													children: event.ok ? "已重启" : "重启失败"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-auto-time",
													children: when(event.at)
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "bc-auto-sub",
											children: [
												"退出码 ",
												event.exit_code ?? "—",
												event.error !== null && event.error !== void 0 ? ` · ${event.error}` : ""
											]
										}),
										event.bundle !== null && event.bundle !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "bc-auto-bundle",
											title: event.bundle,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
												className: "bc-auto-bundle-link",
												href: diagnosticsFileUrl(event.bundle.split(/[\\/]/).pop() ?? event.bundle),
												download: true,
												children: event.bundle
											})
										})
									]
								}, `${event.unit}-${event.at}-${index}`))
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/ui/IndexHealthDialog.tsx
		/**
		* 索引与嵌入状态：回答「知识真的进脑子了吗」，并提供补嵌 / 重建入口。
		*
		* 只读部分展示三条链路的最新覆盖；动作部分触发管理器里的后台任务，
		* 运行期间每秒轮询一次进度（完成数 / 总数 / 当前笔记 / 失败 / ETA）。
		*/
		/** 把可能为空的数值格式化成「—」。 */
		function num(value, suffix = "") {
			return value === null || value === void 0 ? "—" : `${value}${suffix}`;
		}
		/** 覆盖率进度条（0–100）。 */
		function Coverage({ percent }) {
			const width = percent === null ? 0 : Math.max(0, Math.min(100, percent));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "bc-coverage",
				role: "img",
				"aria-label": `覆盖 ${percent === null ? "未知" : width.toFixed(1) + "%"}`,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-coverage-fill",
					style: { width: `${width}%` }
				})
			});
		}
		/** 运行中的任务：进度条 + 计数 + 当前笔记 + 取消。 */
		function JobProgress({ job, onCancel }) {
			const percent = job.total > 0 ? Math.min(100, job.done / job.total * 100) : 0;
			const summary = job.state === "running" ? `${job.done} / ${job.total} 篇 · 失败 ${job.failed} · 已用 ${job.elapsed_s ?? 0}s${job.eta_s === null ? "" : ` · 预计剩余 ${job.eta_s}s`}` : job.state === "done" ? `完成：${job.done} / ${job.total} 篇，失败 ${job.failed}` : job.state === "cancelled" ? `已取消：处理到 ${job.done} / ${job.total} 篇` : `出错：${job.error ?? "未知原因"}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "bc-embed-job",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-embed-job-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: job.label ?? job.mode }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: summary }),
							job.state === "running" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: onCancel,
								children: "取消"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Coverage, { percent }),
					job.current !== null && job.state === "running" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-embed-current",
						title: job.current,
						children: ["当前：", job.current]
					}),
					job.failures.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: "bc-embed-failures",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
							"失败 ",
							job.failed,
							" 篇（点开看前 ",
							job.failures.length,
							" 条）"
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: job.failures.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: item.path }),
							" — ",
							item.reason
						] }, item.path)) })]
					})
				]
			});
		}
		/**
		* 渲染索引与嵌入状态对话框。
		* @param props - 关闭回调
		* @returns 对话框元素（挂载即拉一次状态，运行中每秒刷新）
		*/
		function IndexHealthDialog({ onClose }) {
			const [health, setHealth] = (0, react.useState)(null);
			const [job, setJob] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [armedPrune, setArmedPrune] = (0, react.useState)(false);
			const timer = (0, react.useRef)(null);
			const load = async () => {
				try {
					setHealth(await loadIndexHealth());
					setError(null);
				} catch (e) {
					setError(reasonOf(e));
				}
			};
			const poll = () => {
				if (timer.current !== null) return;
				timer.current = window.setInterval(() => {
					(async () => {
						try {
							const status = await loadEmbedStatus();
							setJob(status);
							if (status.state !== "running") {
								if (timer.current !== null) {
									window.clearInterval(timer.current);
									timer.current = null;
								}
								await load();
							}
						} catch (e) {
							setError(reasonOf(e));
						}
					})();
				}, 1e3);
			};
			(0, react.useEffect)(() => {
				(async () => {
					await load();
					try {
						const status = await loadEmbedStatus();
						setJob(status);
						if (status.state === "running") poll();
					} catch {}
				})();
				return () => {
					if (timer.current !== null) window.clearInterval(timer.current);
				};
			}, []);
			const run = async (mode) => {
				setBusy(true);
				try {
					const result = await startEmbed(mode);
					if (result.status) setJob(result.status);
					if (result.ok) poll();
					else setError(result.error ?? "任务未启动");
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setBusy(false);
				}
			};
			const pruneZombies = async () => {
				setBusy(true);
				try {
					await pruneZombieHeartbeats();
					setArmedPrune(false);
					await load();
				} catch (e) {
					setError(reasonOf(e));
				} finally {
					setBusy(false);
				}
			};
			const cancel = async () => {
				try {
					await cancelEmbed();
				} catch (e) {
					setError(reasonOf(e));
				}
			};
			const percent = health !== null && health.notes !== null && health.notes > 0 && health.vec.total !== null ? Math.min(100, health.vec.total / health.notes * 100) : null;
			const stale = health?.chunks.stale_days;
			const running = job?.state === "running";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose,
				title: "索引与嵌入",
				closeLabel: "关闭",
				description: "只读状态 + 手动补嵌；任务在管理器后台跑，关掉面板也会继续",
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => void load(),
					children: "刷新"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onClose,
					children: "关闭"
				})] }),
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-error",
						children: error
					}),
					health === null && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-backup-empty",
						children: "读取中…"
					}),
					health !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-index-health",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								open: true,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h4", { children: ["笔记向量 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-index-note",
										children: "vec_cache"
									})] }) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "已向量 / 总笔记" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
											num(health.vec.total),
											" / ",
											num(health.notes)
										] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Coverage, { percent }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "缺少向量" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", {
											className: health.vec.missing ? "bc-index-warn" : "",
											children: [
												num(health.vec.missing),
												" 篇",
												(health.vec.missing_sample ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "bc-index-sample",
													title: (health.vec.missing_sample ?? []).join("\n"),
													children: [
														"（如 ",
														health.vec.missing_sample[0],
														"）"
													]
												})
											]
										})]
									}),
									(health.vec.empty ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "空笔记（0 字节，不需向量）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [num(health.vec.empty), " 篇"] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "最近 24h 更新" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [num(health.vec.fresh_24h), " 篇"] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "最后写入" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: health.vec.last_indexed_at ?? "—" })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "孤儿向量（笔记已删）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: num(health.vec.orphans) })]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								open: true,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h4", { children: ["分块索引 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-index-note",
										children: "chunk_index"
									})] }) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "已分块笔记 / 总笔记" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
											num(health.chunks.notes),
											" / ",
											num(health.notes)
										] })]
									}),
									(health.chunks.empty ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "空笔记（0 字节，不需分块）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [num(health.chunks.empty), " 篇"] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "分块总数" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: num(health.chunks.rows) })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "最后索引" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [health.chunks.last_indexed_at ?? "—", stale !== null && stale !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "bc-index-sample",
											children: [
												" · 最后内容变化 ",
												stale,
												" 天前"
											]
										})] })]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h4", { children: ["按领域覆盖 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-index-note",
										children: "向量 / 笔记"
									})] }) }),
									(health.by_domain ?? []).length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "暂无领域数据" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "—" })]
									}),
									(health.by_domain ?? []).map((bucket) => {
										const percent = bucket.total > 0 ? bucket.covered / bucket.total * 100 : 0;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "bc-index-domain-row",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-index-domain-name",
													title: bucket.name,
													children: bucket.name
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "bc-index-domain-bar",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: { width: `${percent}%` } })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: bucket.missing > 0 ? "bc-index-warn" : "",
													children: [
														bucket.covered,
														" / ",
														bucket.total
													]
												})
											]
										}, bucket.name);
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								open: true,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h4", { children: ["管道心跳 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "bc-index-note",
										children: "cron 是否按时跑"
									})] }) }),
									(health.crons ?? []).length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "暂无心跳数据" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "—" })]
									}),
									((health.stale_crons ?? []).length > 0 || (health.zombie_crons ?? []).length > 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-cron-alert",
										children: [
											(health.stale_crons ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-cron-alert-text bc-index-warn",
												children: [health.stale_crons?.length, " 个定时任务超过 1.5 倍周期未运行"]
											}),
											(health.zombie_crons ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-cron-alert-text",
												children: [health.zombie_crons?.length, " 条失效心跳（代码里已无此任务）"]
											}),
											(health.zombie_crons ?? []).length > 0 && (armedPrune ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-cron-alert-actions",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
													size: "sm",
													variant: "ghost",
													disabled: busy,
													onClick: () => void pruneZombies(),
													children: [
														"确认清理 ",
														health.zombie_crons?.length,
														" 条"
													]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
													size: "sm",
													variant: "ghost",
													disabled: busy,
													onClick: () => setArmedPrune(false),
													children: "取消"
												})]
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy,
												onClick: () => setArmedPrune(true),
												children: "清理失效心跳…"
											}))
										]
									}),
									(health.crons ?? []).map((cron) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-cron-row",
										"data-status": cron.status,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "bc-cron-dot",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "bc-cron-name",
												children: cron.name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "bc-cron-age",
												children: cron.age_hours === null ? "从未运行" : `${cron.age_hours} 小时前`
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-cron-interval",
												children: [
													"每 ",
													cron.interval_h,
													" 小时"
												]
											})
										]
									}, cron.name)),
									(health.crons_all ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										className: "bc-cron-all",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
											"全部定时任务（",
											health.crons_all?.length ?? 0,
											"）"
										] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "bc-cron-all-list",
											children: [...health.crons_all ?? []].sort((left, right) => (right.age_hours ?? Number.POSITIVE_INFINITY) - (left.age_hours ?? Number.POSITIVE_INFINITY)).map((cron) => {
												const zombie = (health.zombie_crons ?? []).some((item) => item.name === cron.name);
												return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "bc-cron-row",
													"data-status": cron.status,
													"data-zombie": zombie ? "true" : void 0,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "bc-cron-dot",
															"aria-hidden": "true"
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "bc-cron-name",
															children: [cron.name, zombie && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: "bc-cron-flag",
																children: "已失效"
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "bc-cron-age",
															children: cron.age_hours === null ? "从未运行" : `${cron.age_hours} 小时前`
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "bc-cron-interval",
															children: cron.last_run_at ?? "—"
														})
													]
												}, `all-${cron.name}`);
											})
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: "重试队列" }) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "embed_pending" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [num(health.pending), " 篇"] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-index-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "库大小" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: num(health.db_size_mb, " MB") })]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "bc-index-section",
								open: true,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: "手动补嵌" }) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-embed-actions",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy || running || (health.vec.missing ?? 0) === 0,
												onClick: () => void run("vec:fill"),
												children: [
													"补向量缺失（",
													num(health.vec.missing),
													" 篇）"
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy || running,
												onClick: () => void run("vec:rebuild"),
												children: [
													"全量重建向量（",
													num(health.notes),
													" 篇）"
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy || running,
												onClick: () => void run("chunk:rebuild"),
												children: [
													"分块增量重建（",
													num(health.notes),
													" 篇）"
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy || running,
												title: "忽略内容哈希，逐篇重建全部分块（会重写数万分块行）；数十秒到数分钟，期间可取消",
												onClick: () => void run("chunk:force"),
												children: "分块全量重建（强制）"
											}),
											(health.chunks.missing ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: busy || running,
												onClick: () => void run("chunk:fill"),
												children: [
													"补分块缺失（",
													num(health.chunks.missing),
													" 篇）"
												]
											})
										]
									}),
									job !== null && job.state !== "idle" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(JobProgress, {
										job,
										onCancel: () => void cancel()
									})
								]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/ui/GroupActionDialog.tsx
		/**
		* 分组动作确认框：批量停止 / 批量重启共用。
		* 先把会被影响的单元列清楚、说清后果，确认后才下发。
		*/
		/**
		* 渲染分组动作确认框。
		* @param props - 标题、单元名单与回调
		* @returns 对话框元素（挂载即打开）
		*/
		function GroupActionDialog({ title, description, names, note, confirmLabel, busyLabel, busy, onCancel, onConfirm }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				open: true,
				onClose: busy ? () => {} : onCancel,
				title,
				closeLabel: "关闭",
				description,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					disabled: busy,
					onClick: onCancel,
					children: "取消"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "primary",
					disabled: busy,
					onClick: onConfirm,
					children: busy ? busyLabel : confirmLabel
				})] }),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
					className: "bc-stop-list",
					children: names.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
						className: "bc-stop-item",
						children: name
					}, name))
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-stop-note",
					children: note
				})]
			});
		}
		//#endregion
		//#region src/ui/IconButton.tsx
		/**
		* 渲染一个图标按钮。
		* @param props - 动作名、图标与回调
		* @returns 按钮元素（包在悬停提示里）
		*/
		function IconButton({ label, icon: Glyph, variant = "ghost", danger = false, disabled = false, busy = false, active = false, onClick }) {
			const text = busy ? `${label}中…` : label;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
				label: text,
				side: "bottom",
				delayMs: 400,
				portal: true,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant,
					className: `bc-icon-btn${danger ? " bc-danger" : ""}`,
					"aria-label": text,
					"aria-busy": busy || void 0,
					"aria-pressed": active || void 0,
					disabled: disabled || busy,
					onClick,
					icon: busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, {
						state: "ongoing",
						size: 12
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, { size: 16 })
				})
			});
		}
		//#endregion
		//#region src/ui/LogDock.tsx
		/**
		* 底部日志控制台：显示选中单元最近的日志。
		*
		* 作为页面底部的常驻面板，不覆盖卡片网格、不弹模态，切换单元只换内容。
		* 日志由页面静默轮询刷新：停在底部时自动跟随最新一行，向上翻看时保持不动。
		* 头部支持按关键词过滤（本地、大小写不敏感）与复制当前可见内容。
		*/
		/**
		* 渲染日志控制台。
		* @param props - 日志内容与回调
		* @returns 面板元素
		*/
		function LogDock({ name, text, loading, readAt, paused, lines, onRefresh, onTogglePause, onCycleLines, onClear, onClose }) {
			const body = (0, react.useRef)(null);
			const follow = (0, react.useRef)(true);
			const [filter, setFilter] = (0, react.useState)("");
			const [copied, setCopied] = (0, react.useState)(false);
			const allLines = (0, react.useMemo)(() => text.split("\n"), [text]);
			const shownLines = (0, react.useMemo)(() => {
				const needle = filter.trim().toLowerCase();
				if (needle === "") return allLines;
				return allLines.filter((line) => line.toLowerCase().includes(needle));
			}, [allLines, filter]);
			const shown = shownLines.join("\n");
			const filtering = filter.trim() !== "";
			(0, react.useLayoutEffect)(() => {
				follow.current = true;
				setFilter("");
				const element = body.current;
				if (element !== null) element.scrollTop = element.scrollHeight;
			}, [name]);
			(0, react.useLayoutEffect)(() => {
				const element = body.current;
				if (element !== null && follow.current) element.scrollTop = element.scrollHeight;
			}, [shown]);
			const handleScroll = () => {
				const element = body.current;
				if (element === null) return;
				follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
			};
			const copy = async () => {
				try {
					await navigator.clipboard.writeText(shown);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				} catch {}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "bc-dock",
				"aria-label": `${name} 日志`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: "bc-dock-head",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "bc-dock-title",
							children: "日志"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "bc-dock-sub",
							children: name
						}),
						readAt !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-dock-sub",
							children: [
								"· ",
								readAt,
								" 刷新"
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-dock-spacer" }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "bc-dock-filter",
							value: filter,
							placeholder: "过滤",
							"aria-label": "过滤日志",
							onChange: (event) => setFilter(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Escape") setFilter("");
							}
						}),
						filtering && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-dock-match",
							children: [
								shownLines.length,
								" / ",
								allLines.length
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "bc-dock-lines",
							onClick: onCycleLines,
							title: "切换读取行数",
							children: [lines, " 行"]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: paused ? "继续刷新" : "暂停刷新",
							icon: paused ? IconPlay : IconPause,
							active: paused,
							onClick: onTogglePause
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: copied ? "已复制" : "复制日志",
							icon: copied ? IconCheck : IconCopy,
							onClick: () => void copy()
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "清空日志",
							icon: IconTrash,
							onClick: onClear
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "立即刷新",
							icon: IconRefresh,
							busy: loading,
							onClick: onRefresh
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "收起日志",
							icon: IconChevronDown,
							onClick: onClose
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
					ref: body,
					className: "bc-dock-body",
					onScroll: handleScroll,
					children: loading && text === "" ? "读取中…" : filtering && shownLines.length === 0 ? "（没有匹配的行）" : shown
				})]
			});
		}
		//#endregion
		//#region src/ui/MoreMenu.tsx
		/**
		* 头部「更多」菜单：把备份、清理备份、清理缓存、开机启动收纳成一个 ⋯ 入口。
		*
		* 菜单语义：立即备份 / 清理备份… / 清理缓存…（各自打开对话框）/ 开机启动（勾选态 = 已开启）。
		* 外部点击、Esc、焦点归还都交给宿主的 Menu 原语，不自己维护浮层。
		*/
		/**
		* 渲染「更多」图标按钮与它收纳的菜单。
		* @param props - 开机启动状态、忙碌标记与各动作
		* @returns 菜单入口（含锚定菜单）
		*/
		function MoreMenu({ autostart, busy, onBackup, onPrune, onCaches, onIndex, onAutoRecover, onDiagnostics, onToggleAutostart, onShutdown }) {
			const [open, setOpen] = (0, react.useState)(false);
			const items = [
				{
					id: "backup",
					label: busy === "backup" ? "备份中…" : "立即备份",
					disabled: busy !== null
				},
				{
					id: "prune",
					label: "清理备份…",
					disabled: busy !== null
				},
				{
					id: "caches",
					label: "清理缓存…",
					disabled: busy !== null
				},
				{
					type: "separator",
					id: "index-separator"
				},
				{
					id: "index",
					label: "索引与嵌入状态…",
					disabled: busy !== null
				},
				{
					id: "auto-recover",
					label: "自动恢复记录…",
					disabled: busy !== null
				},
				{
					id: "diagnostics",
					label: "下载诊断包",
					disabled: busy !== null
				}
			];
			if (autostart !== null && autostart.supported) items.push({
				type: "separator",
				id: "autostart-separator"
			}, {
				id: "autostart",
				label: busy === "autostart" ? "设置中…" : "开机启动",
				disabled: busy !== null
			});
			items.push({
				type: "separator",
				id: "shutdown-separator"
			}, {
				id: "shutdown",
				label: "关闭启动器…",
				disabled: busy !== null
			});
			const select = (id) => {
				setOpen(false);
				if (id === "backup") onBackup();
				else if (id === "prune") onPrune();
				else if (id === "caches") onCaches();
				else if (id === "index") onIndex();
				else if (id === "auto-recover") onAutoRecover();
				else if (id === "diagnostics") onDiagnostics();
				else if (id === "autostart") onToggleAutostart();
				else if (id === "shutdown") onShutdown();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
				open,
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					className: "bc-icon-btn",
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsis, { size: 16 }),
					"aria-label": "更多操作",
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => setOpen((value) => !value)
				}),
				items,
				selectedId: autostart?.enabled === true ? "autostart" : void 0,
				onSelect: select,
				onClose: () => setOpen(false),
				align: "end",
				side: "bottom",
				portal: true
			});
		}
		//#endregion
		//#region src/ui/smooth.ts
		/** 统一保留一位小数，减小 path 体积。 */
		function fmt(value) {
			return value.toFixed(1);
		}
		/**
		* 生成平滑折线的 SVG path。
		* @param points - 按 x 升序的采样点（至少 1 个）
		* @returns `M … C …` 形式的 path；点不足时退化成直线段
		*/
		function smoothPath(points) {
			const count = points.length;
			if (count === 0) return "";
			const first = points[0];
			if (count === 1) return `M ${fmt(first.x)} ${fmt(first.y)}`;
			const second = points[1];
			if (count === 2) return `M ${fmt(first.x)} ${fmt(first.y)} L ${fmt(second.x)} ${fmt(second.y)}`;
			const dx = [];
			const slope = [];
			for (let index = 0; index < count - 1; index += 1) {
				const left = points[index];
				const right = points[index + 1];
				const width = right.x - left.x;
				dx.push(width);
				slope.push(width === 0 ? 0 : (right.y - left.y) / width);
			}
			const tangent = new Array(count).fill(0);
			tangent[0] = slope[0] ?? 0;
			tangent[count - 1] = slope[count - 2] ?? 0;
			for (let index = 1; index < count - 1; index += 1) {
				const previous = slope[index - 1] ?? 0;
				const next = slope[index] ?? 0;
				if (previous * next <= 0) {
					tangent[index] = 0;
					continue;
				}
				const w1 = 2 * (dx[index] ?? 0) + (dx[index - 1] ?? 0);
				const w2 = (dx[index] ?? 0) + 2 * (dx[index - 1] ?? 0);
				tangent[index] = (w1 + w2) / (w1 / previous + w2 / next);
			}
			let path = `M ${fmt(first.x)} ${fmt(first.y)}`;
			for (let index = 0; index < count - 1; index += 1) {
				const left = points[index];
				const right = points[index + 1];
				const width = dx[index] ?? 0;
				const c1x = left.x + width / 3;
				const c1y = left.y + (tangent[index] ?? 0) * width / 3;
				const c2x = right.x - width / 3;
				const c2y = right.y - (tangent[index + 1] ?? 0) * width / 3;
				path += ` C ${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(right.x)} ${fmt(right.y)}`;
			}
			return path;
		}
		/**
		* 面积填充路径：平滑曲线 + 回落到基线闭合。
		* @param points - 采样点（按 x 升序）
		* @param baseline - 基线 y（通常图表底部）
		* @returns 闭合的 SVG path
		*/
		function smoothAreaPath(points, baseline) {
			if (points.length === 0) return "";
			const first = points[0];
			const last = points[points.length - 1];
			return `${smoothPath(points)} L ${fmt(last.x)} ${fmt(baseline)} L ${fmt(first.x)} ${fmt(baseline)} Z`;
		}
		//#endregion
		//#region src/ui/Sparkline.tsx
		/**
		* 迷你趋势线：指标卡里那根 20px 高的曲线（单调三次贝塞尔平滑）。
		*
		* 只在至少两个有效采样点时渲染（一个点画不出趋势）；
		* 用 viewBox + width="100%" 自适应卡片宽度。
		*/
		const VIEW_WIDTH = 100;
		/**
		* 渲染一条迷你折线。
		* @param props - 数值序列与尺寸
		* @returns SVG 元素；点数不足时返回 null
		*/
		function Sparkline({ values, height = 20, className }) {
			if (values.length < 2) return null;
			const padding = 2;
			const min = Math.min(...values);
			const span = Math.max(...values) - min || 1;
			const step = VIEW_WIDTH / (values.length - 1);
			const path = smoothPath(values.map((value, index) => ({
				x: index * step,
				y: height - padding - (value - min) / span * (height - padding * 2)
			})));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: className === void 0 ? "bc-spark" : `bc-spark ${className}`,
				viewBox: `0 0 ${VIEW_WIDTH} ${height}`,
				width: "100%",
				height,
				preserveAspectRatio: "none",
				role: "img",
				"aria-label": "趋势",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: path,
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinejoin: "round",
					strokeLinecap: "round",
					vectorEffect: "non-scaling-stroke"
				})
			});
		}
		//#endregion
		//#region src/ui/time.ts
		/**
		* 时间戳小工具：管理器返回的时间戳有两种写法（ISO 带 T / 空格分隔），
		* 图表和悬停读数共用这里的解析与短日期格式。
		*/
		/** `2026-11-07T23:18:28` / `2026-11-07 23:18:28` → 毫秒时间戳。 */
		function parseTs(ts) {
			const normalized = ts.includes("T") ? ts : ts.replace(" ", "T");
			return Date.parse(normalized);
		}
		/** `2026-11-07T23:18:28` → `11-07`。 */
		function shortDate(ts) {
			const day = ts.slice(5, 10);
			return day.length === 5 ? day : ts.slice(0, 10);
		}
		//#endregion
		//#region src/ui/StatTiles.tsx
		/**
		* 概览指标带：数据库 / 知识边 / 笔记 / 记忆 / 失败边 / 上次备份。
		*
		* 前五项各带一条 30 天迷你趋势线，点开看完整趋势（可切 7 / 30 / 90 / 365 天窗口）。
		* 「失败边」有值时整块换成警示底色，而不是把数字染成低对比度文字。
		*/
		/** 指标带里趋势线的窗口（天）。 */
		const SPARK_DAYS = 30;
		/** 取最近 N 天里该指标的数值（升序，跳过空点）。 */
		function seriesValues(points, key) {
			if (points === void 0) return [];
			const cutoff = Date.now() - SPARK_DAYS * 864e5;
			const values = [];
			for (const point of points) {
				const value = point[key];
				if (value === null) continue;
				const stamp = parseTs(point.ts);
				if (Number.isFinite(stamp) && stamp >= cutoff) values.push(value);
			}
			return values;
		}
		function Stat({ label, value, hint, tone, spark, onClick }) {
			const content = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "bc-kpi-label",
					children: label
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "bc-kpi-value",
					children: value
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "bc-kpi-hint",
					children: hint
				}),
				spark !== void 0 && spark.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sparkline, { values: spark })
			] });
			if (onClick === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "bc-kpi",
				"data-tone": tone,
				children: content
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "bc-kpi bc-kpi-action",
				"data-tone": tone,
				onClick,
				children: content
			});
		}
		/**
		* 渲染概览指标。
		* @param props.overview - `/status` 返回值；为空时不渲染
		* @param props.now - 当前毫秒时间戳，用于相对时间
		* @param props.history - `/status/history` 的采样点；为空时只显示数值
		* @param props.onOpenTrend - 点开某个指标的趋势图
		* @returns 指标网格元素
		*/
		function OverviewTiles({ overview, now, history, onOpenTrend }) {
			const backupAt = overview.last_backup.at;
			const backupSize = overview.last_backup.size_mb;
			const backupHint = [formatShortMoment(backupAt), backupSize === null ? null : formatMegabytes(backupSize)].filter((part) => part !== null).join(" · ");
			const points = history?.points;
			const hasFailures = (overview.failure_edges ?? 0) > 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "bc-kpis",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "数据库",
						value: formatMegabytes(overview.db_size_mb),
						hint: "brain.db",
						spark: seriesValues(points, "db_size_mb"),
						onClick: () => onOpenTrend("db_size_mb")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "知识边",
						value: formatCount(overview.edges),
						hint: "图谱连接",
						spark: seriesValues(points, "edges"),
						onClick: () => onOpenTrend("edges")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "笔记",
						value: formatCount(overview.notes),
						hint: "vault 索引",
						spark: seriesValues(points, "notes"),
						onClick: () => onOpenTrend("notes")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "记忆",
						value: formatCount(overview.sessions),
						hint: "会话记忆",
						spark: seriesValues(points, "sessions"),
						onClick: () => onOpenTrend("sessions")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "失败边",
						value: formatCount(overview.failure_edges),
						hint: "待消解 · 查看",
						tone: hasFailures ? "warn" : void 0,
						spark: seriesValues(points, "failure_edges"),
						onClick: () => onOpenTrend("failure_edges")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "上次备份",
						value: formatRelative(backupAt, now),
						hint: backupHint === "" ? "暂无备份" : backupHint
					})
				]
			});
		}
		//#endregion
		//#region src/ui/TrendDialog.tsx
		/**
		* 指标趋势对话框：点指标卡打开，默认 30 天，可切 7 / 30 / 90 / 365 天。
		*
		* 数据来自 `/status/history`（管理器每 6 小时采一次 metrics_snapshots）。
		* 图上支持滚轮缩放（以光标为中心）、拖拽平移、双击重置；悬停读出该采样点日期与数值。
		* 点数不足时明确提示「数据不足」，不画一条假线。失败边指标额外给一个「查看明细」入口。
		*/
		const CHART_W = 600;
		const CHART_H = 170;
		const PAD = 14;
		/** 可选时间窗口（天）。 */
		const RANGES = [
			{
				days: 7,
				label: "7 天"
			},
			{
				days: 30,
				label: "30 天"
			},
			{
				days: 90,
				label: "90 天"
			},
			{
				days: 365,
				label: "365 天"
			}
		];
		/** 把缩放窗口夹到合法范围；窗口至少 2 个点。 */
		function clampView(start, end, total) {
			const size = Math.max(2, Math.min(total, end - start + 1));
			const safeStart = Math.max(0, Math.min(total - size, start));
			return {
				start: safeStart,
				end: safeStart + size - 1
			};
		}
		/**
		* 渲染指标趋势对话框。
		* @param props - 指标、采样点与回调
		* @returns 对话框元素（挂载即打开）
		*/
		function TrendDialog({ metric, points, onOpenFailed, onClose }) {
			const [days, setDays] = (0, react.useState)(30);
			const [hover, setHover] = (0, react.useState)(null);
			const [zoom, setZoom] = (0, react.useState)(null);
			const [limits, setLimits] = (0, react.useState)(null);
			const [limitOpen, setLimitOpen] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)("");
			const [limitError, setLimitError] = (0, react.useState)(null);
			const chartRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)(null);
			const series = (0, react.useMemo)(() => {
				const cutoff = Date.now() - days * 864e5;
				return points.map((point) => ({
					ts: point.ts,
					value: point[metric.key]
				})).filter((point) => point.value !== null && Number.isFinite(parseTs(point.ts)) && parseTs(point.ts) >= cutoff);
			}, [
				points,
				days,
				metric.key
			]);
			const total = series.length;
			const view = zoom === null ? {
				start: 0,
				end: Math.max(0, total - 1)
			} : clampView(zoom.start, zoom.end, total);
			const visible = total === 0 ? [] : series.slice(view.start, view.end + 1);
			const count = visible.length;
			const values = visible.map((point) => point.value);
			const min = count > 0 ? Math.min(...values) : 0;
			const max = count > 0 ? Math.max(...values) : 0;
			const span = max - min || 1;
			const xAt = (index) => count <= 1 ? CHART_W / 2 : index / (count - 1) * CHART_W;
			const yAt = (value) => CHART_H - PAD - (value - min) / span * (CHART_H - PAD * 2);
			const plotPoints = visible.map((point, index) => ({
				x: xAt(index),
				y: yAt(point.value)
			}));
			const line = smoothPath(plotPoints);
			const area = smoothAreaPath(plotPoints, CHART_H);
			const zoomed = zoom !== null && view.end - view.start + 1 < total;
			(0, react.useEffect)(() => {
				const element = chartRef.current;
				if (element === null) return;
				const handleWheel = (event) => {
					if (total < 3) return;
					event.preventDefault();
					const rect = element.getBoundingClientRect();
					const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
					const currentCount = view.end - view.start + 1;
					const factor = event.deltaY > 0 ? 1.3 : 1 / 1.3;
					const nextCount = Math.max(2, Math.min(total, Math.round(currentCount * factor)));
					if (nextCount >= total) {
						setZoom(null);
						return;
					}
					const cursorIndex = view.start + ratio * (currentCount - 1);
					const start = Math.round(cursorIndex - ratio * (nextCount - 1));
					setZoom(clampView(start, start + nextCount - 1, total));
				};
				element.addEventListener("wheel", handleWheel, { passive: false });
				return () => element.removeEventListener("wheel", handleWheel);
			}, [
				total,
				view.start,
				view.end
			]);
			(0, react.useEffect)(() => {
				(async () => {
					try {
						setLimits((await loadTrendThresholds()).thresholds);
					} catch {
						setLimits(null);
					}
				})();
			}, []);
			(0, react.useEffect)(() => {
				setZoom(null);
				setHover(null);
			}, [days, metric.key]);
			const saveLimit = async (clear) => {
				const value = clear ? null : Number(draft);
				if (!clear && (draft.trim() === "" || !Number.isFinite(value) || value <= 0)) {
					setLimitError("请输入正数");
					return;
				}
				try {
					const result = await saveTrendThreshold(metric.key, value);
					if (!result.ok) {
						setLimitError(result.error ?? "保存失败");
						return;
					}
					if (result.thresholds !== void 0) setLimits(result.thresholds);
					setLimitOpen(false);
					setLimitError(null);
				} catch (e) {
					setLimitError(reasonOf(e));
				}
			};
			const handleMove = (event) => {
				if (count === 0) return;
				const rect = event.currentTarget.getBoundingClientRect();
				const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
				setHover(Math.round(ratio * (count - 1)));
			};
			const handlePointerDown = (event) => {
				if (total < 3) return;
				dragRef.current = {
					x: event.clientX,
					start: view.start,
					end: view.end
				};
				event.currentTarget.setPointerCapture(event.pointerId);
			};
			const handlePointerMove = (event) => {
				const drag = dragRef.current;
				if (drag === null) return;
				const rect = chartRef.current?.getBoundingClientRect();
				if (rect === void 0) return;
				const size = drag.end - drag.start + 1;
				const shift = Math.round((drag.x - event.clientX) / rect.width * size);
				const start = Math.max(0, Math.min(total - size, drag.start + shift));
				setZoom(start === 0 && size >= total ? null : clampView(start, start + size - 1, total));
			};
			const handlePointerUp = () => {
				dragRef.current = null;
			};
			const resetZoom = () => {
				setZoom(null);
				setHover(null);
			};
			const latest = count > 0 ? visible[count - 1] ?? null : null;
			const first = visible[0];
			const change = (() => {
				if (latest === null || count < 2) return null;
				const target = Date.now() - 864e5;
				let best = visible[0];
				let bestDistance = Math.abs(parseTs(best.ts) - target);
				for (const point of visible) {
					const distance = Math.abs(parseTs(point.ts) - target);
					if (distance < bestDistance) {
						best = point;
						bestDistance = distance;
					}
				}
				const older = bestDistance <= 6 * 36e5;
				const base = older ? best : visible[count - 2] ?? best;
				const delta = latest.value - base.value;
				return {
					delta,
					percent: base.value === 0 ? null : delta / base.value * 100,
					label: older ? "24h" : "较上次"
				};
			})();
			const threshold = (limits !== null && metric.key in limits ? limits[metric.key] : metric.threshold) ?? void 0;
			const thresholdY = threshold === void 0 ? null : Math.min(CHART_H - PAD, Math.max(PAD, yAt(threshold)));
			const tagY = thresholdY === null ? null : Math.min(CHART_H - 11, Math.max(11, thresholdY));
			const overThreshold = threshold !== void 0 && latest !== null && latest.value > threshold;
			const readout = hover !== null && visible[hover] !== void 0 ? `${shortDate(visible[hover].ts)} · ${metric.format(visible[hover].value)}` : latest !== null ? `最新 ${metric.format(latest.value)}` : "暂无采样";
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				zoomed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: resetZoom,
					children: "重置缩放"
				}),
				onOpenFailed !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onOpenFailed,
					children: "查看失败边明细"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onClose,
					children: "关闭"
				})
			] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Dialog, {
				open: true,
				onClose,
				title: `${metric.label}趋势`,
				closeLabel: "关闭",
				description: `${days} 天窗口 · ${count} / ${total} 个采样点 · 单位${metric.unit}`,
				footer,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "bc-trend",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "bc-trend-head",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "bc-trend-ranges",
									children: RANGES.map((range) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: days === range.days ? "outline" : "ghost",
										onClick: () => setDays(range.days),
										children: range.label
									}, range.days))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => {
										setLimitOpen((open) => !open);
										setDraft(threshold === void 0 ? "" : String(threshold));
										setLimitError(null);
									},
									children: "阈值"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "bc-trend-readout",
									children: [
										change !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: `bc-trend-delta${metric.badWhen === "up" && change.delta > 0 ? " bc-trend-delta-bad" : ""}`,
											title: change.label === "24h" ? "与 24 小时前的采样点比较" : "窗口里没有 24 小时前的点，与上一个采样点比较",
											children: [
												change.label,
												" ",
												change.delta > 0 ? "+" : "",
												metric.format(change.delta),
												change.percent === null ? "" : `（${change.percent > 0 ? "+" : ""}${change.percent.toFixed(1)}%）`
											]
										}),
										overThreshold && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "bc-trend-delta bc-trend-delta-bad",
											children: "超告警"
										}),
										readout
									]
								})
							]
						}),
						limitOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "bc-trend-limit-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "告警线" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: "0",
									className: "bc-trend-limit-input",
									value: draft,
									placeholder: metric.threshold === void 0 ? "留空 = 不画线" : String(metric.threshold),
									onChange: (event) => setDraft(event.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => void saveLimit(false),
									children: "保存"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => void saveLimit(true),
									children: "清除"
								}),
								limitError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-index-warn",
									children: limitError
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							ref: chartRef,
							className: "bc-trend-chart",
							onMouseMove: handleMove,
							onMouseLeave: () => setHover(null),
							onPointerDown: handlePointerDown,
							onPointerMove: handlePointerMove,
							onPointerUp: handlePointerUp,
							onPointerCancel: handlePointerUp,
							onDoubleClick: resetZoom,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
									viewBox: `0 0 ${CHART_W} ${CHART_H}`,
									width: "100%",
									height: "170",
									preserveAspectRatio: "none",
									role: "img",
									"aria-label": `${metric.label}趋势图`,
									children: [
										count > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: area,
											className: "bc-trend-area"
										}),
										threshold !== void 0 && thresholdY !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
											x1: 0,
											x2: CHART_W,
											y1: thresholdY,
											y2: thresholdY,
											className: "bc-trend-threshold",
											vectorEffect: "non-scaling-stroke"
										}),
										count > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: line,
											className: "bc-trend-line",
											vectorEffect: "non-scaling-stroke"
										}),
										hover !== null && visible[hover] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
											x1: xAt(hover),
											x2: xAt(hover),
											y1: 0,
											y2: CHART_H,
											className: "bc-trend-guide",
											vectorEffect: "non-scaling-stroke"
										})
									]
								}),
								hover !== null && visible[hover] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-trend-marker",
									style: {
										left: `${xAt(hover) / CHART_W * 100}%`,
										top: `${yAt(visible[hover].value) / CHART_H * 100}%`
									}
								}),
								count === 1 && visible[0] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-trend-marker",
									style: {
										left: "50%",
										top: `${yAt(visible[0].value) / CHART_H * 100}%`
									}
								}),
								threshold !== void 0 && thresholdY !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: `bc-trend-threshold-tag${overThreshold ? " bc-trend-threshold-tag-over" : ""}`,
									style: { top: `${(tagY ?? thresholdY) / CHART_H * 100}%` },
									children: [
										overThreshold ? "已超告警线" : "告警线",
										" ",
										metric.format(threshold)
									]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "bc-trend-axis",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: first !== void 0 ? shortDate(first.ts) : "—" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: count > 0 ? `最高 ${metric.format(max)} · 最低 ${metric.format(min)}` : "" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: latest !== null ? shortDate(latest.ts) : "—" })
							]
						}),
						count < 2 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "bc-trend-empty",
							children: [
								"数据不足：当前窗口只有 ",
								count,
								" 个采样点。管理器每小时采一次，攒两次就会有折线。"
							]
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "bc-trend-hint",
							children: "滚轮缩放 · 拖拽平移 · 双击重置"
						})
					]
				})
			});
		}
		//#endregion
		//#region src/ui/UnitDetailDialog.tsx
		/**
		* 单元详情：把 `/units` 里这一条的所有字段摊开，排查问题不用再猜。
		*
		* 只读；动作仍走卡片上的按钮和 ⋯ 菜单。
		*/
		/**
		* 渲染单元详情对话框。
		* @param props - 单元快照、时间与回调
		* @returns 对话框元素（挂载即打开）
		*/
		function UnitDetailDialog({ unit, now, dependents, onClose }) {
			const uptime = unit.running ? formatUptime(unit.started_at, now) : null;
			const rows = [
				{
					label: "分组",
					value: unit.group
				},
				{
					label: "描述",
					value: unit.desc
				},
				{
					label: "脚本",
					value: unit.script,
					mono: true
				},
				{
					label: "启动参数",
					value: (unit.args ?? []).join(" ") || "（无）",
					mono: true
				},
				{
					label: "端口",
					value: typeof unit.port === "number" ? String(unit.port) : "（无，无端口服务）"
				},
				{
					label: "状态",
					value: unit.state
				},
				{
					label: "PID",
					value: typeof unit.pid === "number" ? String(unit.pid) : "—"
				},
				{
					label: "父进程",
					value: typeof unit.ppid === "number" ? String(unit.ppid) : "—"
				},
				{
					label: "托管方式",
					value: unit.child_of_manager ? "管理器子进程" : "外部进程"
				},
				{
					label: "随管理器启动",
					value: unit.enabled ? "是" : "否"
				},
				{
					label: "运行时长",
					value: uptime ?? "—"
				},
				{
					label: "健康",
					value: unit.health_error ?? (unit.running ? "正常" : "—")
				},
				{
					label: "退出码",
					value: typeof unit.last_exit_code === "number" ? String(unit.last_exit_code) : "—"
				},
				{
					label: "依赖",
					value: (unit.depends ?? []).join("、") || "（无）"
				},
				{
					label: "被依赖",
					value: dependents.join("、") || "（无）"
				}
			];
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onClose,
				children: "关闭"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Dialog, {
				open: true,
				onClose,
				title: unit.name,
				closeLabel: "关闭",
				description: unit.desc,
				footer,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
					className: "bc-detail-list",
					children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-detail-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
							className: "bc-detail-label",
							children: row.label
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
							className: row.mono === true ? "bc-detail-value bc-detail-mono" : "bc-detail-value",
							children: row.value
						})]
					}, row.label))
				})
			});
		}
		//#endregion
		//#region src/ui/UnitMenu.tsx
		/**
		* 单元「更多」菜单：收纳不常点的单元级设置。
		*
		* 菜单项语义：
		*   - 随管理器启动：勾选态 = enabled（管理器下次启动时是否恢复该单元，不改当前进程）
		*   - 接管为子进程：只在该单元是外部进程时出现（会重启它一次，交给管理器托管）
		*/
		/**
		* 渲染单元级「更多」图标按钮与它收纳的菜单。
		* @param props - 单元快照与单元级动作
		* @returns 菜单入口（含锚定菜单）
		*/
		function UnitMenu({ unit, disabled, onDetail, onToggleEnabled, onAdopt }) {
			const [open, setOpen] = (0, react.useState)(false);
			const items = [{
				id: "detail",
				label: "查看详情"
			}, {
				id: "enabled",
				label: "随管理器启动",
				disabled
			}];
			if (unit.running && unit.child_of_manager === false) items.push({
				id: "adopt",
				label: "接管为子进程（会重启）",
				disabled
			});
			const select = (id) => {
				setOpen(false);
				if (id === "detail") onDetail(unit.name);
				else if (id === "enabled") onToggleEnabled(unit.name, !unit.enabled);
				else if (id === "adopt") onAdopt(unit.name);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
				open,
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					className: "bc-icon-btn",
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsis, { size: 16 }),
					"aria-label": "单元更多操作",
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled,
					onClick: () => setOpen((value) => !value)
				}),
				items,
				selectedId: unit.enabled ? "enabled" : void 0,
				onSelect: select,
				onClose: () => setOpen(false),
				align: "end",
				side: "bottom",
				portal: true
			});
		}
		//#endregion
		//#region src/ui/ServiceCard.tsx
		/**
		* 单个受管单元卡片：状态灯 + 名称 + 端口 + 描述 + 运行信息 + 图标操作。
		*
		* 纯展示组件，不自己发请求；启停与日志由页面统一下发，状态以管理器回报为准。
		*/
		const STATE_DOT = {
			运行中: "done",
			已停止: "idle",
			异常: "error"
		};
		/**
		* 渲染一张单元卡片。
		* @param props - 单元快照与回调
		* @returns 卡片元素
		*/
		function ServiceCard({ unit, now, busyAction, disabled, logOpen, dependents, onLog, onAction, onToggleEnabled, onAdopt, onDetail }) {
			const details = [];
			if (unit.running) {
				if (unit.state === "异常" && unit.health_error) details.push(`健康探测失败：${unit.health_error}`);
				const uptime = formatUptime(unit.started_at, now);
				if (uptime !== null) details.push(`已运行 ${uptime}`);
				if (typeof unit.pid === "number") details.push(`pid ${unit.pid}`);
				if (unit.child_of_manager === false) details.push("外部进程");
			} else {
				details.push(unit.enabled ? "随管理器启动" : "不自动启动");
				if (typeof unit.last_exit_code === "number") details.push(`退出码 ${unit.last_exit_code}`);
			}
			const depends = unit.depends ?? [];
			if (depends.length > 0) details.push(`依赖 ${depends.join("、")}`);
			if (dependents.length > 0) details.push(`被 ${dependents.join("、")} 依赖`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: "bc-card",
				"data-abnormal": unit.running && unit.state === "异常" ? "true" : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-card-top",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, { state: STATE_DOT[unit.state] ?? "warning" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "bc-name",
								children: unit.name
							}),
							unit.port !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "bc-port",
								children: [":", unit.port]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-spacer" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-actions",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: logOpen ? "收起日志" : "查看日志",
										icon: IconList,
										disabled,
										active: logOpen,
										onClick: () => onLog(unit.name)
									}),
									unit.running ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: "重启",
										icon: IconRefresh,
										disabled,
										busy: busyAction === "restart",
										onClick: () => onAction(unit.name, "restart")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: "停止",
										icon: IconStop,
										danger: true,
										disabled,
										busy: busyAction === "stop",
										onClick: () => onAction(unit.name, "stop")
									})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: "启动",
										icon: IconPlay,
										disabled,
										busy: busyAction === "start",
										onClick: () => onAction(unit.name, "start")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UnitMenu, {
										unit,
										disabled,
										onDetail,
										onToggleEnabled,
										onAdopt
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-desc",
						children: unit.desc
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "bc-meta",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "bc-meta-state",
							"data-abnormal": unit.state === "异常",
							children: unit.state
						}), details.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-meta-detail",
							children: ["· ", details.join(" · ")]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/ui/UnitSection.tsx
		/**
		* 一个分组：标题行（运行计数 + 全部启动/重启/停止）+ 该组的单元卡片。
		*/
		/**
		* 渲染一个服务分组。
		* @param props - 分组、成员与回调
		* @returns 分组元素
		*/
		function UnitSection({ group, members, now, busy, logName, dependents, onLog, onAction, onStartAll, onStopAll, onRestartAll, onToggleEnabled, onAdopt, onDetail }) {
			const running = members.filter((unit) => unit.running).length;
			const stopped = members.length - running;
			const abnormal = members.filter((unit) => unit.state !== "运行中" && unit.state !== "已停止").length;
			const severity = (unit) => {
				if (unit.state !== "运行中" && unit.state !== "已停止") return 0;
				return unit.running ? 1 : 2;
			};
			const ordered = [...members].sort((left, right) => severity(left) - severity(right));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "bc-section",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "bc-section-head",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "bc-section-name",
							children: group
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-section-count",
							children: [
								running,
								" / ",
								members.length,
								" 运行"
							]
						}),
						stopped > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "全部启动",
							icon: IconPlay,
							disabled: busy !== null,
							busy: busy === `group:${group}`,
							onClick: () => onStartAll(group)
						}),
						running > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "全部重启",
							icon: IconRefresh,
							disabled: busy !== null,
							busy: busy === `restart-group:${group}`,
							onClick: () => onRestartAll(group)
						}),
						running > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: "全部停止",
							icon: IconStop,
							danger: true,
							disabled: busy !== null,
							busy: busy === `stop-group:${group}`,
							onClick: () => onStopAll(group)
						}),
						abnormal > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "bc-section-warn",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-status-dot",
									"aria-hidden": "true"
								}),
								abnormal,
								" 个异常"
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-rule" })
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-grid",
					children: ordered.map((unit) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceCard, {
						unit,
						now,
						busyAction: busyActionOf(busy, unit.name),
						disabled: busy !== null,
						logOpen: logName === unit.name,
						dependents: dependents[unit.name] ?? [],
						onLog,
						onAction,
						onToggleEnabled,
						onAdopt,
						onDetail
					}, unit.name))
				})]
			});
		}
		//#endregion
		//#region src/ui/metrics.ts
		/**
		* 指标定义：指标带和趋势图共用一份（标签、单位、格式化）。
		*/
		/** 指标顺序与指标带一致。 */
		const METRICS = [
			{
				key: "db_size_mb",
				label: "数据库",
				unit: "MB",
				format: (value) => formatMegabytes(value),
				threshold: 800,
				badWhen: "up"
			},
			{
				key: "edges",
				label: "知识边",
				unit: "条",
				format: (value) => formatCount(value)
			},
			{
				key: "notes",
				label: "笔记",
				unit: "篇",
				format: (value) => formatCount(value)
			},
			{
				key: "sessions",
				label: "记忆",
				unit: "条",
				format: (value) => formatCount(value)
			},
			{
				key: "failure_edges",
				label: "失败边",
				unit: "条",
				format: (value) => formatCount(value),
				threshold: 300,
				badWhen: "up"
			}
		];
		/** 按 key 取指标定义。 */
		function metricSpec(key) {
			const found = METRICS.find((spec) => spec.key === key);
			if (found === void 0) throw new Error(`unknown metric: ${key}`);
			return found;
		}
		//#endregion
		//#region src/ui/styles.ts
		/**
		* 控制台样式表。
		*
		* 客户端插件只装载一个 JS 包，没有独立 CSS 资源，所以样式以文本注入 <head>；
		* 按 id 去重，HMR 重载不会叠加多份。颜色、圆角一律取 DSH 主题令牌，
		* 明暗主题自动成立；只有日志控制台用固定深色底（两种主题下都是深底浅字的终端观感）。
		*/
		const STYLE_ID = "dsh-brain-console-styles";
		const STYLES = `
.bc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  font-size: var(--dsh-content-font-size-secondary, 13px);
  line-height: 1.5;
}

.bc-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 28px;
}

.bc-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1160px;
  margin: 0 auto;
}

/* ---- 标题行 ---- */
.bc-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}
.bc-logo {
  display: inline-flex;
  color: var(--dsw-alias-label-secondary);
}
.bc-title {
  margin: 0;
  font-size: calc(var(--dsh-content-font-size, 14px) + 2px);
  font-weight: 500;
  letter-spacing: -0.01em;
}
.bc-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-count-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-idle-primary);
}
/* 点的填充色表示「全部运行」（成功色）；开启开机自启时，同一个点再套一圈成功色描边，
   两个状态叠在一个点上（双色）。悬停整颗胶囊给出自启说明。 */
.bc-count[data-tone='all'] .bc-count-dot {
  background: var(--dsw-alias-state-success-primary);
}
.bc-count[data-autostart='on'] .bc-count-dot {
  box-shadow: 0 0 0 1px var(--dsw-alias-bg-layer-1), 0 0 0 2.5px var(--dsw-alias-state-success-primary);
}
.bc-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}
.bc-updated {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* ---- 连接 / 操作提示 ---- */
.bc-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-inline-start: 3px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-notice[data-kind='action'] {
  border-inline-start-color: var(--dsw-alias-state-warn-primary);
}
.bc-notice-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.bc-notice-title {
  font-weight: 500;
}
.bc-notice-text {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-notice-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}

/* ---- 概览指标 ---- */
.bc-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.bc-kpi {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-kpi[data-tone='warn'] {
  border-color: transparent;
  background: var(--dsw-alias-state-warn-tertiary);
}
.bc-kpi-label {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-kpi-value {
  font-size: calc(var(--dsh-content-font-size, 14px) + 6px);
  font-weight: 500;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-kpi-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 可点开的指标卡（失败边明细） */
.bc-kpi-action {
  cursor: pointer;
  font: inherit;
  text-align: left;
}
@media (hover: hover) {
  .bc-kpi-action:hover {
    border-color: var(--dsw-alias-border-l4);
  }
}
/* 顶部异常提示 chip：只有运行中但健康探测失败时出现 */
.bc-header-alert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: 22px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 45%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 10%, transparent);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
@media (hover: hover) {
  .bc-header-alert:hover {
    background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 16%, transparent);
  }
}
.bc-header-alert:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}

/* 指标卡里的迷你趋势线 */
.bc-spark {
  display: block;
  margin-top: 3px;
  color: var(--dsw-alias-label-tertiary);
}

/* ---- 指标趋势对话框 ---- */
.bc-trend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bc-trend-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.bc-trend-ranges {
  display: flex;
  align-items: center;
  gap: 2px;
}
.bc-trend-readout {
  margin-left: auto;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-trend-chart {
  padding: 4px 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  cursor: crosshair;
}
.bc-trend-chart svg {
  display: block;
}
.bc-trend-line {
  fill: none;
  stroke: var(--dsw-alias-brand-primary);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.bc-trend-area {
  fill: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);
  stroke: none;
}
.bc-backup-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.bc-backup-restore,
.bc-backup-cancel {
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  cursor: pointer;
}
.bc-backup-restore:hover:not(:disabled),
.bc-backup-cancel:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.bc-backup-restore-danger {
  border-color: var(--dsw-alias-state-error-primary, #e35d6a);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-backup-restore:disabled,
.bc-backup-cancel:disabled {
  opacity: 0.45;
  cursor: default;
}
.bc-badge-auto {
  margin-left: 8px;
  padding: 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
}

.bc-auto-summary {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-auto-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bc-auto-row {
  padding: 7px 4px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-auto-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}
.bc-auto-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #3fb950);
}
.bc-auto-row[data-ok='false'] .bc-auto-dot {
  background: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-auto-unit {
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  font-family: var(--ds-font-family-code, monospace);
}
.bc-auto-attempt,
.bc-auto-ok,
.bc-auto-time {
  color: var(--dsw-alias-label-tertiary);
}
.bc-auto-time {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.bc-auto-sub,
.bc-auto-bundle {
  margin-left: 15px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-auto-bundle {
  margin-top: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-auto-bundle-link {
  color: var(--dsw-alias-label-secondary);
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}
.bc-auto-bundle-link:hover {
  color: var(--dsw-alias-label-primary);
}

.bc-trend-limit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-trend-limit-input {
  width: 96px;
  padding: 2px 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
}

.bc-trend-chart {
  position: relative;
}
.bc-trend-threshold {
  stroke: var(--dsw-alias-state-warning-primary, #e0b341);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
  opacity: 0.8;
}
.bc-trend-threshold-tag {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  padding: 1px 7px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 45%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #1d1d22) 88%, transparent);
  color: var(--dsw-alias-state-warning-primary, #e0b341);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  pointer-events: none;
  backdrop-filter: blur(2px);
}
.bc-trend-threshold-tag-over {
  color: var(--dsw-alias-label-primary, #f9fafb);
  border-color: var(--dsw-alias-state-error-primary, #e35d6a);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 22%, var(--dsw-alias-bg-layer-1, #1d1d22));
}
.bc-trend-delta {
  margin-right: 8px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary);
}
.bc-trend-delta-bad {
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font-weight: 600;
}

.bc-trend-marker {
  position: absolute;
  box-sizing: border-box;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border: 1.5px solid var(--dsw-alias-label-primary, #f9fafb);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--dsw-alias-label-primary, #f9fafb) 12%, transparent);
  pointer-events: none;
}
.bc-trend-guide {
  stroke: var(--dsw-alias-border-l4);
  stroke-width: 1;
}
.bc-trend-dot {
  fill: var(--dsw-alias-brand-primary);
}
.bc-trend-axis {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-trend-empty {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-trend-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}

/* ---- 分组与卡片 ---- */
.bc-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bc-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bc-section-name {
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}
.bc-section-count {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-section-warn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 45%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 10%, transparent);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
.bc-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
.bc-rule {
  flex: 1 1 auto;
  height: 1px;
  background: var(--dsw-alias-border-l1);
}
.bc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}
.bc-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 11px 13px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-card-top {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.bc-name {
  min-width: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-port {
  flex: none;
  padding: 0 6px;
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-interactive-bg-hover-solid);
  color: var(--dsw-alias-label-tertiary);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}
.bc-spacer {
  flex: 1 1 auto;
}
.bc-desc {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
}
.bc-meta-state {
  color: var(--dsw-alias-label-secondary);
}
.bc-meta-state[data-abnormal='true'] {
  color: var(--dsw-alias-state-error-primary);
}
.bc-meta-detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}
/* 图标按钮：28×28 方形，16px 图标居中；忙碌时保持可见（禁用态默认变淡） */
.bc-icon-btn {
  padding: 0;
  width: 28px;
}
.bc-icon-btn[aria-busy='true']:disabled {
  opacity: 1;
  cursor: progress;
}
/* 开关型图标按钮的按下态（例如该单元的日志面板正开着） */
.bc-icon-btn[aria-pressed='true'] {
  background: var(--dsw-alias-button-ghost-active-fill);
}
/* 破坏性动作平时与普通图标同色，悬停才转成错误色，避免一排红块压过内容 */
.bc-danger {
  color: var(--dsw-alias-label-secondary);
}
@media (hover: hover) {
  .bc-danger:hover:not(:disabled) {
    color: var(--dsw-alias-state-error-primary);
    background: var(--dsw-alias-interactive-bg-hover-danger);
  }
}
.bc-danger:focus-visible:not(:disabled) {
  color: var(--dsw-alias-state-error-primary);
}

/* ---- 备份清理对话框 ---- */
.bc-backup-keep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.bc-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xs);
  overflow: hidden;
}
.bc-stepper-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.bc-stepper-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-solid);
  color: var(--dsw-alias-label-primary);
}
.bc-stepper-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.bc-stepper-value {
  min-width: 28px;
  text-align: center;
  color: var(--dsw-alias-label-primary);
  font-variant-numeric: tabular-nums;
}
.bc-backup-list {
  display: flex;
  flex-direction: column;
  max-height: 280px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  --dsh-scrollbar-thumb: var(--dsw-alias-border-l2);
}
.bc-backup-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-backup-row + .bc-backup-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-backup-row[data-doomed='true'] {
  background: var(--dsw-alias-state-error-tertiary);
}
.bc-backup-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bc-backup-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-backup-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-backup-tag {
  flex: none;
  min-width: 44px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary);
}
.bc-backup-row[data-doomed='true'] .bc-backup-tag {
  color: var(--dsw-alias-state-error-primary);
}
.bc-backup-empty {
  padding: 32px 0;
  text-align: center;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-backup-error {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-inline-start: 3px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.bc-backup-done {
  margin-top: 8px;
  color: var(--dsw-alias-state-success-primary);
  font-size: 12px;
}

/* ---- 缓存清理对话框 ---- */
.bc-cache-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: auto;
  max-height: 300px;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-cache-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-cache-row + .bc-cache-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-cache-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}
.bc-cache-row[data-risk='protected'] .bc-cache-main {
  cursor: default;
}
.bc-cache-check {
  flex: none;
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
.bc-cache-lock {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cache-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.bc-cache-size {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.bc-cache-tag {
  flex: none;
  min-width: 48px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cache-row[data-risk='confirm'] .bc-cache-tag {
  color: var(--dsw-alias-state-warn-primary);
}
.bc-cache-note {
  padding-left: 23px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.bc-cache-section {
  margin: 10px 0 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-cache-dir {
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  word-break: break-all;
}
.bc-cache-dir code {
  font-family: var(--ds-font-family-code, monospace);
}
.bc-cache-failed {
  color: var(--dsw-alias-state-warn-primary);
}

/* ---- 失败边明细 ---- */
.bc-failed-list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-failed-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-failed-row + .bc-failed-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-failed-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bc-failed-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-failed-count {
  flex: none;
  color: var(--dsw-alias-state-error-primary);
  font-variant-numeric: tabular-nums;
}
.bc-failed-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-failed-more {
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 单元详情 ---- */
.bc-detail-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
}
.bc-detail-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
  padding: 4px 0;
  font-size: 12px;
}
.bc-detail-row + .bc-detail-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-detail-label {
  color: var(--dsw-alias-label-tertiary);
}
.bc-detail-value {
  margin: 0;
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}
.bc-detail-mono {
  font-family: var(--ds-font-family-code, monospace);
  font-size: 11px;
}

/* ---- 分组停止确认 ---- */
.bc-stop-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0 0 10px;
  padding: 9px 12px;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-stop-item {
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  color: var(--dsw-alias-label-primary);
}
.bc-stop-note {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 空态 / 载入态 ---- */
.bc-loading,
.bc-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 底部日志控制台 ---- */
.bc-dock {
  display: flex;
  flex: none;
  flex-direction: column;
  width: calc(100% - 48px);
  max-width: 1160px;
  margin: 0 auto 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1);
}
.bc-dock-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-dock-title {
  font-weight: 500;
}
.bc-dock-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-dock-spacer {
  flex: 1 1 auto;
}
.bc-dock-filter {
  width: 150px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 12px;
}
.bc-dock-filter::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.bc-dock-filter:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.bc-dock-match {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-dock-lines {
  flex: none;
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--dsw-radius-xs);
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
@media (hover: hover) {
  .bc-dock-lines:hover {
    border-color: var(--dsw-alias-border-l3);
    color: var(--dsw-alias-label-primary);
  }
}
.bc-dock-lines:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.bc-dock-body {
  height: 200px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  background: var(--dsw-static-neutral-bluish-1000);
  color: var(--dsw-static-neutral-bluish-100);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  --dsh-scrollbar-thumb: var(--dsw-static-neutral-bluish-750);
  --dsh-scrollbar-thumb-hover: var(--dsw-static-neutral-bluish-600);
}

/* ---- 窄窗口 ---- */
@media (max-width: 720px) {
  .bc-scroll {
    padding: 14px 14px 20px;
  }
  .bc-inner {
    gap: 16px;
  }
  .bc-header-actions {
    width: 100%;
    margin-left: 0;
  }
  .bc-updated {
    margin-right: auto;
  }
  .bc-dock-filter {
    width: 110px;
  }
  .bc-dock {
    width: calc(100% - 28px);
    margin-bottom: 12px;
  }
  .bc-dock-body {
    height: 160px;
  }
  /* 窄屏：卡片操作按钮换到第二行，单元名拿到整行宽度，不再截成 brain_se… */
  .bc-card-top {
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .bc-card-top .bc-spacer {
    flex: 1 1 100%;
    height: 0;
  }
  .bc-actions {
    margin-left: auto;
  }
}
.bc-embed-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.bc-embed-job {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.04));
}
.bc-embed-job-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-embed-job-head strong {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.bc-embed-job-head > span {
  flex: 1 1 auto;
  font-variant-numeric: tabular-nums;
}
.bc-embed-current {
  margin-top: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-embed-failures {
  margin-top: 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-embed-failures summary {
  cursor: pointer;
}
.bc-embed-failures ul {
  margin: 6px 0 0;
  padding-left: 16px;
  max-height: 120px;
  overflow: auto;
}
.bc-embed-failures code {
  font-size: 11px;
}

.bc-failed-ignore {
  flex: none;
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  cursor: pointer;
}
.bc-failed-ignore:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
}
.bc-failed-ignore:disabled {
  opacity: 0.45;
  cursor: default;
}

/* 统一对话框容器：dialog 限高到视口可用区，内容区自己滚动，头/脚固定。 */
.bc-dialog-capped {
  max-height: 100%;
}
.bc-dialog-content {
  min-height: 0;
  max-height: 100%;
}
.bc-dialog-scroll {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.bc-index-health {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bc-index-health h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.bc-index-note {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary);
}
.bc-index-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-index-row strong {
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
  text-align: right;
}
.bc-index-warn {
  color: var(--dsw-alias-state-warning-primary, #e0b341) !important;
}
.bc-index-sample {
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary);
}
.bc-index-domain-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px auto;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-index-domain-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.bc-index-domain-bar {
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.bc-index-domain-bar > div {
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-label-primary, #f9fafb);
}
.bc-index-domain-row > span:last-child {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.bc-cron-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 4px 0 8px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 35%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 8%, transparent);
  font-size: 11.5px;
  color: var(--dsw-alias-label-secondary);
}
.bc-cron-alert-text {
  color: var(--dsw-alias-label-primary);
}
.bc-cron-alert-actions {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}
.bc-cron-flag {
  margin-left: 6px;
  padding: 0 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cron-row[data-zombie='true'] {
  opacity: 0.55;
}

.bc-cron-all {
  margin-top: 6px;
}
.bc-cron-all > summary {
  cursor: pointer;
  list-style: none;
  padding: 2px 0;
  font-size: 11.5px;
  color: var(--dsw-alias-label-tertiary);
  user-select: none;
}
.bc-cron-all > summary::-webkit-details-marker {
  display: none;
}
.bc-cron-all > summary::before {
  content: '▸';
  margin-right: 6px;
  display: inline-block;
  transition: transform 0.12s ease;
}
.bc-cron-all[open] > summary::before {
  transform: rotate(90deg);
}
.bc-cron-all-list {
  margin-top: 4px;
  padding-left: 2px;
}

.bc-cron-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-cron-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #3fb950);
}
.bc-cron-row[data-status='warn'] .bc-cron-dot {
  background: var(--dsw-alias-state-warning-primary, #e0b341);
}
.bc-cron-row[data-status='bad'] .bc-cron-dot {
  background: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-cron-row[data-status='unknown'] .bc-cron-dot {
  background: var(--dsw-alias-label-tertiary, #8b8b94);
}
.bc-cron-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-cron-age {
  color: var(--dsw-alias-label-primary);
  font-variant-numeric: tabular-nums;
}
.bc-cron-interval {
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

.bc-index-health {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bc-index-section {
  display: block;
  margin: 0 0 4px;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-index-section:last-child {
  border-bottom: 0;
}
.bc-index-section > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.bc-index-section > summary::-webkit-details-marker {
  display: none;
}
.bc-index-section > summary::before {
  content: '▸';
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  transition: transform 0.12s ease;
}
.bc-index-section[open] > summary::before {
  transform: rotate(90deg);
}
.bc-index-section > summary h4 {
  margin: 0;
}
.bc-index-section > summary:hover h4 {
  color: var(--dsw-alias-label-primary);
}
.bc-auto {
  display: flex;
  flex-direction: column;
}

.bc-coverage {
  height: 4px;
  margin: 4px 0 8px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.bc-coverage-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-label-primary, #f9fafb);
  transition: width 0.2s ease;
}
`;
		/**
		* 注入控制台样式表。已有同 id 的元素时改写其内容，
		* 这样 HMR 重新求值模块也会带上新样式，而不会留下旧的一份。
		*/
		function ensureConsoleStyles() {
			if (typeof document === "undefined") return;
			const existing = document.getElementById(STYLE_ID);
			if (existing instanceof HTMLStyleElement) {
				existing.textContent = STYLES;
				return;
			}
			const element = document.createElement("style");
			element.id = STYLE_ID;
			element.textContent = STYLES;
			document.head.append(element);
		}
		//#endregion
		//#region src/page.tsx
		/**
		* ConsolePage — TiSenT Brain 面板（大脑各项服务的查看与人工启停）。
		*
		* 数据源是独立进程 `brain_manager`（127.0.0.1:19998）。本页面**只做组合与下发**：
		* 轮询、日志、历史、动作都拆在 `hooks/` 里，这里只保留弹窗开关、派生值、快捷键和 JSX。
		*
		* 布局：
		*   1) 标题行 —— 运行计数、最后刷新、刷新图标与「更多」菜单（备份 / 清理 / 开机启动）
		*   2) 概览指标带 —— 只读观察值（库大小/边/笔记/记忆/失败边/上次备份）
		*   3) 分组卡片 —— 状态灯 + 名称/端口/说明/运行信息 + 图标操作（日志/启停）
		*   4) 底部日志控制台 —— 常驻面板，不遮挡卡片
		*/
		ensureConsoleStyles();
		/**
		* 渲染大脑控制台。
		* @returns 页面元素
		*/
		function ConsolePage() {
			const { history, refreshHistory } = useHistory();
			const feed = useConsoleFeed(() => {
				refreshHistory();
			});
			const logDock = useLogDock();
			const actions = useConsoleActions({
				units: feed.units,
				load: feed.load,
				log: logDock.log,
				readLog: logDock.readLog
			});
			const [backupOpen, setBackupOpen] = (0, react.useState)(false);
			const [cacheOpen, setCacheOpen] = (0, react.useState)(false);
			const [failedOpen, setFailedOpen] = (0, react.useState)(false);
			const [indexOpen, setIndexOpen] = (0, react.useState)(false);
			const [cronAlerts, setCronAlerts] = (0, react.useState)(null);
			const [autoRecoverOpen, setAutoRecoverOpen] = (0, react.useState)(false);
			const [trend, setTrend] = (0, react.useState)(null);
			const [detailName, setDetailName] = (0, react.useState)(null);
			const [stopGroup, setStopGroup] = (0, react.useState)(null);
			const [restartGroup, setRestartGroup] = (0, react.useState)(null);
			const [stopUnit, setStopUnit] = (0, react.useState)(null);
			const [clearLogOpen, setClearLogOpen] = (0, react.useState)(false);
			const [shutdownOpen, setShutdownOpen] = (0, react.useState)(false);
			const downloadDiagnostics = () => {
				const anchor = document.createElement("a");
				anchor.href = DIAGNOSTICS_URL;
				anchor.rel = "noopener";
				anchor.click();
			};
			const [workingBusy, setWorkingBusy] = (0, react.useState)(null);
			const toggleAutostart = async () => {
				const autostart = feed.autostart;
				if (autostart === null || !autostart.supported) return;
				setWorkingBusy("autostart");
				actions.setActionError(null);
				try {
					await postManager("/autostart", { enabled: !autostart.enabled });
					await feed.load();
				} catch (error) {
					actions.setActionError(`开机启动设置失败：${reasonOf(error)}`);
				} finally {
					setWorkingBusy(null);
				}
			};
			const startManager = async () => {
				setWorkingBusy("manager");
				try {
					const res = await fetch("/brain-console/api/manager/start", { method: "POST" });
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					await feed.load();
				} finally {
					setWorkingBusy(null);
				}
			};
			const shutdownManager = async () => {
				setWorkingBusy("manager-stop");
				try {
					await postManager("/manager/stop");
				} catch (error) {
					actions.setActionError(`关闭启动器失败：${reasonOf(error)}`);
				} finally {
					setWorkingBusy(null);
					setShutdownOpen(false);
				}
			};
			const busy = workingBusy ?? actions.busy;
			const handleAction = (name, action) => {
				if (action === "stop") {
					const runningDependents = feed.units.filter((unit) => unit.running && (unit.depends ?? []).includes(name)).map((unit) => unit.name);
					if (runningDependents.length > 0) {
						setStopUnit({
							name,
							dependents: runningDependents
						});
						return;
					}
				}
				actions.act(name, action);
			};
			const confirmClearLog = async () => {
				try {
					await logDock.clearLogNow();
				} catch (error) {
					actions.setActionError(`${logDock.logName ?? "日志"} 清空失败：${reasonOf(error)}`);
				} finally {
					setClearLogOpen(false);
				}
			};
			const running = feed.units.filter((unit) => unit.running).length;
			const abnormalCount = feed.units.filter((unit) => unit.state !== "运行中" && unit.state !== "已停止").length;
			const focusAbnormal = () => {
				document.querySelector("article.bc-card[data-abnormal=\"true\"]")?.scrollIntoView({
					behavior: "smooth",
					block: "center"
				});
			};
			const groups = Array.from(new Set(feed.units.map((unit) => unit.group)));
			const autostartOn = feed.autostart?.supported === true && feed.autostart.enabled;
			const dependentsByUnit = {};
			for (const unit of feed.units) for (const dependency of unit.depends ?? []) dependentsByUnit[dependency] = [...dependentsByUnit[dependency] ?? [], unit.name];
			const now = Date.now();
			const detailUnit = detailName === null ? void 0 : feed.units.find((unit) => unit.name === detailName);
			const openLog = logDock.log;
			(0, react.useEffect)(() => {
				if (feed.overview !== null && history === null) refreshHistory();
			}, [
				feed.overview,
				history,
				refreshHistory
			]);
			(0, react.useEffect)(() => {
				(async () => {
					try {
						const health = await loadIndexHealth();
						setCronAlerts({
							stale: health.stale_crons?.length ?? 0,
							zombies: health.zombie_crons?.length ?? 0
						});
					} catch {}
				})();
			}, [feed.updatedAt]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					const target = event.target instanceof HTMLElement ? event.target : null;
					const typing = target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
					if (event.key === "Escape") {
						if (document.querySelector("[role=\"dialog\"]") !== null) return;
						logDock.closeLog();
						return;
					}
					if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
					if (event.key === "r") {
						event.preventDefault();
						feed.load(true);
					}
					if (event.key === "/") {
						event.preventDefault();
						document.querySelector(".bc-dock-filter")?.focus();
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [feed.load, logDock.closeLog]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "bc-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "bc-scroll",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "bc-inner",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
									className: "bc-header",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "bc-logo",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrainConsoleIcon, {
												size: 18,
												title: "TiSenT Brain"
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
											className: "bc-title",
											children: "TiSenT Brain"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
											label: autostartOn ? "开机启动：已开启（⋯ 菜单里可关）" : "开机启动：未开启（⋯ 菜单里可开）",
											side: "bottom",
											delayMs: 150,
											portal: true,
											disabled: feed.autostart === null || !feed.autostart.supported,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-count",
												"data-tone": feed.units.length > 0 && running === feed.units.length ? "all" : void 0,
												"data-autostart": autostartOn ? "on" : "off",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-count-dot" }), feed.units.length === 0 ? "—" : `${running} / ${feed.units.length} 运行中`]
											})
										}),
										abnormalCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "bc-header-alert",
											title: "定位到第一个异常单元",
											onClick: focusAbnormal,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-status-dot",
													"aria-hidden": "true"
												}),
												abnormalCount,
												" 个异常"
											]
										}),
										(cronAlerts?.stale ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "bc-header-alert",
											title: "查看过期的定时任务",
											onClick: () => setIndexOpen(true),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-status-dot",
													"aria-hidden": "true"
												}),
												cronAlerts?.stale,
												" 个定时任务过期"
											]
										}),
										(cronAlerts?.stale ?? 0) === 0 && (cronAlerts?.zombies ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "bc-header-alert",
											title: "查看并清理失效心跳",
											onClick: () => setIndexOpen(true),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "bc-status-dot",
													"aria-hidden": "true"
												}),
												cronAlerts?.zombies,
												" 条失效心跳"
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "bc-header-actions",
											children: [
												feed.updatedAt !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "bc-updated",
													children: ["最后刷新 ", feed.updatedAt]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: "刷新",
													icon: IconRefresh,
													busy: feed.refreshing,
													onClick: () => void feed.load(true)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MoreMenu, {
													autostart: feed.autostart,
													busy,
													onBackup: () => void actions.backup(),
													onPrune: () => setBackupOpen(true),
													onCaches: () => setCacheOpen(true),
													onIndex: () => setIndexOpen(true),
													onAutoRecover: () => setAutoRecoverOpen(true),
													onDiagnostics: downloadDiagnostics,
													onToggleAutostart: () => void toggleAutostart(),
													onShutdown: () => setShutdownOpen(true)
												})
											]
										})
									]
								}),
								feed.connectionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-notice",
									"data-kind": "connection",
									role: "status",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-notice-body",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "bc-notice-title",
											children: "无法连接 brain_manager（127.0.0.1:19998）"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "bc-notice-text",
											children: [feed.connectionError, "。面板是管理器的前端，管理器没跑时无法启停单元，可由宿主代为拉起"]
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "bc-notice-actions",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											disabled: busy !== null,
											onClick: () => void startManager(),
											children: busy === "manager" ? "启动中…" : "启动管理器"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => void feed.load(true),
											children: "重试"
										})]
									})]
								}),
								actions.actionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-notice",
									"data-kind": "action",
									role: "status",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "bc-notice-body",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "bc-notice-text",
											children: actions.actionError
										})
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "bc-notice-actions",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => actions.setActionError(null),
											children: "知道了"
										})
									})]
								}),
								feed.overview !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OverviewTiles, {
									overview: feed.overview,
									now,
									history,
									onOpenTrend: (key) => setTrend(key)
								}),
								!feed.loaded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-loading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, { state: "ongoing" }), "正在连接 brain_manager…"]
								}) : feed.units.length === 0 ? feed.connectionError === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "bc-empty",
									children: "管理器没有返回受管单元"
								}) : null : groups.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UnitSection, {
									group,
									members: feed.units.filter((unit) => unit.group === group),
									now,
									busy,
									logName: logDock.logName,
									dependents: dependentsByUnit,
									onLog: logDock.toggleLog,
									onAction: handleAction,
									onStartAll: (group) => void actions.startGroup(group),
									onStopAll: (group) => setStopGroup({
										group,
										names: feed.units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name)
									}),
									onRestartAll: (group) => setRestartGroup({
										group,
										names: feed.units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name)
									}),
									onToggleEnabled: (name, enabled) => void actions.setUnitEnabled(name, enabled),
									onAdopt: (name) => void actions.adoptUnit(name),
									onDetail: (name) => setDetailName(name)
								}, group))
							]
						})
					}),
					backupOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackupDialog, {
						load: loadBackups,
						prune: pruneBackups,
						restore: restoreBackup,
						onChanged: () => {
							feed.load();
						},
						onClose: () => setBackupOpen(false)
					}),
					trend !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrendDialog, {
						metric: metricSpec(trend),
						points: history?.points ?? [],
						onOpenFailed: trend === "failure_edges" ? () => {
							setTrend(null);
							setFailedOpen(true);
						} : void 0,
						onClose: () => setTrend(null)
					}),
					failedOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FailedEdgesDialog, {
						load: loadFailedEdges,
						onClose: () => setFailedOpen(false)
					}),
					indexOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IndexHealthDialog, { onClose: () => setIndexOpen(false) }),
					autoRecoverOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AutoRecoverDialog, { onClose: () => setAutoRecoverOpen(false) }),
					cacheOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CacheDialog, {
						load: loadCaches,
						prune: pruneCaches,
						onClose: () => setCacheOpen(false)
					}),
					stopGroup !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupActionDialog, {
						title: `停止「${stopGroup.group}」`,
						description: `将停止 ${stopGroup.names.length} 个正在运行的单元，并写入抑制清单`,
						names: stopGroup.names,
						note: "停止后它们不会随管理器启动自动恢复，需要手动再点启动",
						confirmLabel: `停止 ${stopGroup.names.length} 个`,
						busyLabel: "停止中…",
						busy: busy === `stop-group:${stopGroup.group}`,
						onCancel: () => setStopGroup(null),
						onConfirm: () => {
							actions.stopGroupNow(stopGroup.group, stopGroup.names).finally(() => setStopGroup(null));
						}
					}),
					restartGroup !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupActionDialog, {
						title: `重启「${restartGroup.group}」`,
						description: `将重启 ${restartGroup.names.length} 个正在运行的单元`,
						names: restartGroup.names,
						note: "重启会中断它们几秒到十几秒；期间依赖它们的调用可能失败",
						confirmLabel: `重启 ${restartGroup.names.length} 个`,
						busyLabel: "重启中…",
						busy: busy === `restart-group:${restartGroup.group}`,
						onCancel: () => setRestartGroup(null),
						onConfirm: () => {
							actions.restartGroupNow(restartGroup.group, restartGroup.names).finally(() => setRestartGroup(null));
						}
					}),
					openLog !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LogDock, {
						name: openLog.name,
						text: openLog.text,
						loading: openLog.loading,
						readAt: openLog.at,
						paused: logDock.paused,
						lines: logDock.lines,
						onRefresh: () => void logDock.readLog(openLog.name),
						onTogglePause: () => logDock.setPaused(!logDock.paused),
						onCycleLines: logDock.cycleLines,
						onClear: () => setClearLogOpen(true),
						onClose: logDock.closeLog
					}),
					detailUnit !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UnitDetailDialog, {
						unit: detailUnit,
						now,
						dependents: dependentsByUnit[detailUnit.name] ?? [],
						onClose: () => setDetailName(null)
					}),
					stopUnit !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmDialog, {
						title: `停止「${stopUnit.name}」`,
						description: `${stopUnit.dependents.join("、")} 依赖它，停止后这些单元会失去后端`,
						note: "停止会写抑制清单并把持久意愿置为 False，不会随管理器启动自动恢复",
						confirmLabel: "停止",
						busyLabel: "停止中…",
						busy: busy === `${stopUnit.name}:stop`,
						onCancel: () => setStopUnit(null),
						onConfirm: () => {
							const target = stopUnit.name;
							setStopUnit(null);
							actions.act(target, "stop");
						}
					}),
					shutdownOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmDialog, {
						title: "关闭启动器",
						description: `将停止全部 ${running} 个正在运行的单元，并结束 brain_manager 进程`,
						note: "之后面板无法启停任何单元；需要时可用连接提示里的「启动管理器」重新拉起（或运行 start_manager.cmd）",
						confirmLabel: "关闭",
						busyLabel: "关闭中…",
						busy: busy === "manager-stop",
						onCancel: () => setShutdownOpen(false),
						onConfirm: () => void shutdownManager()
					}),
					clearLogOpen && openLog !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmDialog, {
						title: `清空「${openLog.name}」日志`,
						description: "把该单元的日志文件截断为空",
						note: "旧内容不可恢复；正在运行的服务会从空文件继续写入",
						confirmLabel: "清空",
						busyLabel: "清空中…",
						busy: logDock.clearing,
						onCancel: () => setClearLogOpen(false),
						onConfirm: () => void confirmClearLog()
					})
				]
			});
		}
		//#endregion
		//#region src/client.tsx
		/** Services the browser half reads. */
		const inject = ["slots"];
		const PANEL_ID = "brain-console";
		function apply(ctx) {
			ctx.effect(() => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 30,
				label: () => "TiSenT Brain"
			}, BrainConsoleIcon)), "brain-console: panel entry");
			ctx.effect(() => ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID
			}, ConsolePage)), "brain-console: page");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
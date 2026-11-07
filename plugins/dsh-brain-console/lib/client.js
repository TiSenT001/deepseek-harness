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
		/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
		function reasonOf$3(error) {
			if (error instanceof TypeError) return "连接被拒绝或超时";
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* 渲染备份清理对话框。
		* @param props - 读写回调与关闭命令
		* @returns 对话框元素（挂载即打开，由父组件条件渲染）
		*/
		function BackupDialog({ load, prune, onChanged, onClose }) {
			const [listing, setListing] = (0, react.useState)(null);
			const [keep, setKeep] = (0, react.useState)(DEFAULT_KEEP);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [result, setResult] = (0, react.useState)(null);
			/** 重新拉列表；保留数收进 [1, 快照数] 区间，避免列表变短后停在上一次的大值。 */
			const refresh = (0, react.useCallback)(async () => {
				try {
					const answer = await load();
					setListing(answer);
					setKeep((current) => Math.min(Math.max(1, current), Math.max(1, answer.files.length)));
					setError(null);
				} catch (e) {
					setError(reasonOf$3(e));
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
					setError(reasonOf$3(e));
				} finally {
					setBusy(false);
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
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
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-backup-main",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-backup-name",
									title: file.name,
									children: file.name
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "bc-backup-tag",
									children: index < keep ? "保留" : "将删除"
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "bc-backup-sub",
								children: [
									file.at,
									" · ",
									formatMegabytes(file.size_mb)
								]
							})]
						}, file.name))
					})] }),
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
		/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
		function reasonOf$2(error) {
			if (error instanceof TypeError) return "连接被拒绝或超时";
			return error instanceof Error ? error.message : String(error);
		}
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
					setError(reasonOf$2(e));
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
					setError(reasonOf$2(e));
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
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
		/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
		function reasonOf$1(error) {
			if (error instanceof TypeError) return "连接被拒绝或超时";
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* 渲染失败边明细。
		* @param props - 读取回调与关闭命令
		* @returns 对话框元素（挂载即打开并读取）
		*/
		function FailedEdgesDialog({ load, onClose }) {
			const [listing, setListing] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				(async () => {
					try {
						setListing(await load());
					} catch (e) {
						setError(reasonOf$1(e));
					}
				})();
			}, [load]);
			const footer = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onClose,
				children: "关闭"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
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
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "bc-failed-name",
									title: `${edge.source}\n→ ${edge.target}`,
									children: [
										shortName(edge.source),
										" → ",
										shortName(edge.target)
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "bc-failed-count",
									children: ["失败 ", edge.failures]
								})]
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
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
		function LogDock({ name, text, loading, readAt, onRefresh, onClose }) {
			const body = (0, react.useRef)(null);
			const follow = (0, react.useRef)(true);
			const [filter, setFilter] = (0, react.useState)("");
			const [copied, setCopied] = (0, react.useState)(false);
			const lines = (0, react.useMemo)(() => text.split("\n"), [text]);
			const shownLines = (0, react.useMemo)(() => {
				const needle = filter.trim().toLowerCase();
				if (needle === "") return lines;
				return lines.filter((line) => line.toLowerCase().includes(needle));
			}, [lines, filter]);
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
								lines.length
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							label: copied ? "已复制" : "复制日志",
							icon: copied ? IconCheck : IconCopy,
							onClick: () => void copy()
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
		* @param props - 开机启动状态、忙碌标记与四个动作
		* @returns 菜单入口（含锚定菜单）
		*/
		function MoreMenu({ autostart, busy, onBackup, onPrune, onCaches, onToggleAutostart }) {
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
			const select = (id) => {
				setOpen(false);
				if (id === "backup") onBackup();
				else if (id === "prune") onPrune();
				else if (id === "caches") onCaches();
				else if (id === "autostart") onToggleAutostart();
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
		* @param props - 单元快照与两个单元级动作
		* @returns 菜单入口（含锚定菜单）
		*/
		function UnitMenu({ unit, disabled, onToggleEnabled, onAdopt }) {
			const [open, setOpen] = (0, react.useState)(false);
			const items = [{
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
				if (id === "enabled") onToggleEnabled(unit.name, !unit.enabled);
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
		function ServiceCard({ unit, now, busyAction, disabled, logOpen, onLog, onAction, onToggleEnabled, onAdopt }) {
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: "bc-card",
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
		//#region src/ui/StatTiles.tsx
		/**
		* 概览指标带：数据库 / 知识边 / 笔记 / 记忆 / 失败边 / 上次备份。
		*
		* 只读观察值，不提供操作；「失败边」是唯一例外：点开看明细（只读清单）。
		* 有失败边时整块换成警示底色，而不是把数字染成低对比度文字。
		*/
		function Stat({ label, value, hint, tone }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "bc-kpi",
				"data-tone": tone,
				children: [
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
					})
				]
			});
		}
		/**
		* 渲染概览指标。
		* @param props.overview - `/status` 返回值；为空时不渲染
		* @param props.now - 当前毫秒时间戳，用于相对时间
		* @param props.onOpenFailed - 点开「失败边」明细
		* @returns 指标网格元素
		*/
		function OverviewTiles({ overview, now, onOpenFailed }) {
			const backupAt = overview.last_backup.at;
			const backupSize = overview.last_backup.size_mb;
			const backupHint = [formatShortMoment(backupAt), backupSize === null ? null : formatMegabytes(backupSize)].filter((part) => part !== null).join(" · ");
			const hasFailures = (overview.failure_edges ?? 0) > 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "bc-kpis",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "数据库",
						value: formatMegabytes(overview.db_size_mb),
						hint: "brain.db"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "知识边",
						value: formatCount(overview.edges),
						hint: "图谱连接"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "笔记",
						value: formatCount(overview.notes),
						hint: "vault 索引"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stat, {
						label: "记忆",
						value: formatCount(overview.sessions),
						hint: "会话记忆"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "bc-kpi bc-kpi-action",
						"data-tone": hasFailures ? "warn" : void 0,
						onClick: onOpenFailed,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "bc-kpi-label",
								children: "失败边"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "bc-kpi-value",
								children: formatCount(overview.failure_edges)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "bc-kpi-hint",
								children: "待消解 · 查看"
							})
						]
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
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
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
		* 数据源是独立进程 `brain_manager`（127.0.0.1:19998）。本页面**只做展示与下发**，
		* 不推断状态：每次操作后重新拉 /units，以管理器返回为准（避免 UI 和实际不一致）。
		*
		* 布局：
		*   1) 标题行 —— 运行计数、最后刷新、刷新图标与「更多」菜单（备份 / 清理 / 开机启动）
		*   2) 概览指标带 —— 只读观察值（库大小/边/笔记/记忆/失败边/上次备份）
		*   3) 分组卡片 —— 状态灯 + 名称/端口/说明/运行信息 + 图标操作（日志/启停）
		*   4) 底部日志控制台 —— 常驻面板，不遮挡卡片
		*/
		ensureConsoleStyles();
		/** brain_manager 的 HTTP 地址。 */
		const API = "http://127.0.0.1:19998";
		/** 自动刷新间隔（毫秒）。 */
		const POLL_MS = 5e3;
		/** 日志读取行数。 */
		const LOG_LINES = 120;
		/** 日志面板打开时的静默刷新间隔（毫秒）。 */
		const LOG_POLL_MS = 4e3;
		const ACTION_LABEL = {
			start: "启动",
			stop: "停止",
			restart: "重启"
		};
		async function jget(path) {
			const res = await fetch(`${API}${path}`, { cache: "no-store" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		}
		async function postManager(path, body) {
			await postJson(path, body);
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
		/** 备份对话框的回调做成模块级常量：引用稳定，对话框只在挂载时拉一次列表。 */
		const loadBackups = () => jget("/actions/backups");
		const pruneBackups = (keep) => postJson("/actions/prune-backups", { keep });
		/** 失败边明细：KPI 点开时读一次实时清单。 */
		const loadFailedEdges = () => jget("/quality/failed-edges?limit=80");
		/** 缓存对话框的回调同样模块级（引用稳定）。 */
		const loadCaches = () => jget("/actions/caches");
		const pruneCaches = (ids) => postJson("/actions/caches/prune", { ids });
		/** 把未知异常收敛成一句话；浏览器 fetch 的网络失败只有 TypeError，换成中文便于阅读。 */
		function reasonOf(error) {
			if (error instanceof TypeError) return "连接被拒绝或超时";
			return error instanceof Error ? error.message : String(error);
		}
		/** 从 `<name>:<action>` 里取出正在执行的动作；不属于该单元则为 null。 */
		function busyActionOf(busy, name) {
			if (busy === null) return null;
			const [unit, action] = busy.split(":");
			if (unit !== name) return null;
			return action === "start" || action === "stop" || action === "restart" ? action : null;
		}
		function UnitSection({ group, members, now, busy, logName, onLog, onAction, onStartAll, onStopAll, onRestartAll, onToggleEnabled, onAdopt }) {
			const running = members.filter((unit) => unit.running).length;
			const stopped = members.length - running;
			const abnormal = members.filter((unit) => unit.state !== "运行中" && unit.state !== "已停止").length;
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
							children: [abnormal, " 个异常"]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-rule" })
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "bc-grid",
					children: members.map((unit) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceCard, {
						unit,
						now,
						busyAction: busyActionOf(busy, unit.name),
						disabled: busy !== null,
						logOpen: logName === unit.name,
						onLog,
						onAction,
						onToggleEnabled,
						onAdopt
					}, unit.name))
				})]
			});
		}
		function ConsolePage() {
			const [units, setUnits] = (0, react.useState)([]);
			const [overview, setOverview] = (0, react.useState)(null);
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(null);
			const [connectionError, setConnectionError] = (0, react.useState)(null);
			const [actionError, setActionError] = (0, react.useState)(null);
			const [updatedAt, setUpdatedAt] = (0, react.useState)(null);
			const [log, setLog] = (0, react.useState)(null);
			const [autostart, setAutostart] = (0, react.useState)(null);
			const [backupOpen, setBackupOpen] = (0, react.useState)(false);
			const [cacheOpen, setCacheOpen] = (0, react.useState)(false);
			const [failedOpen, setFailedOpen] = (0, react.useState)(false);
			const [stopGroup, setStopGroup] = (0, react.useState)(null);
			const [restartGroup, setRestartGroup] = (0, react.useState)(null);
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
			const readLog = (0, react.useCallback)(async (name, silent = false) => {
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
					const answer = await jget(`/units/${name}/log?lines=${LOG_LINES}`);
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
			}, []);
			const logName = log?.name ?? null;
			(0, react.useEffect)(() => {
				if (logName === null) return;
				const timer = setInterval(() => {
					readLog(logName, true);
				}, LOG_POLL_MS);
				return () => clearInterval(timer);
			}, [logName, readLog]);
			const toggleLog = (name) => {
				if (log?.name === name) {
					setLog(null);
					return;
				}
				readLog(name);
			};
			const act = async (name, action) => {
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
			};
			const startGroup = async (group) => {
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
			};
			const stopGroupNow = async (group, names) => {
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
					setStopGroup(null);
				}
				if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没停下来：${failures.join("；")}`);
			};
			const restartGroupNow = async (group, names) => {
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
					setRestartGroup(null);
				}
				if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没重启：${failures.join("；")}`);
			};
			const setUnitEnabled = async (name, enabled) => {
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
			};
			const adoptUnit = async (name) => {
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
			};
			const toggleAutostart = async () => {
				if (autostart === null || !autostart.supported) return;
				setBusy("autostart");
				setActionError(null);
				try {
					await postManager("/autostart", { enabled: !autostart.enabled });
					await load();
				} catch (error) {
					setActionError(`开机启动设置失败：${reasonOf(error)}`);
				} finally {
					setBusy(null);
				}
			};
			const backup = async () => {
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
			};
			const startManager = async () => {
				setBusy("manager");
				try {
					const res = await fetch("/brain-console/api/manager/start", { method: "POST" });
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					await load();
				} catch (error) {
					setConnectionError(reasonOf(error));
				} finally {
					setBusy(null);
				}
			};
			const running = units.filter((unit) => unit.running).length;
			const groups = Array.from(new Set(units.map((unit) => unit.group)));
			const autostartOn = autostart?.supported === true && autostart.enabled;
			const now = Date.now();
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
											disabled: autostart === null || !autostart.supported,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "bc-count",
												"data-tone": units.length > 0 && running === units.length ? "all" : void 0,
												"data-autostart": autostartOn ? "on" : "off",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "bc-count-dot" }), units.length === 0 ? "—" : `${running} / ${units.length} 运行中`]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "bc-header-actions",
											children: [
												updatedAt !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "bc-updated",
													children: ["最后刷新 ", updatedAt]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: "刷新",
													icon: IconRefresh,
													busy: refreshing,
													onClick: () => void load(true)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MoreMenu, {
													autostart,
													busy,
													onBackup: () => void backup(),
													onPrune: () => setBackupOpen(true),
													onCaches: () => setCacheOpen(true),
													onToggleAutostart: () => void toggleAutostart()
												})
											]
										})
									]
								}),
								connectionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
											children: [connectionError, "。面板是管理器的前端，管理器没跑时无法启停单元，可由宿主代为拉起"]
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
											onClick: () => void load(true),
											children: "重试"
										})]
									})]
								}),
								actionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-notice",
									"data-kind": "action",
									role: "status",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "bc-notice-body",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "bc-notice-text",
											children: actionError
										})
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "bc-notice-actions",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setActionError(null),
											children: "知道了"
										})
									})]
								}),
								overview !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OverviewTiles, {
									overview,
									now,
									onOpenFailed: () => setFailedOpen(true)
								}),
								!loaded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "bc-loading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, { state: "ongoing" }), "正在连接 brain_manager…"]
								}) : units.length === 0 ? connectionError === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "bc-empty",
									children: "管理器没有返回受管单元"
								}) : null : groups.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UnitSection, {
									group,
									members: units.filter((unit) => unit.group === group),
									now,
									busy,
									logName: log?.name ?? null,
									onLog: toggleLog,
									onAction: (name, action) => void act(name, action),
									onStartAll: (group) => void startGroup(group),
									onStopAll: (group) => setStopGroup({
										group,
										names: units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name)
									}),
									onRestartAll: (group) => setRestartGroup({
										group,
										names: units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name)
									}),
									onToggleEnabled: (name, enabled) => void setUnitEnabled(name, enabled),
									onAdopt: (name) => void adoptUnit(name)
								}, group))
							]
						})
					}),
					backupOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackupDialog, {
						load: loadBackups,
						prune: pruneBackups,
						onChanged: () => {
							load();
						},
						onClose: () => setBackupOpen(false)
					}),
					failedOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FailedEdgesDialog, {
						load: loadFailedEdges,
						onClose: () => setFailedOpen(false)
					}),
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
						onConfirm: () => void stopGroupNow(stopGroup.group, stopGroup.names)
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
						onConfirm: () => void restartGroupNow(restartGroup.group, restartGroup.names)
					}),
					log !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LogDock, {
						name: log.name,
						text: log.text,
						loading: log.loading,
						readAt: log.at,
						onRefresh: () => void readLog(log.name),
						onClose: () => setLog(null)
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
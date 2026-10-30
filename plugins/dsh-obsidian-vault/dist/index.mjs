import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { appendFile, copyFile, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
//#region src/http.ts
/**
* Write one JSON response.
* @param response - server response to complete.
* @param status - HTTP status code.
* @param body - JSON-serializable payload.
*/
function send(response, status, body) {
	const payload = JSON.stringify(body);
	response.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	response.end(payload);
}
/**
* Read a request body as a JSON object; malformed or empty bodies become `{}`.
* @param request - incoming request.
*/
async function readJson(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(Buffer.from(chunk));
	if (chunks.length === 0) return {};
	try {
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}
//#endregion
//#region src/protocol.ts
/** Route prefix the Host half mounts its JSON API under. */
const API_BASE = "/obsidian/api";
//#endregion
//#region src/vault/files.ts
/**
* Vault file operations. The harness `fs` service exposes reads and atomic text
* writes but no rename, remove, mkdir, or mtime, so these few operations go
* through Node's fs confined to the vault root by an explicit containment check.
* @module dsh-obsidian-vault/vault/files
*/
/** Thrown when a requested path escapes the vault root. */
var VaultPathError = class extends Error {
	/** @param path - the offending relative path. */
	constructor(path) {
		super(`path escapes the vault root: ${path}`);
		this.name = "VaultPathError";
	}
};
/** File operations that stay inside one vault root. */
var VaultFiles = class {
	root;
	/** @param root - absolute vault directory. */
	constructor(root) {
		this.root = resolve(root);
	}
	/**
	* Resolve a vault-relative path, refusing anything outside the root.
	* @param relativePath - path with `/` separators.
	*/
	absolute(relativePath) {
		const candidate = resolve(join(this.root, relativePath));
		const relation = relative(this.root, candidate);
		if (relation.startsWith("..") || isAbsolute(relation)) throw new VaultPathError(relativePath);
		return candidate;
	}
	/**
	* Modification time of one file.
	* @param relativePath - vault-relative path.
	* @returns epoch milliseconds, or undefined when the file is absent.
	*/
	async mtimeOf(relativePath) {
		try {
			return (await stat(this.absolute(relativePath))).mtimeMs;
		} catch {
			return;
		}
	}
	/**
	* Size and modification time of one file.
	* @param relativePath - vault-relative path.
	* @returns the metadata, or undefined when the file is absent or a directory.
	*/
	async info(relativePath) {
		try {
			const stats = await stat(this.absolute(relativePath));
			if (!stats.isFile()) return void 0;
			return {
				size: stats.size,
				mtime: stats.mtimeMs
			};
		} catch {
			return;
		}
	}
	/**
	* Read at most `maxBytes` from the start of one file.
	* @param relativePath - vault-relative path.
	* @param maxBytes - inclusive byte cap.
	* @returns the decoded prefix, whether the file continues, and its full size.
	*/
	async readPrefix(relativePath, maxBytes) {
		const handle = await open(this.absolute(relativePath), "r");
		try {
			const stats = await handle.stat();
			const limit = Math.min(stats.size, maxBytes);
			const buffer = Buffer.alloc(limit);
			const { bytesRead } = await handle.read(buffer, 0, limit, 0);
			return {
				text: new TextDecoder("utf-8").decode(buffer.subarray(0, bytesRead)).replace(/\uFFFD$/, ""),
				truncated: stats.size > bytesRead,
				size: stats.size
			};
		} finally {
			await handle.close();
		}
	}
	/**
	* Delete one file or directory inside the vault.
	* @param relativePath - vault-relative path.
	*/
	async remove(relativePath) {
		await rm(this.absolute(relativePath), {
			force: false,
			recursive: true
		});
	}
	/**
	* Create one file, failing when it already exists.
	* @param relativePath - vault-relative path.
	* @param content - initial text.
	*/
	async writeNew(relativePath, content) {
		await writeFile(this.absolute(relativePath), content, {
			encoding: "utf8",
			flag: "wx"
		});
	}
	/**
	* Read one file as UTF-8 text.
	* @param relativePath - vault-relative path.
	*/
	async readText(relativePath) {
		return readFile(this.absolute(relativePath), "utf8");
	}
	/**
	* Replace one file's text.
	* @param relativePath - vault-relative path.
	* @param content - new text.
	*/
	async writeText(relativePath, content) {
		await writeFile(this.absolute(relativePath), content, "utf8");
	}
	/**
	* Read one file as raw bytes.
	* @param relativePath - vault-relative path.
	*/
	async readBytes(relativePath) {
		return readFile(this.absolute(relativePath));
	}
	/**
	* Replace one file's bytes, creating missing parent directories.
	* @param relativePath - vault-relative path.
	* @param data - new content.
	*/
	async writeBytes(relativePath, data) {
		const target = this.absolute(relativePath);
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, data);
	}
	/**
	* Whether a path exists.
	* @param relativePath - vault-relative path.
	*/
	async exists(relativePath) {
		try {
			await stat(this.absolute(relativePath));
			return true;
		} catch {
			return false;
		}
	}
	/**
	* Recursively list the vault's files with stats, skipping dot-directories
	* (`.obsidian`, `.trash`) — the bridge's frame builds its TFile cache from it.
	* @returns one entry per file, vault-relative paths with `/` separators.
	*/
	async list() {
		const out = [];
		const walk = async (directory, prefix) => {
			const entries = await readdir(directory, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.name.startsWith(".")) continue;
				const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
				if (entry.isDirectory()) {
					await walk(join(directory, entry.name), path);
					continue;
				}
				const stats = await stat(join(directory, entry.name));
				out.push({
					path,
					name: entry.name,
					extension: extname(entry.name).slice(1).toLowerCase(),
					size: stats.size,
					mtime: stats.mtimeMs,
					ctime: stats.birthtimeMs
				});
			}
		};
		await walk(this.root, "");
		return out;
	}
	/**
	* Move one entry to a new path, creating the parent directory.
	* @param from - current vault-relative path.
	* @param to - destination vault-relative path.
	*/
	async move(from, to) {
		const target = this.absolute(to);
		await mkdir(dirname(target), { recursive: true });
		await rename(this.absolute(from), target);
	}
	/**
	* Copy one entry into `.trash/<tag>/` as a rollback point.
	* @param relativePath - vault-relative path.
	* @param tag - folder name under `.trash`.
	* @returns the vault-relative backup path.
	*/
	async backup(relativePath, tag) {
		const target = `.trash/${tag}/${relativePath.slice(relativePath.lastIndexOf("/") + 1)}`;
		await mkdir(dirname(this.absolute(target)), { recursive: true });
		await copyFile(this.absolute(relativePath), this.absolute(target));
		return target;
	}
	/**
	* Move one entry into `.trash` instead of deleting it, mirroring Obsidian's
	* default so a mis-click stays recoverable.
	* @param relativePath - vault-relative path.
	* @returns the vault-relative trash path.
	*/
	async moveToTrash(relativePath) {
		const trash = ".trash";
		await mkdir(this.absolute(trash), { recursive: true });
		const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
		const target = `${trash}/${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${name}`;
		await rename(this.absolute(relativePath), this.absolute(target));
		return target;
	}
	/**
	* Create a directory, including missing parents, inside the vault.
	* @param relativePath - vault-relative directory path.
	*/
	async mkdir(relativePath) {
		await mkdir(this.absolute(relativePath), { recursive: true });
	}
	/** The root directory, with `/` separators normalized by Node on use. */
	get directory() {
		return this.root;
	}
	/** Separator this platform uses, for building display paths. */
	get separator() {
		return sep;
	}
};
//#endregion
//#region src/bridge-endpoints.ts
/**
* Serve one `bridge/*` route against the active vault.
* @param registry - live vault registry; the active vault supplies the root.
* @param route - path after the API prefix, e.g. `bridge/data`.
* @param request - incoming request.
* @param response - response to complete.
*/
async function serveBridgeRoute(registry, route, request, response) {
	const files = new VaultFiles(registry.active()?.path ?? registry.vault.status().root);
	try {
		switch (route) {
			case "bridge/read-binary": {
				const path = new URL(request.url ?? "/", "http://localhost").searchParams.get("path") ?? "";
				if (path.length === 0) {
					send(response, 400, { error: "path is required" });
					return;
				}
				send(response, 200, {
					path,
					data: (await files.readBytes(path)).toString("base64")
				});
				return;
			}
			case "bridge/read-text": {
				const path = new URL(request.url ?? "/", "http://localhost").searchParams.get("path") ?? "";
				if (path.length === 0) {
					send(response, 400, { error: "path is required" });
					return;
				}
				send(response, 200, {
					path,
					content: await files.readText(path)
				});
				return;
			}
			case "bridge/write-text": {
				const body = await readJson(request);
				const path = typeof body["path"] === "string" ? body["path"] : "";
				const content = typeof body["content"] === "string" ? body["content"] : void 0;
				if (path.length === 0 || content === void 0) {
					send(response, 400, { error: "path and content are required" });
					return;
				}
				await files.writeText(path, content);
				send(response, 200, {
					ok: true,
					path
				});
				return;
			}
			case "bridge/list":
				send(response, 200, { files: await files.list() });
				return;
			case "bridge/exists": {
				const path = new URL(request.url ?? "/", "http://localhost").searchParams.get("path") ?? "";
				if (path.length === 0) {
					send(response, 400, { error: "path is required" });
					return;
				}
				send(response, 200, {
					path,
					exists: await files.exists(path)
				});
				return;
			}
			case "bridge/raw": {
				const path = new URL(request.url ?? "/", "http://localhost").searchParams.get("path") ?? "";
				if (path.length === 0) {
					send(response, 400, { error: "path is required" });
					return;
				}
				const bytes = await files.readBytes(path);
				response.writeHead(200, {
					"content-type": rawContentType(path),
					"cache-control": "no-store",
					"access-control-allow-origin": "*"
				});
				response.end(bytes);
				return;
			}
			case "bridge/write-binary": {
				const body = await readJson(request);
				const path = typeof body["path"] === "string" ? body["path"] : "";
				const data = typeof body["data"] === "string" ? body["data"] : void 0;
				if (path.length === 0 || data === void 0) {
					send(response, 400, { error: "path and data are required" });
					return;
				}
				await files.writeBytes(path, Buffer.from(data, "base64"));
				send(response, 200, {
					ok: true,
					path
				});
				return;
			}
			default: send(response, 404, {
				error: "unknown bridge route",
				route
			});
		}
	} catch (error) {
		if (error instanceof VaultPathError) {
			send(response, 400, { error: error.message });
			return;
		}
		if (error.code === "ENOENT") {
			send(response, 404, { error: "file not found" });
			return;
		}
		throw error;
	}
}
const RAW_TYPES = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	bmp: "image/bmp",
	ico: "image/x-icon"
};
/** Content type for `bridge/raw`, by lowercase file extension. */
function rawContentType(path) {
	return RAW_TYPES[path.slice(path.lastIndexOf(".") + 1).toLowerCase()] ?? "application/octet-stream";
}
//#endregion
//#region src/note-write.ts
/**
* Save one note.
* @param vault - live index owning the file.
* @param request - request carrying `{ path, content, baseMtime? }`.
* @param response - response completed with the save outcome.
*/
async function serveNoteSave(vault, request, response) {
	const body = await readJson(request);
	const path = typeof body["path"] === "string" ? body["path"] : "";
	const content = typeof body["content"] === "string" ? body["content"] : void 0;
	if (path.length === 0 || content === void 0) {
		send(response, 400, { error: "path and content are required" });
		return;
	}
	const rawBase = body["baseMtime"];
	const baseMtime = typeof rawBase === "number" && Number.isFinite(rawBase) ? rawBase : void 0;
	const result = await vault.saveNote(path, content, baseMtime);
	if (result.ok) send(response, 200, result);
	else send(response, result.status, result);
}
//#endregion
//#region src/vault/obsidian-config.ts
/**
* The `.obsidian` JSON files Obsidian itself maintains. Reads fall back to
* `undefined` when a file is absent or unparsable; writes merge the patch into
* whatever is already on disk, so keys this plugin does not model survive.
* @module dsh-obsidian-vault/vault/obsidian-config
*/
/** Obsidian's configuration folder, relative to the vault root. */
const CONFIG_DIRECTORY = ".obsidian";
/** Files this plugin is allowed to touch, each stored as `<file>.json`. */
const CONFIG_FILES = [
	"app",
	"graph",
	"appearance",
	"core-plugins",
	"hotkeys",
	"daily-notes",
	"templates",
	"bookmarks",
	"plugins-bridge"
];
/** Whether a wire value names a configuration file this plugin serves. */
function isConfigFile(value) {
	return typeof value === "string" && CONFIG_FILES.includes(value);
}
/**
* Read one configuration file.
* @param root - vault directory holding `.obsidian`.
* @param file - configuration file name without its extension.
* @returns the parsed document, or `undefined` when absent or unparsable.
*/
async function readObsidianConfig(root, file) {
	let text;
	try {
		text = await readFile(configPath(root, file), "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return void 0;
		throw error;
	}
	try {
		return JSON.parse(text.charCodeAt(0) === 65279 ? text.slice(1) : text);
	} catch {
		return;
	}
}
/**
* Merge a patch into one configuration file and write it back atomically.
* @param root - vault directory holding `.obsidian`.
* @param file - configuration file name without its extension.
* @param patch - values to set; nested objects merge, arrays replace.
* @returns the document as written.
*/
async function writeObsidianConfig(root, file, patch) {
	const target = configPath(root, file);
	const merged = mergeJson(await readObsidianConfig(root, file), patch);
	await mkdir(dirname(target), { recursive: true });
	const temporary = `${target}.tmp`;
	await writeFile(temporary, `${JSON.stringify(merged, void 0, 2)}\n`, "utf8");
	await rename(temporary, target);
	return merged;
}
/**
* Deep-merge `patch` over `previous`. Plain objects merge key by key; any other
* pair, arrays included, replaces wholesale.
*/
function mergeJson(previous, patch) {
	if (!isPlainObject(previous) || !isPlainObject(patch)) return patch;
	const merged = { ...previous };
	for (const [key, value] of Object.entries(patch)) merged[key] = mergeJson(previous[key], value);
	return merged;
}
function configPath(root, file) {
	return resolve(root, CONFIG_DIRECTORY, `${file}.json`);
}
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/config-endpoints.ts
/**
* Serve one `config/*` route against the active vault.
* @param registry - live vault registry; the active vault supplies the root.
* @param route - path after the API prefix, e.g. `config/read`.
* @param request - incoming request.
* @param response - response to complete.
*/
async function serveConfigRoute(registry, route, request, response) {
	const root = registry.active()?.path ?? registry.vault.status().root;
	switch (route) {
		case "config/read": {
			const file = new URL(request.url ?? "/", "http://localhost").searchParams.get("file");
			if (!isConfigFile(file)) {
				send(response, 400, {
					error: "unknown config file",
					file
				});
				return;
			}
			send(response, 200, {
				file,
				value: await readObsidianConfig(root, file) ?? null
			});
			return;
		}
		case "config/write": {
			const body = await readJson(request);
			const file = body["file"];
			if (!isConfigFile(file)) {
				send(response, 400, {
					error: "unknown config file",
					file
				});
				return;
			}
			send(response, 200, {
				file,
				value: await writeObsidianConfig(root, file, body["value"] ?? {})
			});
			return;
		}
		default: send(response, 404, {
			error: "unknown config route",
			route
		});
	}
}
/** Global folder holding the DSH-adapted plugins, shared by every vault. */
const DSH_PLUGINS_FOLDER = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "plugins");
//#endregion
//#region src/vault/plugins.ts
/**
* Plugin inventory: the DSH-adapted plugin folder, which is global (inside the
* plugin package) and injected by the caller, plus the built-in plugin
* enablement Obsidian records in `core-plugins.json`. This module never loads
* third-party code: the panel shows what is installed and lets the user flip a
* flag.
* @module dsh-obsidian-vault/vault/plugins
*/
/** Obsidian's built-in plugin ids, in the order its settings list them, with the state a fresh vault starts from. */
const CORE_DEFAULTS = [
	["file-explorer", true],
	["global-search", true],
	["switcher", true],
	["graph", true],
	["backlink", true],
	["canvas", true],
	["outgoing-link", true],
	["tag-pane", true],
	["footnotes", false],
	["properties", true],
	["page-preview", true],
	["daily-notes", false],
	["templates", false],
	["note-composer", true],
	["command-palette", true],
	["slash-command", false],
	["editor-status", true],
	["bookmarks", true],
	["markdown-importer", false],
	["zk-prefixer", false],
	["random-note", false],
	["outline", true],
	["word-count", true],
	["slides", false],
	["audio-recorder", false],
	["workspaces", false],
	["file-recovery", true],
	["publish", false],
	["sync", false],
	["bases", true],
	["webviewer", false]
];
/**
* Read everything the plugin panel shows.
* @param root - vault directory holding `.obsidian`.
* @param dshFolder - global DSH-adapted plugin folder, shared by every vault.
* @returns the inventory; an absent `core-plugins.json` falls back to Obsidian's defaults.
*/
async function listPlugins(root, dshFolder) {
	return {
		core: await corePlugins(root),
		dsh: await pluginManifests(dshFolder),
		dshFolder,
		community: await pluginManifests(join(root, CONFIG_DIRECTORY, "plugins"))
	};
}
/**
* Flip one built-in plugin, keeping whichever format the file already uses.
* `core-plugins.json` is either an object of booleans or, in older vaults, an
* array listing only the enabled ids.
* @param root - vault directory holding `.obsidian`.
* @param id - core plugin id.
* @param enabled - desired state.
*/
async function setCorePluginEnabled(root, id, enabled) {
	const value = await readObsidianConfig(root, "core-plugins");
	if (Array.isArray(value)) {
		const current = value.filter((entry) => typeof entry === "string");
		await writeObsidianConfig(root, "core-plugins", enabled ? current.includes(id) ? current : [...current, id] : current.filter((entry) => entry !== id));
		return;
	}
	const state = coreState(value);
	state.set(id, enabled);
	await writeObsidianConfig(root, "core-plugins", Object.fromEntries(state));
}
/**
* Create the DSH plugin folder when missing and open it in the OS file
* manager; users only ever place DSH-adapted plugins themselves.
* @param folder - global DSH-adapted plugin folder.
* @returns the folder path, so the caller can show it.
*/
async function revealPluginsFolder(folder) {
	await mkdir(folder, { recursive: true });
	spawn(process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open", [folder], {
		detached: true,
		stdio: "ignore"
	}).unref();
	return folder;
}
/** Directory names under the plugin folder, sorted. */
async function installedIds(folder) {
	return (await readdir(folder, { withFileTypes: true })).filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name).sort();
}
/**
* Manifests under one plugin folder. Entries are display-only metadata; the
* bridge whitelist decides which community ids may actually run.
*/
async function pluginManifests(folder) {
	if (!await exists(folder)) return [];
	const plugins = [];
	for (const id of await installedIds(folder)) {
		const manifest = await readManifest(folder, id);
		plugins.push({
			id,
			name: text(manifest?.name) ?? id,
			...optional("version", text(manifest?.version)),
			...optional("author", text(manifest?.author)),
			...optional("description", text(manifest?.description))
		});
	}
	plugins.sort((left, right) => left.name.localeCompare(right.name));
	return plugins;
}
/** Parse one plugin manifest; a missing or broken file leaves the folder name as the label. */
async function readManifest(folder, id) {
	try {
		const parsed = JSON.parse(await readFile(join(folder, id, "manifest.json"), "utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : void 0;
	} catch {
		return;
	}
}
/** Built-in plugins: known ids first, then any extra ids the config names. */
async function corePlugins(root) {
	return [...coreState(await readObsidianConfig(root, "core-plugins"))].map(([id, enabled]) => ({
		id,
		enabled
	}));
}
/**
* Normalize `core-plugins.json`, preserving its order: known ids in Obsidian's
* default order, then any extra ids from the file. An array names enabled ids;
* anything else falls back to the defaults.
*/
function coreState(value) {
	if (Array.isArray(value)) {
		const enabled = new Set(value.filter((entry) => typeof entry === "string"));
		const state = new Map(CORE_DEFAULTS.map(([id]) => [id, enabled.has(id)]));
		for (const id of enabled) if (!state.has(id)) state.set(id, true);
		return state;
	}
	const stored = plainObject(value);
	const state = new Map(CORE_DEFAULTS.map(([id, fallback]) => [id, stored === void 0 ? fallback : stored[id] === true]));
	if (stored !== void 0) {
		for (const [id, on] of Object.entries(stored)) if (!state.has(id)) state.set(id, on === true);
	}
	return state;
}
function plainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function text(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function optional(key, value) {
	return value === void 0 ? {} : { [key]: value };
}
async function exists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region src/plugin-endpoints.ts
/**
* Serve one `plugins/*` route against the active vault.
* @param registry - live vault registry; the active vault supplies the root.
* @param route - path after the API prefix, e.g. `plugins/list`.
* @param request - incoming request.
* @param response - response to complete.
*/
async function servePluginRoute(registry, route, request, response) {
	const root = registry.active()?.path ?? registry.vault.status().root;
	switch (route) {
		case "plugins/list":
			send(response, 200, await listPlugins(root, DSH_PLUGINS_FOLDER));
			return;
		case "plugins/toggle": {
			const body = await readJson(request);
			const id = typeof body["id"] === "string" ? body["id"].trim() : "";
			if (id.length === 0) {
				send(response, 400, { error: "id is required" });
				return;
			}
			await setCorePluginEnabled(root, id, body["enabled"] === true);
			send(response, 200, await listPlugins(root, DSH_PLUGINS_FOLDER));
			return;
		}
		case "plugins/reveal":
			send(response, 200, { folder: await revealPluginsFolder(DSH_PLUGINS_FOLDER) });
			return;
		default: send(response, 404, {
			error: "unknown plugin route",
			route
		});
	}
}
//#endregion
//#region src/vault-endpoints.ts
/**
* Serve one `vault/*` route.
* @param registry - live vault registry.
* @param route - path after the API prefix, e.g. `vault/list`.
* @param request - incoming request.
* @param response - response to complete.
*/
async function serveVaultRoute(registry, route, request, response) {
	switch (route) {
		case "vault/list":
			send(response, 200, registry.list());
			return;
		case "vault/inspect": {
			const path = (new URL(request.url ?? "/", "http://localhost").searchParams.get("path") ?? "").trim();
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			send(response, 200, await registry.inspect(path));
			return;
		}
		case "vault/open": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"].trim() : "";
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			const init = body["init"] === true;
			try {
				send(response, 200, await registry.open(path, init));
			} catch (error) {
				send(response, 404, {
					error: messageOf$1(error),
					path
				});
			}
			return;
		}
		case "vault/create": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"].trim() : "";
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			const name = typeof body["name"] === "string" ? body["name"] : void 0;
			try {
				send(response, 200, await registry.create(path, name));
			} catch (error) {
				send(response, 500, {
					error: messageOf$1(error),
					path
				});
			}
			return;
		}
		case "vault/forget": {
			const body = await readJson(request);
			const id = typeof body["id"] === "string" ? body["id"].trim() : "";
			if (id.length === 0) {
				send(response, 400, { error: "id is required" });
				return;
			}
			try {
				await registry.forget(id);
				send(response, 200, registry.list());
			} catch (error) {
				send(response, 500, { error: messageOf$1(error) });
			}
			return;
		}
		default: send(response, 404, {
			error: "unknown vault route",
			route
		});
	}
}
function messageOf$1(error) {
	return error instanceof Error ? error.message : String(error);
}
//#endregion
//#region src/routes-shared.ts
/**
* Route-layer plumbing shared by the dispatcher: the mount surface, the
* connection gate, the attachment content-type table, and the two helpers the
* asset and note-open routes need.
* @module dsh-obsidian-vault/routes-shared
*/
/** Content types served for attachment downloads. */
const CONTENT_TYPES = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	pdf: "application/pdf",
	mp4: "video/mp4",
	webm: "video/webm",
	mp3: "audio/mpeg",
	wav: "audio/wav"
};
/** 写「笔记打开」事件到 DSH_HOME/logs/note-open.jsonl（统一骨架，brain 侧采集）。 */
async function logNoteOpen(path) {
	const home = process.env.DSH_HOME;
	if (!home) return;
	const logDir = join(home, "logs");
	const logPath = join(logDir, "note-open.jsonl");
	try {
		await mkdir(logDir, { recursive: true });
		await appendFile(logPath, JSON.stringify({
			ts: (/* @__PURE__ */ new Date()).toISOString(),
			source: "dsh_note_open",
			event: "note_open",
			level: "info",
			path
		}) + "\n", "utf8");
	} catch {}
}
/**
* Lower-case extension of a vault path.
* @param path - vault-relative path.
* @returns the extension without the dot, or an empty string.
*/
function extensionOf$1(path) {
	const dot = path.lastIndexOf(".");
	return dot === -1 ? "" : path.slice(dot + 1).toLowerCase();
}
/**
* Attachment download header: an ASCII fallback plus the RFC 5987 UTF-8 name.
* @param path - vault-relative path.
* @returns the `content-disposition` value.
*/
function dispositionOf(path) {
	const name = path.slice(path.lastIndexOf("/") + 1);
	return `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
//#endregion
//#region src/routes.ts
/**
* The Chromium-facing JSON API: `/obsidian/api/*`. The route layer only
* parses requests, rejects untrusted callers, and shapes responses; every
* answer comes from the vault index.
* @module dsh-obsidian-vault/routes
*/
/**
* Mount the vault API on the Web carrier.
* @param host - plugin context exposes the carrier and the connection gate.
* @param registry - live vault registry the routes read and switch.
* @returns the disposer removing every route.
*/
function mountVaultRoutes(host, registry) {
	const gate = host.get("connection");
	const handler = (request, response) => serve(host, registry, gate, request, response);
	return host.webServer.register({
		kind: "prefix",
		path: API_BASE,
		handler
	});
}
async function serve(host, registry, gate, request, response) {
	const rejection = gate?.requestRejection?.({ headers: request.headers });
	if (rejection !== void 0) {
		send(response, rejection, { error: "forbidden" });
		return;
	}
	const url = new URL(request.url ?? "/", "http://localhost");
	const route = url.pathname.slice(13).replace(/^\//, "");
	try {
		if (route.startsWith("vault/")) {
			await serveVaultRoute(registry, route, request, response);
			return;
		}
		if (route.startsWith("config/")) {
			await serveConfigRoute(registry, route, request, response);
			return;
		}
		if (route.startsWith("plugins/")) {
			await servePluginRoute(registry, route, request, response);
			return;
		}
		if (route.startsWith("bridge/")) {
			await serveBridgeRoute(registry, route, request, response);
			return;
		}
		await dispatch(host, registry.vault, route, url, request, response);
	} catch (error) {
		send(response, 500, { error: error instanceof Error ? error.message : String(error) });
	}
}
async function dispatch(host, vault, route, url, request, response) {
	switch (route) {
		case "worker.js": {
			const source = await readFile(new URL("./worker.js", import.meta.url), "utf8");
			response.writeHead(200, {
				"content-type": "text/javascript; charset=utf-8",
				"cache-control": "no-cache"
			});
			response.end(source);
			return;
		}
		case "shim.js": {
			const source = await readFile(new URL("./shim.js", import.meta.url), "utf8");
			response.writeHead(200, {
				"content-type": "text/javascript; charset=utf-8",
				"cache-control": "no-cache",
				"access-control-allow-origin": "*"
			});
			response.end(source);
			return;
		}
		case "status":
			send(response, 200, vault.status());
			return;
		case "tree":
			send(response, 200, { nodes: vault.tree() });
			return;
		case "note": {
			if (request.method === "POST") {
				await serveNoteSave(vault, request, response);
				return;
			}
			const path = url.searchParams.get("path") ?? "";
			const note = await vault.note(path);
			if (note === void 0) send(response, 404, {
				error: "note not found",
				path
			});
			else send(response, 200, note);
			return;
		}
		case "file": {
			const path = url.searchParams.get("path") ?? "";
			const file = await vault.file(path);
			if (file === void 0) send(response, 404, {
				error: "file not found",
				path
			});
			else send(response, 200, file);
			return;
		}
		case "backlinks": {
			const path = url.searchParams.get("path") ?? "";
			send(response, 200, { items: vault.backlinksOf(path) });
			return;
		}
		case "unlinked": {
			const path = url.searchParams.get("path") ?? "";
			send(response, 200, { items: vault.unlinkedMentions(path) });
			return;
		}
		case "tags":
			send(response, 200, { items: vault.tags() });
			return;
		case "search": {
			const query = url.searchParams.get("q") ?? "";
			send(response, 200, { items: vault.search(query) });
			return;
		}
		case "graph": {
			const center = url.searchParams.get("center") ?? void 0;
			const depth = Number(url.searchParams.get("depth") ?? "2");
			const query = url.searchParams.get("q") ?? void 0;
			const tag = url.searchParams.get("tag") ?? void 0;
			const flag = (name, fallback) => {
				const value = url.searchParams.get(name);
				if (value === null) return fallback;
				return value === "1" || value === "true";
			};
			send(response, 200, vault.graph(center, Number.isFinite(depth) ? depth : 2, 400, {
				...query === void 0 || query.length === 0 ? {} : { query },
				...tag === void 0 || tag.length === 0 ? {} : { tag },
				includeUnresolved: flag("unresolved", true),
				includeAttachments: flag("attachments", true),
				includeTags: flag("tags", false)
			}));
			return;
		}
		case "create": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			const ok = await vault.create(path);
			send(response, ok ? 200 : 400, {
				ok,
				path
			});
			return;
		}
		case "rename": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			const name = typeof body["name"] === "string" ? body["name"] : "";
			if (path.length === 0 || name.length === 0) {
				send(response, 400, { error: "path and name are required" });
				return;
			}
			try {
				await vault.rename(path, name);
				send(response, 200, {
					ok: true,
					path
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				send(response, /already exists/.test(message) ? 409 : /invalid name/.test(message) ? 400 : 500, { error: message });
			}
			return;
		}
		case "delete": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			await vault.remove(path);
			send(response, 200, {
				ok: true,
				path
			});
			return;
		}
		case "move": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			const to = typeof body["to"] === "string" ? body["to"] : "";
			if (path.length === 0 || to.length === 0) {
				send(response, 400, { error: "path and to are required" });
				return;
			}
			try {
				send(response, 200, {
					ok: true,
					...await vault.move(path, to)
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				send(response, /already exists/.test(message) ? 409 : /into itself/.test(message) ? 400 : 500, { error: message });
			}
			return;
		}
		case "mkdir": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			await vault.makeFolder(path);
			send(response, 200, {
				ok: true,
				path
			});
			return;
		}
		case "asset": {
			const path = url.searchParams.get("path") ?? "";
			const asset = await vault.readAsset(path);
			if (asset === void 0) {
				send(response, 404, {
					error: "asset not found",
					path
				});
				return;
			}
			const download = url.searchParams.get("download") === "1";
			response.writeHead(200, {
				"content-type": CONTENT_TYPES[extensionOf$1(path)] ?? "application/octet-stream",
				"cache-control": "no-cache",
				...download ? { "content-disposition": dispositionOf(path) } : {}
			});
			response.end(Buffer.from(asset));
			return;
		}
		case "note-open": {
			const body = await readJson(request);
			const path = typeof body["path"] === "string" ? body["path"] : "";
			if (path.length === 0) {
				send(response, 400, { error: "path is required" });
				return;
			}
			logNoteOpen(path);
			send(response, 200, {
				ok: true,
				path
			});
			return;
		}
		default: send(response, 404, {
			error: "unknown route",
			route
		});
	}
}
//#endregion
//#region src/vault/frontmatter.ts
const EMPTY = {
	values: {},
	body: ""
};
/**
* Read a leading `---` block and return the remaining body.
* @param source - complete note text.
* @returns the parsed values; `body` is the source when no block exists.
*/
function parseFrontmatter(source) {
	const text = source.startsWith("﻿") ? source.slice(1) : source;
	if (!text.startsWith("---")) return {
		values: {},
		body: source
	};
	const lines = text.split(/\r?\n/);
	if ((lines[0] ?? "").trim() !== "---") return {
		values: {},
		body: source
	};
	let end = -1;
	for (let index = 1; index < lines.length; index += 1) {
		const line = (lines[index] ?? "").trim();
		if (line === "---" || line === "...") {
			end = index;
			break;
		}
	}
	if (end === -1) return EMPTY;
	return {
		values: parseBlock(lines.slice(1, end)),
		body: lines.slice(end + 1).join("\n")
	};
}
function parseBlock(lines) {
	const values = {};
	let currentKey;
	let list;
	for (const raw of lines) {
		const line = raw.replace(/\s+$/, "");
		if (line.length === 0 || line.trimStart().startsWith("#")) continue;
		const item = /^\s*-\s*(.*)$/.exec(line);
		if (item !== null && currentKey !== void 0 && (list !== void 0 || /^\s+/.test(line))) {
			list ??= [];
			list.push(unquote(item[1].trim()));
			values[currentKey] = list;
			continue;
		}
		const pair = /^([A-Za-z0-9_\-. ]+):(.*)$/.exec(line);
		if (pair === null) continue;
		currentKey = pair[1].trim();
		list = void 0;
		const rest = pair[2].trim();
		if (rest.length === 0) {
			values[currentKey] = void 0;
			continue;
		}
		const array = /^\[(.*)\]$/.exec(rest);
		if (array !== null) {
			values[currentKey] = array[1].split(",").map((part) => unquote(part.trim())).filter((part) => part.length > 0);
			continue;
		}
		values[currentKey] = scalar(rest);
	}
	for (const [key, value] of Object.entries(values)) if (value === void 0) delete values[key];
	return values;
}
function scalar(raw) {
	const text = unquote(raw);
	if (text === "true") return true;
	if (text === "false") return false;
	if (text === "null" || text === "~") return null;
	if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
	return text;
}
function unquote(text) {
	const trimmed = text.trim();
	if (trimmed.length >= 2) {
		const first = trimmed[0];
		const last = trimmed[trimmed.length - 1];
		if (first === "\"" && last === "\"" || first === "'" && last === "'") return trimmed.slice(1, -1);
	}
	return trimmed;
}
//#endregion
//#region src/vault/query-tokenize.ts
const FIELDS = new Set([
	"file",
	"path",
	"content",
	"tag",
	"line",
	"block",
	"section",
	"task",
	"task-todo",
	"task-done"
]);
/**
* Tokenize a query string.
* @param input - raw query.
* @returns the lexical tokens, in order.
*/
function tokenize(input) {
	const tokens = [];
	let index = 0;
	const pushWord = (word) => {
		if (word.length === 0) return;
		if (word === "OR") {
			tokens.push({
				type: "or",
				value: word
			});
			return;
		}
		if (word.startsWith("#") && word.length > 1) {
			tokens.push({
				type: "field",
				value: `tag:${word.slice(1)}`
			});
			return;
		}
		const separator = word.indexOf(":");
		if (separator > 0) {
			const field = word.slice(0, separator).toLowerCase();
			const rest = word.slice(separator + 1);
			if (field === "match-case" || field === "ignore-case") {
				tokens.push({
					type: "case",
					value: field
				});
				pushWord(rest);
				return;
			}
			if (FIELDS.has(field)) {
				tokens.push({
					type: "field",
					value: `${field}:${rest}`
				});
				return;
			}
		}
		tokens.push({
			type: "term",
			value: word
		});
	};
	while (index < input.length) {
		const char = input[index];
		if (/\s/.test(char)) {
			index += 1;
			continue;
		}
		if (char === "(" || char === ")") {
			tokens.push({
				type: char === "(" ? "lparen" : "rparen",
				value: char
			});
			index += 1;
			continue;
		}
		if (char === "-") {
			tokens.push({
				type: "neg",
				value: "-"
			});
			index += 1;
			continue;
		}
		if (char === "\"") {
			let value = "";
			index += 1;
			while (index < input.length && input[index] !== "\"") {
				if (input[index] === "\\" && index + 1 < input.length) {
					value += input[index + 1];
					index += 2;
					continue;
				}
				value += input[index];
				index += 1;
			}
			index += 1;
			tokens.push({
				type: "phrase",
				value
			});
			continue;
		}
		if (char === "/") {
			let pattern = "";
			index += 1;
			while (index < input.length && input[index] !== "/") {
				pattern += input[index];
				index += 1;
			}
			index += 1;
			let flags = "";
			while (index < input.length && /[a-z]/i.test(input[index])) {
				flags += input[index];
				index += 1;
			}
			tokens.push({
				type: "regex",
				value: `/${pattern}/${flags}`
			});
			continue;
		}
		let word = "";
		while (index < input.length && !/[\s()]/.test(input[index])) {
			if (input[index] === "\"") {
				index += 1;
				while (index < input.length && input[index] !== "\"") {
					word += input[index];
					index += 1;
				}
				index += 1;
				continue;
			}
			word += input[index];
			index += 1;
		}
		pushWord(word);
	}
	return tokens;
}
//#endregion
//#region src/vault/query-match.ts
/**
* Evaluate one parsed node against a document.
* @param parsed - result of `parseQuery`.
* @param doc - the note to test.
* @returns whether the note matches.
*/
function matchesQuery(parsed, doc) {
	if (parsed.kind === "plain") {
		const needle = parsed.text.toLowerCase();
		if (needle.length === 0) return false;
		return doc.title.toLowerCase().includes(needle) || doc.path.toLowerCase().includes(needle) || doc.content.toLowerCase().includes(needle) || doc.tags.some((tag) => tag.toLowerCase().includes(needle));
	}
	return evaluate(parsed.node, {
		text: doc.content,
		tags: doc.tags,
		frontmatter: doc.frontmatter ?? {},
		caseSensitive: false
	}, doc);
}
function evaluate(node, scope, doc) {
	switch (node.kind) {
		case "all": return true;
		case "term": return includes(scope.text, node.value, scope.caseSensitive);
		case "phrase": return includes(scope.text, node.value, scope.caseSensitive);
		case "regex": return matchesRegex(scope.text, node.value, scope.caseSensitive);
		case "and": return node.children.every((child) => evaluate(child, scope, doc));
		case "or": return node.children.some((child) => evaluate(child, scope, doc));
		case "not": return !evaluate(node.child, scope, doc);
		case "case": return evaluate(node.child, {
			...scope,
			caseSensitive: node.caseSensitive
		}, doc);
		case "property": {
			const raw = scope.frontmatter[node.key];
			if (raw === void 0 || raw === null) return false;
			const text = Array.isArray(raw) ? raw.map(String).join(" ") : String(raw);
			if (node.value === void 0) return true;
			return includes(text, node.value, scope.caseSensitive);
		}
		case "field": return evaluateField(node.field, node.child, scope, doc);
		default: return false;
	}
}
function evaluateField(field, child, scope, doc) {
	switch (field) {
		case "file": return evaluate(child, {
			...scope,
			text: doc.title
		}, doc);
		case "path": return evaluate(child, {
			...scope,
			text: doc.path
		}, doc);
		case "content": return evaluate(child, {
			...scope,
			text: doc.content
		}, doc);
		case "tag": {
			const text = `${doc.tags.map((tag) => `#${tag}`).join(" ")} ${doc.tags.join(" ")}`;
			return evaluate(child, {
				...scope,
				text,
				tags: doc.tags
			}, doc);
		}
		case "line": return doc.content.split(/\r?\n/).some((line) => evaluate(child, {
			...scope,
			text: line
		}, doc));
		case "block": return doc.content.split(/\r?\n\s*\r?\n/).some((block) => evaluate(child, {
			...scope,
			text: block
		}, doc));
		case "section": return sections(doc).some((section) => evaluate(child, {
			...scope,
			text: section
		}, doc));
		case "task": return taskLines(doc, "any").some((line) => evaluate(child, {
			...scope,
			text: line
		}, doc));
		case "task-todo": return taskLines(doc, "todo").some((line) => evaluate(child, {
			...scope,
			text: line
		}, doc));
		case "task-done": return taskLines(doc, "done").some((line) => evaluate(child, {
			...scope,
			text: line
		}, doc));
		default: return false;
	}
}
function sections(doc) {
	const headings = doc.headings ?? [];
	if (headings.length === 0) return [doc.content];
	const lines = doc.content.split(/\r?\n/);
	const out = [];
	for (let index = 0; index < headings.length; index += 1) {
		const start = headings[index].line - 1;
		let end = lines.length;
		for (let next = index + 1; next < headings.length; next += 1) if (headings[next].level <= headings[index].level) {
			end = headings[next].line - 1;
			break;
		}
		out.push(lines.slice(start, end).join("\n"));
	}
	return out;
}
const TASK = /^\s*(?:[-*+]|\d+\.)\s+\[( |x|X)\]\s*(.*)$/;
function taskLines(doc, mode) {
	const out = [];
	for (const line of doc.content.split(/\r?\n/)) {
		const match = TASK.exec(line);
		if (match === null) continue;
		const done = match[1] !== " ";
		if (mode === "todo" && done) continue;
		if (mode === "done" && !done) continue;
		out.push(match[2] ?? "");
	}
	return out;
}
function matchesRegex(text, source, caseSensitive) {
	const last = source.lastIndexOf("/");
	const pattern = source.slice(1, last);
	const flags = source.slice(last + 1);
	try {
		const base = flags.replace(/g/g, "");
		const effective = base.includes("i") || caseSensitive ? base : `${base}i`;
		return new RegExp(pattern, effective).test(text);
	} catch {
		return text.includes(pattern);
	}
}
function includes(text, needle, caseSensitive) {
	if (needle.length === 0) return true;
	return caseSensitive ? text.includes(needle) : text.toLowerCase().includes(needle.toLowerCase());
}
//#endregion
//#region src/vault/query.ts
/**
* Obsidian search syntax: quoted phrases, `OR`, `-term`, parentheses, the
* `file:` `path:` `content:` `tag:` `line:` `block:` `section:` `task:`
* `task-todo:` `task-done:` `match-case:` `ignore-case:` operators, the bare
* `#tag` shorthand, and property queries (`[key]`, `[key:value]`).
* @module dsh-obsidian-vault/vault/query
*/
/**
* Parse a query into a tree, or report that it is plain text.
* @param input - raw query.
* @returns the parsed tree, or the plain-text fallback.
*/
function parseQuery(input) {
	const trimmed = input.trim();
	const tokens = tokenize(trimmed);
	if (!tokens.some((token) => token.type === "or" || token.type === "lparen" || token.type === "neg" || token.type === "field" || token.type === "case" || token.type === "phrase" || token.type === "regex" || token.type === "term" && /^\[[^\]]+\]$/.test(token.value))) return {
		kind: "plain",
		text: trimmed
	};
	let cursor = 0;
	const peek = () => tokens[cursor];
	const next = () => tokens[cursor++];
	const parseOr = () => {
		const children = [parseAnd()];
		while (peek()?.type === "or") {
			next();
			children.push(parseAnd());
		}
		return children.length === 1 ? children[0] : {
			kind: "or",
			children
		};
	};
	const parseAnd = () => {
		const children = [];
		while (true) {
			const token = peek();
			if (token === void 0 || token.type === "or" || token.type === "rparen") break;
			children.push(parseUnary());
		}
		if (children.length === 0) return { kind: "all" };
		return children.length === 1 ? children[0] : {
			kind: "and",
			children
		};
	};
	const parseUnary = () => {
		if (peek()?.type === "neg") {
			next();
			return {
				kind: "not",
				child: parseUnary()
			};
		}
		return parsePrimary();
	};
	const parsePrimary = () => {
		const token = next();
		if (token === void 0) return { kind: "all" };
		if (token.type === "lparen") {
			const node = parseOr();
			if (peek()?.type === "rparen") next();
			return node;
		}
		if (token.type === "case") {
			const [name, ...rest] = token.value.split(":");
			const child = parseUnary();
			return {
				kind: "case",
				caseSensitive: name === "match-case",
				child: rest.length === 0 ? child : child
			};
		}
		if (token.type === "field") {
			const separator = token.value.indexOf(":");
			const field = token.value.slice(0, separator);
			const value = token.value.slice(separator + 1);
			return {
				kind: "field",
				field,
				child: peek()?.type === "lparen" ? parsePrimary() : value.length === 0 ? { kind: "all" } : {
					kind: "term",
					value
				}
			};
		}
		if (token.type === "phrase") return {
			kind: "phrase",
			value: token.value
		};
		if (token.type === "regex") return {
			kind: "regex",
			value: token.value
		};
		if (token.type === "term") {
			const property = /^\[([^\]]+)\]$/.exec(token.value);
			if (property !== null) {
				const body = property[1];
				const separator = body.indexOf(":");
				return separator === -1 ? {
					kind: "property",
					key: body
				} : {
					kind: "property",
					key: body.slice(0, separator),
					value: body.slice(separator + 1)
				};
			}
			return {
				kind: "term",
				value: token.value
			};
		}
		return { kind: "all" };
	};
	return {
		kind: "tree",
		node: parseOr()
	};
}
//#endregion
//#region src/vault/graph.ts
/**
* Build one graph.
* @param input - index state the graph is derived from.
* @param request - center, depth, cap, and filters.
*/
function buildGraph(input, request) {
	const { filter } = request;
	const expanded = expandedGraph(input, {
		includeUnresolved: filter.includeUnresolved !== false,
		includeAttachments: filter.includeAttachments !== false,
		includeTags: filter.includeTags === true
	});
	const query = (filter.query ?? "").trim();
	const parsed = parseQuery(query);
	const matches = query.length === 0 ? () => true : (node) => matchesQuery(parsed, {
		path: node.path,
		title: node.title,
		content: "",
		tags: node.tags ?? []
	});
	const tag = filter.tag;
	const allowed = (node) => {
		if (node.path === request.center) return true;
		if (tag !== void 0 && tag.length > 0) {
			if (node.kind === "tag") {
				if (node.tags?.[0] !== tag) return false;
			} else if (!(node.tags ?? []).includes(tag)) return false;
		}
		return matches(node);
	};
	const edges = [...expanded.adjacency].flatMap(([source, targets]) => [...targets].map((target) => ({
		source,
		target
	})));
	const included = /* @__PURE__ */ new Set();
	if (request.center !== void 0 && expanded.nodes.has(request.center)) {
		included.add(request.center);
		let frontier = [request.center];
		for (let hop = 1; hop <= request.depth; hop += 1) {
			const next = [];
			for (const path of frontier) for (const neighbor of expanded.adjacency.get(path) ?? []) {
				if (included.has(neighbor)) continue;
				const node = expanded.nodes.get(neighbor);
				if (node === void 0 || !allowed(node)) continue;
				included.add(neighbor);
				next.push(neighbor);
			}
			frontier = next;
		}
	} else {
		const ranked = [...expanded.nodes.values()].filter(allowed).sort((left, right) => (expanded.adjacency.get(right.path)?.size ?? 0) - (expanded.adjacency.get(left.path)?.size ?? 0)).slice(0, request.limit);
		for (const node of ranked) included.add(node.path);
	}
	const nodes = [];
	for (const path of included) {
		const node = expanded.nodes.get(path);
		if (node === void 0) continue;
		nodes.push({
			...node,
			depth: path === request.center ? 0 : centeredDepth(path, request.center, expanded.adjacency)
		});
	}
	return {
		nodes,
		edges: edges.filter((edge) => included.has(edge.source) && included.has(edge.target))
	};
}
function expandedGraph(input, options) {
	const nodes = /* @__PURE__ */ new Map();
	const adjacency = /* @__PURE__ */ new Map();
	const addNode = (node) => {
		if (!nodes.has(node.path)) nodes.set(node.path, node);
	};
	const link = (left, right) => {
		addEdge(adjacency, left, right);
		addEdge(adjacency, right, left);
	};
	for (const [path, entry] of input.notes) addNode({
		path,
		title: entry.title,
		depth: 0,
		kind: "note",
		tags: entry.tags
	});
	for (const [source, targets] of input.adjacency) for (const target of targets) link(source, target);
	if (options.includeUnresolved) for (const [path, links] of input.linksByNote) for (const linkDto of links) {
		if (linkDto.status === "resolved" || linkDto.target.length === 0) continue;
		const ghost = `unresolved:${linkDto.target}`;
		addNode({
			path: ghost,
			title: linkDto.target,
			depth: 0,
			kind: "unresolved"
		});
		link(path, ghost);
	}
	if (options.includeAttachments && input.attachments.size > 0) {
		const byName = /* @__PURE__ */ new Map();
		for (const attachment of input.attachments) byName.set(attachment.slice(attachment.lastIndexOf("/") + 1).toLowerCase(), attachment);
		for (const [path, links] of input.linksByNote) for (const linkDto of links) {
			const name = linkDto.target.toLowerCase();
			if (!/\.[a-z0-9]+$/.test(name)) continue;
			const file = byName.get(name);
			if (file === void 0) continue;
			const id = `attachment:${file}`;
			addNode({
				path: id,
				title: file.slice(file.lastIndexOf("/") + 1),
				depth: 0,
				kind: "attachment"
			});
			link(path, id);
		}
	}
	if (options.includeTags) for (const [path, entry] of input.notes) for (const tag of entry.tags) {
		const id = `tag:${tag}`;
		addNode({
			path: id,
			title: `#${tag}`,
			depth: 0,
			kind: "tag",
			tags: [tag]
		});
		link(path, id);
	}
	return {
		nodes,
		adjacency
	};
}
function addEdge(adjacency, from, to) {
	const set = adjacency.get(from);
	if (set === void 0) adjacency.set(from, new Set([to]));
	else set.add(to);
}
function centeredDepth(path, center, adjacency, cap = 3) {
	if (center === void 0 || path === center) return 0;
	const seen = new Set([center]);
	let frontier = [center];
	for (let hop = 1; hop <= cap; hop += 1) {
		const next = [];
		for (const current of frontier) for (const neighbor of adjacency.get(current) ?? []) {
			if (seen.has(neighbor)) continue;
			if (neighbor === path) return hop;
			seen.add(neighbor);
			next.push(neighbor);
		}
		frontier = next;
	}
	return cap;
}
//#endregion
//#region src/vault/mentions.ts
/**
* Find prose mentions of one note.
* @param notes - vault-relative path to its parsed entry.
* @param path - the note whose title and aliases are searched for.
* @param limit - maximum mentions; one hit per mentioning note.
* @returns matches in index order, each with its first matching line.
*/
function unlinkedMentionsOf(notes, path, limit = 20) {
	const entry = notes.get(path);
	if (entry === void 0) return [];
	const needles = [entry.title, ...entry.aliases].map((value) => value.trim().toLowerCase()).filter((value) => value.length >= 2);
	if (needles.length === 0) return [];
	const hits = [];
	for (const [otherPath, other] of notes) {
		if (otherPath === path) continue;
		for (let index = 0; index < other.lines.length; index += 1) {
			const line = other.lines[index] ?? "";
			if (line.trim().length === 0) continue;
			const lower = line.toLowerCase();
			let matched = false;
			for (const needle of needles) {
				const at = lower.indexOf(needle);
				if (at === -1) continue;
				if (insideWikiLink(line, at)) continue;
				matched = true;
				break;
			}
			if (!matched) continue;
			hits.push({
				path: otherPath,
				title: other.title,
				line: index + 1,
				context: line.trim().slice(0, 180)
			});
			break;
		}
		if (hits.length >= limit) break;
	}
	return hits;
}
/** Whether a position sits inside a `[[…]]` span on its line. */
function insideWikiLink(line, index) {
	const open = line.lastIndexOf("[[", index);
	if (open === -1) return false;
	return line.lastIndexOf("]]", index) < open;
}
//#endregion
//#region src/vault/search.ts
const RANK = {
	title: 0,
	alias: 1,
	tag: 2,
	path: 3,
	content: 4
};
/**
* Rank notes by title, alias, tag, path, then content; operator queries run
* through the shared parser instead.
* @param notes - vault-relative path to the note's fields.
* @param query - raw query text.
* @param limit - maximum hits.
*/
function searchNotes(notes, query, limit = 40) {
	const parsed = parseQuery(query);
	if (parsed.kind === "tree") {
		const hits = [];
		for (const [path, note] of notes) {
			if (hits.length >= limit) break;
			if (!matchesQuery(parsed, {
				path,
				title: note.title,
				content: note.content ?? note.lines.join("\n"),
				tags: note.tags,
				frontmatter: note.frontmatter,
				headings: note.headings
			})) continue;
			hits.push({
				path,
				title: note.title,
				kind: "content",
				snippet: querySnippet(note, query)
			});
		}
		return hits.sort((left, right) => left.title.localeCompare(right.title, "zh"));
	}
	const needle = parsed.text.toLowerCase();
	if (needle.length === 0) return [];
	const hits = /* @__PURE__ */ new Map();
	const keep = (hit) => {
		if (hits.size >= limit || hits.has(hit.path)) return;
		hits.set(hit.path, hit);
	};
	for (const [path, note] of notes) {
		const title = note.title.toLowerCase();
		if (title === needle || title.startsWith(needle)) keep({
			path,
			title: note.title,
			kind: "title",
			snippet: openingLine(note)
		});
		else if (note.aliases.some((alias) => alias.toLowerCase().includes(needle))) keep({
			path,
			title: note.title,
			kind: "alias",
			snippet: openingLine(note)
		});
		else if (note.tags.some((tag) => tag.toLowerCase().includes(needle))) keep({
			path,
			title: note.title,
			kind: "tag",
			snippet: openingLine(note)
		});
		else if (path.toLowerCase().includes(needle)) keep({
			path,
			title: note.title,
			kind: "path",
			snippet: openingLine(note)
		});
	}
	if (hits.size < limit) for (const [path, note] of notes) {
		if (hits.size >= limit) break;
		if (hits.has(path) || note.content === null) continue;
		const index = note.content.toLowerCase().indexOf(needle);
		if (index === -1) continue;
		keep({
			path,
			title: note.title,
			kind: "content",
			snippet: snippetOf(note.content, index, needle.length)
		});
	}
	return [...hits.values()].sort((left, right) => RANK[left.kind] - RANK[right.kind] || left.title.localeCompare(right.title, "zh"));
}
function snippetOf(content, index, length) {
	const start = Math.max(0, content.lastIndexOf("\n", index) + 1);
	const end = content.indexOf("\n", index + length);
	const line = content.slice(start, end === -1 ? content.length : end).trim();
	return line.length > 160 ? `${line.slice(0, 160)}…` : line;
}
function openingLine(note) {
	for (const line of note.lines) {
		const text = line.trim();
		if (text.length > 0 && !text.startsWith("---") && !text.startsWith("```")) return text.replace(/^#{1,6}\s+/, "").slice(0, 120);
	}
}
/**
* Snippet for an operator query: the first line containing any bare term.
* @param note - the matched note.
* @param query - the raw query text.
*/
function querySnippet(note, query) {
	const words = query.replace(/"[^"]*"/g, " ").split(/[\s()]+/).map((word) => word.replace(/^-/, "").replace(/^[a-z-]+:/i, "")).filter((word) => word.length > 1 && word.toUpperCase() !== "OR");
	if (words.length === 0) return openingLine(note);
	for (const line of note.lines) {
		const text = line.trim();
		if (text.length === 0) continue;
		const lower = text.toLowerCase();
		if (words.some((word) => lower.includes(word.toLowerCase()))) return text.replace(/^#{1,6}\s+/, "").slice(0, 120);
	}
	return openingLine(note);
}
//#endregion
//#region src/vault/resolver.ts
/** Normalize an authored target for lookup. */
function normalizeTarget(target) {
	let text = target.trim().replace(/\\/g, "/");
	while (text.startsWith("./")) text = text.slice(2);
	text = text.replace(/^\/+/, "");
	text = text.replace(/\.md$/i, "");
	return text.toLowerCase();
}
/**
* Resolution index over the current vault, rebuilt whenever the vault changes.
*/
var LinkResolver = class {
	byPath = /* @__PURE__ */ new Map();
	byBasename = /* @__PURE__ */ new Map();
	byAlias = /* @__PURE__ */ new Map();
	/** @param notes - every note currently indexed. */
	constructor(notes) {
		for (const note of notes) {
			this.byPath.set(normalizeTarget(note.path), note);
			push(this.byBasename, normalizeTarget(basenameOf(note.path)), note);
			for (const alias of note.aliases) {
				const key = normalizeTarget(alias);
				if (key.length > 0) push(this.byAlias, key, note);
			}
		}
	}
	/**
	* Resolve one authored target.
	* @param target - link text with alias, anchor, and `.md` already removed.
	* @param from - vault-relative path of the note the link is written in.
	* @returns the winning note, an ambiguity, or an unresolved marker.
	*/
	resolve(target, from) {
		const cleaned = target.trim().replace(/\\/g, "/");
		if (cleaned.length === 0) return { status: "unresolved" };
		const folder = from === void 0 ? "" : folderOf(from).toLowerCase();
		let key;
		if (cleaned.startsWith("./") || cleaned.startsWith("../")) {
			key = normalizeTarget(joinRelative(folder, cleaned));
			const exact = this.byPath.get(key);
			if (exact !== void 0) return {
				status: "resolved",
				path: exact.path
			};
		} else if (cleaned.startsWith("/")) {
			const exact = this.byPath.get(normalizeTarget(cleaned));
			return exact === void 0 ? { status: "unresolved" } : {
				status: "resolved",
				path: exact.path
			};
		} else {
			key = normalizeTarget(cleaned);
			const exact = this.byPath.get(key);
			if (exact !== void 0) return {
				status: "resolved",
				path: exact.path
			};
		}
		for (const pool of [
			this.suffixMatches(key),
			this.byBasename.get(key) ?? [],
			this.byAlias.get(key) ?? []
		]) {
			const chosen = decide(rank(pool, folder), folder);
			if (chosen.kind === "resolved") return {
				status: "resolved",
				path: chosen.path
			};
			if (chosen.kind === "ambiguous") return {
				status: "ambiguous",
				candidates: chosen.paths
			};
		}
		return { status: "unresolved" };
	}
	suffixMatches(key) {
		const matches = [];
		for (const [path, note] of this.byPath) if (path.endsWith(`/${key}`)) matches.push(note);
		return matches;
	}
};
/** Order candidates: source folder first, then ascending path length. */
function rank(candidates, folder) {
	const prefix = folder.length === 0 ? "" : `${folder}/`;
	return [...candidates].sort((left, right) => {
		const nearLeft = left.path.toLowerCase().startsWith(prefix) ? 0 : 1;
		const nearRight = right.path.toLowerCase().startsWith(prefix) ? 0 : 1;
		if (nearLeft !== nearRight) return nearLeft - nearRight;
		return left.path.length - right.path.length;
	});
}
/** The first candidate wins; only a same-bucket equal-length tie is ambiguous. */
function decide(ordered, folder) {
	const first = ordered[0];
	if (first === void 0) return { kind: "none" };
	const tied = ordered.filter((candidate) => candidate.path.length === first.path.length && isNear(candidate, folder) === isNear(first, folder));
	if (tied.length === 1) return {
		kind: "resolved",
		path: first.path
	};
	return {
		kind: "ambiguous",
		paths: tied.map((candidate) => candidate.path)
	};
}
/** True when the candidate lives under the source folder. */
function isNear(candidate, folder) {
	return folder.length === 0 || candidate.path.toLowerCase().startsWith(`${folder}/`);
}
/** Join a `./`/`../` target onto the source folder. */
function joinRelative(folder, target) {
	const parts = folder.length === 0 ? [] : folder.split("/");
	for (const segment of target.split("/")) {
		if (segment === "" || segment === ".") continue;
		if (segment === "..") {
			parts.pop();
			continue;
		}
		parts.push(segment);
	}
	return parts.join("/");
}
function push(map, key, note) {
	const list = map.get(key);
	if (list === void 0) map.set(key, [note]);
	else list.push(note);
}
function folderOf(path) {
	const slash = path.lastIndexOf("/");
	return slash === -1 ? "" : path.slice(0, slash);
}
function basenameOf(path) {
	return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/i, "");
}
//#endregion
//#region src/vault/derive.ts
/**
* Resolve every note's links and collect the derived indexes.
* @param notes - vault-relative path to its parsed entry.
* @param attachments - vault-relative paths of non-note files, so `![[img.png]]` resolves.
* @returns the indexes; a link that resolves to itself or an attachment adds no backlink or edge.
*/
function deriveIndex(notes, attachments) {
	const identities = [];
	for (const [path, entry] of notes) identities.push({
		path,
		title: entry.title,
		aliases: entry.aliases
	});
	for (const path of attachments) identities.push({
		path,
		title: path.slice(path.lastIndexOf("/") + 1),
		aliases: []
	});
	const resolver = new LinkResolver(identities);
	const linkIndex = /* @__PURE__ */ new Map();
	const backlinks = /* @__PURE__ */ new Map();
	const tags = /* @__PURE__ */ new Map();
	const adjacency = /* @__PURE__ */ new Map();
	for (const [path, entry] of notes) {
		const links = [];
		for (const token of entry.links) {
			const resolution = resolver.resolve(token.target, path);
			links.push({
				raw: token.raw,
				target: token.target,
				...token.alias === void 0 ? {} : { alias: token.alias },
				...token.anchor === void 0 ? {} : { anchor: token.anchor },
				...token.block === void 0 ? {} : { block: token.block },
				embed: token.embed,
				line: token.line,
				status: resolution.status,
				...resolution.path === void 0 ? {} : { path: resolution.path },
				...resolution.candidates === void 0 ? {} : { candidates: resolution.candidates }
			});
			if (resolution.status !== "resolved" || resolution.path === void 0) continue;
			if (resolution.path === path || attachments.has(resolution.path)) continue;
			const context = (entry.lines[token.line - 1] ?? "").trim();
			const list = backlinks.get(resolution.path);
			const item = {
				path,
				title: entry.title,
				line: token.line,
				context
			};
			if (list === void 0) backlinks.set(resolution.path, [item]);
			else list.push(item);
			connect(adjacency, path, resolution.path);
		}
		linkIndex.set(path, links);
		for (const tag of entry.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
	}
	return {
		resolver,
		linkIndex,
		backlinks,
		tagCounts: tags,
		adjacency
	};
}
function connect(adjacency, left, right) {
	add(adjacency, left, right);
	add(adjacency, right, left);
}
function add(adjacency, from, to) {
	const set = adjacency.get(from);
	if (set === void 0) adjacency.set(from, new Set([to]));
	else set.add(to);
}
//#endregion
//#region src/vault/syntax-shared.ts
/** A fence opener or closer: three or more backticks or tildes. */
const FENCE = /^\s*(`{3,}|~{3,})/;
//#endregion
//#region src/vault/syntax-links.ts
/**
* Wikilink parsing: split `[[target#anchor|alias]]` bodies into their parts and
* find the tokens on one line while skipping inline code.
* @module dsh-obsidian-vault/vault/syntax-links
*/
/**
* Split one `[[...]]` body into its parts.
* @param inner - text between the brackets.
* @param meta - occurrence metadata carried through verbatim.
* @returns the parsed token, or undefined when the body holds no target.
*/
function parseWikiTarget(inner, meta) {
	const pipe = inner.indexOf("|");
	const alias = pipe === -1 ? void 0 : inner.slice(pipe + 1).trim();
	const head = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
	if (head.includes("[") || head.includes("]")) return void 0;
	if (head.length === 0 && alias === void 0) return void 0;
	const hash = head.indexOf("#");
	const beforeHash = hash === -1 ? head : head.slice(0, hash);
	const afterHash = hash === -1 ? "" : head.slice(hash + 1);
	const caret = afterHash.indexOf("^");
	const anchor = caret === -1 ? afterHash.trim() : afterHash.slice(0, caret).trim();
	const block = caret === -1 ? void 0 : afterHash.slice(caret + 1).trim();
	const target = beforeHash.trim().replace(/\.md$/i, "");
	if (target.length === 0 && anchor.length === 0 && block === void 0) return void 0;
	return trim(meta, {
		target,
		...alias === void 0 || alias.length === 0 ? {} : { alias },
		...anchor.length === 0 ? {} : { anchor },
		...block === void 0 || block.length === 0 ? {} : { block }
	});
}
function trim(meta, parts) {
	return {
		raw: meta.raw,
		embed: meta.embed,
		line: meta.line,
		target: parts.target,
		...parts.alias === void 0 ? {} : { alias: parts.alias },
		...parts.anchor === void 0 ? {} : { anchor: parts.anchor },
		...parts.block === void 0 ? {} : { block: parts.block }
	};
}
/**
* Scan every wikilink the source authors, skipping fenced code.
* @param source - complete note text.
* @returns links in source order.
*/
function scanWikiLinks(source) {
	const out = [];
	const lines = source.split(/\r?\n/);
	let fence = null;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? "";
		const fenceMatch = FENCE.exec(line);
		if (fence !== null) {
			if (fenceMatch !== null && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
			continue;
		}
		if (fenceMatch !== null) {
			fence = fenceMatch[1];
			continue;
		}
		scanLine(line, index + 1, out);
	}
	return out;
}
function scanLine(text, lineNo, out) {
	for (const found of tokensOfLine(text, lineNo)) out.push(found.token);
}
/**
* Find every wikilink on one line, skipping inline code spans.
* @param text - one source line.
* @param lineNo - 1-based line number stored on each token.
* @returns the tokens with their ranges.
*/
function tokensOfLine(text, lineNo) {
	const found = [];
	let index = 0;
	while (index < text.length) {
		const char = text[index];
		if (char === "`") {
			let run = 1;
			while (text[index + run] === "`") run += 1;
			const close = text.indexOf("`".repeat(run), index + run);
			if (close === -1) {
				index += run;
				continue;
			}
			index = close + run;
			continue;
		}
		const embed = char === "!" && text[index + 1] === "[";
		const open = embed ? index + 1 : index;
		if (text[open] === "[" && text[open + 1] === "[") {
			const close = text.indexOf("]]", open + 2);
			if (close !== -1) {
				const token = parseWikiTarget(text.slice(open + 2, close), {
					raw: text.slice(index, close + 2),
					embed,
					line: lineNo
				});
				if (token !== void 0) {
					found.push({
						token,
						start: index,
						end: close + 2
					});
					index = close + 2;
					continue;
				}
			}
		}
		index += 1;
	}
	return found;
}
//#endregion
//#region src/vault/syntax-scan.ts
/**
* Syntax scanners: fenced-code-aware scan passes for `^block-id` markers,
* headings, inline `#tags` and tag spans.
* @module dsh-obsidian-vault/vault/syntax-scan
*/
const BLOCK_ID = /(?:^|\s)\^([A-Za-z0-9][A-Za-z0-9-]*)\s*$/;
const HEADING = /^\s{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const TAG = /(^|[^\p{L}\p{N}_/\\#])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/gu;
/**
* Find `^block-id` markers and the 1-based line each one ends.
* @param body - note body without frontmatter.
* @returns block id to line number.
*/
function scanBlockIds(body) {
	const found = /* @__PURE__ */ new Map();
	let fence = null;
	const lines = body.split(/\r?\n/);
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const fenceMatch = FENCE.exec(line);
		if (fence !== null) {
			if (fenceMatch !== null && fenceMatch[1][0] === fence[0]) fence = null;
			continue;
		}
		if (fenceMatch !== null) {
			fence = fenceMatch[1];
			continue;
		}
		const match = BLOCK_ID.exec(line);
		if (match !== null) found.set(match[1], index + 1);
	}
	return found;
}
/**
* Scan headings outside fenced code.
* @param source - complete note text.
* @returns headings in source order.
*/
function scanHeadings(source) {
	const out = [];
	const lines = source.split(/\r?\n/);
	let fence = null;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? "";
		const fenceMatch = FENCE.exec(line);
		if (fence !== null) {
			if (fenceMatch !== null && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
			continue;
		}
		if (fenceMatch !== null) {
			fence = fenceMatch[1];
			continue;
		}
		const match = HEADING.exec(line);
		if (match === null) continue;
		const text = match[2].trim();
		if (text.length === 0) continue;
		out.push({
			level: match[1].length,
			text,
			line: index + 1
		});
	}
	return out;
}
/**
* Scan inline `#tags` outside fenced code and inline code.
* @param source - complete note text.
* @returns unique tag names without the leading `#`, in source order.
*/
function scanTags(source) {
	const seen = /* @__PURE__ */ new Set();
	const lines = source.split(/\r?\n/);
	let fence = null;
	for (const line of lines) {
		const fenceMatch = FENCE.exec(line);
		if (fence !== null) {
			if (fenceMatch !== null && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
			continue;
		}
		if (fenceMatch !== null) {
			fence = fenceMatch[1];
			continue;
		}
		const visible = stripInlineCode(maskWikiLinks(line));
		for (const match of visible.matchAll(TAG)) {
			const tag = match[2].replace(/\/+$/, "");
			if (tag.length === 0) continue;
			seen.add(tag);
		}
	}
	return [...seen];
}
function maskWikiLinks(text) {
	const found = tokensOfLine(text, 0);
	if (found.length === 0) return text;
	let out = "";
	let cursor = 0;
	for (const item of found) {
		out += text.slice(cursor, item.start) + " ".repeat(item.end - item.start);
		cursor = item.end;
	}
	return out + text.slice(cursor);
}
function stripInlineCode(line) {
	let out = "";
	let index = 0;
	while (index < line.length) {
		if (line[index] !== "`") {
			out += line[index];
			index += 1;
			continue;
		}
		let run = 1;
		while (line[index + run] === "`") run += 1;
		const close = line.indexOf("`".repeat(run), index + run);
		if (close === -1) {
			out += line.slice(index);
			break;
		}
		out += " ".repeat(close + run - index);
		index = close + run;
	}
	return out;
}
//#endregion
//#region src/vault/syntax.ts
/**
* Obsidian syntax: `[[wikilinks]]`, `![[embeds]]`, `#tags`, headings, and
* `^block-id` markers. One implementation serves the Host index (metadata) and
* the browser preprocessor (rendering), so both halves agree on what counts as
* syntax. Fenced code blocks, inline code spans, and HTML comments are opaque.
*
* The scanners, the link parser and the shared token shapes live in
* `syntax-scan`, `syntax-links` and `syntax-shared`; this module keeps the
* rewrite pass and re-exports them for callers that want one import.
* @module dsh-obsidian-vault/vault/syntax
*/
/**
* Rewrite every wikilink outside fenced and inline code, leaving all other
* source text unchanged.
* @param source - markdown source.
* @param replace - replacement markdown for one token.
* @returns the rewritten source.
*/
function replaceWikiLinks(source, replace) {
	const lines = source.split(/\r?\n/);
	let fence = null;
	const out = [];
	for (const line of lines) {
		const fenceMatch = FENCE.exec(line);
		if (fence !== null) {
			out.push(line);
			if (fenceMatch !== null && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
			continue;
		}
		if (fenceMatch !== null) {
			fence = fenceMatch[1];
			out.push(line);
			continue;
		}
		out.push(replaceLine(line, replace));
	}
	return out.join("\n");
}
function replaceLine(text, replace) {
	const found = tokensOfLine(text, 0);
	if (found.length === 0) return text;
	let out = "";
	let cursor = 0;
	for (const item of found) {
		out += text.slice(cursor, item.start);
		out += replace(item.token);
		cursor = item.end;
	}
	return out + text.slice(cursor);
}
//#endregion
//#region src/vault/entry.ts
const MARKDOWN$3 = /\.md$/i;
/**
* Parse one note file into its index entry.
* @param input - path, filesystem identity, limits, and the text reader.
* @returns the entry; an oversized or unreadable note keeps empty metadata.
*/
async function parseNoteEntry(input) {
	const { path, key, size, budget, maxFileBytes, mtime } = input;
	const title = path.slice(path.lastIndexOf("/") + 1).replace(MARKDOWN$3, "");
	const empty = {
		key,
		title,
		aliases: [],
		tags: [],
		headings: [],
		links: [],
		lines: [],
		content: null,
		size,
		mtime,
		blocks: {},
		frontmatter: {}
	};
	if (size > maxFileBytes) return empty;
	let content;
	try {
		content = await input.read();
	} catch {
		return empty;
	}
	const frontmatter = parseFrontmatter(content);
	const body = frontmatter.body;
	const aliases = aliasList(frontmatter.values);
	const tags = new Set(scanTags(body));
	for (const tag of tagList(frontmatter.values)) tags.add(tag);
	return {
		key,
		title,
		aliases,
		tags: [...tags],
		headings: scanHeadings(body),
		links: scanWikiLinks(body),
		lines: body.split("\n"),
		content: budget >= content.length ? content : null,
		size,
		mtime,
		blocks: Object.fromEntries(scanBlockIds(body)),
		frontmatter: frontmatter.values
	};
}
/** `aliases` or `alias` from frontmatter, as a non-empty string list. */
function aliasList(values) {
	const raw = values["aliases"] ?? values["alias"];
	if (Array.isArray(raw)) return raw.map(String).filter((value) => value.length > 0);
	if (typeof raw === "string" && raw.length > 0) return [raw];
	return [];
}
/** `tags` or `tag` from frontmatter, without leading `#`. */
function tagList(values) {
	const raw = values["tags"] ?? values["tag"];
	return (Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : []).map((tag) => tag.replace(/^#/, "").trim()).filter((tag) => tag.length > 0);
}
//#endregion
//#region src/vault/scan.ts
const MARKDOWN$2 = /\.md$/i;
const SELF = /^\.+$/;
/**
* Walk the vault once, reusing previous entries whose filesystem version did
* not move. Per-directory read failures skip that subtree; a root resolution
* failure rejects.
* @param fs - Host filesystem service.
* @param rootPath - absolute directory of the vault.
* @param options - resolved tunables.
* @param previous - entries from the last scan, reused when the key matches.
* @param parse - parses one note under the remaining content budget.
* @returns the walk result, including the change signature.
*/
async function scanVault(fs, rootPath, options, previous, parse) {
	const root = await fs.resolve(rootPath);
	const notes = /* @__PURE__ */ new Map();
	const attachments = /* @__PURE__ */ new Set();
	const attachmentMeta = /* @__PURE__ */ new Map();
	const directories = [];
	const dirPaths = [];
	let budget = options.maxIndexBytes;
	const walk = async (target, prefix, depth) => {
		if (depth > options.maxDepth) return;
		directories.push(target);
		if (prefix !== "") dirPaths.push(prefix);
		let entries;
		try {
			entries = await fs.listDir(target);
		} catch {
			return;
		}
		for (const entry of entries) {
			if (isIgnored(entry.name, options.ignore)) continue;
			const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
			if (entry.type === "directory") {
				await walk(entry.target, path, depth + 1);
				continue;
			}
			if (entry.type !== "file") continue;
			if (!MARKDOWN$2.test(entry.name)) {
				attachments.add(path);
				attachmentMeta.set(path, entry.size === void 0 ? {} : { size: entry.size });
				continue;
			}
			const size = entry.size ?? 0;
			const key = `${String(entry.version ?? "")}:${size}`;
			const cached = previous.get(path);
			if (cached !== void 0 && cached.key === key) {
				notes.set(path, cached);
				budget -= cached.content?.length ?? 0;
				continue;
			}
			const parsed = await parse(entry.target, path, key, size, budget);
			budget -= parsed.content?.length ?? 0;
			notes.set(path, parsed);
		}
	};
	await walk(root, "", 0);
	const seen = [...notes].map(([path, entry]) => `${path} ${entry.key}`).join("");
	const dirs = directories.map((directory) => directory.displayPath).join("");
	return {
		root,
		notes,
		attachments,
		attachmentMeta,
		directories,
		dirPaths,
		signature: `${seen}${[...attachments].join("")}${dirs}`
	};
}
/** Ignored names: dotfiles, self references, and configured names. */
function isIgnored(name, ignore) {
	if (name.startsWith(".")) return true;
	if (SELF.test(name)) return true;
	return ignore.includes(name);
}
//#endregion
//#region src/filetypes.ts
const IMAGE_TYPES = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	bmp: "image/bmp",
	avif: "image/avif",
	ico: "image/x-icon"
};
const TEXT_TYPES = {
	txt: "text",
	log: "text",
	csv: "csv",
	tsv: "csv",
	json: "json",
	jsonc: "json",
	jsonl: "json",
	yaml: "yaml",
	yml: "yaml",
	toml: "toml",
	ini: "ini",
	cfg: "ini",
	conf: "ini",
	properties: "ini",
	xml: "xml",
	html: "html",
	htm: "html",
	css: "css",
	scss: "scss",
	less: "less",
	js: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	jsx: "javascript",
	ts: "typescript",
	mts: "typescript",
	cts: "typescript",
	tsx: "typescript",
	py: "python",
	pyi: "python",
	rb: "ruby",
	go: "go",
	rs: "rust",
	java: "java",
	kt: "kotlin",
	kts: "kotlin",
	c: "c",
	h: "cpp",
	cc: "cpp",
	cpp: "cpp",
	cxx: "cpp",
	hpp: "cpp",
	cs: "csharp",
	php: "php",
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	ps1: "powershell",
	bat: "batch",
	cmd: "batch",
	sql: "sql",
	lua: "lua",
	swift: "swift",
	dart: "dart",
	vue: "vue",
	svelte: "svelte",
	gradle: "groovy",
	tex: "latex"
};
const MARKDOWN_TYPES = new Set([
	"md",
	"markdown",
	"mdown"
]);
const BINARY = {
	kind: "binary",
	mime: "application/octet-stream",
	previewable: false
};
/**
* Lowercase extension of one path, without the dot.
* @param path - vault-relative path with `/` separators.
* @returns the extension, or an empty string for a name with no dot or a dotfile.
*/
function extensionOf(path) {
	const name = path.slice(path.lastIndexOf("/") + 1);
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return "";
	return name.slice(dot + 1).toLowerCase();
}
/**
* Registry lookup for one path.
* @param path - vault-relative path.
* @returns the matching entry; unknown extensions are binary.
*/
function fileTypeOf(path) {
	const extension = extensionOf(path);
	if (MARKDOWN_TYPES.has(extension)) return {
		kind: "markdown",
		language: "markdown",
		mime: "text/markdown; charset=utf-8",
		previewable: true
	};
	const image = IMAGE_TYPES[extension];
	if (image !== void 0) return {
		kind: "image",
		mime: image,
		previewable: true
	};
	if (extension === "pdf") return {
		kind: "pdf",
		mime: "application/pdf",
		previewable: true
	};
	const language = TEXT_TYPES[extension];
	if (language !== void 0) return {
		kind: "code",
		language,
		mime: "text/plain; charset=utf-8",
		previewable: true
	};
	return BINARY;
}
//#endregion
//#region src/vault/tree.ts
function insert(root, path, meta, dir = false) {
	const parts = path.split("/");
	let node = root;
	for (let index = 0; index < parts.length; index += 1) {
		const name = parts[index];
		const childPath = parts.slice(0, index + 1).join("/");
		const file = index === parts.length - 1 && !dir;
		let child = node.children.get(name);
		if (child === void 0) {
			child = {
				name,
				path: childPath,
				kind: file ? "file" : "dir",
				children: /* @__PURE__ */ new Map(),
				...file && meta?.mtime !== void 0 ? { mtime: meta.mtime } : {},
				...file && meta?.size !== void 0 ? { size: meta.size } : {}
			};
			node.children.set(name, child);
		}
		node = child;
	}
}
function finish(node) {
	const children = [...node.children.values()].sort((left, right) => {
		if (left.kind !== right.kind) return left.kind === "dir" ? -1 : 1;
		return left.name.localeCompare(right.name, "zh");
	}).map((child) => finish(child));
	return {
		name: node.name,
		path: node.path,
		kind: node.kind,
		...node.mtime === void 0 ? {} : { mtime: node.mtime },
		...node.size === void 0 ? {} : { size: node.size },
		...children.length === 0 ? {} : { children }
	};
}
/**
* Last segment of a vault-relative path.
* @param path - path with `/` separators.
*/
function baseName(path) {
	return path.slice(path.lastIndexOf("/") + 1);
}
/**
* Build the nested explorer tree.
* @param files - vault-relative path to its metadata.
* @param dirs - vault-relative directories, including empty ones no file mentions.
* @returns the root level nodes.
*/
function buildTree(files, dirs = []) {
	const root = {
		name: "",
		path: "",
		kind: "dir",
		children: /* @__PURE__ */ new Map()
	};
	for (const path of dirs) insert(root, path, void 0, true);
	for (const [path, meta] of files) insert(root, path, meta);
	return finish(root).children ?? [];
}
//#endregion
//#region src/vault/index-read.ts
/** Text the file view may carry to the browser; longer files arrive truncated. */
const MAX_TEXT_BYTES = 1024 * 1024;
/**
* Resolve a vault-relative path against the scanned root.
* @param fs - Host filesystem service.
* @param root - the scanned root target.
* @param path - vault-relative path.
* @returns the resolved target.
* @throws {Error} when the root has not been resolved yet.
*/
async function resolveInVault(fs, root, path) {
	if (root === void 0) throw new Error("vault root is not resolved yet");
	const separator = root.displayPath.endsWith("\\") ? "\\" : "/";
	return fs.resolve(`${root.displayPath}${separator}${path.replace(/\//g, separator)}`);
}
/**
* Read one vault file for the file viewer. Markdown and whitelisted text files
* carry a prefix of their content; images, PDFs, and binaries carry metadata
* only and stream through the asset route.
* @param files - the vault file helper.
* @param path - vault-relative path.
* @returns the file, or undefined when it is absent or a directory.
*/
async function fileOf(files, path) {
	const info = await files.info(path);
	if (info === void 0) return void 0;
	const spec = fileTypeOf(path);
	const base = {
		path,
		name: baseName(path),
		ext: extensionOf(path),
		kind: spec.kind,
		mime: spec.mime,
		size: info.size,
		mtime: info.mtime,
		truncated: false,
		...spec.language === void 0 ? {} : { language: spec.language }
	};
	if (spec.kind !== "markdown" && spec.kind !== "code") return base;
	try {
		const prefix = await files.readPrefix(path, MAX_TEXT_BYTES);
		return {
			...base,
			size: prefix.size,
			text: prefix.text,
			truncated: prefix.truncated
		};
	} catch {
		return base;
	}
}
/**
* Read one attachment inside the vault.
* @param input - filesystem service, root and indexed attachments.
* @param path - vault-relative path.
* @param maxBytes - inclusive cap.
* @returns the bytes, or undefined when the file is absent, outside the vault, or unreadable.
*/
async function readAssetOf(input, path, maxBytes) {
	const readBytes = input.fs.readBytes;
	if (input.root === void 0 || readBytes === void 0) return void 0;
	if (!input.attachments.has(path)) return void 0;
	try {
		const target = await resolveInVault(input.fs, input.root, path);
		if (input.fs.contains !== void 0 && !input.fs.contains(input.root, target)) return void 0;
		return await readBytes.call(input.fs, target, void 0, maxBytes);
	} catch {
		return;
	}
}
//#endregion
//#region src/vault/store.ts
/**
* The vault index state: owned collections, the serialized scan cycle, and the
* parse step. `VaultIndex` is the public facade over one store instance.
* @module dsh-obsidian-vault/vault/store
*/
/** Live vault state: parsed notes, derived indexes and the scan chain. */
var VaultStore = class {
	/** Parsed notes by vault-relative path. */
	notes = /* @__PURE__ */ new Map();
	/** Attachment paths. */
	attachments = /* @__PURE__ */ new Set();
	/** Attachment metadata by path. */
	attachmentMeta = /* @__PURE__ */ new Map();
	/** Root target once the first scan resolved it. */
	rootTarget;
	/** Directories whose change can invalidate the index. */
	directories = [];
	/** Every scanned directory path. */
	dirPaths = [];
	/** Link resolver built by the last reindex. */
	resolver;
	/** Outgoing links by note path. */
	linkIndex = /* @__PURE__ */ new Map();
	/** Incoming links by note path. */
	backlinks = /* @__PURE__ */ new Map();
	/** Tag counts from the last reindex. */
	tagCounts = /* @__PURE__ */ new Map();
	/** Link adjacency from the last reindex. */
	adjacency = /* @__PURE__ */ new Map();
	/** Bumped after every published scan. */
	revision = 0;
	/** Last scan failure, cleared by the next successful scan. */
	failure;
	/** Signature of the last published scan. */
	signature;
	/** The vault file helper bound to the current root. */
	files;
	/** Absolute root currently indexed. */
	rootPath;
	/** Host filesystem service. */
	fs;
	/** Resolved tunables. */
	options;
	scanChain = Promise.resolve();
	/**
	* @param fs - Host filesystem service.
	* @param options - resolved tunables.
	*/
	constructor(fs, options) {
		this.fs = fs;
		this.options = options;
		this.rootPath = options.root;
		this.files = new VaultFiles(options.root);
	}
	/**
	* Point the store at another vault directory and drop everything derived
	* from the old root; the revision bump tells the page its cached views are
	* stale.
	* @param root - absolute directory of the new vault.
	*/
	rebind(root) {
		this.rootPath = root;
		this.files = new VaultFiles(root);
		this.notes = /* @__PURE__ */ new Map();
		this.attachments = /* @__PURE__ */ new Set();
		this.attachmentMeta = /* @__PURE__ */ new Map();
		this.rootTarget = void 0;
		this.directories = [];
		this.dirPaths = [];
		this.resolver = void 0;
		this.linkIndex = /* @__PURE__ */ new Map();
		this.backlinks = /* @__PURE__ */ new Map();
		this.tagCounts = /* @__PURE__ */ new Map();
		this.adjacency = /* @__PURE__ */ new Map();
		this.failure = void 0;
		this.signature = void 0;
		this.revision += 1;
	}
	/**
	* Rescan the vault, reusing parsed entries whose filesystem version did not
	* move. Scans run one at a time in call order, so a scan that read the vault
	* before a write cannot publish its older snapshot after a scan that saw the
	* write.
	* @returns nothing; failures land on the failure field.
	*/
	async refresh() {
		const run = this.scanChain.then(() => this.scan());
		this.scanChain = run.catch(() => void 0);
		await run;
	}
	/**
	* Read one indexed note body from disk.
	* @param path - vault-relative path.
	* @returns the file text, or an empty string before the root resolves.
	*/
	async readText(path) {
		if (this.rootTarget === void 0) return "";
		return this.fs.readText(await resolveInVault(this.fs, this.rootTarget, path));
	}
	async scan() {
		let result;
		try {
			result = await scanVault(this.fs, this.rootPath, this.options, this.notes, (target, path, key, size, budget) => this.parse(target, path, key, size, budget));
		} catch (error) {
			this.failure = error instanceof Error ? error.message : String(error);
			return;
		}
		if (this.signature === result.signature) {
			this.failure = void 0;
			return;
		}
		this.signature = result.signature;
		this.notes = result.notes;
		this.attachments = result.attachments;
		this.attachmentMeta = result.attachmentMeta;
		this.directories = result.directories;
		this.dirPaths = result.dirPaths;
		this.rootTarget = result.root;
		this.reindex();
		this.revision += 1;
		this.failure = void 0;
	}
	parse(target, path, key, size, budget) {
		return this.files.mtimeOf(path).then((mtime) => parseNoteEntry({
			path,
			key,
			size,
			budget,
			maxFileBytes: this.options.maxFileBytes,
			mtime,
			read: () => this.fs.readText(target)
		}));
	}
	reindex() {
		const derived = deriveIndex(this.notes, this.attachments);
		this.resolver = derived.resolver;
		this.linkIndex = new Map(derived.linkIndex);
		this.backlinks = new Map(derived.backlinks);
		this.tagCounts = new Map(derived.tagCounts);
		this.adjacency = new Map(derived.adjacency);
	}
};
//#endregion
//#region src/vault/projections.ts
/**
* Build the status report the page shell renders.
* @param input - the current snapshot fields.
* @returns the status DTO.
*/
function statusOf(input) {
	return {
		ready: input.ready,
		root: input.root,
		notes: input.notes,
		version: input.version,
		...input.failure === void 0 ? {} : { error: input.failure }
	};
}
/**
* Build the explorer tree over notes, attachments and scanned directories.
* @param input - the indexed collections.
* @returns the tree nodes.
*/
function treeOf(input) {
	const files = [...input.notes].map(([path, entry]) => [path, entry.mtime === void 0 ? { size: entry.size } : {
		size: entry.size,
		mtime: entry.mtime
	}]);
	for (const path of input.attachments) files.push([path, input.attachmentMeta.get(path) ?? {}]);
	return buildTree(files, input.dirPaths);
}
/**
* Tags with note counts, most frequent first.
* @param tagCounts - tag to note count.
* @returns the sorted tag counts.
*/
function tagsOf(tagCounts) {
	return [...tagCounts.entries()].map(([tag, count]) => ({
		tag,
		count
	})).sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}
//#endregion
//#region src/vault/links.ts
/**
* Link rewriting for a moved note: every wikilink whose target resolved to the
* moved path is retargeted, preserving alias, heading anchor, block id, and the
* embed `!` prefix.
* @module dsh-obsidian-vault/vault/links
*/
/**
* Retarget links that point at `from` so they point at `to`.
* @param source - full note text, frontmatter included.
* @param from - old vault-relative path.
* @param to - new vault-relative path.
* @param options - resolution and title facts.
*/
function rewriteMoveLinks(source, from, to, options) {
	const target = to.replace(/\.md$/i, "");
	let changed = 0;
	return {
		text: replaceWikiLinks(source, (token) => {
			if (options.resolve(token.target) !== from) return token.raw;
			if (!token.target.includes("/") && options.titleStillUnique && !options.titleChanged) return token.raw;
			const anchor = token.anchor === void 0 || token.anchor.length === 0 ? "" : `#${token.anchor}`;
			const block = token.block === void 0 ? "" : anchor.length > 0 ? `^${token.block}` : `#^${token.block}`;
			const alias = token.alias === void 0 ? "" : `|${token.alias}`;
			changed += 1;
			return `${token.embed ? "!" : ""}[[${target}${anchor}${block}${alias}]]`;
		}),
		changed
	};
}
//#endregion
//#region src/vault/move.ts
const MARKDOWN$1 = /\.md$/i;
/**
* Move a note or folder, rewriting links that pointed at the old path. A
* folder move rewrites links to every descendant note as well. The caller
* rescans afterwards.
* @param state - index slices the move reads.
* @param from - current vault-relative path.
* @param to - destination vault-relative path.
* @returns the moved path, rewritten notes, and the trash backup.
*/
async function moveEntry(state, from, to) {
	if (from === to) return {
		moved: to,
		rewritten: [],
		backup: void 0
	};
	if (to.startsWith(`${from}/`)) throw new Error(`cannot move a folder into itself: ${to}`);
	if (await state.files.exists(to)) throw new Error(`target already exists: ${to}`);
	const mappings = [...state.notes.keys()].filter((path) => path === from || path.startsWith(`${from}/`)).map((path) => ({
		from: path,
		to: path === from ? to : `${to}/${path.slice(from.length + 1)}`
	}));
	const moving = new Set(mappings.map((mapping) => mapping.from));
	const counts = /* @__PURE__ */ new Map();
	for (const [path, note] of state.notes) {
		if (moving.has(path)) continue;
		counts.set(note.title, (counts.get(note.title) ?? 0) + 1);
	}
	const facts = mappings.map((mapping) => {
		const entry = state.notes.get(mapping.from);
		return {
			...mapping,
			titleChanged: entry !== void 0 && entry.title !== baseName(mapping.to).replace(MARKDOWN$1, ""),
			titleStillUnique: (counts.get(baseName(mapping.to).replace(MARKDOWN$1, "")) ?? 0) === 0
		};
	});
	const affected = /* @__PURE__ */ new Set();
	for (const mapping of mappings) for (const item of state.backlinks.get(mapping.from) ?? []) affected.add(item.path);
	const resolver = state.resolver;
	const rewrites = [];
	for (const path of affected) {
		let raw;
		try {
			raw = await state.files.readText(path);
		} catch {
			continue;
		}
		let text = raw;
		let count = 0;
		for (const mapping of facts) {
			const result = rewriteMoveLinks(text, mapping.from, mapping.to, {
				resolve: (target) => {
					const resolution = resolver?.resolve(target, path);
					return resolution?.status === "resolved" ? resolution.path : void 0;
				},
				titleStillUnique: mapping.titleStillUnique,
				titleChanged: mapping.titleChanged
			});
			text = result.text;
			count += result.changed;
		}
		if (count > 0) rewrites.push({
			path,
			before: raw,
			after: text,
			count
		});
	}
	const backup = state.notes.has(from) ? await state.files.backup(from, `move-${Date.now()}`) : void 0;
	const written = [];
	try {
		for (const rewrite of rewrites) {
			await state.files.writeText(rewrite.path, rewrite.after);
			written.push(rewrite.path);
		}
		await state.files.move(from, to);
	} catch (error) {
		for (const path of written) {
			const rewrite = rewrites.find((item) => item.path === path);
			if (rewrite !== void 0) await state.files.writeText(path, rewrite.before).catch(() => void 0);
		}
		throw error;
	}
	return {
		moved: to,
		rewritten: rewrites.map((item) => ({
			path: item.path,
			count: item.count
		})),
		backup
	};
}
//#endregion
//#region src/vault/index-ops.ts
/**
* Rename one entry in place, rewriting links like a same-folder move so
* existing `[[links]]` keep resolving. Conflicts reject instead of overwriting
* the target.
* @param ctx - index state and services.
* @param path - vault-relative path.
* @param name - new file name (no separators).
*/
async function renameEntry(ctx, path, name) {
	const trimmed = name.trim();
	if (trimmed.length === 0 || trimmed === "." || trimmed === ".." || trimmed.includes("/") || trimmed.includes("\\")) throw new Error(`invalid name: ${name}`);
	const slash = path.lastIndexOf("/");
	const to = slash === -1 ? trimmed : `${path.slice(0, slash)}/${trimmed}`;
	if (to === path) return;
	await moveEntryTo(ctx, path, to);
}
/**
* Move one entry to `.trash`, then rescan.
* @param ctx - index state and services.
* @param path - vault-relative path.
* @returns the trash path.
*/
async function removeEntry(ctx, path) {
	const trashed = await ctx.files.moveToTrash(path);
	await ctx.refresh();
	return trashed;
}
/**
* Move a note or folder, rewriting links that pointed at the old path. A folder
* move rewrites links to every descendant note as well.
* @param ctx - index state and services.
* @param from - current vault-relative path.
* @param to - destination vault-relative path.
* @returns the moved path, rewritten notes, and the trash backup.
*/
async function moveEntryTo(ctx, from, to) {
	const outcome = await moveEntry({
		files: ctx.files,
		notes: ctx.notes,
		backlinks: ctx.backlinks,
		resolver: ctx.resolver
	}, from, to);
	await ctx.refresh();
	return outcome;
}
/**
* Create a folder, then rescan.
* @param ctx - index state and services.
* @param path - vault-relative folder path.
*/
async function makeFolderIn(ctx, path) {
	await ctx.files.mkdir(path);
	await ctx.refresh();
}
//#endregion
//#region src/vault/index-write.ts
const MARKDOWN = /\.md$/i;
/**
* Create an empty note when it does not exist yet.
* @param ctx - index state and services.
* @param path - vault-relative path ending in `.md`.
* @returns true when the file now exists.
*/
async function createNote(ctx, path) {
	if (ctx.hasNote(path)) return true;
	if (!path.toLowerCase().endsWith(".md")) return false;
	if (ctx.root !== void 0) {
		const separator = ctx.root.displayPath.endsWith("\\") ? "\\" : "/";
		try {
			const target = await ctx.fs.resolve(`${ctx.root.displayPath}${separator}${path.replace(/\//g, separator)}`);
			await ctx.fs.writeText(target, "", { kind: "createIfAbsent" });
			await ctx.refresh();
			return true;
		} catch {}
	}
	try {
		await ctx.files.writeNew(path, "");
		await ctx.refresh();
		return true;
	} catch {
		return false;
	}
}
/**
* Replace one indexed note's text, refusing a write when the file changed on
* disk since the caller read it.
* @param ctx - index state and services.
* @param path - vault-relative path.
* @param content - complete new file text.
* @param baseMtime - modification time the caller started from; omit to overwrite unconditionally.
* @returns the fresh modification time, or the rejection the route reports.
*/
async function saveNoteTo(ctx, path, content, baseMtime) {
	if (!MARKDOWN.test(path)) return {
		ok: false,
		status: 400,
		error: "not a markdown note"
	};
	if (!ctx.hasNote(path)) return {
		ok: false,
		status: 404,
		error: "note not found"
	};
	if (Buffer.byteLength(content, "utf8") > ctx.options.maxFileBytes) return {
		ok: false,
		status: 400,
		error: "note exceeds the configured size limit"
	};
	if (baseMtime !== void 0) {
		const current = await ctx.files.mtimeOf(path);
		if (current !== void 0 && Math.round(current) !== Math.round(baseMtime)) return {
			ok: false,
			status: 409,
			error: "note changed on disk",
			mtime: current
		};
	}
	await ctx.files.writeText(path, content);
	const mtime = await ctx.files.mtimeOf(path);
	await ctx.refresh();
	return {
		ok: true,
		path,
		mtime: mtime ?? Date.now()
	};
}
//#endregion
//#region src/vault/index.ts
/** Live vault index. One instance per plugin fiber. */
var VaultIndex = class {
	store;
	/**
	* @param fs - Host filesystem service.
	* @param options - resolved tunables.
	*/
	constructor(fs, options) {
		this.store = new VaultStore(fs, options);
	}
	/**
	* Point the index at another vault directory. Parsed entries and every
	* derived index belong to the old root, so they are dropped before the next
	* refresh.
	* @param root - absolute directory of the new vault.
	*/
	rebind(root) {
		this.store.rebind(root);
	}
	/**
	* Rename one entry in place, rewriting links like a same-folder move so
	* existing `[[links]]` keep resolving. Conflicts reject instead of
	* overwriting the target.
	* @param path - vault-relative path.
	* @param name - new file name (no separators).
	*/
	async rename(path, name) {
		await renameEntry(this.opsContext(), path, name);
	}
	/**
	* Move one entry to `.trash`, then rescan.
	* @param path - vault-relative path.
	* @returns the trash path.
	*/
	async remove(path) {
		return removeEntry(this.opsContext(), path);
	}
	/**
	* Move a note or folder, rewriting links that pointed at the old path. A
	* folder move rewrites links to every descendant note as well.
	* @param from - current vault-relative path.
	* @param to - destination vault-relative path.
	* @returns the moved path, rewritten notes, and the trash backup.
	*/
	async move(from, to) {
		return moveEntryTo(this.opsContext(), from, to);
	}
	/**
	* Create a folder, then rescan.
	* @param path - vault-relative folder path.
	*/
	async makeFolder(path) {
		await makeFolderIn(this.opsContext(), path);
	}
	/** Vault-relative paths of every indexed note, sorted. */
	get paths() {
		return [...this.store.notes.keys()].sort();
	}
	/** Root target once the first scan resolved it. */
	get root() {
		return this.store.rootTarget;
	}
	/** Directories whose change can invalidate the index. */
	get watchedDirectories() {
		return this.store.directories;
	}
	/** Index revision; changes after every rescan. */
	get version() {
		return this.store.revision;
	}
	/**
	* Rescan the vault, reusing parsed entries whose filesystem version did not
	* move.
	* @returns nothing; failures land on the status report.
	*/
	async refresh() {
		await this.store.refresh();
	}
	/** Status report for the page shell. */
	status() {
		return statusOf({
			ready: this.store.notes.size > 0,
			root: this.store.rootPath,
			notes: this.store.notes.size,
			version: this.store.revision,
			failure: this.store.failure
		});
	}
	/** Explorer tree over notes, attachments, and every scanned directory. */
	tree() {
		return treeOf({
			notes: this.store.notes,
			attachments: this.store.attachments,
			attachmentMeta: this.store.attachmentMeta,
			dirPaths: this.store.dirPaths
		});
	}
	/**
	* Read one note into its display form.
	* @param path - vault-relative path.
	* @returns the note, or undefined when it is not indexed.
	*/
	async note(path) {
		const entry = this.store.notes.get(path);
		if (entry === void 0) return void 0;
		let content = entry.content;
		if (content === null && this.store.rootTarget !== void 0) try {
			content = await this.store.readText(path);
		} catch {
			content = "";
		}
		const parsed = parseFrontmatter(content ?? "");
		return {
			path,
			title: entry.title,
			content: parsed.body,
			frontmatter: parsed.values,
			tags: entry.tags,
			headings: entry.headings,
			links: this.store.linkIndex.get(path) ?? [],
			blocks: entry.blocks
		};
	}
	/**
	* Notes that link to this path.
	* @param path - vault-relative path.
	* @returns the backlinks, empty when none link here.
	*/
	backlinksOf(path) {
		return this.store.backlinks.get(path) ?? [];
	}
	/**
	* Mentions of this note's title or an alias that are not wikilinks.
	* @param path - vault-relative path.
	* @param limit - maximum mentions.
	* @returns the mention rows.
	*/
	unlinkedMentions(path, limit = 20) {
		return unlinkedMentionsOf(this.store.notes, path, limit);
	}
	/** Tags with note counts, most frequent first. */
	tags() {
		return tagsOf(this.store.tagCounts);
	}
	/**
	* Rank notes by title, alias, tag, path, then content; operator queries use
	* the shared parser.
	* @param query - raw query text.
	* @param limit - maximum hits.
	* @returns the ranked hits.
	*/
	search(query, limit = 40) {
		return searchNotes(this.store.notes, query, limit);
	}
	/**
	* Link graph around one note, or the whole vault when no center is given.
	* @param center - vault-relative path to center on.
	* @param depth - hop limit for a centered graph.
	* @param limit - node cap for a global graph.
	* @param filter - query text, tag, and which synthetic node kinds to include.
	* @returns the graph document.
	*/
	graph(center, depth = 2, limit = 400, filter = {}) {
		return buildGraph({
			notes: this.store.notes,
			adjacency: this.store.adjacency,
			linksByNote: this.store.linkIndex,
			attachments: this.store.attachments
		}, {
			center,
			depth,
			limit,
			filter
		});
	}
	/**
	* Create an empty note when it does not exist yet.
	* @param path - vault-relative path ending in `.md`.
	* @returns true when the file now exists.
	*/
	async create(path) {
		return createNote(this.writeContext(), path);
	}
	/**
	* Replace one indexed note's text, refusing a write when the file changed on
	* disk since the caller read it.
	* @param path - vault-relative path.
	* @param content - complete new file text.
	* @param baseMtime - modification time the caller started from; omit to overwrite unconditionally.
	* @returns the fresh modification time, or the rejection the route reports.
	*/
	async saveNote(path, content, baseMtime) {
		return saveNoteTo(this.writeContext(), path, content, baseMtime);
	}
	/**
	* Read one vault file for the file viewer.
	* @param path - vault-relative path.
	* @returns the file, or undefined when it is absent or a directory.
	*/
	async file(path) {
		return fileOf(this.store.files, path);
	}
	/**
	* Read one attachment inside the vault.
	* @param path - vault-relative path.
	* @param maxBytes - inclusive cap.
	* @returns the bytes, or undefined when the file is absent, outside the vault, or unreadable.
	*/
	async readAsset(path, maxBytes = 32 * 1024 * 1024) {
		return readAssetOf({
			fs: this.store.fs,
			root: this.store.rootTarget,
			attachments: this.store.attachments
		}, path, maxBytes);
	}
	/** Bundle the state the entry operations read. @returns the ops context. */
	opsContext() {
		return {
			files: this.store.files,
			notes: this.store.notes,
			backlinks: this.store.backlinks,
			resolver: this.store.resolver,
			refresh: () => this.store.refresh()
		};
	}
	/** Bundle the state the write paths read. @returns the write context. */
	writeContext() {
		return {
			fs: this.store.fs,
			files: this.store.files,
			options: this.store.options,
			root: this.store.rootTarget,
			hasNote: (path) => this.store.notes.has(path),
			refresh: () => this.store.refresh()
		};
	}
};
//#endregion
//#region src/vault/watch.ts
const DEBOUNCE_MS = 250;
/** Owns the directory watchers and the debounced rescan. */
var VaultWatcher = class {
	closed = false;
	timer;
	watchers = [];
	watchedKey = "";
	refreshing = false;
	dirty = false;
	fs;
	vault;
	report;
	/**
	* @param fs - Host filesystem service.
	* @param vault - index to refresh.
	* @param report - failure sink; watching is best-effort.
	*/
	constructor(fs, vault, report) {
		this.fs = fs;
		this.vault = vault;
		this.report = report;
	}
	/**
	* Replace the current watchers with one per indexed directory.
	* @param signal - aborts initialization.
	*/
	async sync(signal) {
		const key = this.vault.watchedDirectories.map((directory) => directory.displayPath).join("|");
		if (key === this.watchedKey) return;
		this.watchedKey = key;
		await this.releaseWatchers();
		if (this.closed) return;
		for (const directory of this.vault.watchedDirectories) {
			if (this.closed) return;
			await this.watch(directory, signal);
		}
	}
	/** Stop every watcher and cancel a pending rescan. */
	async close() {
		this.closed = true;
		this.watchedKey = "";
		if (this.timer !== void 0) {
			clearTimeout(this.timer);
			this.timer = void 0;
		}
		await this.releaseWatchers();
	}
	async releaseWatchers() {
		const watchers = this.watchers;
		this.watchers = [];
		for (const close of watchers) try {
			await close();
		} catch (error) {
			this.report(error instanceof Error ? error : new Error(String(error)));
		}
	}
	async watch(directory, signal) {
		const watch = this.fs.watch;
		if (watch === void 0) return;
		try {
			const close = await watch.call(this.fs, directory, () => {
				this.schedule();
			}, signal);
			this.watchers.push(close);
		} catch (error) {
			this.report(error instanceof Error ? error : new Error(String(error)));
		}
	}
	schedule() {
		this.dirty = true;
		if (this.timer !== void 0) return;
		this.timer = setTimeout(() => {
			this.timer = void 0;
			this.flush();
		}, DEBOUNCE_MS);
	}
	async flush() {
		if (this.refreshing) return;
		this.refreshing = true;
		try {
			while (this.dirty && !this.closed) {
				this.dirty = false;
				await this.vault.refresh();
				const abort = new AbortController();
				await this.sync(abort.signal);
			}
		} catch (error) {
			this.report(error instanceof Error ? error : new Error(String(error)));
		} finally {
			this.refreshing = false;
		}
	}
};
/**
* Read the registry file.
* @param settings - file location and failure sink.
* @returns the stored document, or undefined when absent or unreadable.
*/
async function readRegistry(settings) {
	let text;
	try {
		text = await readFile(settings.storePath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") settings.report(asError$1(error));
		return;
	}
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		settings.report(asError$1(error));
		return;
	}
	if (typeof parsed !== "object" || parsed === null) return void 0;
	const document = parsed;
	if (!Array.isArray(document.vaults)) return void 0;
	const vaults = document.vaults.flatMap((item) => {
		if (typeof item !== "object" || item === null) return [];
		const record = item;
		if (typeof record["id"] !== "string" || typeof record["path"] !== "string") return [];
		return [{
			id: record["id"],
			path: resolve(record["path"]),
			name: typeof record["name"] === "string" && record["name"].length > 0 ? record["name"] : basename(record["path"]),
			lastOpenedAt: typeof record["lastOpenedAt"] === "number" ? record["lastOpenedAt"] : 0
		}];
	});
	return {
		version: 1,
		...typeof document.activeId === "string" ? { activeId: document.activeId } : {},
		vaults
	};
}
/**
* Write the registry file atomically (temporary file, then rename).
* @param settings - file location and failure sink.
* @param document - the document to persist.
*/
async function writeRegistry(settings, document) {
	try {
		await mkdir(dirname(settings.storePath), { recursive: true });
		const temporary = `${settings.storePath}.tmp`;
		await writeFile(temporary, `${JSON.stringify(document, void 0, 2)}\n`, "utf8");
		await rename(temporary, settings.storePath);
	} catch (error) {
		settings.report(asError$1(error));
	}
}
function asError$1(error) {
	return error instanceof Error ? error : new Error(String(error));
}
//#endregion
//#region src/vault/registry.ts
/**
* Vault registry: the set of known vault directories, the active one, and the
* index plus watcher bound to it. Switching a vault rebinds the same index, so
* every route keeps one live object.
* @module dsh-obsidian-vault/vault/registry
*/
/** Live vault registry. One instance per plugin fiber. */
var VaultRegistry = class {
	records = [];
	activeId;
	index;
	watcher;
	fs;
	options;
	settings;
	loaded = false;
	/** @param fs - Host filesystem service. */
	constructor(fs, options, settings) {
		this.fs = fs;
		this.options = options;
		this.settings = settings;
		this.index = new VaultIndex(fs, options);
		this.watcher = new VaultWatcher(fs, this.index, (error) => settings.report(error));
	}
	/** The index every note route reads. */
	get vault() {
		return this.index;
	}
	/**
	* Restore the registry file and activate its last vault. A fresh install
	* registers the configured root so the workspace still has content.
	* @returns nothing; failures land on the status report.
	*/
	async start() {
		if (this.loaded) return;
		this.loaded = true;
		const stored = await this.read();
		if (stored === void 0) {
			const seed = this.recordFor(this.options.root, void 0);
			this.records = [seed];
			this.activeId = seed.id;
		} else {
			this.records = [...stored.vaults];
			this.activeId = stored.activeId !== void 0 && stored.vaults.some((item) => item.id === stored.activeId) ? stored.activeId : this.records[0]?.id;
		}
		const active = this.active();
		if (active === void 0) {
			await this.activateUndefined();
			await this.save();
			return;
		}
		await this.activate(active, false);
	}
	/** Registry snapshot for the vault manager. */
	list() {
		const activeId = this.activeId;
		return {
			...activeId === void 0 ? {} : { activeId },
			vaults: [...this.records].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt).map((item) => this.toDto(item))
		};
	}
	/** The active record, if any. */
	active() {
		return this.records.find((item) => item.id === this.activeId);
	}
	/**
	* Activate a directory, registering it when it is new.
	* @param path - absolute directory chosen by the user.
	* @param init - create `.obsidian` when the folder has none.
	* @returns the activated vault and whether it carries configuration.
	*/
	async open(path, init = false) {
		const directory = resolve(path);
		await this.fs.resolve(directory);
		if (init) await mkdir(resolve(directory, ".obsidian"), { recursive: true });
		const existing = this.records.find((item) => item.path === directory);
		const record = existing ?? this.recordFor(directory, void 0);
		if (existing === void 0) this.records = [...this.records, record];
		await this.activate(record, true);
		return {
			vault: this.toDto(record),
			configured: await hasConfigDirectory(directory)
		};
	}
	/**
	* Create a directory when missing and register it as a vault.
	* @param path - absolute directory to use.
	* @param name - display name; defaults to the directory name.
	*/
	async create(path, name) {
		const directory = resolve(path);
		await mkdir(directory, { recursive: true });
		await mkdir(resolve(directory, ".obsidian"), { recursive: true });
		const existing = this.records.find((item) => item.path === directory);
		const record = existing ?? this.recordFor(directory, name);
		if (existing === void 0) this.records = [...this.records, record];
		else if (name !== void 0 && name.trim().length > 0) this.records = this.records.map((item) => item.id === record.id ? {
			...item,
			name: name.trim()
		} : item);
		await this.activate(record, true);
		return {
			vault: this.toDto(record),
			configured: true
		};
	}
	/**
	* Drop one vault from the list. Forgetting the active vault activates the
	* most recently used remaining one, or an empty vault when none remain.
	* @param id - registry id.
	*/
	async forget(id) {
		if (this.records.find((item) => item.id === id) === void 0) return;
		this.records = this.records.filter((item) => item.id !== id);
		if (this.activeId !== id) {
			await this.save();
			return;
		}
		this.activeId = void 0;
		const next = [...this.records].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)[0];
		if (next === void 0) await this.activateUndefined();
		else await this.activate(next, true);
	}
	/**
	* Probe a directory before opening it: whether it exists, carries
	* `.obsidian`, and is already registered. The picker dialog asks before
	* activating an unconfigured folder, so this never mutates anything.
	* @param path - candidate directory.
	*/
	async inspect(path) {
		const directory = resolve(path);
		let exists = false;
		try {
			exists = (await stat(directory)).isDirectory();
		} catch {
			exists = false;
		}
		return {
			path: directory,
			exists,
			configured: exists && await hasConfigDirectory(directory),
			registered: this.records.some((item) => item.path === directory),
			name: basename(directory)
		};
	}
	/** Stop the watcher. */
	async close() {
		await this.watcher.close();
	}
	async activate(record, persist) {
		this.activeId = record.id;
		this.records = this.records.map((item) => item.id === record.id ? {
			...item,
			name: item.name.length > 0 ? item.name : basename(item.path),
			lastOpenedAt: Date.now()
		} : item);
		this.index.rebind(record.path);
		try {
			await this.index.refresh();
		} catch (error) {
			this.settings.report(asError(error));
		}
		await this.syncWatcher();
		if (persist) await this.save();
	}
	async activateUndefined() {
		await mkdir(this.settings.emptyVaultPath, { recursive: true });
		this.index.rebind(this.settings.emptyVaultPath);
		try {
			await this.index.refresh();
		} catch (error) {
			this.settings.report(asError(error));
		}
		await this.syncWatcher();
	}
	async syncWatcher() {
		try {
			await this.watcher.sync(this.settings.signal);
		} catch (error) {
			this.settings.report(asError(error));
		}
	}
	recordFor(path, name) {
		const directory = resolve(path);
		return {
			id: randomUUID(),
			path: directory,
			name: name !== void 0 && name.trim().length > 0 ? name.trim() : basename(directory),
			lastOpenedAt: Date.now()
		};
	}
	toDto(record) {
		return {
			id: record.id,
			path: record.path,
			name: record.name,
			lastOpenedAt: record.lastOpenedAt,
			...record.id === this.activeId ? { active: true } : {}
		};
	}
	async read() {
		return readRegistry(this.settings);
	}
	async save() {
		await writeRegistry(this.settings, {
			version: 1,
			...this.activeId === void 0 ? {} : { activeId: this.activeId },
			vaults: this.records
		});
	}
};
/** Whether a directory carries an Obsidian configuration folder. */
async function hasConfigDirectory(path) {
	try {
		return (await stat(resolve(path, ".obsidian"))).isDirectory();
	} catch {
		return false;
	}
}
function asError(error) {
	return error instanceof Error ? error : new Error(String(error));
}
//#endregion
//#region src/index.ts
/**
* Host half: resolve the vault, build the index, mount `/obsidian/api`, and
* keep the index fresh from directory watches.
* @module dsh-obsidian-vault
*/
/** Cordis plugin name. */
const name = "obsidian-vault";
/** Services the Host half needs before it can mount. */
const inject = ["webServer", "fs"];
const DEFAULTS = {
	ignore: [
		".obsidian",
		".trash",
		".git",
		"node_modules",
		".DS_Store",
		"__pycache__"
	],
	maxFileBytes: 2 * 1024 * 1024,
	maxIndexBytes: 64 * 1024 * 1024,
	maxDepth: 12
};
/**
* Mount the vault workspace.
* @param ctx - plugin context carrying the filesystem and Web carrier.
* @param config - optional vault settings.
*/
async function apply(ctx, config) {
	const settings = resolveConfig(config);
	const abort = new AbortController();
	const registry = new VaultRegistry(ctx.fs, settings, {
		storePath: join(dshHome(), "obsidian-vault", "vaults.json"),
		emptyVaultPath: join(dshHome(), "obsidian-vault", "empty-vault"),
		report: (error) => {
			ctx.logger?.warn?.(`obsidian-vault: ${error.message}`);
		},
		signal: abort.signal
	});
	ctx.effect(() => mountVaultRoutes(ctx, registry), "obsidian-vault: routes");
	ctx.effect(() => () => {
		abort.abort();
		registry.close();
	}, "obsidian-vault: cleanup");
	try {
		await registry.start();
	} catch (error) {
		ctx.logger?.warn?.(`obsidian-vault: initial scan failed: ${messageOf(error)}`);
	}
	const status = registry.vault.status();
	ctx.logger?.info?.(`obsidian-vault: ${status.notes} notes under ${status.root}`);
}
/** Directory the Host keeps its own vault registry under. */
function dshHome() {
	const configured = process.env.DSH_HOME;
	return configured !== void 0 && configured.trim().length > 0 ? resolve(configured) : join(homedir(), ".dsh");
}
function messageOf(error) {
	return error instanceof Error ? error.message : String(error);
}
function resolveConfig(config) {
	return {
		root: config?.vault !== void 0 && config.vault.trim().length > 0 ? resolve(config.vault) : detectVault(),
		ignore: config?.ignore ?? DEFAULTS.ignore,
		maxFileBytes: positive(config?.maxFileBytes, DEFAULTS.maxFileBytes),
		maxIndexBytes: positive(config?.maxIndexBytes, DEFAULTS.maxIndexBytes),
		maxDepth: positive(config?.maxDepth, DEFAULTS.maxDepth)
	};
}
/** Walk up from the working directory looking for a vault marker. */
function detectVault() {
	let directory = process.cwd();
	for (let depth = 0; depth < 6; depth += 1) {
		if (existsSync(join(directory, ".obsidian"))) return directory;
		const parent = dirname(directory);
		if (parent === directory) break;
		directory = parent;
	}
	return process.cwd();
}
function positive(value, fallback) {
	return value !== void 0 && Number.isFinite(value) && value > 0 ? value : fallback;
}
//#endregion
export { apply, inject, name };

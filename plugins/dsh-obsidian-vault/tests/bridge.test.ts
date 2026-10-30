import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { FRAME_SOURCE, isFrameMessage } from '../src/bridge-protocol.ts'
import { resolveBridgeRequest, type BridgeDeps } from '../src/client/bridge-dispatch.ts'
import {
  readBridgeWhitelist,
  readPluginData,
  readPluginScript,
  setBridgeEnabled,
  writePluginData,
} from '../src/vault/bridge.ts'
import { VaultFiles, VaultPathError } from '../src/vault/files.ts'
import { writeObsidianConfig } from '../src/vault/obsidian-config.ts'
import { listPlugins } from '../src/vault/plugins.ts'

const roots: string[] = []
let root: string
let dshDir: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-bridge-'))
  dshDir = join(root, 'dsh-plugins')
  roots.push(root)
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

/** Create one community plugin folder with an optional manifest and script. */
async function communityPlugin(id: string, manifest?: unknown, script?: string): Promise<void> {
  const folder = join(root, '.obsidian', 'plugins', id)
  await mkdir(folder, { recursive: true })
  if (manifest !== undefined) await writeFile(join(folder, 'manifest.json'), JSON.stringify(manifest), 'utf8')
  if (script !== undefined) await writeFile(join(folder, 'main.js'), script, 'utf8')
}

test('the whitelist starts empty and ignores malformed documents', async () => {
  assert.deepEqual(await readBridgeWhitelist(root), [])

  await writeObsidianConfig(root, 'plugins-bridge', { enabled: true })
  assert.deepEqual(await readBridgeWhitelist(root), [], 'a non-array document means an empty list')

  await writeObsidianConfig(root, 'plugins-bridge', ['pur-studio', '../evil', 7, 'ok-2'])
  assert.deepEqual(await readBridgeWhitelist(root), ['pur-studio', 'ok-2'])
})

test('setBridgeEnabled adds, dedupes, and removes ids', async () => {
  assert.deepEqual(await setBridgeEnabled(root, 'pur-studio', true), ['pur-studio'])
  assert.deepEqual(await setBridgeEnabled(root, 'pur-studio', true), ['pur-studio'], 'enabling twice must not duplicate')
  assert.deepEqual(await setBridgeEnabled(root, 'other', true), ['pur-studio', 'other'])
  assert.deepEqual(await setBridgeEnabled(root, 'pur-studio', false), ['other'])

  const onDisk = JSON.parse(await readFile(join(root, '.obsidian', 'plugins-bridge.json'), 'utf8'))
  assert.deepEqual(onDisk, ['other'])

  await assert.rejects(() => setBridgeEnabled(root, '../escape', true), /invalid plugin id/)
})

test('the community list scans the vault plugins folder and reports the whitelist', async () => {
  await communityPlugin('pur-studio', { id: 'pur-studio', name: 'Pur Studio', version: '0.1.0', author: 'DSH' })
  await mkdir(join(root, '.obsidian', 'plugins', 'broken'), { recursive: true })
  await writeFile(join(root, '.obsidian', 'plugins', 'broken', 'manifest.json'), '{ not json', 'utf8')
  await mkdir(join(root, '.obsidian', 'plugins', '.hidden'), { recursive: true })
  await setBridgeEnabled(root, 'pur-studio', true)

  const inventory = await listPlugins(root, dshDir)
  assert.deepEqual(inventory.community.map(entry => entry.id).sort(), ['broken', 'pur-studio'])
  const pur = inventory.community.find(entry => entry.id === 'pur-studio')
  assert.equal(pur?.name, 'Pur Studio')
  assert.equal(pur?.version, '0.1.0')
  assert.equal(inventory.community.find(entry => entry.id === 'broken')?.name, 'broken')
  assert.deepEqual(inventory.bridge, ['pur-studio'])
})

test('plugin data round-trips through data.json', async () => {
  await communityPlugin('pur-studio')
  assert.equal(await readPluginData(root, 'pur-studio'), undefined, 'absent data.json reads as undefined')

  const document = { entries: [1, 2, 3], nested: { flag: true } }
  await writePluginData(root, 'pur-studio', document)
  assert.deepEqual(await readPluginData(root, 'pur-studio'), document)
  const onDisk = await readFile(join(root, '.obsidian', 'plugins', 'pur-studio', 'data.json'), 'utf8')
  assert.ok(onDisk.endsWith('\n'), 'data.json keeps the trailing newline')

  await writeFile(join(root, '.obsidian', 'plugins', 'pur-studio', 'data.json'), '{ broken', 'utf8')
  assert.equal(await readPluginData(root, 'pur-studio'), undefined, 'an unparsable document reads as undefined')

  await assert.rejects(() => readPluginData(root, '../escape'), /invalid plugin id/)
})

test('the plugin script serves main.js bytes only when present', async () => {
  await communityPlugin('pur-studio')
  assert.equal(await readPluginScript(root, 'pur-studio'), undefined)

  await communityPlugin('pur-studio', undefined, 'globalThis.loaded = true\n')
  const script = await readPluginScript(root, 'pur-studio')
  assert.equal(script?.toString('utf8'), 'globalThis.loaded = true\n')

  await assert.rejects(() => readPluginScript(root, '../escape'), /invalid plugin id/)
})

test('binary writes create parent directories and stay inside the vault', async () => {
  const files = new VaultFiles(root)
  const bytes = new Uint8Array([0x00, 0x01, 0x02, 0xff])
  await files.writeBytes('attachments/deep/pic.bin', bytes)
  assert.deepEqual(new Uint8Array(await files.readBytes('attachments/deep/pic.bin')), bytes)

  await assert.rejects(() => files.writeBytes('../escape.bin', bytes), VaultPathError)
  await assert.rejects(() => files.readBytes('../escape.bin'), VaultPathError)
})

/** Bridge deps that record every call. */
function recordingDeps(calls: string[], loadResult?: unknown): BridgeDeps {
  return {
    readBinary: (path) => {
      calls.push(`readBinary:${path}`)
      return Promise.resolve('YmluYXJ5')
    },
    writeBinary: (path, data) => {
      calls.push(`writeBinary:${path}:${data}`)
      return Promise.resolve()
    },
    readText: (path) => {
      calls.push(`readText:${path}`)
      return Promise.resolve('# note')
    },
    writeText: (path, content) => {
      calls.push(`writeText:${path}:${content}`)
      return Promise.resolve()
    },
    listFiles: () => {
      calls.push('listFiles')
      return Promise.resolve([{ path: 'a.md', name: 'a.md', extension: 'md', size: 3, mtime: 1, ctime: 1 }])
    },
    exists: (path) => {
      calls.push(`exists:${path}`)
      return Promise.resolve(path === 'a.md')
    },
    loadData: (id) => {
      calls.push(`loadData:${id}`)
      return Promise.resolve(loadResult)
    },
    saveData: (id, value) => {
      calls.push(`saveData:${id}:${JSON.stringify(value)}`)
      return Promise.resolve()
    },
    fileCache: (path) => {
      calls.push(`fileCache:${path}`)
      return Promise.resolve({ tags: [{ tag: '#tagged' }] })
    },
    activeFile: () => {
      calls.push('activeFile')
      return 'a.md'
    },
    openLink: (path) => {
      calls.push(`openLink:${path}`)
    },
  }
}

test('the bridge dispatch confines data.json access to the mounted plugin id', async () => {
  const calls: string[] = []
  const deps = recordingDeps(calls, { seed: 1 })

  assert.deepEqual(await resolveBridgeRequest('plugin.loadData', { id: 'other' }, 'pur-studio', deps), { seed: 1 })
  await resolveBridgeRequest('plugin.saveData', { value: { n: 2 } }, 'pur-studio', deps)
  await resolveBridgeRequest('plugin.saveData', undefined, 'pur-studio', deps)
  assert.deepEqual(calls, [
    'loadData:pur-studio',
    'saveData:pur-studio:{"n":2}',
    'saveData:pur-studio:null',
  ], 'the mounted id wins over anything params claim')

  const empty = await resolveBridgeRequest('plugin.loadData', undefined, 'pur-studio', recordingDeps([], undefined))
  assert.equal(empty, null, 'absent data.json answers null, never undefined')
})

test('the bridge dispatch validates binary call parameters', async () => {
  const calls: string[] = []
  const deps = recordingDeps(calls)

  assert.equal(await resolveBridgeRequest('vault.readBinary', { path: 'a.bin' }, 'pur-studio', deps), 'YmluYXJ5')
  assert.deepEqual(await resolveBridgeRequest('vault.writeBinary', { path: 'a.bin', data: 'AAE=' }, 'pur-studio', deps), { ok: true })
  assert.deepEqual(calls, ['readBinary:a.bin', 'writeBinary:a.bin:AAE='])

  await assert.rejects(() => resolveBridgeRequest('vault.readBinary', {}, 'pur-studio', deps), /path is required/)
  await assert.rejects(() => resolveBridgeRequest('vault.writeBinary', { path: 'a.bin' }, 'pur-studio', deps), /path and data are required/)
  assert.deepEqual(calls, ['readBinary:a.bin', 'writeBinary:a.bin:AAE='], 'rejected calls never reach the vault')
})

test('the bridge dispatch serves text reads, writes, list, and exists', async () => {
  const calls: string[] = []
  const deps = recordingDeps(calls)

  assert.equal(await resolveBridgeRequest('vault.readText', { path: 'a.md' }, 'pur-studio', deps), '# note')
  assert.deepEqual(await resolveBridgeRequest('vault.writeText', { path: 'a.md', content: '# b' }, 'pur-studio', deps), { ok: true })
  const files = await resolveBridgeRequest('vault.list', undefined, 'pur-studio', deps)
  assert.deepEqual(files, [{ path: 'a.md', name: 'a.md', extension: 'md', size: 3, mtime: 1, ctime: 1 }])
  assert.equal(await resolveBridgeRequest('vault.exists', { path: 'a.md' }, 'pur-studio', deps), true)
  assert.equal(await resolveBridgeRequest('vault.exists', { path: 'b.md' }, 'pur-studio', deps), false)
  assert.deepEqual(calls, [
    'readText:a.md',
    'writeText:a.md:# b',
    'listFiles',
    'exists:a.md',
    'exists:b.md',
  ])

  await assert.rejects(() => resolveBridgeRequest('vault.readText', {}, 'pur-studio', deps), /path is required/)
  await assert.rejects(() => resolveBridgeRequest('vault.writeText', { path: 'a.md' }, 'pur-studio', deps), /path and content are required/)
  await assert.rejects(() => resolveBridgeRequest('vault.exists', { path: '' }, 'pur-studio', deps), /path is required/)
  assert.equal(calls.length, 5, 'rejected calls never reach the vault')
})

test('the bridge dispatch answers the active file and routes open-link requests', async () => {
  const calls: string[] = []
  const deps = recordingDeps(calls)

  assert.equal(await resolveBridgeRequest('workspace.getActiveFile', undefined, 'pur-studio', deps), 'a.md')
  assert.deepEqual(await resolveBridgeRequest('workspace.openLinkText', { path: 'b.md' }, 'pur-studio', deps), { ok: true })
  assert.deepEqual(calls, ['activeFile', 'openLink:b.md'])

  await assert.rejects(() => resolveBridgeRequest('workspace.openLinkText', {}, 'pur-studio', deps), /path is required/)
  assert.equal(calls.length, 2, 'rejected calls never reach the vault')
})

test('isFrameMessage accepts only tagged frame messages', () => {
  assert.ok(isFrameMessage({ source: FRAME_SOURCE, kind: 'request', id: 1, method: 'plugin.loadData' }))
  assert.ok(isFrameMessage({ source: FRAME_SOURCE, kind: 'event', event: 'frame.ready' }))
  assert.ok(!isFrameMessage({ source: 'ov-bridge-host', kind: 'request' }))
  assert.ok(!isFrameMessage({ source: FRAME_SOURCE, kind: 'response' }))
  assert.ok(!isFrameMessage(null))
  assert.ok(!isFrameMessage('ov-bridge'))
})

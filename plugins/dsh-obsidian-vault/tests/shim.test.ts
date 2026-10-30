import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { FrameMessage, HostMessage } from '../src/bridge-protocol.ts'
import { UnsupportedObsidianApi } from '../src/shim/errors.ts'
import { fileFromDto, TFile, TFolder } from '../src/shim/files.ts'
import { buildNodeStubs } from '../src/shim/node-stubs.ts'
import { normalizePath } from '../src/shim/normalize.ts'
import { Plugin, type ShimApp, type ShimManifest } from '../src/shim/plugin.ts'
import { sha256Hex } from '../src/shim/sha256.ts'
import { BridgeTransport, type TransportIO } from '../src/shim/transport.ts'
import { ShimVault } from '../src/shim/vault.ts'
import { ShimWorkspace, ViewRegistry, WorkspaceLeaf } from '../src/shim/views.ts'
import { ShimMetadataCache } from '../src/shim/metadata.ts'
import { ShimCommands } from '../src/shim/commands.ts'

/** A looped-back transport pair: frame posts land in the host handler and vice versa. */
function transportPair(): { frame: BridgeTransport; host: { requests: FrameMessage[]; events: FrameMessage[]; answer: (id: number, result?: unknown, error?: string) => void; push: (event: string, params?: Record<string, unknown>) => void } } {
  const requests: FrameMessage[] = []
  const events: FrameMessage[] = []
  let hostToFrame: (message: HostMessage) => void = () => undefined
  const io: TransportIO = {
    post: message => {
      if (message.kind === 'request') requests.push(message)
      else events.push(message)
    },
    listen: handler => {
      hostToFrame = handler
      return () => undefined
    },
  }
  const frame = new BridgeTransport(io)
  return {
    frame,
    host: {
      requests,
      events,
      answer: (id, result, error) => hostToFrame({ source: 'ov-bridge-host', kind: 'response', id, result, error }),
      push: (event, params) => hostToFrame({ source: 'ov-bridge-host', kind: 'event', event, params }),
    },
  }
}

const MANIFEST: ShimManifest = { id: 'pur-studio', name: 'Pur Studio', version: '0.1.0' }

/**
 * A ShimApp with real vault/metadata and constructor-skipping stand-ins for the
 * DOM-bound members the tested Plugin paths never touch.
 */
function fakeApp(transport: BridgeTransport): ShimApp {
  const vault = new ShimVault(transport, 'http://h/obsidian/api')
  const workspace: ShimWorkspace = Object.create(ShimWorkspace.prototype)
  return {
    bridge: transport,
    settingTabs: [],
    views: new ViewRegistry(),
    vault,
    metadataCache: new ShimMetadataCache(vault, transport),
    commands: new ShimCommands(),
    workspace,
  }
}

test('normalizePath mirrors Obsidian', () => {
  assert.equal(normalizePath('a\\b\\c.md'), 'a/b/c.md')
  assert.equal(normalizePath('a//b///c'), 'a/b/c')
  assert.equal(normalizePath('a/b/'), 'a/b')
  assert.equal(normalizePath('note.md'), 'note.md')
})

test('sha256Hex matches known vectors', () => {
  assert.equal(sha256Hex(new TextEncoder().encode('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(sha256Hex(new Uint8Array(0)), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
})

test('node stubs: path and crypto behave, desktop modules throw UnsupportedObsidianApi', () => {
  const stubs = buildNodeStubs({ colorGroups: [{ query: 'path:x', color: { rgb: 255 } }] })
  const path = stubs['path'] as { join: (...parts: string[]) => string; dirname: (p: string) => string; basename: (p: string) => string; extname: (p: string) => string }
  assert.equal(path.join('/vault', '.obsidian', 'graph.json'), 'vault/.obsidian/graph.json')
  assert.equal(path.dirname('a/b/c.md'), 'a/b')
  assert.equal(path.basename('a/b/c.md'), 'c.md')
  assert.equal(path.extname('c.md'), '.md')

  const fs = stubs['fs'] as { existsSync: (p: string) => boolean; readFileSync: (p: string, enc?: string) => string; writeFileSync: () => void }
  assert.equal(fs.existsSync('/vault/.obsidian/graph.json'), true)
  assert.deepEqual(JSON.parse(fs.readFileSync('C:\\vault\\.obsidian\\graph.json', 'utf8')), { colorGroups: [{ query: 'path:x', color: { rgb: 255 } }] })
  assert.throws(() => fs.existsSync('/vault/other.txt'), UnsupportedObsidianApi)
  assert.throws(() => fs.writeFileSync(), UnsupportedObsidianApi)

  const emptyGraph = buildNodeStubs(null)['fs'] as { existsSync: (p: string) => boolean }
  assert.equal(emptyGraph.existsSync('/vault/.obsidian/graph.json'), false)

  const childProcess = stubs['child_process'] as { exec: () => void }
  assert.throws(() => childProcess.exec(), UnsupportedObsidianApi)
  const electron = stubs['electron'] as { remote: { BrowserWindow?: unknown } }
  assert.throws(() => electron.remote.BrowserWindow, UnsupportedObsidianApi)
  const os = stubs['os'] as { tmpdir: () => void }
  assert.throws(() => os.tmpdir(), UnsupportedObsidianApi)

  const cryptoStub = stubs['crypto'] as { randomUUID: () => string; createHash: (a: string) => { update: (d: Uint8Array) => { digest: (e: string) => string } } }
  assert.match(cryptoStub.randomUUID(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(
    cryptoStub.createHash('sha256').update(new TextEncoder().encode('abc')).digest('hex'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
  assert.throws(() => cryptoStub.createHash('md5'), UnsupportedObsidianApi)
})

test('transport correlates responses and dispatches host events', async () => {
  const { frame, host } = transportPair()
  const seen: string[] = []
  frame.onEvent((event, params) => seen.push(`${event}:${String(params?.['id'])}`))

  const first = frame.request('vault.readText', { path: 'a.md' })
  const second = frame.request('vault.list')
  assert.deepEqual(host.requests.map(message => message.kind === 'request' ? message.id : -1), [1, 2])
  host.answer(2, ['a.md'])
  host.answer(1, undefined, 'read failed')
  assert.deepEqual(await second, ['a.md'])
  await assert.rejects(first, /read failed/)

  host.push('command.run', { id: 'ping' })
  assert.deepEqual(seen, ['command.run:ping'])
  frame.dispose()
})

test('vault facade: cache-backed sync getters, bridge-backed writes', async () => {
  const { frame, host } = transportPair()
  const vault = new ShimVault(frame, 'http://h/obsidian/api')

  const listPromise = vault.warmup()
  assert.equal(vault.getFiles().length, 0, 'cold cache answers empty')
  const list = [
    { path: '笔记.md', name: '笔记.md', extension: 'md', size: 4, mtime: 1, ctime: 1 },
    { path: 'assets/pic.png', name: 'pic.png', extension: 'png', size: 2, mtime: 2, ctime: 2 },
  ]
  host.answer(1, list)
  host.answer(2, list) // the cold read's background refresh
  await listPromise

  const files = vault.getFiles()
  assert.equal(files.length, 2)
  const [first, second] = files
  assert.ok(first instanceof TFile && second instanceof TFile)
  assert.equal(first.basename, '笔记')
  assert.deepEqual(vault.getMarkdownFiles().map(file => file.path), ['笔记.md'])
  assert.ok(vault.getAbstractFileByPath('assets') instanceof TFolder)
  assert.equal(vault.getAbstractFileByPath('missing.md'), null)

  const created = vault.create('新.md', '# 新')
  const createRequest = host.requests.at(-1)
  assert.equal(createRequest?.kind === 'request' && createRequest.method, 'vault.exists')
  host.answer(3, false)
  await Promise.resolve()
  await Promise.resolve()
  const writeRequest = host.requests.at(-1)
  assert.equal(writeRequest?.kind === 'request' && writeRequest.method, 'vault.writeText')
  assert.deepEqual(writeRequest?.kind === 'request' && writeRequest.params, { path: '新.md', content: '# 新' })
  host.answer(4, { ok: true })
  assert.equal((await created).path, '新.md')

  const processed = vault.process('笔记.md', data => `${data}\nmore`)
  host.answer(5, '原内容')
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  const modify = host.requests.at(-1)
  assert.deepEqual(modify?.kind === 'request' && modify.params, { path: '笔记.md', content: '原内容\nmore' })
  host.answer(6, { ok: true })
  await processed

  assert.equal(vault.getResourcePath(second), 'http://h/obsidian/api/bridge/raw?path=assets%2Fpic.png')
  frame.dispose()
})

test('Plugin: data round-trips and commands repost on every add', async () => {
  const { frame, host } = transportPair()
  const plugin = new Plugin(fakeApp(frame), MANIFEST)

  const loaded = plugin.loadData()
  host.answer(1, null)
  assert.equal(await loaded, null)

  const saved = plugin.saveData({ seed: 1 })
  const saveRequest = host.requests.at(-1)
  assert.deepEqual(saveRequest?.kind === 'request' && saveRequest.params, { value: { seed: 1 } })
  host.answer(2, { ok: true })
  await saved

  plugin.addCommand({ id: 'one', name: '第一', callback: () => undefined })
  plugin.addCommand({ id: 'two', name: '第二', callback: () => undefined })
  const events = host.events.filter(message => message.kind === 'event' && message.event === 'commands.register')
  assert.equal(events.length, 2, 'every addCommand reposts the full list')
  const last = events.at(-1)
  assert.deepEqual(last?.kind === 'event' && last.params, { commands: [{ id: 'one', name: '第一' }, { id: 'two', name: '第二' }] })

  let ran = ''
  plugin.addCommand({ id: 'three', name: '第三', callback: () => { ran = 'three' } })
  plugin.runCommand('three')
  assert.equal(ran, 'three')
  frame.dispose()
})

test('fileFromDto builds real TFile instances', () => {
  const file = fileFromDto({ path: 'a/b/Note.MD', name: 'Note.MD', extension: 'md', size: 3, mtime: 7, ctime: 6 })
  assert.ok(file instanceof TFile)
  assert.equal(file.basename, 'Note')
  assert.equal(file.extension, 'md')
  assert.deepEqual(file.stat, { ctime: 6, mtime: 7, size: 3 })
})

test('metadataCache resolves links from the vault cache', async () => {
  const { frame, host } = transportPair()
  const vault = new ShimVault(frame, 'http://h/obsidian/api')
  const warming = vault.warmup()
  host.answer(1, [
    { path: '文件夹/目标.md', name: '目标.md', extension: 'md', size: 1, mtime: 1, ctime: 1 },
  ])
  await warming
  const metadata = new ShimMetadataCache(vault, frame)
  assert.equal(metadata.getFirstLinkpathDest('目标', '')?.path, '文件夹/目标.md')
  assert.equal(metadata.getFirstLinkpathDest('文件夹/目标.md', '')?.path, '文件夹/目标.md')
  assert.equal(metadata.getFirstLinkpathDest('没有', ''), null)
  const only = vault.getFiles()[0]
  assert.ok(only instanceof TFile)
  // The first read warms a background fetch and answers "not indexed"; the
  // next read answers from the warm entry.
  assert.equal(metadata.getFileCache(only), null)
  host.answer(2, { tags: [{ tag: '#标记' }] })
  await Promise.resolve()
  await Promise.resolve()
  assert.deepEqual(metadata.getFileCache(only), { tags: [{ tag: '#标记' }] })
  assert.equal(metadata.getBacklinksForFile(only), undefined)
  frame.dispose()
})

test('ViewRegistry registers and disposes factories', () => {
  const registry = new ViewRegistry()
  const dispose = registry.register('audit', () => {
    throw new Error('not constructed in this test')
  })
  dispose()
  const leaf: WorkspaceLeaf = Object.create(WorkspaceLeaf.prototype)
  assert.equal(registry.create('audit', leaf), undefined)
})

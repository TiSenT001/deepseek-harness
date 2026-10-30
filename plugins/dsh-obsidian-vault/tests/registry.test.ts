import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { VaultRegistry } from '../src/vault/registry.ts'
import { NodeFs } from './helpers/node-fs.ts'

const roots: string[] = []
let base: string
let fs: NodeFs

const OPTIONS = {
  ignore: ['.obsidian'],
  maxFileBytes: 1024 * 1024,
  maxIndexBytes: 1024 * 1024,
  maxDepth: 6,
}

beforeEach(async () => {
  base = await mkdtemp(join(tmpdir(), 'ov-registry-'))
  roots.push(base)
  await mkdir(join(base, 'vault-a'))
  await writeFile(join(base, 'vault-a', 'alpha.md'), '# Alpha', 'utf8')
  fs = new NodeFs(base)
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

/** Start a registry whose store lives under the test root. */
async function startRegistry(initialRoot = join(base, 'vault-a')): Promise<{
  readonly registry: VaultRegistry
  readonly abort: AbortController
  readonly errors: readonly Error[]
}> {
  const abort = new AbortController()
  const errors: Error[] = []
  const registry = new VaultRegistry(fs, { ...OPTIONS, root: initialRoot }, {
    storePath: join(base, 'state', 'vaults.json'),
    emptyVaultPath: join(base, 'state', 'empty-vault'),
    report: (error) => { errors.push(error) },
    signal: abort.signal,
  })
  await registry.start()
  return { registry, abort, errors }
}

test('seeds the configured root as the first active vault', async () => {
  const { registry, abort } = await startRegistry()
  const list = registry.list()
  assert.equal(list.vaults.length, 1)
  assert.equal(list.vaults[0]?.path, join(base, 'vault-a'))
  assert.equal(list.vaults[0]?.active, true)
  assert.equal(list.activeId, list.vaults[0]?.id)
  assert.equal(registry.vault.status().root, join(base, 'vault-a'))
  assert.deepEqual(registry.vault.tree().map(node => node.name), ['alpha.md'])
  await registry.close()
  abort.abort()
})

test('inspect reports existence, configuration, and registration without mutating', async () => {
  const { registry, abort } = await startRegistry()
  await mkdir(join(base, 'vault-b'))

  const candidate = await registry.inspect(join(base, 'vault-b'))
  assert.deepEqual(candidate, {
    path: join(base, 'vault-b'),
    exists: true,
    configured: false,
    registered: false,
    name: 'vault-b',
  })

  const known = await registry.inspect(join(base, 'vault-a'))
  assert.equal(known.registered, true)
  assert.equal(known.configured, false)
  assert.equal(registry.list().vaults.length, 1)

  const missing = await registry.inspect(join(base, 'absent'))
  assert.equal(missing.exists, false)
  assert.equal(missing.configured, false)
  await registry.close()
  abort.abort()
})

test('open registers and activates another vault, rebinding the index', async () => {
  const { registry, abort } = await startRegistry()
  await mkdir(join(base, 'vault-b'))
  await writeFile(join(base, 'vault-b', 'beta.md'), '# Beta', 'utf8')

  const opened = await registry.open(join(base, 'vault-b'))
  assert.equal(opened.vault.path, join(base, 'vault-b'))
  assert.equal(opened.vault.active, true)
  assert.equal(opened.configured, false)
  assert.equal(registry.vault.status().root, join(base, 'vault-b'))
  assert.deepEqual(registry.vault.tree().map(node => node.name), ['beta.md'])
  assert.equal(await registry.vault.note('alpha.md'), undefined)

  const again = await registry.open(join(base, 'vault-b'))
  assert.equal(again.vault.id, opened.vault.id)
  assert.equal(registry.list().vaults.length, 2)
  await registry.close()
  abort.abort()
})

test('open with init creates the .obsidian configuration directory', async () => {
  const { registry, abort } = await startRegistry()
  await mkdir(join(base, 'vault-b'))

  const opened = await registry.open(join(base, 'vault-b'), true)
  assert.equal(opened.configured, true)
  assert.ok((await readdir(join(base, 'vault-b'))).includes('.obsidian'))
  await registry.close()
  abort.abort()
})

test('create makes the folder, its configuration, and an active record', async () => {
  const { registry, abort } = await startRegistry()
  const target = join(base, 'fresh', 'nested')

  const created = await registry.create(target)
  assert.equal(created.vault.name, 'nested')
  assert.equal(created.vault.active, true)
  assert.equal(created.configured, true)
  assert.equal(registry.vault.status().root, target)
  assert.ok((await readdir(target)).includes('.obsidian'))
  await registry.close()
  abort.abort()
})

test('list keeps one active vault and orders by last activation', async () => {
  const { registry, abort } = await startRegistry()
  await mkdir(join(base, 'vault-b'))
  await registry.open(join(base, 'vault-b'))

  const list = registry.list()
  const times = list.vaults.map(vault => vault.lastOpenedAt)
  assert.deepEqual(times, [...times].sort((left, right) => right - left))
  assert.equal(list.vaults.filter(vault => vault.active === true).length, 1)
  assert.equal(list.vaults.find(vault => vault.active === true)?.path, join(base, 'vault-b'))
  await registry.close()
  abort.abort()
})

test('forgetting the active vault activates the most recent remaining one', async () => {
  const { registry, abort } = await startRegistry()
  await mkdir(join(base, 'vault-b'))
  const opened = await registry.open(join(base, 'vault-b'))

  await registry.forget(opened.vault.id)
  assert.equal(registry.list().vaults.length, 1)
  assert.equal(registry.active()?.path, join(base, 'vault-a'))
  assert.equal(registry.vault.status().root, join(base, 'vault-a'))
  await registry.close()
  abort.abort()
})

test('forgetting every vault falls back to the empty vault directory', async () => {
  const { registry, abort } = await startRegistry()
  const only = registry.active()
  assert.ok(only !== undefined)

  await registry.forget(only.id)
  assert.deepEqual(registry.list().vaults, [])
  assert.equal(registry.list().activeId, undefined)
  assert.equal(registry.vault.status().root, join(base, 'state', 'empty-vault'))
  assert.deepEqual(registry.vault.tree(), [])
  await registry.close()
  abort.abort()
})

test('persists the registry and restores the active vault across restarts', async () => {
  const first = await startRegistry()
  await mkdir(join(base, 'vault-b'))
  await first.registry.open(join(base, 'vault-b'))
  await first.registry.close()
  first.abort.abort()

  const stored = JSON.parse(await readFile(join(base, 'state', 'vaults.json'), 'utf8')) as {
    readonly version: number
    readonly vaults: readonly { readonly path: string }[]
  }
  assert.equal(stored.version, 1)
  assert.equal(stored.vaults.length, 2)

  const second = await startRegistry()
  assert.equal(second.registry.list().vaults.length, 2)
  assert.equal(second.registry.active()?.path, join(base, 'vault-b'))
  assert.equal(second.registry.vault.status().root, join(base, 'vault-b'))
  await second.registry.close()
  second.abort.abort()
})

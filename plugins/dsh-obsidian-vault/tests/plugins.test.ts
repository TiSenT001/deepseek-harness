import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { listPlugins, setCorePluginEnabled } from '../src/vault/plugins.ts'
import { CONFIG_DIRECTORY, writeObsidianConfig } from '../src/vault/obsidian-config.ts'

const roots: string[] = []
let root: string
let dshDir: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-plugins-'))
  // The DSH plugin folder is global in production; tests inject a per-run one.
  dshDir = join(root, 'dsh-plugins')
  roots.push(root)
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

async function dshPlugin(id: string, manifest?: unknown): Promise<void> {
  const folder = join(dshDir, id)
  await mkdir(folder, { recursive: true })
  if (manifest !== undefined) await writeFile(join(folder, 'manifest.json'), JSON.stringify(manifest), 'utf8')
}

async function readConfig(name: string): Promise<unknown> {
  return JSON.parse(await readFile(join(root, CONFIG_DIRECTORY, `${name}.json`), 'utf8'))
}

test('an unconfigured folder reports the built-in defaults and no dsh plugins', async () => {
  const inventory = await listPlugins(root, dshDir)
  assert.equal(inventory.dshFolder, dshDir)
  assert.deepEqual(inventory.dsh, [])
  const graph = inventory.core.find(entry => entry.id === 'graph')
  const footnotes = inventory.core.find(entry => entry.id === 'footnotes')
  assert.equal(graph?.enabled, true)
  assert.equal(footnotes?.enabled, false)
  assert.ok(inventory.core.length > 20)
})

test('the dsh folder lists adapted plugins as display-only entries', async () => {
  await dshPlugin('dsh-one', { id: 'dsh-one', name: 'DSH One', version: '0.1.0', description: 'Adapted.' })
  await dshPlugin('dsh-two')

  const inventory = await listPlugins(root, dshDir)
  assert.deepEqual(inventory.dsh.map(entry => entry.id), ['dsh-one', 'dsh-two'])
  const one = inventory.dsh[0]
  assert.equal(one?.name, 'DSH One')
  assert.equal(one?.version, '0.1.0')
  assert.equal(inventory.dsh[1]?.name, 'dsh-two', 'a folder without a manifest falls back to its name')
})

test('a corrupt manifest leaves the folder name as the label', async () => {
  await mkdir(join(dshDir, 'broken'), { recursive: true })
  await writeFile(join(dshDir, 'broken', 'manifest.json'), '{ not json', 'utf8')

  const inventory = await listPlugins(root, dshDir)
  assert.equal(inventory.dsh[0]?.name, 'broken')
  assert.equal(inventory.dsh[0]?.version, undefined)
})

test('core toggles keep the old array format when the file uses one', async () => {
  await writeObsidianConfig(root, 'core-plugins', ['graph', 'backlink'])

  const inventory = await listPlugins(root, dshDir)
  assert.equal(inventory.core.find(entry => entry.id === 'graph')?.enabled, true)
  assert.equal(inventory.core.find(entry => entry.id === 'outline')?.enabled, false)

  await setCorePluginEnabled(root, 'graph', false)
  assert.deepEqual(await readConfig('core-plugins'), ['backlink'])

  await setCorePluginEnabled(root, 'outline', true)
  assert.deepEqual(await readConfig('core-plugins'), ['backlink', 'outline'])
})

test('core toggles write an object when the file is absent, starting from the defaults', async () => {
  await setCorePluginEnabled(root, 'daily-notes', true)
  const written = await readConfig('core-plugins') as Record<string, boolean>
  assert.equal(written['daily-notes'], true)
  assert.equal(written['file-explorer'], true)
  assert.equal(written.footnotes, false)

  await setCorePluginEnabled(root, 'file-explorer', false)
  const stored = await readConfig('core-plugins') as Record<string, boolean>
  assert.equal(stored['file-explorer'], false)
  assert.equal(stored['daily-notes'], true)
})

test('an object file keeps its unknown ids and its own values', async () => {
  await writeObsidianConfig(root, 'core-plugins', { graph: true, 'custom-builtin': true, outline: false })

  const inventory = await listPlugins(root, dshDir)
  assert.equal(inventory.core.find(entry => entry.id === 'custom-builtin')?.enabled, true)
  assert.equal(inventory.core.find(entry => entry.id === 'outline')?.enabled, false)
  assert.equal(inventory.core.find(entry => entry.id === 'footnotes')?.enabled, false)

  await setCorePluginEnabled(root, 'outline', true)
  const stored = await readConfig('core-plugins') as Record<string, boolean>
  assert.equal(stored.outline, true)
  assert.equal(stored['custom-builtin'], true)
  assert.equal(stored.graph, true)
})

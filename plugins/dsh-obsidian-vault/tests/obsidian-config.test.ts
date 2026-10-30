import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import {
  CONFIG_DIRECTORY,
  isConfigFile,
  mergeJson,
  readObsidianConfig,
  writeObsidianConfig,
} from '../src/vault/obsidian-config.ts'

const roots: string[] = []
let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ov-config-'))
  roots.push(root)
})

after(async () => {
  for (const directory of roots) await rm(directory, { recursive: true, force: true })
})

test('isConfigFile accepts only the served files', () => {
  assert.equal(isConfigFile('graph'), true)
  assert.equal(isConfigFile('community-plugins'), false)
  assert.equal(isConfigFile('workspace'), false)
  assert.equal(isConfigFile('../graph'), false)
  assert.equal(isConfigFile(undefined), false)
})

test('reads an absent configuration file as undefined', async () => {
  assert.equal(await readObsidianConfig(root, 'graph'), undefined)
})

test('reads a corrupt document as undefined', async () => {
  await writeObsidianConfig(root, 'graph', { seed: true })
  await writeFile(join(root, CONFIG_DIRECTORY, 'graph.json'), '{ not json', 'utf8')
  assert.equal(await readObsidianConfig(root, 'graph'), undefined)
})

test('merges nested objects and keeps keys the patch does not mention', () => {
  assert.deepEqual(
    mergeJson({ a: 1, nested: { x: 1, y: 2 }, list: [1, 2] }, { nested: { y: 3 }, list: [3] }),
    { a: 1, nested: { x: 1, y: 3 }, list: [3] },
  )
})

test('replaces the document when either side is not a plain object', () => {
  assert.deepEqual(mergeJson(undefined, { a: 1 }), { a: 1 })
  assert.deepEqual(mergeJson({ a: 1 }, ['b']), ['b'])
})

test('write preserves unknown keys, then the next read returns them', async () => {
  await writeObsidianConfig(root, 'graph', { search: 'alpha', collapseForces: true })
  const written = await writeObsidianConfig(root, 'graph', { nodeSizeMultiplier: 1.4 })

  assert.deepEqual(written, { search: 'alpha', collapseForces: true, nodeSizeMultiplier: 1.4 })
  assert.deepEqual(await readObsidianConfig(root, 'graph'), written)
  const text = await readFile(join(root, CONFIG_DIRECTORY, 'graph.json'), 'utf8')
  assert.ok(text.endsWith('\n'))
  assert.ok(text.includes('collapseForces'))
})

test('write replaces a corrupt file with the patch', async () => {
  await writeObsidianConfig(root, 'graph', { seed: true })
  await writeFile(join(root, CONFIG_DIRECTORY, 'graph.json'), 'broken', 'utf8')

  assert.deepEqual(await writeObsidianConfig(root, 'graph', { search: 'x' }), { search: 'x' })
})

test('readObsidianConfig ignores a UTF-8 BOM written by a Windows editor', async () => {
  // writeObsidianConfig creates `.obsidian`; the file is then rewritten with the
  // BOM PowerShell and Windows editors prepend.
  await writeObsidianConfig(root, 'plugins-bridge', [])
  await writeFile(join(root, CONFIG_DIRECTORY, 'plugins-bridge.json'), '\uFEFF["pur-studio"]', 'utf8')
  const value = await readObsidianConfig(root, 'plugins-bridge')
  assert.deepEqual(value, ['pur-studio'])
})

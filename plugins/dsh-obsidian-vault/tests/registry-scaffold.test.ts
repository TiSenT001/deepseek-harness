/**
 * Registry integration: creating a knowledge base from the UI path seeds the
 * scaffold, while an existing vault keeps its own files.
 * @module dsh-obsidian-vault/tests/registry-scaffold
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { VaultRegistry } from '../src/vault/registry.ts'
import { NodeFs } from './helpers/node-fs.ts'

test('creating a vault seeds the conventions scaffold', async () => {
  const base = await mkdtemp(join(tmpdir(), 'ov-registry-scaffold-'))
  const abort = new AbortController()
  const errors: Error[] = []
  try {
    const registry = new VaultRegistry(new NodeFs(base), {
      root: join(base, 'seed'),
      ignore: ['.obsidian'],
      maxFileBytes: 1024 * 1024,
      maxIndexBytes: 1024 * 1024,
      maxDepth: 6,
    }, {
      storePath: join(base, 'state', 'vaults.json'),
      emptyVaultPath: join(base, 'state', 'empty-vault'),
      report: (error) => { errors.push(error) },
      signal: abort.signal,
    })
    await registry.start()

    const created = join(base, '新知识库')
    await registry.create(created, '新知识库')

    assert.deepEqual(errors, [])
    assert.ok(existsSync(join(created, '知识库总览', '笔记编写规范.md')))
    assert.ok(existsSync(join(created, '知识库总览', '起步说明.md')))
    const names = registry.vault.tree().map(node => node.name).sort()
    assert.deepEqual(names, ['知识库总览'])
    assert.ok(existsSync(join(created, '.obsidian', 'app.json')))
    assert.equal(existsSync(join(created, '.obsidian', 'daily-notes.json')), false)
    await registry.close()
  } finally {
    abort.abort()
    await rm(base, { recursive: true, force: true })
  }
})

test('opening an existing vault does not inject scaffold files', async () => {
  const base = await mkdtemp(join(tmpdir(), 'ov-registry-existing-'))
  const abort = new AbortController()
  try {
    await writeFile(join(base, 'old.md'), '# 旧笔记\n')
    const registry = new VaultRegistry(new NodeFs(base), {
      root: base,
      ignore: ['.obsidian'],
      maxFileBytes: 1024 * 1024,
      maxIndexBytes: 1024 * 1024,
      maxDepth: 6,
    }, {
      storePath: join(base, 'state', 'vaults.json'),
      emptyVaultPath: join(base, 'state', 'empty-vault'),
      report: () => undefined,
      signal: abort.signal,
    })
    await registry.start()
    await registry.open(base, true)
    const names = registry.vault.tree().map(node => node.name).sort()
    assert.deepEqual(names, ['old.md'])
    await registry.close()
  } finally {
    abort.abort()
    await rm(base, { recursive: true, force: true })
  }
})

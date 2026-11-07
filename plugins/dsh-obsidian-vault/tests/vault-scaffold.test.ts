/**
 * Vault scaffold: a new directory gets the owner's structure and rules, while an
 * existing vault is never touched. Placeholders are rendered from the vault name
 * and the seed date.
 * @module dsh-obsidian-vault/tests/vault-scaffold
 */
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { PACKAGE_ROOT } from '../src/package-root.ts'
import { seedVault } from '../src/vault/scaffold.ts'

const scaffold = join(PACKAGE_ROOT, 'scaffold', 'vault')

/** Create a temp directory and clean it afterwards. */
async function tempDir(): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const path = await mkdtemp(join(tmpdir(), 'ov-scaffold-'))
  return { path, cleanup: () => rm(path, { recursive: true, force: true }) }
}

test('seeds a new vault with the conventions structure', async () => {
  const { path, cleanup } = await tempDir()
  try {
    const result = await seedVault(path, '测试库', scaffold)
    assert.equal(result.seeded, true)
    assert.ok(result.files >= 15, `seeded ${result.files} files`)

    for (const relative of [
      '知识库总览/测试库.md',
      '知识库总览/笔记编写规范.md',
      '知识库总览/kb-conventions.md',
      '知识库总览/关键词快速检索.md',
      'TA技术美术/TA技术美术.md',
      '收件箱/收件箱说明.md',
      '附件/附件说明.md',
      'Pur画布/画布说明.md',
    ]) {
      assert.ok(existsSync(join(path, relative)), `missing ${relative}`)
    }

    const master = await readFile(join(path, '知识库总览/测试库.md'), 'utf8')
    assert.ok(master.includes('# 测试库'))
    assert.ok(master.includes('[[笔记编写规范]]'))
    const spec = await readFile(join(path, '知识库总览/笔记编写规范.md'), 'utf8')
    assert.ok(spec.includes('测试库/'), 'structure tree uses the vault name')
    assert.equal(spec.includes('{{VAULT_NAME}}'), false)
    assert.equal(spec.includes('{{DATE}}'), false)
    assert.match(spec, /created: \d{4}-\d{2}-\d{2}/)

    // The portable Obsidian behaviour is seeded; personal workflow files are not.
    assert.ok(existsSync(join(path, '.obsidian/app.json')))
    assert.ok(existsSync(join(path, '.obsidian/graph.json')))
    assert.equal(existsSync(join(path, '.obsidian/daily-notes.json')), false)
    assert.equal(existsSync(join(path, '.obsidian/templates.json')), false)
    assert.equal(existsSync(join(path, '.obsidian/community-plugins.json')), false)
  } finally {
    await cleanup()
  }
})

test('an existing .obsidian file is not overwritten by the preset', async () => {
  const { path, cleanup } = await tempDir()
  try {
    await mkdir(join(path, '.obsidian'), { recursive: true })
    await writeFile(join(path, '.obsidian/app.json'), '{"mine":true}\n')
    const result = await seedVault(path, '测试库', scaffold)
    assert.equal(result.seeded, true)
    assert.equal(await readFile(join(path, '.obsidian/app.json'), 'utf8'), '{"mine":true}\n')
    assert.ok(existsSync(join(path, '.obsidian/graph.json')))
  } finally {
    await cleanup()
  }
})

test('an existing note stops the seed', async () => {
  const { path, cleanup } = await tempDir()
  try {
    await writeFile(join(path, '已有笔记.md'), '# 已有\n')
    const result = await seedVault(path, '测试库', scaffold)
    assert.deepEqual(result, { seeded: false, files: 0 })
    assert.equal(existsSync(join(path, '知识库总览')), false)
  } finally {
    await cleanup()
  }
})

test('seeding twice never overwrites the first vault', async () => {
  const { path, cleanup } = await tempDir()
  try {
    await seedVault(path, '测试库', scaffold)
    const edited = join(path, '知识库总览/测试库.md')
    await writeFile(edited, '# 我的手写版本\n')
    const second = await seedVault(path, '测试库', scaffold)
    assert.equal(second.seeded, false)
    assert.equal(await readFile(edited, 'utf8'), '# 我的手写版本\n')
  } finally {
    await cleanup()
  }
})

test('a missing name falls back to the directory name', async () => {
  const { path, cleanup } = await tempDir()
  try {
    const result = await seedVault(path, '   ', scaffold)
    assert.equal(result.seeded, true)
    const directoryName = path.slice(path.lastIndexOf('\\') + 1)
    assert.ok(existsSync(join(path, '知识库总览', `${directoryName}.md`)))
  } finally {
    await cleanup()
  }
})

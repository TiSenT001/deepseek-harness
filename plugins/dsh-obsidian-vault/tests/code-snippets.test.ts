/**
 * Code snippet library: content-addressed by id, stored in plugin data.
 * @module dsh-obsidian-vault/tests/code-snippets
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { deleteCodeSnippet, readCodeSnippets, saveCodeSnippet, snippetFile } from '../src/code-snippets.ts'

const snippet = (id: string, title: string) => ({
  id,
  title,
  code: 'return {}',
  inputs: [{ id: 'a', label: 'A' }],
  outputs: [],
})

test('a missing library reads as empty and the first save creates the folder', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'pur-snippets-'))
  try {
    assert.deepEqual(await readCodeSnippets(folder), [])
    const afterSave = await saveCodeSnippet(folder, snippet('s1', '加法'))
    assert.equal(afterSave.length, 1)
    assert.equal(snippetFile(folder).endsWith('code-nodes.json'), true)
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
})

test('re-saving the same id replaces it, a new id appends', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'pur-snippets-'))
  try {
    await saveCodeSnippet(folder, snippet('s1', '加法'))
    const replaced = await saveCodeSnippet(folder, { ...snippet('s1', '减法'), code: 'return a - b' })
    assert.equal(replaced.length, 1)
    assert.equal(replaced[0]?.title, '减法')
    const appended = await saveCodeSnippet(folder, snippet('s2', '乘法'))
    assert.deepEqual(appended.map((node) => node.id), ['s1', 's2'])
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
})

test('deleting removes only the named snippet and survives a damaged file', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'pur-snippets-'))
  try {
    await saveCodeSnippet(folder, snippet('s1', '加法'))
    await saveCodeSnippet(folder, snippet('s2', '乘法'))
    const left = await deleteCodeSnippet(folder, 's1')
    assert.deepEqual(left.map((node) => node.id), ['s2'])
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
})

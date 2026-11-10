import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeTag, rewriteTag, validTagName } from '../src/vault/tag-rewrite.ts'

test('body tags are renamed exactly, including nested-name safety', () => {
  const result = rewriteTag('正文 #项目 和 #项目/子 还有 #项目x', '项目', '工作')
  assert.equal(result.source, '正文 #工作 和 #项目/子 还有 #项目x')
  assert.equal(result.count, 1)
})

test('code fences and inline code stay untouched', () => {
  const source = '```\n#项目\n```\n`#项目` 和 #项目'
  const result = rewriteTag(source, '#项目', '#工作')
  assert.equal(result.source, '```\n#项目\n```\n`#项目` 和 #工作')
  assert.equal(result.count, 1)
})

test('frontmatter block lists and inline arrays are rewritten', () => {
  const block = '---\ntags:\n  - 项目\n  - 其他\n---\n#项目'
  assert.equal(rewriteTag(block, '项目', '工作').source, '---\ntags:\n  - 工作\n  - 其他\n---\n#工作')
  const inline = '---\ntags: [项目, "其他"]\n---\n'
  assert.equal(rewriteTag(inline, '项目', '工作').source, '---\ntags: [工作, "其他"]\n---\n')
})

test('matching is case-insensitive but the replacement keeps its case', () => {
  const result = rewriteTag('#AI #ai', 'ai', '人工智能')
  assert.equal(result.source, '#人工智能 #人工智能')
  assert.equal(result.count, 2)
})

test('CRLF line endings survive the rewrite', () => {
  const result = rewriteTag('---\r\ntags:\r\n  - 旧\r\n---\r\n#旧\r\n', '旧', '新')
  assert.equal(result.source, '---\r\ntags:\r\n  - 新\r\n---\r\n#新\r\n')
})

test('tag names normalize and validate', () => {
  assert.equal(normalizeTag(' #项目/子 '), '项目/子')
  assert.equal(validTagName('#项目/子'), '项目/子')
  assert.equal(validTagName('has space'), undefined)
  assert.equal(validTagName('#'), undefined)
})

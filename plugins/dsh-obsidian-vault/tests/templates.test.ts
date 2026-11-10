import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TreeNodeDto } from '../src/protocol.ts'
import { applyTemplate, templateNotes, templateTargetPath } from '../src/client/ui/templates.ts'

const tree: readonly TreeNodeDto[] = [
  { name: '收件箱', path: '收件箱', kind: 'dir', children: [
    { name: '草稿.md', path: '收件箱/草稿.md', kind: 'file' },
  ] },
  { name: '模板', path: '模板', kind: 'dir', children: [
    { name: '日记.md', path: '模板/日记.md', kind: 'file' },
    { name: '会议', path: '模板/会议', kind: 'dir', children: [
      { name: '周会.md', path: '模板/会议/周会.md', kind: 'file' },
      { name: '附件.pdf', path: '模板/会议/附件.pdf', kind: 'file' },
    ] },
  ] },
  { name: '笔记.md', path: '笔记.md', kind: 'file' },
]

test('templateNotes only returns Markdown under a 模板 folder', () => {
  assert.deepEqual(templateNotes(tree).map(item => item.path), ['模板/会议/周会.md', '模板/日记.md'])
  assert.deepEqual(templateNotes(tree).map(item => item.name), ['周会', '日记'])
})

test('applyTemplate expands title, date, time and custom formats', () => {
  const date = new Date(2026, 10, 9, 8, 5, 7)
  const body = applyTemplate('# {{title}}\n{{date}} {{time}}\n{{date:YYYY/MM/DD}} {{date:YY-MM-DD}}', {
    title: '周会记录',
    date,
  })
  assert.equal(body, '# 周会记录\n2026-11-09 08:05\n2026/11/09 26-11-09')
})

test('templateTargetPath keeps the note inside 收件箱 and strips .md', () => {
  assert.equal(templateTargetPath('我的笔记'), '收件箱/我的笔记.md')
  assert.equal(templateTargetPath('我的笔记.md'), '收件箱/我的笔记.md')
  assert.equal(templateTargetPath('A/B'), '收件箱/A-B.md')
})

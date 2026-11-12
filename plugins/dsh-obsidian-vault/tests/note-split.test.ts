import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planSplit } from '../src/client/ui/note-split.ts'

const note = `# 总标题

开头。

## 第一节

内容一。

### 子标题

子内容。

## 第二节

内容二。
`

test('splits level-two headings and keeps deeper headings in their section', () => {
  const plan = planSplit('文件夹/总标题.md', note, 2, ['文件夹/总标题.md'])
  assert.equal(plan.notes.length, 2)
  assert.deepEqual(plan.notes.map(item => item.path), ['文件夹/第一节.md', '文件夹/第二节.md'])
  assert.ok(plan.notes[0]?.content.includes('### 子标题'))
  assert.ok(plan.index.includes('[[文件夹/第一节|第一节]]'))
  assert.ok(plan.index.startsWith('# 总标题'))
})

test('can split level-three headings instead', () => {
  const plan = planSplit('总标题.md', note, 3, ['总标题.md'])
  assert.equal(plan.notes.length, 1)
  assert.equal(plan.notes[0]?.path, '子标题.md')
  assert.ok(plan.notes[0]?.content.includes('子内容。'))
})

test('duplicate headings get a numbered path', () => {
  const plan = planSplit('a.md', '## 同名\n\na\n\n## 同名\n\nb\n', 2, ['a.md', '同名.md'])
  assert.deepEqual(plan.notes.map(item => item.path), ['同名 2.md', '同名 3.md'])
})

test('a note without the chosen heading level is returned unchanged', () => {
  const plan = planSplit('a.md', '# 只有标题\n\n正文\n', 2, ['a.md'])
  assert.equal(plan.notes.length, 0)
  assert.equal(plan.index, '# 只有标题\n\n正文\n')
})

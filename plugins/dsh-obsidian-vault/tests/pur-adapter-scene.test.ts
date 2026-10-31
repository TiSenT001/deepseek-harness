/**
 * Adapter scene and document tests: zoom badge window, scene assembly,
 * export-text documents, locale coverage of every menu labelKey, label
 * interpolation, and the generic element patch command.
 * @module dsh-obsidian-vault/tests/pur-adapter-scene
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PurController,
  buildExportOutline,
  buildPurScene,
  buildSelectedTextExport,
  zoomBadgeAlpha,
} from '../src/pur-kernel/index.ts'
import type { PurElement, PurMenuEntry, PurRenderPreferences } from '../src/pur-kernel/index.ts'
import { PUR_ZH } from '../src/client/i18n/pur-zh.ts'
import { PUR_EN } from '../src/client/i18n/pur-en.ts'
import { buildPurLabels } from '../src/client/i18n/pur-labels.ts'
import { controllerOf, envOf, LABELS } from './helpers/pur-adapter-fixtures.ts'

test('zoomBadgeAlpha follows the upstream window', () => {
  assert.equal(zoomBadgeAlpha(null, 1000), undefined)
  assert.equal(zoomBadgeAlpha(3000, 1000), 1)
  assert.equal(zoomBadgeAlpha(1600, 1000), 1)
  assert.equal(zoomBadgeAlpha(1300, 1000), 0.5)
  assert.equal(zoomBadgeAlpha(1000, 1000), undefined)
})

test('buildPurScene folds controller state and hides an expired badge', () => {
  const controller = controllerOf()
  controller.state.showZoomUntil = 1600
  const preferences: PurRenderPreferences = { backgroundColor: '#000', gridColor: '#333', showGrid: true }
  const labels = buildPurLabels((key) => key).render
  const scene = buildPurScene(controller, { width: 800, height: 600, preferences, labels, now: () => 1000 })
  assert.equal(scene.elements, controller.state.elements)
  assert.equal(scene.zoomBadgeAlpha, 1)
  assert.equal(scene.pinDrag, null)
  controller.state.showZoomUntil = 900
  assert.equal(buildPurScene(controller, { width: 800, height: 600, preferences, labels, now: () => 1000 }).zoomBadgeAlpha, undefined)
})

test('buildSelectedTextExport joins text and fenced code, null when empty', () => {
  const controller = controllerOf()
  const [text, node] = controller.state.elements
  assert.equal(buildSelectedTextExport(controller.state.elements, new Set()), null)
  const only = buildSelectedTextExport(controller.state.elements, new Set([text?.id ?? '']))
  assert.equal(only, 'text')
  const both = buildSelectedTextExport(controller.state.elements, new Set([text?.id ?? '', node?.id ?? '']))
  assert.equal(both, 'text\n\n---\n\n```javascript\nfunction process(inputs) { return {}; }\n```')
})

test('buildExportOutline matches the upstream outline format', () => {
  const labels = buildPurLabels((key) => (PUR_ZH as Record<string, string>)[key] ?? key).exportText
  const elements: PurElement[] = [
    { id: 't1', type: 'text', x: 0, y: 0, w: 100, h: 40, content: '正文' },
    { id: 'i1', type: 'image', x: 0, y: 0, w: 100, h: 40, original: '附件/pic.png' },
    { id: 'n1', type: 'note-link', x: 0, y: 0, w: 100, h: 40, content: 'c', link: '笔记.md' },
    { id: 'l1', type: 'line', from: 't1', to: 'n1' },
    {
      id: 'g1',
      type: 'group',
      x: 0,
      y: 0,
      w: 200,
      h: 200,
      content: '📦 分组A',
      link: '说明.md',
      children: [{ id: 't2', type: 'text', x: 0, y: 0, w: 50, h: 20, content: '子文本' }],
    },
    { id: 'c1', type: 'code-node', x: 0, y: 0, w: 100, h: 60, content: 'x' },
  ]
  const outline = buildExportOutline(elements, { title: '画布', time: 'TIME', labels })
  assert.equal(
    outline,
    [
      '# 画布',
      '> 导出时间：TIME',
      '',
      '---',
      '',
      '正文',
      '',
      `![pic.png](https://pur.studio/${encodeURIComponent('画布')}/pic.png)`,
      '',
      '[[笔记]]',
      '',
      '## 4. 📦 分组A → [[说明]]',
      '',
      '子文本',
      '',
    ].join('\n'),
  )
})

/** Recursively collect the labelKeys of a menu model. */
function labelKeys(entries: readonly PurMenuEntry[], into: Set<string>): void {
  for (const entry of entries) {
    if (entry.labelKey !== undefined) into.add(entry.labelKey)
    if (entry.children !== undefined) labelKeys(entry.children, into)
  }
}

test('every menu labelKey resolves in both locale dictionaries', () => {
  const controller = new PurController(envOf(), LABELS)
  const keys = new Set<string>()
  const contexts = [
    { activeFileIsMarkdown: true, isPopout: false, isPinned: false, supportsPopout: true, supportsPinTop: true, supportsReveal: true },
    { activeFileIsMarkdown: false, isPopout: true, isPinned: true, supportsPopout: true, supportsPinTop: true, supportsReveal: false },
  ]
  for (const context of contexts) labelKeys(controller.contextMenu(10, 10, context).model.entries, keys)
  controller.addTextBlock(10, 20)
  controller.addCodeNode(100, 100, { inputs: ['a'], outputs: ['sum'], title: 'N' })
  controller.addCodeNode(300, 100, { inputs: ['b'], outputs: ['out'], title: 'M' })
  for (const element of controller.state.elements) controller.state.selectedIds.add(element.id)
  for (const context of contexts) labelKeys(controller.contextMenu(10, 20, context).model.entries, keys)
  controller.insertNoteLink(0, 0, 'a.md', 'A')
  const noteLink = controller.state.elements.at(-1)
  controller.state.selectedIds.clear()
  controller.state.selectedIds.add(noteLink?.id ?? '')
  for (const context of contexts) labelKeys(controller.contextMenu(1, 1, context).model.entries, keys)
  assert.ok(keys.size > 40, `expected broad coverage, got ${keys.size}`)
  const zh = PUR_ZH as Record<string, string>
  const en = PUR_EN as Record<string, string>
  for (const key of keys) {
    assert.ok(`pur.${key}` in zh, `zh missing pur.${key}`)
    assert.ok(`pur.${key}` in en, `en missing pur.${key}`)
  }
})

test('buildPurLabels interpolates parameterized labels from the dictionary', () => {
  const bundles = buildPurLabels((key) => (PUR_ZH as Record<string, string>)[key] ?? key)
  assert.equal(bundles.controller.copiedElements(2), '已复制 2 个元素')
  assert.equal(bundles.codegenCore.header(3, 2, 'T'), '3 个节点 / 2 条连线 | T')
  assert.equal(bundles.codegenPy.topology(['a', 'b']), '拓扑顺序: a → b')
  assert.equal(bundles.menuTitle({ id: 'x', icon: '', labelKey: 'pinInputN', value: 2 }), '输入 2')
  assert.equal(bundles.menuTitle({ id: 'x', icon: '', label: 'literal' }), 'literal')
  assert.equal(bundles.menuTitle({ id: 'fallback-id', icon: '' }), 'fallback-id')
})

test('updateElement applies the patch per kind and commits history', () => {
  const controller = controllerOf()
  const [text, node] = controller.state.elements
  const depth = controller.history.stack.length
  const effects = controller.updateElement(text?.id ?? '', { content: 'new', bold: true, bgOpacity: 0.5, fontSize: 20, link: 'ignored' })
  assert.deepEqual(effects, [{ type: 'save' }, { type: 'render' }])
  assert.equal(controller.history.stack.length, depth + 1)
  assert.equal(text?.type === 'text' ? text.content : '', 'new')
  if (text?.type === 'text') {
    assert.equal(text.bold, true)
    assert.equal(text.bgOpacity, 0.5)
    assert.equal(text.fontSize, 20)
    assert.equal('link' in text, false)
  }
  controller.updateElement(node?.id ?? '', { title: 'T2', bold: true, code: 'return 2' })
  if (node?.type === 'code-node') {
    assert.equal(node.title, 'T2')
    assert.equal(node.code, 'return 2')
    assert.equal('bold' in node, false)
  }
  assert.deepEqual(controller.updateElement('missing', { content: 'x' }), [])
})

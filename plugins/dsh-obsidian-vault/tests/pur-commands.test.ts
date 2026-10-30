/**
 * Command-surface tests: dictionary alignment, the Pur pane command registry,
 * palette entries, and the save-as/new-canvas/export flows behind the pane's
 * command verbs.
 * @module dsh-obsidian-vault/tests/pur-commands
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PUR_ZH } from '../src/client/i18n/pur-zh.ts'
import { PUR_EN } from '../src/client/i18n/pur-en.ts'
import { createT } from '../src/client/i18n.ts'
import { purBundles } from '../src/client/pur/labels.ts'
import { PurImageCache } from '../src/client/pur/loader.ts'
import { createPurMenuHost } from '../src/client/pur/host.ts'
import type { PurMenuHostDeps } from '../src/client/pur/host.ts'
import { exportMarkdownFlow, writeFreshDocument } from '../src/client/pur/host-export.ts'
import {
  createPurPaneHandlers,
  getPurPaneHandlers,
  getPurPanePaths,
  registerPurPaneCommands,
  subscribePurPaneCommands,
} from '../src/client/pur/pane-commands.ts'
import type { PurPaneHandlers } from '../src/client/pur/pane-commands.ts'
import { buildPurPaneCommands } from '../src/client/ui/commands.ts'
import { serializeStudioDocument } from '../src/pur-kernel/index.ts'
import type { PurControllerEffect } from '../src/pur-kernel/index.ts'
import { controllerOf, hostOf } from './helpers/pur-adapter-fixtures.ts'

/** A fully-faked menu host context plus the records its callbacks keep. */
interface FakeHostEnv {
  readonly deps: PurMenuHostDeps
  readonly notices: string[]
  readonly prompts: { title: string; initial: string }[]
  readonly opened: string[]
  readonly runs: PurControllerEffect[][]
}

/**
 * Build fake menu host deps over a pinned controller.
 * @param path - the open document path.
 * @param promptAnswer - what the prompt resolves; null dismisses it.
 * @param withOpenPath - whether the pane can navigate to a written document.
 * @returns the deps and their call records.
 */
function depsOf(path: string, promptAnswer: string | null = null, withOpenPath = true): FakeHostEnv {
  const t = createT('zh')
  const notices: string[] = []
  const prompts: { title: string; initial: string }[] = []
  const opened: string[] = []
  const runs: PurControllerEffect[][] = []
  return {
    notices,
    prompts,
    opened,
    runs,
    deps: {
      t,
      labels: purBundles(t),
      controller: controllerOf(),
      path,
      images: new PurImageCache(),
      preferences: { backgroundColor: '#1e1e1e', gridColor: '#333333', showGrid: false },
      notice: (text) => notices.push(text),
      run: (effects) => runs.push([...effects]),
      openEditor: () => undefined,
      promptText: (title, initial) => {
        prompts.push({ title, initial })
        return Promise.resolve(promptAnswer)
      },
      pickNote: () => Promise.resolve(null),
      ...(withOpenPath ? { openPath: (p: string) => opened.push(p) } : {}),
    },
  }
}

/** The vault writes and folder creations a fetch stub observed. */
interface FetchLog {
  readonly writes: { path: string; content: string }[]
  readonly mkdirs: string[]
  /** Put the original global fetch back. */
  readonly restore: () => void
}

/**
 * Replace the global fetch with a bridge stub answering `bridge/exists`,
 * `mkdir` and `bridge/write-text` from a fixed existing-path set.
 * @param existing - vault paths the stub reports as present.
 * @returns the write/mkdir records and the restore function.
 */
function stubFetch(existing: readonly string[]): FetchLog {
  const writes: { path: string; content: string }[] = []
  const mkdirs: string[] = []
  const original = globalThis.fetch
  const stub: typeof fetch = (input, init) => {
    const url = String(input)
    if (url.includes('bridge/exists?path=')) {
      const path = decodeURIComponent(url.slice(url.indexOf('path=') + 'path='.length))
      return Promise.resolve(new Response(JSON.stringify({ exists: existing.includes(path) })))
    }
    if (url.endsWith('/mkdir')) {
      const body = JSON.parse(String(init?.body)) as { path: string }
      mkdirs.push(body.path)
      return Promise.resolve(new Response('{}'))
    }
    if (url.endsWith('/bridge/write-text')) {
      const body = JSON.parse(String(init?.body)) as { path: string; content: string }
      writes.push({ path: body.path, content: body.content })
      return Promise.resolve(new Response('{}'))
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`))
  }
  globalThis.fetch = stub
  return { writes, mkdirs, restore: () => { globalThis.fetch = original } }
}

/** Let the microtask queue behind a `void`'d flow drain. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Pane handlers recording every dispatched verb. */
function recordingHandlers(log: string[]): PurPaneHandlers {
  const record = (name: string) => (): void => {
    log.push(name)
  }
  return {
    newCanvas: record('newCanvas'),
    saveStudioAs: record('saveStudioAs'),
    exportMarkdown: record('exportMarkdown'),
    popout: record('popout'),
    undo: record('undo'),
    redo: record('redo'),
    selectAll: record('selectAll'),
    copy: record('copy'),
    paste: record('paste'),
    deleteSelection: record('deleteSelection'),
    group: record('group'),
    ungroup: record('ungroup'),
    duplicate: record('duplicate'),
    fitView: record('fitView'),
  }
}

test('the zh and en pur dictionaries carry the same keys', () => {
  assert.deepEqual(Object.keys(PUR_EN).sort(), Object.keys(PUR_ZH).sort())
  assert.equal(createT('en')('pur.cmdSaveStudioAs'), 'Save Pur Studio File...')
  assert.equal(createT('zh')('pur.copySuffix'), '_副本')
})

test('the pane registry notifies subscribers and refreshes the path snapshot', () => {
  const events: string[] = []
  const unsubscribe = subscribePurPaneCommands(() => events.push('change'))
  const before = getPurPanePaths()
  const handlers = recordingHandlers([])
  const dispose = registerPurPaneCommands('test/a.purstudio', handlers)
  try {
    assert.notEqual(getPurPanePaths(), before)
    assert.ok(getPurPanePaths().includes('test/a.purstudio'))
    assert.equal(getPurPaneHandlers('test/a.purstudio'), handlers)
    dispose()
    assert.ok(!getPurPanePaths().includes('test/a.purstudio'))
    assert.equal(getPurPaneHandlers('test/a.purstudio'), undefined)
    dispose()
    assert.equal(events.length, 2)
  } finally {
    unsubscribe()
    dispose()
  }
})

test('a stale disposer cannot remove a pane re-registered under its path', () => {
  const first = recordingHandlers([])
  const second = recordingHandlers([])
  const disposeFirst = registerPurPaneCommands('test/b.purstudio', first)
  const disposeSecond = registerPurPaneCommands('test/b.purstudio', second)
  try {
    disposeFirst()
    assert.equal(getPurPaneHandlers('test/b.purstudio'), second)
    disposeSecond()
    assert.equal(getPurPaneHandlers('test/b.purstudio'), undefined)
  } finally {
    disposeFirst()
    disposeSecond()
  }
})

test('buildPurPaneCommands lists fifteen localised entries dispatching to the pane', () => {
  const log: string[] = []
  const commands = buildPurPaneCommands(createT('zh'), recordingHandlers(log))
  assert.equal(commands.length, 15)
  const ids = commands.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(',')}`)
  assert.equal(commands.find((entry) => entry.id === 'pur.newCanvas')?.label, '新建 Pur Studio 画布')
  assert.equal(commands.find((entry) => entry.id === 'pur.saveStudioAs')?.label, '保存 Pur Studio 文件...')
  assert.equal(commands.find((entry) => entry.id === 'pur.popout')?.label, 'Pur Studio: 弹出独立窗口')
  for (const command of commands) command.run()
  assert.deepEqual(log, [
    'newCanvas',
    'saveStudioAs',
    'saveStudioAs',
    'deleteSelection',
    'group',
    'ungroup',
    'duplicate',
    'fitView',
    'exportMarkdown',
    'selectAll',
    'undo',
    'redo',
    'copy',
    'paste',
    'popout',
  ])
})

test('buildPurPaneCommands lists nothing while the pane is not ready', () => {
  assert.deepEqual(buildPurPaneCommands(createT('zh'), undefined), [])
})

test('savePur prompts with the document name plus the copy suffix', async () => {
  const env = depsOf('旅行.PurStudio')
  createPurMenuHost(() => env.deps).savePur()
  await settle()
  assert.deepEqual(env.prompts, [{ title: '保存为 .PurStudio', initial: '旅行_副本' }])
  assert.deepEqual(env.notices, [])
})

test('savePur falls back to the new-canvas name for an unsaved document', async () => {
  const env = depsOf('')
  createPurMenuHost(() => env.deps).savePur()
  await settle()
  assert.deepEqual(env.prompts, [{ title: '保存为 .PurStudio', initial: '新画布' }])
})

test('writeFreshDocument creates a numbered canvas, notices and opens it', async () => {
  const fetchStub = stubFetch(['Pur画布/新画布.PurStudio'])
  try {
    const env = depsOf('旅行.PurStudio')
    await writeFreshDocument(env.deps)
    assert.deepEqual(fetchStub.mkdirs, ['Pur画布'])
    assert.equal(fetchStub.writes.length, 1)
    assert.equal(fetchStub.writes[0]?.path, 'Pur画布/新画布_1.PurStudio')
    assert.equal(
      fetchStub.writes[0]?.content,
      serializeStudioDocument({ elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }),
    )
    assert.deepEqual(env.notices, ['已创建：Pur画布/新画布_1.PurStudio'])
    assert.deepEqual(env.opened, ['Pur画布/新画布_1.PurStudio'])
    assert.deepEqual(env.prompts, [])
  } finally {
    fetchStub.restore()
  }
})

test('writeFreshDocument keeps working where the pane cannot navigate', async () => {
  const fetchStub = stubFetch([])
  try {
    const env = depsOf('旅行.PurStudio', null, false)
    await writeFreshDocument(env.deps)
    assert.equal(fetchStub.writes[0]?.path, 'Pur画布/新画布.PurStudio')
    assert.deepEqual(env.notices, ['已创建：Pur画布/新画布.PurStudio'])
    assert.deepEqual(env.opened, [])
  } finally {
    fetchStub.restore()
  }
})

test('exportMarkdownFlow prompts for the file name in the menu variant', async () => {
  const fetchStub = stubFetch([])
  try {
    const env = depsOf('旅行.PurStudio', '自定义')
    await exportMarkdownFlow(env.deps, false, true)
    assert.deepEqual(env.prompts, [{ title: '导出文件名', initial: '旅行' }])
    assert.deepEqual(fetchStub.mkdirs, ['收件箱'])
    assert.equal(fetchStub.writes[0]?.path, '收件箱/自定义.md')
    assert.deepEqual(env.notices, ['✅ 已导出：收件箱/自定义.md'])
  } finally {
    fetchStub.restore()
  }
})

test('exportMarkdownFlow writes the command variant under the fixed name without prompting', async () => {
  const fetchStub = stubFetch(['收件箱/pur-studio-export.md'])
  try {
    const env = depsOf('旅行.PurStudio')
    await exportMarkdownFlow(env.deps, false, false, 'pur-studio-export')
    assert.deepEqual(env.prompts, [])
    assert.equal(fetchStub.writes[0]?.path, '收件箱/pur-studio-export_1.md')
    assert.deepEqual(env.notices, ['✅ 已导出：收件箱/pur-studio-export_1.md'])
  } finally {
    fetchStub.restore()
  }
})

test('exportMarkdownFlow aborts silently when the name prompt is dismissed', async () => {
  const fetchStub = stubFetch([])
  try {
    const env = depsOf('旅行.PurStudio')
    await exportMarkdownFlow(env.deps, false, true)
    assert.deepEqual(env.prompts, [{ title: '导出文件名', initial: '旅行' }])
    assert.equal(fetchStub.writes.length, 0)
    assert.equal(fetchStub.mkdirs.length, 0)
    assert.deepEqual(env.notices, [])
  } finally {
    fetchStub.restore()
  }
})

test('createPurPaneHandlers routes controller verbs through run and menu verbs to the host', () => {
  const controller = controllerOf()
  const { host, calls } = hostOf()
  const runs: PurControllerEffect[][] = []
  const handlers = createPurPaneHandlers(() => controller, () => null, host, (effects) => runs.push([...effects]))
  handlers.selectAll()
  assert.deepEqual(runs.at(-1), [{ type: 'render' }])
  handlers.undo()
  assert.deepEqual(runs.at(-1), [{ type: 'save' }, { type: 'render' }])
  handlers.newCanvas()
  handlers.saveStudioAs()
  handlers.popout()
  assert.deepEqual(calls, ['newCanvas', 'savePur', 'togglePopout'])
  handlers.exportMarkdown()
  assert.equal(runs.length, 2)
  assert.equal(calls.length, 3)
})

test('createPurPaneHandlers no-ops controller verbs before the document loads', () => {
  const { host } = hostOf()
  const runs: PurControllerEffect[][] = []
  const handlers = createPurPaneHandlers(() => null, () => null, host, (effects) => runs.push([...effects]))
  handlers.selectAll()
  handlers.undo()
  handlers.copy()
  handlers.deleteSelection()
  assert.equal(runs.length, 0)
})

test('createPurPaneHandlers exports markdown under the fixed command name', async () => {
  const fetchStub = stubFetch([])
  try {
    const env = depsOf('旅行.PurStudio')
    const { host } = hostOf()
    const handlers = createPurPaneHandlers(() => env.deps.controller, () => env.deps, host, () => undefined)
    handlers.exportMarkdown()
    await settle()
    assert.deepEqual(env.prompts, [])
    assert.equal(fetchStub.writes[0]?.path, '收件箱/pur-studio-export.md')
    assert.deepEqual(env.notices, ['✅ 已导出：收件箱/pur-studio-export.md'])
  } finally {
    fetchStub.restore()
  }
})

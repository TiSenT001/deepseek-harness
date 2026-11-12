import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCommands } from '../src/client/ui/commands.ts'
import { createT } from '../src/client/i18n.ts'
import type { MenuActions } from '../src/client/ui/menu/types.ts'

/** Menu actions with the calls the command tests observe. */
function actions(log: string[]): MenuActions {
  const noop = (): void => undefined
  return {
    open: noop,
    openGraph: noop,
    createNote: folder => log.push(`createNote:${folder}`),
    createFolder: folder => log.push(`createFolder:${folder}`),
    createTarget: noop,
    rename: noop,
    remove: noop,
    move: noop,
    copy: noop,
    copyPaths: noop,
    newTab: noop,
    closeTab: noop,
    closeOthers: noop,
    closeAllTabs: noop,
    pinTab: noop,
    splitPane: noop,
    closePane: noop,
    reload: () => log.push('reload'),
    collapseTree: () => log.push('collapseTree'),
    showGraph: () => log.push('showGraph'),
    toggleExplorer: noop,
    toggleRail: noop,
    quickSwitch: noop,
    setRail: rail => log.push(`setRail:${rail}`),
    filterTag: noop,
    toggleBookmark: path => log.push(`toggleBookmark:${path}`),
    openHistory: noop,
    openMerge: noop,
    openSplit: noop,
  }
}

/** The page callbacks a command registry needs, each recording its call. */
function context(log: string[], editable: boolean, notePath: string | undefined = undefined) {
  return {
    t: createT('zh'),
    actions: actions(log),
    openSearch: () => log.push('openSearch'),
    openEdit: () => log.push('openEdit'),
    openReading: () => log.push('openReading'),
    openSettings: () => log.push('openSettings'),
    openVaults: () => log.push('openVaults'),
    openPurStudio: () => log.push('openPurStudio'),
    closeCurrentTab: () => log.push('closeCurrentTab'),
    openBookmarks: () => log.push('openBookmarks'),
    notePath,
    bookmarked: false,
    toggleBookmark: (path: string) => log.push(`toggleBookmark:${path}`),
    editable,
    extra: [],
  }
}

test('the registry lists unique ids and localised labels', () => {
  const commands = buildCommands(context([], true))
  const ids = commands.map(entry => entry.id)
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(',')}`)
  assert.equal(commands.find(entry => entry.id === 'note.new')?.label, '新建笔记')
  assert.equal(commands.find(entry => entry.id === 'file.quick')?.hint, 'Ctrl+O')
})

test('view commands appear only while a note is editable', () => {
  const editable = buildCommands(context([], true)).map(entry => entry.id)
  assert.ok(editable.includes('view.edit') && editable.includes('view.reading'))
  const readOnly = buildCommands(context([], false)).map(entry => entry.id)
  assert.ok(!readOnly.includes('view.edit') && !readOnly.includes('view.reading'))
})

test('extra commands sit after the create entries', () => {
  const extra = [{ id: 'daily.open', label: '打开今日笔记', run: () => undefined }]
  const ids = buildCommands({ ...context([], true), extra }).map(entry => entry.id)
  assert.ok(ids.includes('daily.open'))
  assert.ok(ids.indexOf('daily.open') > ids.indexOf('folder.new'))
})

test('commands run through the shared action dispatcher', () => {
  const log: string[] = []
  const commands = buildCommands(context(log, true))
  const run = (id: string): void => {
    commands.find(entry => entry.id === id)?.run()
  }
  run('note.new')
  run('folder.new')
  run('tab.close')
  run('rail.backlinks')
  run('index.refresh')
  run('view.edit')
  run('plugin.purStudio')
  run('vault.switch')
  assert.deepEqual(log, [
    'createNote:',
    'createFolder:',
    'closeCurrentTab',
    'setRail:backlinks',
    'reload',
    'openEdit',
    'openPurStudio',
    'openVaults',
  ])
})

test('bookmark commands track the active note', () => {
  const without = buildCommands(context([], true)).map(entry => entry.id)
  assert.ok(!without.includes('bookmark.toggle'))
  const withNote = buildCommands(context([], true, 'notes/a.md'))
  assert.ok(withNote.some(entry => entry.id === 'bookmark.toggle'))
  const log: string[] = []
  buildCommands(context(log, true, 'notes/a.md'))
    .find(entry => entry.id === 'bookmark.toggle')?.run()
  assert.deepEqual(log, ['toggleBookmark:notes/a.md'])
})

test('the bookmarks panel opens from the palette', () => {
  const log: string[] = []
  buildCommands(context(log, true))
    .find(entry => entry.id === 'bookmarks.show')?.run()
  assert.deepEqual(log, ['openBookmarks'])
})

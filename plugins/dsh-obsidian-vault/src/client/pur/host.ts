/**
 * The pane's menu host: save-as `.PurStudio`, Markdown outline, PNG/JPG
 * bitmap, JSON Canvas and generated-code exports land in the vault under
 * `收件箱/` (exports) and `Pur画布/` (save-as/new), mirroring the Obsidian
 * adapter. Imports use the OS file picker; popout, pin-top, reveal and embed
 * report `pur.unsupportedFeature`.
 * @module dsh-obsidian-vault/client/pur/host
 */
import {
  NOTE_RAW_PICKER,
  appendReferences,
  createElementId,
  irToElements,
  jsonCanvasToElements,
  parseSimpleYAML,
  pushHistory,
  selectedImageReferences,
  serializeStudioDocument,
} from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurElement, PurMenuHost, PurRenderPreferences } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'
import { fetchNote, findEmbeddingNotes, purAssetUrl, saveNote, storeImage } from '../api.ts'
import { purReader } from './labels.ts'
import { PurImageCache, fetchNoteSummary, resolveNoteLink } from './loader.ts'
import { fileToDataURL, insertUrlInput } from './paste-drop.ts'
import { openPurLink } from './sink.ts'
import type { PurEditorKind } from './sink.ts'
import { exportCanvasFlow, exportImageFlow, exportMarkdownFlow, fileBaseName, generateCodeFlow, writeFreshDocument, writeNamedDocument } from './host-export.ts'

export { exportSelectedText } from './host-export.ts'

/** What the menu host needs from the pane. */
export interface PurMenuHostDeps {
  /** The workspace translator. */
  readonly t: Translate
  /** Localized label bundles. */
  readonly labels: PurLabelBundles
  /** The canvas controller. */
  readonly controller: PurController
  /** Vault-relative path of the open document. */
  readonly path: string
  /** Decoded-image cache, for bitmap exports. */
  readonly images: PurImageCache
  /** Resolved colours and grid toggle, for bitmap exports. */
  readonly preferences: PurRenderPreferences
  /** Show a transient notice. */
  readonly notice: (text: string) => void
  /** Drain controller effects into the pane's sink. */
  readonly run: (effects: readonly PurControllerEffect[]) => void
  /** Open an editor overlay for one element. */
  readonly openEditor: (kind: PurEditorKind, id: string) => void
  /** One-line text prompt; null settles a dismissal. */
  readonly promptText: (title: string, initial: string) => Promise<string | null>
  /** Markdown note picker; null settles a dismissal. */
  readonly pickNote: () => Promise<string | null>
  /** Open a vault path in the workspace; absent where the pane cannot navigate. */
  readonly openPath?: (path: string) => void
}

/** Push imported elements into the document with one history snapshot. */
function insertElements(deps: PurMenuHostDeps, elements: readonly PurElement[]): void {
  deps.controller.state.elements.push(...elements)
  pushHistory(deps.controller.history, deps.controller.state.elements)
  deps.run([{ type: 'save' }, { type: 'render' }])
}

/** Open an OS file picker and run the chosen file through `consume`. */
function pickFile(accept: string, consume: (file: File) => Promise<void>): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.style.display = 'none'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    input.remove()
    if (file !== undefined) void consume(file)
  })
  document.body.appendChild(input)
  input.click()
}

/** Insert a picked note as a hydrated note-link card at the point. */
async function insertPickedNote(deps: PurMenuHostDeps, at: { x: number; y: number }): Promise<void> {
  const picked = await deps.pickNote()
  if (picked === null) return
  const note = await fetchNoteSummary(picked)
  if (note === null) deps.run(deps.controller.insertNoteLink(at.x, at.y, picked, picked.replace(/\.md$/i, '')))
  else deps.run(deps.controller.insertNoteLink(at.x, at.y, note.path, note.title === '' ? picked : note.title, note.content, NOTE_RAW_PICKER))
}

/**
 * Create the pane's menu host.
 * @param deps - pane context, read at dispatch time.
 * @returns host operations for menu ids the kernel cannot perform.
 */
export function createPurMenuHost(deps: () => PurMenuHostDeps): PurMenuHost {
  const unsupported = (): void => deps().notice(deps().t('pur.unsupportedFeature'))
  return {
    presetTitle: (presetId) => purReader(deps().t)(`pur.preset.${presetId}`),
    newCanvas: () => void writeFreshDocument(deps()),
    addNoteLink: (at) => void insertPickedNote(deps(), at),
    importLocal: (at) => pickFile('image/*', async (file) => {
      const dataURL = await fileToDataURL(file)
      const path = await storeImage(file.name, dataURL).catch(() => '')
      deps().run(path.length === 0
        ? deps().controller.insertImage(at.x, at.y, '', dataURL)
        : deps().controller.insertImage(at.x, at.y, path))
    }),
    importIr: (at) => pickFile('.yaml,.yml,.json', async (file) => {
      try {
        const groups = irToElements(parseSimpleYAML(await file.text()), at.x, at.y, { createId: createElementId })
        if (groups !== null) insertElements(deps(), groups)
      } catch {
        deps().notice(deps().t('pur.importFailed'))
      }
    }),
    importCanvas: () => pickFile('.canvas', async (file) => {
      try {
        insertElements(deps(), jsonCanvasToElements(JSON.parse(await file.text())))
      } catch {
        deps().notice(deps().t('pur.importFailed'))
      }
    }),
    importNet: (at) => {
      const d = deps()
      void d.promptText(d.t('pur.importNet'), '').then((value) => {
        if (value === null) return
        insertUrlInput(d.controller, at, value, { webLinkCard: d.labels.controller.webLinkCard, resolveNote: resolveNoteLink, run: d.run })
      })
    },
    savePur: () => {
      const d = deps()
      const base = fileBaseName(d.path)
      const initial = base === undefined || base === '' ? d.t('pur.newCanvasName') : base + d.t('pur.copySuffix')
      void writeNamedDocument(d, d.t('pur.saveAsPur'), initial, () =>
        serializeStudioDocument({ elements: d.controller.state.elements, viewState: d.controller.state.view }))
    },
    exportMarkdown: () => void exportMarkdownFlow(deps(), false, true),
    generateCode: (format) => void generateCodeFlow(deps(), format),
    exportImage: (format) => void exportImageFlow(deps(), format),
    exportCanvasDocument: () => void exportCanvasFlow(deps()),
    togglePopout: unsupported,
    togglePinTop: unsupported,
    openAsset: (id, destination) => {
      const url = purAssetUrl('pur-asset:' + id)
      if (destination === 'current') window.location.assign(url)
      else window.open(url, '_blank', 'noopener')
    },
    openEmbeddingNote: (element) => {
      const d = deps()
      const title = d.path.replace(/^.*\//, '').replace(/\.PurStudio$/i, '')
      const name = element.type === 'image' ? element.original.split(/[\\/]/).pop() ?? '' : ''
      if (name.length === 0) {
        d.notice(d.t('pur.noEmbeddingNote'))
        return
      }
      void findEmbeddingNotes(title, name).then((notes) => {
        const first = notes[0]
        if (first === undefined) {
          d.notice(d.t('pur.noEmbeddingNote'))
          return
        }
        d.openPath?.(first)
      }).catch(() => d.notice(d.t('pur.noEmbeddingNote')))
    },    openLink: (target) => openPurLink(target),
    copyLinkOf: (element) => {
      const text = element.type === 'note-link' ? element.link : element.type === 'image' ? (element.link ?? element.original) : ''
      if (text === '') return
      void navigator.clipboard.writeText(text).then(() => deps().notice(deps().t('pur.copied')))
    },
    revealInExplorer: unsupported,
    embedInActiveNote: () => {
      const d = deps()
      const title = d.path.replace(/^.*\//, '').replace(/\.PurStudio$/i, '')
      const references = selectedImageReferences(d.controller.state.elements, d.controller.state.selectedIds, title)
      if (references.length === 0) {
        d.notice(d.t('pur.embedNoSelection'))
        return
      }
      // The canvas holds the active tab, so the target note comes from the
      // picker; upstream reads the active file, which is the canvas here too.
      void d.pickNote().then(async (note) => {
        if (note === null) return
        try {
          const file = await fetchNote(note)
          await saveNote(note, appendReferences(file.content, references))
          d.notice(d.t('pur.embeddedTo'))
        } catch (cause) {
          d.notice(cause instanceof Error ? cause.message : d.t('pur.unsupportedFeature'))
        }
      })
    },
    promptElementLink: (element) => {
      void deps().pickNote().then((picked) => {
        if (picked === null) return
        const d = deps()
        d.run(d.controller.updateElement(element.id, { link: picked }))
        d.notice(d.t(element.type === 'group' ? 'pur.groupLinked' : 'pur.linkedNotice'))
      })
    },
    editText: (id) => deps().openEditor('text', id),
    editGroup: (id) => deps().openEditor('group', id),
    editLine: (id) => deps().openEditor('line', id),
    editNoteLink: (id) => deps().openEditor('note-link', id),
  }
}
/** Depth-first lookup of one image element by id. */
function findImageElement(elements: readonly PurElement[], id: string): PurElement | undefined {
  for (const element of elements) {
    if (element.id === id && element.type === 'image') return element
    if (element.type === 'group') {
      const nested = findImageElement(element.children, id)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

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
import type { PurController, PurControllerEffect, PurElement, PurMenuHost, PurOpenDestination, PurRenderPreferences } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'
import { fetchNote, findEmbeddingNotes, purAssetUrl, saveNote, storeImage } from '../api.ts'
import { findElement } from '../../pur-kernel/index.ts'
import { bridgeWriteText, deleteCodeSnippet, fetchCodeSnippets, importPurFile, openFileWith, saveCodeSnippet } from '../api.ts'
import { thumbnailOf } from './loader.ts'
import { purReader } from './labels.ts'
import { PurImageCache, fetchNoteSummary, resolveNoteLink } from './loader.ts'
import { fileToDataURL, insertUrlInput } from './paste-drop.ts'
import { openPurLink } from './sink.ts'
import type { PurEditorKind } from './sink.ts'

/** Background of an imported note card, matching the canvas default. */
const NOTE_BG = 'rgba(28,28,30,0.92)'
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
  /** Re-read the snippet library after a save, so the menu lists it. */
  readonly reloadSnippets?: () => void
  /** Open a vault path in the workspace; absent where the pane cannot navigate. */
  readonly openPath?: (path: string, destination?: PurOpenDestination) => void
  /** Show a full-size preview of one plugin-owned asset. */
  readonly openPreview?: (id: string, destination: PurOpenDestination) => void
}

/** Push imported elements into the document with one history snapshot. */
function insertElements(deps: PurMenuHostDeps, elements: readonly PurElement[]): void {
  deps.controller.state.elements.push(...elements)
  pushHistory(deps.controller.history, deps.controller.state.elements)
  deps.run([{ type: 'save' }, { type: 'render' }])
}

/** Room left around an imported board, in screen pixels. */
const IMPORT_MARGIN = 40

/** Viewport the framing assumes before the canvas is on screen. */
const IMPORT_VIEWPORT = { w: 1200, h: 800 }

/**
 * Compute the view that shows a whole imported board. Opening at unit scale would
 * park the camera at one corner of a board that can be tens of thousands of units
 * wide, which is what made an imported canvas look empty.
 * @param elements - the imported elements.
 * @returns a view state that fits them on screen.
 */
function frameImportedScene(elements: readonly { x: number; y: number; w: number; h: number }[]): { offsetX: number; offsetY: number; scale: number } {
  if (elements.length === 0) return { offsetX: 0, offsetY: 0, scale: 1 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const element of elements) {
    minX = Math.min(minX, element.x)
    minY = Math.min(minY, element.y)
    maxX = Math.max(maxX, element.x + element.w)
    maxY = Math.max(maxY, element.y + element.h)
  }
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  const fit = Math.min(
    (IMPORT_VIEWPORT.w - IMPORT_MARGIN * 2) / width,
    (IMPORT_VIEWPORT.h - IMPORT_MARGIN * 2) / height,
  )
  // Never magnify a small board; a single imported card keeps its own size.
  const scale = Math.min(1, Math.max(fit, 0.001))
  return {
    offsetX: IMPORT_MARGIN - minX * scale,
    offsetY: IMPORT_MARGIN - minY * scale,
    scale,
  }
}

/** Open an OS file picker and run the chosen file through `consume`. */
/**
 * Encode bytes as base64 without spreading them into one call: a .pur file easily
 * exceeds the argument limit, and the spread overflowed the stack for a 1.6MB one.
 * @param bytes - the file contents.
 * @returns base64 text.
 */
function toBase64(bytes: Uint8Array): string {
  const chunk = 0x8000
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return btoa(binary)
}

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
      // Store a small copy too: a zoomed-out board draws it instead of decoding
      // the full picture for a few dozen pixels.
      const thumbData = await thumbnailOf(dataURL).catch(() => null)
      const thumbStored = thumbData === null ? '' : await storeImage(`${file.name}-thumb`, thumbData).catch(() => '')
      const thumb = thumbStored.length === 0 ? undefined : thumbStored
      deps().run(path.length === 0
        ? deps().controller.insertImage(at.x, at.y, '', dataURL, thumb)
        : deps().controller.insertImage(at.x, at.y, path, undefined, thumb))
    }),
    importPur: (at) => {
      const d = deps()
      pickFile('.pur,.purz', async (file) => {
        if (file === null) return
        const bytes = new Uint8Array(await file.arrayBuffer())
        const data = toBase64(bytes)
        const result = await importPurFile(file.name, data)
        for (const element of result.elements) {
          if (element.type === "text") {
            d.run(d.controller.insertText(element.x + at.x, element.y + at.y, element.text, { w: element.w, h: element.h, bgColor: NOTE_BG }))
            continue
          }
          d.run(d.controller.insertImage(element.x + at.x, element.y + at.y, element.ref))
        }
        const template = result.approximate ? 'pur.importedApprox' : 'pur.importedCount'
        d.notice(d.t(template).replace('{count}', String(result.elements.length)))
      })
    },
    importPurAsCanvas: () => pickFile('.pur,.purz', async (file) => {
      if (file === null) return
      const d = deps()
      const bytes = new Uint8Array(await file.arrayBuffer())
      const data = toBase64(bytes)
      const result = await importPurFile(file.name, data).catch(() => null)
      if (result === null || result.elements.length === 0) {
        d.notice(d.t('pur.importFailed'))
        return
      }
      const suggested = `${file.name.replace(/\.purz?$/i, '')}.purstudio`
      const name = await d.promptText(d.t('pur.newCanvasName'), suggested)
      if (name === null || name.trim() === '') return
      const folder = d.path.includes('/') ? d.path.slice(0, d.path.lastIndexOf('/')) : ''
      const target = folder === '' ? name.trim() : `${folder}/${name.trim()}`
      const document = {
        elements: result.elements.map((element, index) => element.type === "text"
          ? {
              id: `imported-${index}`,
              type: "text",
              x: element.x,
              y: element.y,
              w: element.w,
              h: element.h,
              content: element.text,
              bgColor: NOTE_BG,
              color: "#e0e0e0",
              fontSize: 14,
              rotation: 0,
              opacity: 1,
            }
          : {
              id: `imported-${index}`,
              type: "image",
              x: element.x,
              y: element.y,
              w: element.w,
              h: element.h,
              original: element.ref,
            }),
        // Frame the board the way it sat on its own canvas: the coordinates are
        // PureRef world units, so the view has to be derived from them.
        viewState: frameImportedScene(result.elements),
      }
      // The canvas format is plugin-owned: it is written through the bridge route,
      // which creates the file when it does not exist yet.
      const written = await bridgeWriteText(target, JSON.stringify(document, null, 2)).catch(() => null)
      if (written === null) {
        d.notice(d.t('pur.importFailed'))
        return
      }
      d.notice(d.t('pur.importedCount').replace('{count}', String(result.elements.length)))
      d.openPath?.(target)
    }),    importIr: (at) => pickFile('.yaml,.yml,.json', async (file) => {
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
    togglePopout: () => {
      // A browser window, not a second workspace: the popout page mounts only
      // this canvas, so it can sit on another monitor without its own file tree.
      const token = new URLSearchParams(window.location.search).get('token') ?? ''
      const query = `path=${encodeURIComponent(deps().path)}${token === '' ? '' : `&token=${encodeURIComponent(token)}`}`
      window.open(`/obsidian/api/pur/popout?${query}`, '_blank', 'popup,width=1200,height=800')
    },
    togglePinTop: unsupported,
    insertCodeSnippet: (id, at) => {
      const d = deps()
      void fetchCodeSnippets().then((nodes) => {
        const node = nodes.find((entry) => entry.id === id)
        if (node === undefined) return
        d.run(d.controller.addCodeNode(at.x, at.y, {
          inputs: node.inputs.map((pin) => pin.label),
          outputs: node.outputs.map((pin) => pin.label),
          code: node.code,
          title: node.title,
        }))
      }).catch(() => d.notice(d.t('pur.snippetFailed')))
    },
    deleteCodeSnippet: (id) => {
      const d = deps()
      void deleteCodeSnippet(id).then(() => d.reloadSnippets?.()).catch(() => d.notice(d.t('pur.snippetFailed')))
    },
    saveCodeSnippet: (elementId) => {
      const d = deps()
      const site = findElement(d.controller.state.elements, elementId)
      const element = site !== null && site.element.type === 'code-node' ? site.element : null
      if (element === null) return
      void d.promptText(d.t('pur.snippetTitle'), element.title ?? '').then((title) => {
        if (title === null || title.trim() === '') return
        return saveCodeSnippet({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          title: title.trim(),
          code: element.code ?? element.content,
          inputs: (element.inputs ?? []).map((pin) => ({ id: pin.id, label: pin.label })),
          outputs: (element.outputs ?? []).map((pin) => ({ id: pin.id, label: pin.label })),
        }).then(() => d.reloadSnippets?.())
      }).catch(() => d.notice(d.t('pur.snippetFailed')))
    },
    openFileWith: (target, program) => {
      void openFileWith(target, program).catch(() => deps().notice(deps().t('pur.openWithFailed')))
    },
    openAsset: (id, destination) => {
      // A real document tab (a split for 'right'), not `window.open`: the webview
      // blocks popups, and the image deserves the same zoom and pan as a file.
      deps().openPath?.(`pur-asset:${id}`, destination)
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
    },    openLink: (target, destination) => {
      // A URL leaves the app; a vault path navigates inside the workspace, so the
      // destination decides between the current tab and a new one.
      if (/^https?:/i.test(target)) {
        window.open(target, '_blank', 'noopener')
        return
      }
      deps().openPath?.(target, destination)
    },
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

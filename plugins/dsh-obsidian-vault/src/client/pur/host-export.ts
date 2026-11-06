/**
 * Export flows of the pane's menu host: Markdown outline, PNG/JPG bitmap,
 * JSON Canvas and generated-code writes land in the vault under `收件箱/`;
 * save-as and new-canvas documents land under `Pur画布/`, mirroring the
 * Obsidian adapter. All writes go through the bridge.
 * @module dsh-obsidian-vault/client/pur/host-export
 */
import { bridgeExists, createFolder } from '../api.ts'
import {
  buildExportOutline,
  buildPipeline,
  buildSelectedTextExport,
  drawScene,
  elementsToJsonCanvas,
  renderJavaScript,
  renderPython,
  serializeStudioDocument,
} from '../../pur-kernel/index.ts'
import type { PurMenuHostDeps } from './host.ts'
import { ensureExportDir, uniqueExportPath, writeExportDataURL, writeExportText } from './loader.ts'

/** Vault folder save-as and new-canvas documents land in, mirroring upstream. */
const STUDIO_DIR = 'Pur画布'

/** The document's display basename, without its extension. */
export function fileBaseName(path: string): string | undefined {
  const name = path.split('/').pop()
  return name === undefined ? undefined : name.replace(/\.[^.]*$/, '')
}

/** Strip characters vault file names cannot carry, mirroring upstream. */
function safeName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim()
}

/** Create the folder when absent. */
async function ensureFolder(path: string): Promise<void> {
  if (!(await bridgeExists(path))) await createFolder(path)
}

/** Pick a non-colliding vault path in a folder, appending `_N` like upstream. */
async function uniquePathIn(folder: string, name: string, extension: string): Promise<string> {
  let candidate = `${folder}/${name}.${extension}`
  let counter = 1
  while (await bridgeExists(candidate)) {
    candidate = `${folder}/${name}_${counter}.${extension}`
    counter++
  }
  return candidate
}

/** Write text into the vault, reporting failures as a notice. @returns success. */
async function writeText(deps: PurMenuHostDeps, path: string, content: string): Promise<boolean> {
  try {
    await writeExportText(path, content)
    return true
  } catch {
    deps.notice(deps.t('pur.saveFailed'))
    return false
  }
}

/** Notice the exported path, interpolating the dictionary template. */
function exportedNotice(deps: PurMenuHostDeps, path: string): void {
  deps.notice(deps.t('pur.exportedTo').replace('{path}', path))
}

/** Write a fresh document under a prompted name in `Pur画布/`, noticing with upstream's saved copy. */
export async function writeNamedDocument(deps: PurMenuHostDeps, title: string, initial: string, content: () => string): Promise<void> {
  const name = await deps.promptText(title, initial)
  if (name === null) return
  await ensureFolder(STUDIO_DIR)
  const path = await uniquePathIn(STUDIO_DIR, safeName(name) || 'export', 'PurStudio')
  if (await writeText(deps, path, content())) deps.notice(deps.t('pur.savedTo').replace('{path}', path))
}

/**
 * Write a fresh empty canvas under `Pur画布/` without prompting, mirroring
 * upstream's `createNewStudio`, then open it when the pane can navigate.
 * @param deps - menu host context.
 */
export async function writeFreshDocument(deps: PurMenuHostDeps): Promise<void> {
  await ensureFolder(STUDIO_DIR)
  const path = await uniquePathIn(STUDIO_DIR, safeName(deps.t('pur.newCanvasName')), 'PurStudio')
  const content = serializeStudioDocument({ elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } })
  if (!(await writeText(deps, path, content))) return
  deps.notice(deps.t('pur.createdTo').replace('{path}', path))
  deps.openPath?.(path)
}

/** Export the canvas (or the selection's text/code) as Markdown under `收件箱/`. */
export async function exportMarkdownFlow(deps: PurMenuHostDeps, selectedOnly: boolean, promptName: boolean, fixedName?: string): Promise<void> {
  const elements = deps.controller.state.elements
  let content: string | null
  if (selectedOnly) {
    content = buildSelectedTextExport(elements, deps.controller.state.selectedIds)
    if (content === null) {
      deps.notice(deps.t('pur.noExportContent'))
      return
    }
  } else {
    content = buildExportOutline(elements, { title: fileBaseName(deps.path), time: new Date().toLocaleString(), labels: deps.labels.exportText })
  }
  let name = fixedName ?? fileBaseName(deps.path) ?? deps.t('pur.untitled')
  if (promptName) {
    const asked = await deps.promptText(deps.t('pur.exportNamePrompt'), name)
    if (asked === null) return
    name = asked
  }
  await ensureExportDir()
  const path = await uniqueExportPath(name, 'md')
  if (await writeText(deps, path, content)) exportedNotice(deps, path)
}

/**
 * Run the export-as-text flow: the selection's text and code under a prompted
 * file name.
 * @param deps - menu host context.
 */
export function exportSelectedText(deps: PurMenuHostDeps): void {
  void exportMarkdownFlow(deps, true, true)
}

/** Generate runnable JavaScript or Python from the pipeline into `收件箱/`. */
export async function generateCodeFlow(deps: PurMenuHostDeps, format: 'js' | 'py'): Promise<void> {
  const result = buildPipeline(deps.controller.state.elements)
  if (!result.ok) {
    deps.notice(deps.t(result.reason === 'no-code-nodes' ? 'pur.noCodeNodes' : 'pur.cycleError'))
    return
  }
  const header = deps.labels.codegenCore.header(result.pipeline.nodes.length, result.pipeline.edges.length, new Date().toLocaleString())
  const code = format === 'js'
    ? renderJavaScript(result.pipeline, deps.labels.codegenCore, deps.labels.codegenJs, header)
    : renderPython(result.pipeline, deps.labels.codegenCore, deps.labels.codegenPy, header)
  await ensureExportDir()
  const path = await uniqueExportPath(fileBaseName(deps.path) ?? deps.t('pur.untitled'), format)
  if (await writeText(deps, path, code)) exportedNotice(deps, path)
}

/** Export the canvas bounds as a bitmap under `收件箱/`, redrawing offscreen. */
export async function exportImageFlow(deps: PurMenuHostDeps, format: 'png' | 'jpg'): Promise<void> {
  const elements = deps.controller.state.elements.filter((element) => element.type !== 'line')
  if (elements.length === 0) return
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const element of elements) {
    const x = element.x ?? 0
    const y = element.y ?? 0
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + (element.w ?? 0))
    maxY = Math.max(maxY, y + (element.h ?? 0))
  }
  const padding = 20
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const options = deps.exportOptions
  const scale = Math.min(3, Math.max(1, Math.round(options.scale)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (ctx === null) return
  const preferences = deps.preferences
  const transparentPng = format === 'png' && options.transparent
  drawScene(ctx, {
    elements,
    view: { offsetX: padding - minX, offsetY: padding - minY, scale },
    width: canvas.width,
    height: canvas.height,
    preferences: {
      ...preferences,
      backgroundColor: format === 'jpg' || !transparentPng
        ? (preferences.backgroundColor === 'transparent' || preferences.backgroundColor === 'obsidian' ? '#1e1e1e' : preferences.backgroundColor)
        : 'transparent',
      showGrid: false,
    },
    labels: deps.labels.render,
    images: deps.images.map,
  })
  const dataURL = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', format === 'jpg' ? Math.min(1, Math.max(0.4, options.jpgQuality)) : 1)
  await ensureExportDir()
  const path = await uniqueExportPath(fileBaseName(deps.path) ?? deps.t('pur.untitled'), format)
  try {
    await writeExportDataURL(path, dataURL)
    exportedNotice(deps, path)
  } catch {
    deps.notice(deps.t('pur.saveFailed'))
  }
}

/** Export the elements as a JSON Canvas document under `收件箱/`. */
export async function exportCanvasFlow(deps: PurMenuHostDeps): Promise<void> {
  await ensureExportDir()
  const path = await uniqueExportPath(fileBaseName(deps.path) ?? deps.t('pur.untitled'), 'canvas')
  if (await writeText(deps, path, JSON.stringify(elementsToJsonCanvas(deps.controller.state.elements), null, 2))) exportedNotice(deps, path)
}

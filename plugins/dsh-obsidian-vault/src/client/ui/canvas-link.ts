/**
 * Link a pasted image through a Pur Studio canvas. The bytes land in the
 * canvas's attachment folder, the canvas document gains an image element whose
 * `original` names that file, and the note embeds the `pur.studio` reference the
 * reading view already resolves.
 * @module dsh-obsidian-vault/client/ui/canvas-link
 */
import { bridgeExists, bridgeListFiles, bridgeReadText, bridgeWriteText, writeAsset } from '../api.ts'
import { createElementId, parseStudioDocument, serializeStudioDocument } from '../../pur-kernel/index.ts'
import type { PurElement, PurStudioDocument } from '../../pur-kernel/index.ts'

/** Vault folder canvases live in. */
export const CANVAS_DIR = 'Pur画布'

/** Attachment folder inside the canvas folder; the resolver reads `Pur画布/附件`. */
const CANVAS_ATTACHMENT_DIR = `${CANVAS_DIR}/附件`

/** Default card size for an image dropped into a canvas. */
const IMAGE_CARD = { w: 320, h: 200 } as const

/** One canvas the user can link into. */
export interface CanvasOption {
  readonly path: string
  readonly name: string
}

/**
 * Read one canvas file name without its extension.
 * @param path - vault-relative canvas path.
 * @returns the display name.
 */
export function canvasNameOf(path: string): string {
  const base = path.split('/').pop() ?? path
  return base.replace(/\.PurStudio$/i, '')
}

/**
 * Build the `pur.studio` reference a note embeds. Kept unencoded like the
 * references the canvas export writes, because the reading view matches the
 * canvas and file names literally.
 * @param canvasPath - path of the canvas holding the image.
 * @param fileName - image file name inside the canvas.
 * @returns the reference URL.
 */
export function purStudioLink(canvasPath: string, fileName: string): string {
  return `https://pur.studio/${canvasNameOf(canvasPath)}/${fileName}`
}

/**
 * List the canvases in the vault, newest name order.
 * @returns every `.PurStudio` file.
 */
export async function listCanvases(): Promise<readonly CanvasOption[]> {
  const files = await bridgeListFiles()
  return files
    .filter(file => file.extension.toLowerCase() === 'purstudio')
    .map(file => ({ path: file.path, name: canvasNameOf(file.path) }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh'))
}

/**
 * Build one image element pointing at a stored attachment.
 * @param fileName - file name inside the canvas attachment folder.
 * @param index - position used to stagger new cards.
 * @returns the element.
 */
function imageElement(fileName: string, index: number): PurElement {
  return {
    id: createElementId(),
    type: 'image',
    x: 40 + index * 28,
    y: 40 + index * 28,
    w: IMAGE_CARD.w,
    h: IMAGE_CARD.h,
    original: `附件/${fileName}`,
  }
}

/**
 * Add one image to an existing canvas.
 * @param canvasPath - vault-relative canvas path.
 * @param name - original image file name.
 * @param dataUrl - the image as a data URL.
 * @returns the embed link plus the stored vault path.
 */
export async function appendImageToCanvas(
  canvasPath: string,
  name: string,
  dataUrl: string,
): Promise<{ link: string; assetPath: string }> {
  const assetPath = await writeAsset(name, dataUrl, CANVAS_ATTACHMENT_DIR)
  const fileName = assetPath.split('/').pop() ?? name
  const document = parseStudioDocument(await bridgeReadText(canvasPath))
  const next: PurStudioDocument = {
    elements: [...document.elements, imageElement(fileName, document.elements.length)],
    viewState: document.viewState,
  }
  await bridgeWriteText(canvasPath, serializeStudioDocument(next))
  return { link: purStudioLink(canvasPath, fileName), assetPath }
}

/**
 * Create a canvas holding one image and return its path and embed link.
 * @param baseName - canvas file name without extension.
 * @param name - original image file name.
 * @param dataUrl - the image as a data URL.
 * @returns the created canvas path and the embed link.
 */
export async function createCanvasWithImage(
  baseName: string,
  name: string,
  dataUrl: string,
): Promise<{ path: string; link: string; assetPath: string }> {
  const assetPath = await writeAsset(name, dataUrl, CANVAS_ATTACHMENT_DIR)
  const fileName = assetPath.split('/').pop() ?? name
  const clean = baseName.trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 80).length > 0
    ? baseName.trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)
    : '粘贴图片'
  let path = `${CANVAS_DIR}/${clean}.PurStudio`
  let counter = 1
  while (await bridgeExists(path)) {
    path = `${CANVAS_DIR}/${clean}_${counter}.PurStudio`
    counter += 1
  }
  const document: PurStudioDocument = {
    elements: [imageElement(fileName, 0)],
    viewState: { offsetX: 0, offsetY: 0, scale: 1 },
  }
  await bridgeWriteText(path, serializeStudioDocument(document))
  return { path, link: purStudioLink(path, fileName), assetPath }
}

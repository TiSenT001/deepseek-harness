/**
 * Create a fresh empty Pur Studio canvas in the vault and hand back its path.
 * The old ribbon entry opened a bridged Obsidian plugin frame; with bridging
 * removed, the entry now creates a real `.PurStudio` file instead.
 * @module dsh-obsidian-vault/client/ui/newCanvas
 */
import { bridgeExists, bridgeWriteText, createFolder } from '../api.ts'
import { serializeStudioDocument } from '../../pur-kernel/index.ts'

/** Vault folder canvases live in. */
const CANVAS_DIR = 'Pur画布'

/**
 * Create the next free `Pur画布/<name>_N.PurStudio` and open it.
 * @param name - base file name without extension.
 * @param openPath - opens the written vault path in the workspace.
 * @returns the created path.
 */
export async function createPurCanvas(name: string, openPath: (path: string) => void): Promise<string> {
  try {
    await createFolder(CANVAS_DIR)
  } catch {
    // Already present; the folder call is idempotent enough for this flow.
  }
  let candidate = `${CANVAS_DIR}/${name}.PurStudio`
  let counter = 1
  while (await bridgeExists(candidate)) {
    candidate = `${CANVAS_DIR}/${name}_${counter}.PurStudio`
    counter += 1
  }
  await bridgeWriteText(candidate, serializeStudioDocument({ elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }))
  openPath(candidate)
  return candidate
}

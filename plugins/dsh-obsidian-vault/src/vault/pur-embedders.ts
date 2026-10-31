/**
 * Reverse lookup for embedded canvas images: which notes reference
 * `https://pur.studio/<canvas>/<file>`. The search index narrows the candidates;
 * only those few notes are read back, so the click stays fast on a large vault.
 * @module dsh-obsidian-vault/vault/pur-embedders
 */
import type { VaultIndex } from './index.ts'

/**
 * Notes that embed one canvas image.
 * @param vault - index over the active vault.
 * @param canvas - canvas title as written in the reference.
 * @param file - image file name as written in the reference.
 * @returns vault-relative note paths, most recently modified first.
 */
export async function findEmbeddingNotes(
  vault: VaultIndex,
  canvas: string,
  file: string,
): Promise<readonly string[]> {
  const needle = `/${encodeURIComponent(canvas)}/${encodeURIComponent(file)}`
  const seen = new Set<string>()
  const paths: string[] = []
  for (const hit of vault.search(file, 40)) {
    if (seen.has(hit.path)) continue
    seen.add(hit.path)
    if (!/\.md$/i.test(hit.path)) continue
    const note = await vault.note(hit.path)
    if (note === undefined) continue
    if (!note.content.includes('pur.studio/')) continue
    if (!note.content.includes(needle) && !note.content.includes(`/${canvas}/${file}`)) continue
    paths.push(hit.path)
  }
  return paths
}

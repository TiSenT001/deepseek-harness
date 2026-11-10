/**
 * Read paths that reach the filesystem directly: one vault file for the viewer,
 * one attachment's bytes, and the root-relative target resolution they share.
 * @module dsh-obsidian-vault/vault/index-read
 */
import type { FileDto } from '../protocol.ts'
import { extensionOf, fileTypeOf } from '../filetypes.ts'
import { baseName } from './tree.ts'
import type { VaultFiles } from './files.ts'
import type { FsLike, FsTargetLike } from './index-types.ts'

/** Text the file view may carry to the browser; longer files arrive truncated. */
const MAX_TEXT_BYTES = 1024 * 1024

/**
 * Resolve a vault-relative path against the scanned root.
 * @param fs - Host filesystem service.
 * @param root - the scanned root target.
 * @param path - vault-relative path.
 * @returns the resolved target.
 * @throws {Error} when the root has not been resolved yet.
 */
export async function resolveInVault(fs: FsLike, root: FsTargetLike | undefined, path: string): Promise<FsTargetLike> {
  if (root === undefined) throw new Error('vault root is not resolved yet')
  const separator = root.displayPath.endsWith('\\') ? '\\' : '/'
  return fs.resolve(`${root.displayPath}${separator}${path.replace(/\//g, separator)}`)
}

/**
 * Read one vault file for the file viewer. Markdown and whitelisted text files
 * carry a prefix of their content; images, PDFs, and binaries carry metadata
 * only and stream through the asset route.
 * @param files - the vault file helper.
 * @param path - vault-relative path.
 * @returns the file, or undefined when it is absent or a directory.
 */
export async function fileOf(files: VaultFiles, path: string): Promise<FileDto | undefined> {
  const info = await files.info(path)
  if (info === undefined) return undefined
  const spec = fileTypeOf(path)
  const base: FileDto = {
    path,
    name: baseName(path),
    ext: extensionOf(path),
    kind: spec.kind,
    mime: spec.mime,
    size: info.size,
    mtime: info.mtime,
    truncated: false,
    ...(spec.language === undefined ? {} : { language: spec.language }),
  }
  if (spec.kind !== 'markdown' && spec.kind !== 'code' && spec.kind !== 'canvas') return base
  try {
    const prefix = await files.readPrefix(path, MAX_TEXT_BYTES)
    return { ...base, size: prefix.size, text: prefix.text, truncated: prefix.truncated }
  } catch {
    // An unreadable text file still answers with its metadata.
    return base
  }
}

/** Inputs the attachment reader needs. */
export interface AssetInput {
  /** Host filesystem service. */
  readonly fs: FsLike
  /** Scanned root target. */
  readonly root: FsTargetLike | undefined
  /** Indexed attachment paths. */
  readonly attachments: ReadonlySet<string>
}

/**
 * Read one attachment inside the vault.
 * @param input - filesystem service, root and indexed attachments.
 * @param path - vault-relative path.
 * @param maxBytes - inclusive cap.
 * @returns the bytes, or undefined when the file is absent, outside the vault, or unreadable.
 */
export async function readAssetOf(input: AssetInput, path: string, maxBytes: number): Promise<Uint8Array | undefined> {
  const readBytes = input.fs.readBytes
  if (input.root === undefined || readBytes === undefined) return undefined
  if (!input.attachments.has(path)) return undefined
  try {
    const target = await resolveInVault(input.fs, input.root, path)
    if (input.fs.contains !== undefined && !input.fs.contains(input.root, target)) return undefined
    return await readBytes.call(input.fs, target, undefined, maxBytes)
  } catch {
    return undefined
  }
}

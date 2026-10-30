/**
 * Obsidian's file model classes for the frame: `instanceof TFile` checks in
 * plugin code must behave exactly like the real runtime, so the classes are
 * real and the vault facade constructs them from the bridge's file list.
 * @module dsh-obsidian-vault/shim/files
 */
import type { BridgeFileDto } from '../protocol.ts'

/** File timestamps Obsidian exposes on `TFile.stat`. */
export interface FileStat {
  readonly ctime: number
  readonly mtime: number
  readonly size: number
}

/** A vault entry: Obsidian's `TAbstractFile`. */
export abstract class TAbstractFile {
  readonly path: string
  readonly name: string

  constructor(path: string) {
    this.path = path
    this.name = path.slice(path.lastIndexOf('/') + 1)
  }
}

/** A vault folder: Obsidian's `TFolder`. */
export class TFolder extends TAbstractFile {}

/** A vault file: Obsidian's `TFile`, including `extension` and `stat`. */
export class TFile extends TAbstractFile {
  readonly extension: string
  readonly basename: string
  readonly stat: FileStat

  constructor(path: string, stat: FileStat) {
    super(path)
    const dot = this.name.lastIndexOf('.')
    this.extension = dot > 0 ? this.name.slice(dot + 1).toLowerCase() : ''
    this.basename = dot > 0 ? this.name.slice(0, dot) : this.name
    this.stat = stat
  }
}

/**
 * Build the frame-side file object for one bridge list entry.
 * @param dto - the host's file record.
 * @returns the TFile mirroring it.
 */
export function fileFromDto(dto: BridgeFileDto): TFile {
  return new TFile(dto.path, { ctime: dto.ctime, mtime: dto.mtime, size: dto.size })
}

/**
 * The scan cycle: run one vault scan and hand back what changed. The index
 * class owns the state; this module owns the traversal contract so the class
 * only applies results.
 * @module dsh-obsidian-vault/vault/index-scan
 */
import { scanVault } from './scan.ts'
import type { NoteEntry } from './entry.ts'
import type { VaultFiles } from './files.ts'
import type { FsLike, FsTargetLike, VaultOptions } from './index-types.ts'

/** Result of one successful scan. */
export type ScanResult = Awaited<ReturnType<typeof scanVault>>

/** What one scan needs from the index. */
export interface ScanHost {
  /** Host filesystem service. */
  readonly fs: FsLike
  /** Resolved tunables. */
  readonly options: VaultOptions
  /** The vault file helper bound to the current root. */
  readonly files: VaultFiles
  /** Absolute root currently indexed. */
  readonly rootPath: string
  /** Previously parsed entries, reused when their filesystem version is unchanged. */
  readonly notes: ReadonlyMap<string, NoteEntry>
  /** Signature of the last published scan. */
  readonly signature: string | undefined
  /** Parse one entry. @returns the parsed entry. */
  parse(target: FsTargetLike, path: string, key: string, size: number, budget: number): Promise<NoteEntry>
}

/** Outcome of one scan attempt. */
export type ScanOutcome =
  | { readonly kind: 'failed'; readonly message: string }
  | { readonly kind: 'unchanged' }
  | { readonly kind: 'scanned'; readonly result: ScanResult }

/**
 * Run one scan and report what happened, without touching index state.
 * @param host - current root, services and previous snapshot.
 * @returns the outcome the caller applies.
 */
export async function scanOnce(host: ScanHost): Promise<ScanOutcome> {
  let result: ScanResult
  try {
    result = await scanVault(host.fs, host.rootPath, host.options, host.notes,
      (target, path, key, size, budget) => host.parse(target, path, key, size, budget))
  } catch (error) {
    return { kind: 'failed', message: error instanceof Error ? error.message : String(error) }
  }
  if (host.signature === result.signature) return { kind: 'unchanged' }
  return { kind: 'scanned', result }
}

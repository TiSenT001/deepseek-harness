/**
 * Wire types shared by the Host half (index and routes) and the browser half.
 * Every type here is plain JSON so both sides can import it type-only.
 * @module dsh-obsidian-vault/protocol
 */
import type { FileKind } from './filetypes.ts'

/** Route prefix the Host half mounts its JSON API under. */
export const API_BASE = '/obsidian/api'

/** How one `[[link]]` resolved against the vault. */
export type LinkStatus = 'resolved' | 'unresolved' | 'ambiguous'

/** One heading of a note. */
export interface HeadingDto {
  readonly level: number
  readonly text: string
  /** 1-based source line. */
  readonly line: number
}

/** One `[[link]]` occurrence, already resolved against the vault. */
export interface NoteLinkDto {
  readonly raw: string
  readonly target: string
  readonly alias?: string
  readonly anchor?: string
  readonly block?: string
  readonly embed: boolean
  /** 1-based source line. */
  readonly line: number
  readonly status: LinkStatus
  readonly path?: string
  readonly candidates?: readonly string[]
}

/** One note as the reading view needs it. */
export interface NoteDto {
  readonly path: string
  readonly title: string
  readonly content: string
  readonly frontmatter: Readonly<Record<string, unknown>>
  readonly tags: readonly string[]
  readonly headings: readonly HeadingDto[]
  readonly links: readonly NoteLinkDto[]
  /** `^block-id` markers, mapped to their 1-based line. */
  readonly blocks?: Readonly<Record<string, number>>
}

/** One file as the file viewer needs it. */
export interface FileDto {
  readonly path: string
  readonly name: string
  /** Lowercase extension without the dot; empty when the name has none. */
  readonly ext: string
  readonly kind: FileKind
  /** Badge and highlighter key for text files. */
  readonly language?: string
  readonly mime: string
  readonly size: number
  /** Epoch milliseconds when the Host could stat the file. */
  readonly mtime?: number
  /** Text prefix for Markdown and whitelisted code; absent for images, PDFs, and binaries. */
  readonly text?: string
  /** True when the text above is a prefix of a larger file. */
  readonly truncated: boolean
}

/** One entry of the explorer tree. */
export interface TreeNodeDto {
  readonly name: string
  readonly path: string
  readonly kind: 'dir' | 'file'
  /** Epoch milliseconds, when the host could read it. */
  readonly mtime?: number
  /** Bytes, for files. */
  readonly size?: number
  readonly children?: readonly TreeNodeDto[]
}

/** Index freshness and vault identity. */
export interface StatusDto {
  readonly ready: boolean
  readonly root: string
  readonly notes: number
  readonly version: number
  readonly error?: string
}

/** One registered vault. */
export interface VaultDto {
  readonly id: string
  readonly path: string
  readonly name: string
  /** Epoch milliseconds of the last activation. */
  readonly lastOpenedAt: number
  /** Present only for the vault the index currently serves. */
  readonly active?: boolean
}

/** Registry snapshot for the vault manager. */
export interface VaultListDto {
  readonly activeId?: string
  readonly vaults: readonly VaultDto[]
}

/** Answer to opening or creating a vault. */
export interface VaultOpenDto {
  readonly vault: VaultDto
  /** False when the directory has no `.obsidian` folder. */
  readonly configured: boolean
}

/** Probe of a candidate vault directory, before any activation. */
export interface VaultInspectDto {
  readonly path: string
  readonly exists: boolean
  readonly configured: boolean
  readonly registered: boolean
  /** Directory basename, the default display name. */
  readonly name: string
}

/** The `.obsidian` JSON files this plugin reads and writes. */
export type ObsidianConfigFile =
  | 'app'
  | 'graph'
  | 'appearance'
  | 'core-plugins'
  | 'hotkeys'
  | 'daily-notes'
  | 'templates'
  | 'bookmarks'
  | 'plugins-bridge'

/** One configuration file as stored under `.obsidian`. */
export interface ObsidianConfigDto {
  readonly file: ObsidianConfigFile
  /** The parsed document, or `null` when the file is absent or unreadable. */
  readonly value: unknown
}

/** One DSH-adapted plugin folder from the package-global folder. */
export interface PluginDto {
  readonly id: string
  readonly name: string
  readonly version?: string
  readonly author?: string
  readonly description?: string
}

/** One built-in plugin with the enablement `.obsidian` records. */
export interface CorePluginDto {
  readonly id: string
  readonly enabled: boolean
}

/** Plugin inventory of the active vault. */
export interface PluginsDto {
  readonly core: readonly CorePluginDto[]
  /** DSH-adapted plugins from the package-global folder; display-only until the bridge ships. */
  readonly dsh: readonly PluginDto[]
  /** Absolute path of the global DSH plugin folder, inside the plugin package. */
  readonly dshFolder: string
  /** Obsidian plugins installed under the vault's `.obsidian/plugins`; read-only metadata. */
  readonly community: readonly PluginDto[]
}

/** One file the bridge's `vault.list` reports, for TFile construction in the frame. */
export interface BridgeFileDto {
  readonly path: string
  readonly name: string
  /** Lowercase extension without the dot; '' for extensionless names. */
  readonly extension: string
  readonly size: number
  readonly mtime: number
  readonly ctime: number
}

/** One link that points at the queried note. */
export interface BacklinkDto {
  readonly path: string
  readonly title: string
  /** 1-based source line. */
  readonly line: number
  readonly context: string
}

/** One index hit. */
export interface SearchHitDto {
  readonly path: string
  readonly title: string
  readonly kind: 'title' | 'alias' | 'tag' | 'path' | 'content'
  readonly snippet?: string
}

/** One tag with its note count. */
export interface TagCountDto {
  readonly tag: string
  readonly count: number
}

/** What a graph node stands for. */
export type GraphNodeKind = 'note' | 'unresolved' | 'attachment' | 'tag'

/** One graph node; `depth` counts hops from the center. */
export interface GraphNodeDto {
  readonly path: string
  readonly title: string
  readonly depth: number
  /** Omitted means `note`. */
  readonly kind?: GraphNodeKind
  /** Tags of a note node, used by client-side group matching. */
  readonly tags?: readonly string[]
}

/** One undirected link edge. */
export interface GraphEdgeDto {
  readonly source: string
  readonly target: string
}

/** A local or global link graph. */
export interface GraphDto {
  readonly nodes: readonly GraphNodeDto[]
  readonly edges: readonly GraphEdgeDto[]
}

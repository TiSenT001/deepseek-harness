/**
 * File-type registry shared by the Host and the browser half: it decides which
 * view opens one vault path, which text files the code view may show, and the
 * language badge the highlighter uses. Unknown extensions stay binary.
 * @module dsh-obsidian-vault/filetypes
 */

/** View one vault path opens. */
export type FileKind = 'markdown' | 'image' | 'pdf' | 'code' | 'canvas' | 'binary'

/** Registry entry for one extension. */
export interface FileTypeSpec {
  readonly kind: FileKind
  /** Badge and tokenizer key; absent for images, PDFs, and binaries. */
  readonly language?: string
  readonly mime: string
  /** Extensions the explorer shows with a preview instead of a download row. */
  readonly previewable: boolean
}

const IMAGE_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  ico: 'image/x-icon',
}

const TEXT_TYPES: Readonly<Record<string, string>> = {
  txt: 'text',
  log: 'text',
  csv: 'csv',
  tsv: 'csv',
  json: 'json',
  jsonc: 'json',
  jsonl: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  properties: 'ini',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  pyi: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  c: 'c',
  h: 'cpp',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  ps1: 'powershell',
  bat: 'batch',
  cmd: 'batch',
  sql: 'sql',
  lua: 'lua',
  swift: 'swift',
  dart: 'dart',
  vue: 'vue',
  svelte: 'svelte',
  gradle: 'groovy',
  tex: 'latex',
}

const MARKDOWN_TYPES = new Set(['md', 'markdown', 'mdown'])

const BINARY: FileTypeSpec = { kind: 'binary', mime: 'application/octet-stream', previewable: false }

/**
 * Lowercase extension of one path, without the dot.
 * @param path - vault-relative path with `/` separators.
 * @returns the extension, or an empty string for a name with no dot or a dotfile.
 */
export function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  return name.slice(dot + 1).toLowerCase()
}

/**
 * Registry lookup for one path.
 * @param path - vault-relative path.
 * @returns the matching entry; unknown extensions are binary.
 */
export function fileTypeOf(path: string): FileTypeSpec {
  const extension = extensionOf(path)
  if (MARKDOWN_TYPES.has(extension)) {
    return { kind: 'markdown', language: 'markdown', mime: 'text/markdown; charset=utf-8', previewable: true }
  }
  const image = IMAGE_TYPES[extension]
  if (image !== undefined) return { kind: 'image', mime: image, previewable: true }
  if (extension === 'pdf') return { kind: 'pdf', mime: 'application/pdf', previewable: true }
  if (extension === 'canvas') return { kind: 'canvas', mime: 'text/plain; charset=utf-8', previewable: true }
  const language = TEXT_TYPES[extension]
  if (language !== undefined) {
    return { kind: 'code', language, mime: 'text/plain; charset=utf-8', previewable: true }
  }
  return BINARY
}

/**
 * Whether the explorer should list one attachment.
 * @param path - vault-relative path.
 * @returns true for images, PDFs, and whitelisted text files.
 */
export function isPreviewableFile(path: string): boolean {
  return fileTypeOf(path).previewable
}

const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  pyi: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  kts: 'kotlin',
  cs: 'csharp',
  'c++': 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  mdown: 'markdown',
  jsonc: 'json',
  json5: 'json',
  ps1: 'powershell',
  bat: 'batch',
  cmd: 'batch',
  tex: 'latex',
  text: 'text',
  plaintext: 'text',
  plain: 'text',
  none: 'text',
}

/**
 * Normalize a fence or data attribute into a tokenizer language key.
 * @param value - author-written language name or extension.
 * @returns the registry key, or undefined when absent.
 */
export function normalizeLanguage(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const key = value.trim().toLowerCase()
  if (key.length === 0) return undefined
  return LANGUAGE_ALIASES[key] ?? key
}

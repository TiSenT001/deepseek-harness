/**
 * Adapter-facing contracts: the effect sink every host implements and the menu
 * host operations the kernel cannot perform itself.
 * @module dsh-obsidian-vault/pur-kernel/adapter-types
 */
import type { PurElement } from './types.ts'

/** What an adapter performs when the kernel reports effects, in order. */
export interface PurEffectSink {
  /** Repaint the canvas. */
  render(): void
  /** Persist the document. */
  save(): void
  /** Show a transient message. */
  notice(text: string): void
  /** Set the canvas CSS cursor. */
  setCursor(cursor: string): void
  /** Open a vault path or URL in the current tab. */
  openLink(target: string): void
  /** Open the text/code-node editor. */
  editText(id: string): void
  /** Open the group-label editor. */
  editGroup(id: string): void
  /** Open the line-label editor. */
  editLine(id: string): void
  /** Open the note-link editor. */
  editNoteLink(id: string): void
  /** Open the context menu at a viewport point. */
  showContextMenu(clientX: number, clientY: number): void
  /** Run the export-as-text flow. */
  exportText(): void
}

/** A world-space point, for menu commands that create elements. */
export interface PurMenuPoint {
  /** World x. */
  x: number
  /** World y. */
  y: number
}

/** Where an open request goes. */
export type PurOpenDestination = 'current' | 'new-tab' | 'right'

/** Host operations the menu model triggers that the kernel cannot perform. */
export interface PurMenuHost {
  /** Localized title of a code-node preset. @param presetId - the preset id. @returns the title. */
  presetTitle(presetId: string): string
  /** Create a fresh canvas document. */
  newCanvas(): void
  /** Open the note picker and insert a note-link card at the point. */
  addNoteLink(at: PurMenuPoint): void
  /** Import a local image file at the point. */
  importLocal(at: PurMenuPoint): void
  /** Import a YAML/IR file at the point. */
  importIr(at: PurMenuPoint): void
  /** Import a PureRef \.pur\ document at one canvas point. */
  importPur(at: PurMenuPoint): void
  /** Import a JSON Canvas file at the point. */
  importCanvas(at: PurMenuPoint): void
  /** Import from a remote URL at the point. */
  importNet(at: PurMenuPoint): void
  /** Save the document under a new name. */
  savePur(): void
  /** Export the canvas as a Markdown outline. */
  exportMarkdown(): void
  /** Generate runnable code. @param format - the target language. */
  generateCode(format: 'js' | 'py'): void
  /** Export a canvas bitmap. @param format - the image format. */
  exportImage(format: 'png' | 'jpg'): void
  /** Export a JSON Canvas document. */
  exportCanvasDocument(): void
  /** Toggle the popout window. */
  togglePopout(): void
  /** Toggle always-on-top. */
  togglePinTop(): void
  /** Open an element's link target. */
  openLink(target: string, destination: PurOpenDestination): void
  /** Jump to the note that embeds this image, when one does. */
  openEmbeddingNote(element: PurElement): void
  /** Open one plugin-owned image asset for preview. */
  openAsset(id: string, destination: PurOpenDestination): void
  /** Insert one saved snippet as a new code node. */
  insertCodeSnippet(id: string, at: PurMenuPoint): void

  /** Remove one snippet from the library. */
  deleteCodeSnippet(id: string): void

  /** Save one code node into the snippet library, asking for its title. */
  saveCodeSnippet(elementId: string): void

  /** Hand one file to a desktop program; ids come from the host fixed list. */
  openFileWith(target: string, program: string): void
  /** Copy the element's link or image source to the clipboard. */
  copyLinkOf(element: PurElement): void
  /** Reveal the element's target in the file explorer. */
  revealInExplorer(element: PurElement): void
  /** Embed the image element in the active markdown note. */
  embedInActiveNote(element: PurElement): void
  /** Prompt for the note an image or group links to; `modify` pre-fills. */
  promptElementLink(element: PurElement, mode: 'link' | 'modify'): void
  /** Open the text/code-node editor. */
  editText(id: string): void
  /** Open the group-label editor. */
  editGroup(id: string): void
  /** Open the line-label editor. */
  editLine(id: string): void
  /** Open the note-link editor. */
  editNoteLink(id: string): void
}

/** One dispatched menu action. */
export interface PurMenuAction {
  /** The entry id, including any `prefix:parameter` suffix. */
  id: string
  /** Menu origin in world coordinates, for creation commands. */
  world: PurMenuPoint
  /** Element the menu was opened on, when there is one. */
  targetId?: string
  /** Committed value, for the opacity entry. */
  value?: number
}

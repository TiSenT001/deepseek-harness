/**
 * Runtime bridge to the shell-shared Markdown renderer. The bundle externalizes
 * these module-table identities, so the plugin carries no second renderer.
 * @module dsh-obsidian-vault/client/primitives
 */
import type { ReactNode } from 'react'

declare const require: (id: string) => unknown

/** Localized chrome the shared renderer reads. */
export interface MarkdownLabels {
  readonly code: { readonly copyLabel: string; readonly copiedLabel: string }
  readonly footnotes: string
}

/** Props the shared renderer accepts for settled documents. */
export interface MarkdownTextProps {
  readonly text: string
  readonly labels: MarkdownLabels
  readonly variant?: 'body' | 'compact'
}

/** Navigation capabilities the shared renderer reads from its provider. */
export interface MarkdownDelegateProps {
  readonly children: ReactNode
  readonly openExternalLink?: ((href: string) => void) | undefined
  readonly openFile?: ((path: string, options?: { readonly line?: number }) => void) | undefined
}

interface PrimitivesModule {
  readonly MarkdownText: (props: MarkdownTextProps) => ReactNode
  readonly MarkdownDelegateProvider: (props: MarkdownDelegateProps) => ReactNode
}

const primitives = require('@deepseek-ai/dsh-client-ui-primitives') as PrimitivesModule

/** The GFM document renderer shared with the rest of the GUI. */
export const MarkdownText = primitives.MarkdownText

/** The navigation scope the renderer consults for link activation. */
export const MarkdownDelegateProvider = primitives.MarkdownDelegateProvider

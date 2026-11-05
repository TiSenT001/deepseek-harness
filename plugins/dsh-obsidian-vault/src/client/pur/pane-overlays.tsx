/**
 * Overlay stack of the React Pur pane: the context menu with its opacity
 * slider, the four element editors, the one-line prompt, the note picker,
 * and the transient notice toast.
 * @module dsh-obsidian-vault/client/pur/pane-overlays
 */
import type React from 'react'
import { runMenuAction } from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurMenuAction, PurMenuHost } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'
import { PurGroupEditor, PurLineEditor, PurNoteLinkEditor, PurTextEditor } from './editors.tsx'
import type { PurEditorProps } from './editors.tsx'
import type { CodeSnippetDto } from '../api.ts'
import { PurContextMenu } from './menu.tsx'
import type { PurMenuState } from './menu.tsx'
import { PurNotePicker, PurPrompt } from './picker.tsx'
import type { PurEditorKind } from './sink.ts'

/** An open element editor overlay. */
export interface PurEditorState {
  /** Which editor. */
  readonly kind: PurEditorKind
  /** The target element id. */
  readonly id: string
}

/** An open one-line prompt. */
export interface PurPromptState {
  /** Dialog heading. */
  readonly title: string
  /** Initial input value. */
  readonly initial: string
  /** Settle the prompt; null means dismissed. */
  readonly resolve: (value: string | null) => void
}

/** An open note picker. */
export interface PurPickerState {
  /** Settle the picker with a vault path; null means dismissed. */
  readonly resolve: (path: string | null) => void
}

/** The toast's inline look; the theme has no notice primitive. */
const NOTICE_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 16,
  transform: 'translateX(-50%)',
  background: 'rgba(30,30,30,0.9)',
  color: '#e0e0e0',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 12,
  pointerEvents: 'none',
}

/** Props for {@link PurPaneOverlays}. */
export interface PurPaneOverlaysProps {
  /** The workspace translator. */
  readonly t: Translate
  /** Localized label bundles. */
  readonly labels: PurLabelBundles
  /** The open context menu, if any. */
  readonly menu: PurMenuState | null
  /** The open editor, if any. */
  readonly editor: PurEditorState | null
  /** The open prompt, if any. */
  readonly prompt: PurPromptState | null
  /** The open note picker, if any. */
  readonly picker: PurPickerState | null
  /** The transient notice text, if any. */
  readonly notice: string | null
  /** Saved snippets the editors can insert or extend. */
  readonly snippets: readonly CodeSnippetDto[]
  /** Store a snippet shaped from an editor draft; absent where the pane cannot write. */
  readonly onSaveSnippet?: (snippet: CodeSnippetDto) => Promise<boolean>
  /** The controller, null before the document loads. @returns the controller. */
  readonly controller: () => PurController | null
  /** The menu dispatch host. */
  readonly menuHost: PurMenuHost
  /** Drain controller effects into the pane's sink. */
  readonly run: (effects: readonly PurControllerEffect[]) => void
  /** Close the context menu. */
  readonly closeMenu: () => void
  /** Close the editor. */
  readonly closeEditor: () => void
  /** Close the prompt. */
  readonly closePrompt: () => void
  /** Close the note picker. */
  readonly closePicker: () => void
}

/**
 * Render every overlay the pane can open, in stacking order.
 * @param props - overlay state, the controller getter, and close callbacks.
 */
export function PurPaneOverlays(props: PurPaneOverlaysProps): JSX.Element {
  const { t, labels, menu, editor, prompt, picker, notice, controller, menuHost, run, closeMenu, closeEditor, closePrompt, closePicker } = props
  const onMenuAction = (id: string, value?: number): void => {
    const active = controller()
    if (active === null || menu === null) return
    const action: PurMenuAction = { id, world: menu.world }
    if (menu.targetId !== undefined) action.targetId = menu.targetId
    if (value !== undefined) action.value = value
    run(runMenuAction(active, menuHost, action))
  }
  const editorElement = (state: PurEditorState): JSX.Element | null => {
    const active = controller()
    if (active === null) return null
    const editorProps: PurEditorProps = {
      t,
      controller: active,
      id: state.id,
      run,
      onClose: closeEditor,
      snippets: props.snippets,
      ...(props.onSaveSnippet === undefined ? {} : { onSaveSnippet: props.onSaveSnippet }),
    }
    if (state.kind === 'text') return <PurTextEditor {...editorProps} />
    if (state.kind === 'group') return <PurGroupEditor {...editorProps} />
    if (state.kind === 'line') return <PurLineEditor {...editorProps} />
    return <PurNoteLinkEditor {...editorProps} />
  }
  return (
    <>
      {menu !== null ? (
        <PurContextMenu
          state={menu}
          labels={labels}
          onAction={onMenuAction}
          onPreviewOpacity={(value) => {
            const active = controller()
            if (active !== null) run(active.setOpacity(value, 'preview'))
          }}
          onClose={closeMenu}
        />
      ) : null}
      {editor !== null ? editorElement(editor) : null}
      {prompt !== null ? (
        <PurPrompt
          t={t}
          title={prompt.title}
          initial={prompt.initial}
          resolve={(value) => {
            prompt.resolve(value)
            closePrompt()
          }}
        />
      ) : null}
      {picker !== null ? (
        <PurNotePicker
          t={t}
          resolve={(picked) => {
            picker.resolve(picked)
            closePicker()
          }}
        />
      ) : null}
      {notice !== null ? <div style={NOTICE_STYLE}>{notice}</div> : null}
    </>
  )
}

/**
 * In-app replacements for `window.prompt` and `window.confirm`. Embedded
 * webviews block the native dialogs (they resolve to null immediately), which
 * made rename, delete and the create commands look broken. This hook returns
 * the same promise contract so call sites keep their shape.
 * @module dsh-obsidian-vault/client/ui/useAsk
 */
import { useCallback, useState, type ReactNode } from 'react'
import type { Translate } from '../i18n.ts'
import { AskDialog } from './AskDialog.tsx'
import type { AskRequest } from './AskDialog.tsx'

/** Prompt and confirm, plus the element that renders the pending request. */
export interface Ask {
  /** Ask for one line of text; resolves null when dismissed. */
  readonly askText: (title: string, initial?: string) => Promise<string | null>
  /** Ask for a yes/no decision. */
  readonly askConfirm: (message: string) => Promise<boolean>
  /** The dialog element, or null while nothing is pending. */
  readonly node: ReactNode
}

/**
 * Wire the dialog state behind {@link Ask}.
 * @param t - translator for the buttons.
 * @returns the ask functions and their element.
 */
export function useAsk(t: Translate): Ask {
  const [request, setRequest] = useState<AskRequest | null>(null)

  const askText = useCallback(
    (title: string, initial = ''): Promise<string | null> =>
      new Promise((resolve) => {
        setRequest({ kind: 'text', title, initial, resolve })
      }),
    [],
  )

  const askConfirm = useCallback(
    (message: string): Promise<boolean> =>
      new Promise((resolve) => {
        setRequest({ kind: 'confirm', title: message, resolve })
      }),
    [],
  )

  const close = useCallback((value: string | null | boolean): void => {
    setRequest((current) => {
      if (current !== null) current.resolve(value as never)
      return null
    })
  }, [])

  return {
    askText,
    askConfirm,
    node: request === null
      ? null
      : (
        <AskDialog
          t={t}
          request={request}
          onCancel={() => close(request.kind === 'confirm' ? false : null)}
          onSubmit={(value) => close(request.kind === 'confirm' ? true : value)}
        />
      ),
  }
}

/**
 * The shared ask dialog: in-app replacements for `window.prompt` and
 * `window.confirm`. Embedded webviews block the native dialogs (they resolve to
 * null immediately), which made rename, delete and the create commands look
 * broken. Living in the kit keeps both the vault workspace and the canvas pane on
 * one dialog without either side importing the other's internals.
 * @module dsh-obsidian-vault/client/ui/kit/ask
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Translate } from '../../i18n.ts'
import { css } from './classes.ts'

/** One pending request: a text field, or a yes/no question. */
export type AskRequest =
  | { readonly kind: 'text'; readonly title: string; readonly initial: string; readonly resolve: (value: string | null) => void }
  | { readonly kind: 'confirm'; readonly title: string; readonly resolve: (value: boolean) => void }

/** Prompt and confirm, plus the element that renders the pending request. */
export interface Ask {
  /** Ask for one line of text; resolves null when dismissed. */
  readonly askText: (title: string, initial?: string) => Promise<string | null>
  /** Ask for a yes/no decision. */
  readonly askConfirm: (message: string) => Promise<boolean>
  /** The dialog element, or null while nothing is pending. */
  readonly node: ReactNode
}

/** Props for {@link AskDialog}. */
export interface AskDialogProps {
  readonly t: Translate
  readonly request: AskRequest
  readonly onSubmit: (value: string) => void
  readonly onCancel: () => void
}

/**
 * Render the pending request.
 * @param props - the request and its settle callbacks.
 */
export function AskDialog({ t, request, onSubmit, onCancel }: AskDialogProps): JSX.Element {
  const [value, setValue] = useState(request.kind === 'text' ? request.initial : '')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const submit = (): void => {
    if (request.kind === 'text' && value.trim().length === 0) {
      onCancel()
      return
    }
    onSubmit(value)
  }

  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          submit()
        }
      }}
    >
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={request.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{request.title}</span>
        </header>
        <div className={css.dialogBody}>
          {request.kind === 'text'
            ? (
              <input
                ref={inputRef}
                className={css.dialogInput}
                value={value}
                aria-label={request.title}
                onChange={(event) => setValue(event.target.value)}
              />
            )
            : null}
          <div className={css.dialogActions}>
            <button type="button" className={css.dialogButton} onClick={onCancel}>
              {t('cancel')}
            </button>
            <button type="button" className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()} onClick={submit}>
              {t('ok')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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

/**
 * The one dialog the vault workspace uses for text entry and confirmation:
 * create note, create folder, rename and delete. Rendered by {@link useAsk}.
 * @module dsh-obsidian-vault/client/ui/AskDialog
 */
import { useEffect, useRef, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { css } from './theme.ts'

/** One pending request: a text field, or a yes/no question. */
export type AskRequest =
  | { readonly kind: 'text'; readonly title: string; readonly initial: string; readonly resolve: (value: string | null) => void }
  | { readonly kind: 'confirm'; readonly title: string; readonly resolve: (value: boolean) => void }

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

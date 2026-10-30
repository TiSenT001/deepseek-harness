/**
 * One Obsidian callout: a typed, optionally collapsible aside.
 * @module dsh-obsidian-vault/client/ui/Callout
 */
import type { ReactNode } from 'react'
import type { CalloutType } from '../markdown/callouts.ts'
import { css } from './theme.ts'

/** Default titles for callouts authored without one. */
const TITLES: Readonly<Record<CalloutType, string>> = {
  note: 'Note',
  abstract: 'Abstract',
  summary: 'Summary',
  tldr: 'TL;DR',
  info: 'Info',
  todo: 'Todo',
  tip: 'Tip',
  hint: 'Hint',
  important: 'Important',
  success: 'Success',
  check: 'Check',
  done: 'Done',
  question: 'Question',
  help: 'Help',
  faq: 'FAQ',
  warning: 'Warning',
  caution: 'Caution',
  attention: 'Attention',
  failure: 'Failure',
  fail: 'Fail',
  missing: 'Missing',
  danger: 'Danger',
  error: 'Error',
  bug: 'Bug',
  example: 'Example',
  quote: 'Quote',
  cite: 'Cite',
}

/** Props for {@link Callout}. */
export interface CalloutProps {
  readonly type: CalloutType
  readonly title: string
  readonly foldable: boolean
  readonly folded: boolean
  readonly children: ReactNode
}

/**
 * Render one callout block.
 * @param props - the callout kind, its title, fold state, and body.
 */
export function Callout({ type, title, foldable, folded, children }: CalloutProps): JSX.Element {
  const label = title.length > 0 ? title : TITLES[type]
  const head = (
    <span className={css.calloutTitle}>
      <span className={css.calloutMark} aria-hidden="true" />
      {label}
    </span>
  )
  if (foldable) {
    return (
      <details className={css.callout} data-callout={type} open={!folded}>
        <summary className={css.calloutHead}>{head}</summary>
        <div className={css.calloutBody}>{children}</div>
      </details>
    )
  }
  return (
    <div className={css.callout} data-callout={type}>
      <div className={css.calloutHead}>{head}</div>
      <div className={css.calloutBody}>{children}</div>
    </div>
  )
}

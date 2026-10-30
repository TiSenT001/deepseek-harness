/**
 * The three shared surface states: empty, loading, and failed. Every pane uses
 * these so placeholders, skeletons, and error copy look and behave the same.
 * @module dsh-obsidian-vault/client/ui/kit/states
 */
import { Icon, type IconName } from '../Icon.tsx'
import { css } from './classes.ts'

/** Props for {@link EmptyState}. */
export interface EmptyStateProps {
  readonly title: string
  readonly hint?: string
  readonly icon?: IconName
  /** Optional primary action rendered under the hint. */
  readonly action?: { readonly label: string; readonly onSelect: () => void }
}

/**
 * Render the shared empty state.
 * @param props - title, optional hint, icon, and action.
 */
export function EmptyState({ title, hint, icon, action }: EmptyStateProps): JSX.Element {
  return (
    <div className={css.state}>
      {icon === undefined ? null : <span className={css.stateIcon}><Icon name={icon} size={22} /></span>}
      <div className={css.stateTitle}>{title}</div>
      {hint === undefined ? null : <div className={css.stateHint}>{hint}</div>}
      {action === undefined
        ? null
        : (
          <button type="button" className={css.stateAction} onClick={action.onSelect}>
            {action.label}
          </button>
        )}
    </div>
  )
}

/** Props for {@link LoadingState}. */
export interface LoadingStateProps {
  /** Line widths in percent; the defaults read as a short paragraph. */
  readonly lines?: readonly number[]
  readonly label?: string
}

/**
 * Render the shared skeleton.
 * @param props - placeholder line widths and an accessible label.
 */
export function LoadingState({ lines = [92, 68, 84, 56, 76, 40], label }: LoadingStateProps): JSX.Element {
  return (
    <div className={css.skeleton} aria-busy="true" aria-label={label}>
      {lines.map((width, index) => (
        <div key={index} className={css.skeletonLine} style={{ width: `${width}%` }} />
      ))}
    </div>
  )
}

/** Props for {@link ErrorState}. */
export interface ErrorStateProps {
  readonly message: string
  readonly retryLabel?: string
  readonly onRetry?: () => void
}

/**
 * Render the shared failure banner.
 * @param props - the message and an optional retry action.
 */
export function ErrorState({ message, retryLabel, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <div className={css.errorState} role="alert">
      <span className={css.errorMessage}>{message}</span>
      {onRetry === undefined || retryLabel === undefined
        ? null
        : (
          <button type="button" className={css.errorAction} onClick={onRetry}>
            {retryLabel}
          </button>
        )}
    </div>
  )
}

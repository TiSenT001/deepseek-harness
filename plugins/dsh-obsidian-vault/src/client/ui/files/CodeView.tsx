/**
 * Code view: language badge, line numbers, highlighted source, a copy action,
 * and notices for a truncated file or a capped line count.
 * @module dsh-obsidian-vault/client/ui/files/CodeView
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Translate } from '../../i18n.ts'
import { normalizeLanguage } from '../../../filetypes.ts'
import { css } from '../theme.ts'
import { tokenClass } from './highlight.ts'
import { tokenizeLines } from './tokenize.ts'

/** Rendered rows before the view stops mounting lines. */
const LINE_CAP = 6000

/** Props for {@link CodeView}. */
export interface CodeViewProps {
  readonly t: Translate
  readonly text: string
  readonly language: string | undefined
  readonly truncated?: boolean
  /** Extra header actions, such as the Markdown source toggle. */
  readonly action?: ReactNode
}

/**
 * Render highlighted source with a line gutter.
 * @param props - source text, its language, and optional header actions.
 */
export function CodeView({ t, text, language, truncated = false, action }: CodeViewProps): JSX.Element {
  const [copied, setCopied] = useState(false)
  const normalized = normalizeLanguage(language)
  const lines = useMemo(() => tokenizeLines(text, normalized), [text, normalized])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  const visible = Math.min(lines.length, LINE_CAP)
  const bytes = new TextEncoder().encode(text).length

  return (
    <div className={css.codeView}>
      <div className={css.codeHead}>
        <span className={css.codeLang}>{normalized ?? t('filePlainText')}</span>
        <span className={css.codeMeta}>{lines.length} {t('lines')} · {formatBytes(bytes)}</span>
        <span className={css.codeActions}>
          {action}
          <button
            type="button"
            className={css.button}
            aria-label={t('copyLabel')}
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => undefined)
            }}
          >
            {copied ? t('copiedLabel') : t('copyLabel')}
          </button>
        </span>
      </div>
      {truncated ? <div className={css.codeNotice}>{t('fileTruncated')}</div> : null}
      {lines.length > visible ? (
        <div className={css.codeNotice}>{t('fileLineCap')} {visible} {t('lines')}</div>
      ) : null}
      <div className={css.codeBody} role="region" aria-label={t('fileSource')}>
        {lines.slice(0, visible).map((tokens, index) => (
          <div key={index} className={css.codeLine}>
            <span className={css.codeLineNo} aria-hidden="true">{index + 1}</span>
            <span className={css.codeText}>
              {tokens.length === 0
                ? '\n'
                : tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={tokenClass(token.kind)}>{token.text}</span>
                ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Human-readable byte size.
 * @param bytes - size in bytes.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

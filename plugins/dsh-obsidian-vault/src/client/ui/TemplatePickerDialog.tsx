/**
 * New-note-from-template dialog: pick a note under `模板/`, name the result and
 * create it with the template body already filled in.
 * @module dsh-obsidian-vault/client/ui/TemplatePickerDialog
 */
import { useState } from 'react'
import type { Translate } from '../i18n.ts'
import type { TemplateNote } from './templates.ts'
import { Icon } from './Icon.tsx'
import { Select } from './kit/select.tsx'
import { css } from './theme.ts'

/** Props for {@link TemplatePickerDialog}. */
export interface TemplatePickerDialogProps {
  readonly t: Translate
  readonly templates: readonly TemplateNote[]
  readonly onCreate: (templatePath: string, title: string) => void
  readonly onClose: () => void
}

/**
 * Render the template picker.
 * @param props - available templates, the create callback, and close.
 */
export function TemplatePickerDialog({ t, templates, onCreate, onClose }: TemplatePickerDialogProps): JSX.Element {
  const first = templates[0]
  const [templatePath, setTemplatePath] = useState(first?.path ?? '')
  const [title, setTitle] = useState(first?.name ?? '')
  const trimmed = title.trim()

  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className={`${css.dialog} ${css.templateDialog}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('newFromTemplate')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('newFromTemplate')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          {templates.length === 0
            ? <p className={css.templateEmpty}>{t('noTemplates')}</p>
            : (
              <>
                <div className={css.templateField}>
                  <span className={css.templateLabel}>{t('template')}</span>
                  <Select
                    value={templatePath}
                    options={templates.map(template => ({ value: template.path, label: template.name }))}
                    ariaLabel={t('template')}
                    onChange={(path) => {
                      setTemplatePath(path)
                      const picked = templates.find(template => template.path === path)
                      if (picked !== undefined) setTitle(picked.name)
                    }}
                  />
                </div>
                <div className={css.templateField}>
                  <span className={css.templateLabel}>{t('templateTitle')}</span>
                  <input
                    className={css.dialogInput}
                    value={title}
                    aria-label={t('templateTitle')}
                    onChange={event => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && templatePath.length > 0 && trimmed.length > 0) {
                        event.preventDefault()
                        onCreate(templatePath, trimmed)
                      }
                    }}
                  />
                </div>
                <div className={css.dialogActions}>
                  <button type="button" className={css.dialogButton} onClick={onClose}>{t('cancel')}</button>
                  <button
                    type="button"
                    className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
                    disabled={templatePath.length === 0 || trimmed.length === 0}
                    onClick={() => onCreate(templatePath, trimmed)}
                  >
                    {t('newNote')}
                  </button>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  )
}

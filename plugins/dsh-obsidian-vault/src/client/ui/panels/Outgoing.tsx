/**
 * Outgoing-links panel: the wikilinks this note points at, split into resolved
 * targets and unresolved links that still need a note.
 * @module dsh-obsidian-vault/client/ui/panels/Outgoing
 */
import type { NoteDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { uniqueLinks } from './outgoing-links.ts'
import { css } from '../theme.ts'

function outgoing(
  t: Translate,
  note: NoteDto | undefined,
  onOpen: (path: string) => void,
  onCreate?: (target: string) => void,
): JSX.Element {
  return <OutgoingPanel t={t} note={note} onOpen={onOpen} {...(onCreate === undefined ? {} : { onCreate })} />
}

/**
 * Render the outgoing-links panel.
 * @param props - the active note, the open callback, and the create callback.
 */
function OutgoingPanel({
  t, note, onOpen, onCreate,
}: {
  readonly t: Translate
  readonly note: NoteDto | undefined
  readonly onOpen: (path: string) => void
  readonly onCreate?: (target: string) => void
}): JSX.Element {
  if (note === undefined) return <div className={css.empty}>{t('noLinksOut')}</div>
  const { resolved, unresolved } = uniqueLinks(note.links)
  if (resolved.length === 0 && unresolved.length === 0) return <div className={css.empty}>{t('noLinksOut')}</div>
  return (
    <>
      {resolved.length === 0
        ? null
        : (
          <>
            <div className={css.sectionTitle}>{t('resolvedLinks')} · {resolved.length}</div>
            {resolved.map(link => (
              <button
                key={link.path}
                type="button"
                className={css.item}
                title={`${link.path}\nL${link.line}`}
                onClick={() => link.path !== undefined && onOpen(link.path)}
              >
                <span className={css.backlinkName}>{link.label}</span>
                <div className={css.itemMeta}>{link.path}</div>
              </button>
            ))}
          </>
        )}
      {unresolved.length === 0
        ? null
        : (
          <>
            <div className={css.sectionTitle}>{t('unresolvedLinks')} · {unresolved.length}</div>
            {unresolved.map(link => (
              <button
                key={link.target}
                type="button"
                className={`${css.item} ${css.unresolved}`.trim()}
                title={`${link.target}\nL${link.line}`}
                onClick={() => onCreate?.(link.target)}
              >
                <span className={css.backlinkName}>{link.label}</span>
              </button>
            ))}
          </>
        )}
    </>
  )
}

export { outgoing as renderOutgoing }

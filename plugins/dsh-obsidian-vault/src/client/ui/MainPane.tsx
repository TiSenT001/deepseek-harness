/**
 * The main column: the error banner plus whichever surface owns the reading
 * area — graph, empty state, loading state, reading view, or the file viewer.
 * @module dsh-obsidian-vault/client/ui/MainPane
 */
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import type { MarkdownLabels } from '../primitives.ts'
import type { Translate } from '../i18n.ts'
import { ErrorState, LoadingState } from './kit/index.ts'
import { FileView } from './files/FileView.tsx'
import { GraphView } from './GraphView.tsx'
import { NoteView, type ElementRef } from './NoteView.tsx'
import { VaultEmptyState, type VaultEmptyAction } from './VaultEmptyState.tsx'
import type { MenuScene } from './menu/registry.ts'
import { css } from './theme.ts'

/** Props for {@link MainPane}. */
export interface MainPaneProps {
  readonly t: Translate
  readonly labels: MarkdownLabels
  readonly view: 'note' | 'graph'
  readonly path: string | undefined
  /** Display name of the active vault, for the empty tab. */
  readonly vaultName?: string
  /** Cards shown while no tab is open. */
  readonly emptyActions?: readonly VaultEmptyAction[]
  /** Recently opened documents for the empty tab. */
  readonly recentPaths?: readonly string[]
  /** Open one recent document from the empty tab. */
  readonly onOpenRecent?: (path: string) => void
  /** Open the quick switcher from the empty tab's search row. */
  readonly onEmptySearch?: () => void
  readonly isMarkdown: boolean
  readonly note: NoteDto | undefined
  readonly sourceMode: boolean
  readonly error: string | undefined
  readonly scrollRef: ElementRef<HTMLDivElement>
  readonly anchor: string | undefined
  readonly backlinks: readonly BacklinkDto[]
  readonly version: number | undefined
  readonly onRetry: () => void
  /** Leave source mode for the same Markdown file. */
  readonly onReading: () => void
  /** Leave the graph for the note view. */
  readonly onSwitchToReading: () => void
  readonly onSource: () => void
  /** The source editor wrote the note; reload the index. */
  readonly onSaved: () => void
  readonly onOpen: (path: string, argument?: string) => void
  readonly onCreate: (target: string) => void
  readonly onTag: (tag: string) => void
  readonly onPathFilter: (prefix: string) => void
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  readonly onCenter: (path: string) => void
  readonly onCloseGraph: () => void
  /** Open the settings dialog; the plugin view offers it when bridging is off. */
  readonly onOpenSettings: () => void
}

/**
 * Render the reading area below the tab strip.
 * @param props - the selected path, its parsed note, and view callbacks.
 */
export function MainPane(props: MainPaneProps): JSX.Element {
  const {
    t, labels, view, path, vaultName, emptyActions, recentPaths, onOpenRecent, onEmptySearch, isMarkdown, note, sourceMode, error, scrollRef, anchor, backlinks,
    version, onRetry, onReading, onSwitchToReading, onSource, onSaved,
    onOpen, onCreate, onTag, onPathFilter, onMenu, onCenter,
    onCloseGraph, onOpenSettings,
  } = props

  return (
    <>
      {error === undefined
        ? null
        : (
          <ErrorState
            message={`${t('loadFailed')}: ${error}`}
            retryLabel={t('refresh')}
            onRetry={onRetry}
          />
        )}
      <main className={css.main}>
        {view === 'graph'
          ? (
            <GraphView
              t={t}
              center={path}
              version={version}
              onOpen={(next) => {
                onSwitchToReading()
                onOpen(next)
              }}
              onCenter={onCenter}
              onCreate={(target) => {
                onSwitchToReading()
                onCreate(target)
              }}
              onTag={onTag}
              onClose={onCloseGraph}
              onMenu={onMenu}
            />
          )
          : path === undefined
          // The ribbon, the top bar, and Ctrl+O already open the switcher.
          ? (
            <VaultEmptyState
              t={t}
              {...(vaultName === undefined ? {} : { vaultName })}
              actions={emptyActions ?? []}
              recent={recentPaths}
              onOpenRecent={onOpenRecent}
              onSearch={() => onEmptySearch?.()}
            />
          )
            : isMarkdown && note === undefined
            ? <LoadingState label={t('loadingIndex')} />
            : isMarkdown && note !== undefined && !sourceMode
            ? (
              <NoteView
                t={t}
                labels={labels}
                note={note}
                scrollRef={scrollRef}
                anchor={anchor}
                onOpen={onOpen}
                onCreate={onCreate}
                onTag={onTag}
                onPathFilter={onPathFilter}
                backlinks={backlinks}
                onMenu={onMenu}
                onSource={onSource}
              />
            )
            : (
              <FileView
                t={t}
                path={path}
                onSaved={onSaved}
                onOpenPath={onOpen}
                onMenu={onMenu}
                {...(isMarkdown ? { onReading } : {})}
              />
            )}
      </main>
    </>
  )
}

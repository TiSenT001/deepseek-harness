/**
 * One split pane: its own tab strip, scroll memory, and reading surface. The
 * active pane reads the page's shared note bundle; every other pane fetches
 * its own. Pressing anywhere in a pane focuses it before the click runs, so
 * the page's callbacks always apply to the pane the user touched.
 * @module dsh-obsidian-vault/client/ui/PaneColumn
 */
import { useEffect, useRef, useState } from 'react'
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import { fileTypeOf } from '../../filetypes.ts'
import { MainPane, type MainPaneProps } from './MainPane.tsx'
import type { PaneDropSide, PaneState } from './panes.ts'
import { activeTab } from './tabs.ts'
import { hasTabDrag, readTabDrag } from './tab-drag.ts'
import { TabStrip } from './TabStrip.tsx'
import { useNoteBundle } from './useNoteBundle.ts'
import { useScrollMemory } from './useScrollMemory.ts'
import { css } from './theme.ts'

/** Reading handlers the page routes through while a pane is mounted. */
export interface PaneHandlers {
  /** Scroll the pane's reading view to a heading. */
  readonly onHeading: (text: string) => void
  /** Forget the pane's remembered scroll offsets. */
  readonly clear: () => void
}

/** Reading-surface callbacks every pane forwards to the page. */
type PaneSurfaceCallbacks = Pick<
  MainPaneProps,
  | 'onRetry' | 'onReading' | 'onSwitchToReading' | 'onSource' | 'onSaved'
  | 'onOpen' | 'onCreate' | 'onTag' | 'onPathFilter' | 'onMenu' | 'onCenter'
  | 'onCloseGraph' | 'onOpenSettings' | 'emptyActions' | 'onEmptySearch'
>

/** Props for {@link PaneColumn}: the shared surface props plus pane routing. */
export interface PaneColumnProps extends PaneSurfaceCallbacks {
  readonly t: MainPaneProps['t']
  readonly labels: MainPaneProps['labels']
  /** Vault display name, shown by the empty tab. */
  readonly vaultName?: string
  /** Recently opened documents for the empty tab. */
  readonly recentPaths?: readonly string[]
  /** Open one recent document from the empty tab. */
  readonly onOpenRecent?: (path: string) => void
  readonly version: number | undefined
  /** The page's view toggle; only the active pane shows the graph or a plugin. */
  readonly view: MainPaneProps['view']
  readonly pane: PaneState
  /** Flex-grow applied to the pane: its size share normalized by the strip's
   * total, so the panes always fill the strip even when the model's shares no
   * longer sum to one. */
  readonly share: number
  readonly isActive: boolean
  /** The page's bundle for the active pane, already path-guarded. */
  readonly activeNote: NoteDto | undefined
  readonly activeBacklinks: readonly BacklinkDto[]
  /** Reveal anchor; applied only while this pane is active. */
  readonly anchor: string | undefined
  /** Source mode; applied only while this pane is active. */
  readonly sourceMode: boolean
  /** Page error; shown only while this pane is active. */
  readonly error: string | undefined
  readonly onActivate: () => void
  /** Register this pane's reading handlers; `undefined` unregisters. */
  readonly register: (id: number, handlers: PaneHandlers | undefined) => void
  /** Track the heading in view; only the active pane reports. */
  readonly onActiveHeading: (text: string | undefined) => void
  readonly onSelectTab: (index: number) => void
  readonly onCloseTab: (index: number) => void
  readonly onPinTab: (index: number) => void
  readonly onNewTab: () => void
  /** Move a tab within this pane or into another pane. */
  readonly onMoveTab: (fromPaneId: number, fromIndex: number, toPaneId: number, toIndex: number) => void
  /** Drop a tab on this pane's edge: split it and move the tab into the new pane. */
  readonly onSplitTab: (targetPaneId: number, sourcePaneId: number, sourceIndex: number, side: PaneDropSide) => void
}

const NOOP_HEADING = (): void => undefined

/** Highlight class for the edge currently receiving a dragged tab. */
const DROP_CLASS: Record<PaneDropSide, string> = {
  left: css.paneDropLeft,
  right: css.paneDropRight,
  top: css.paneDropTop,
  bottom: css.paneDropBottom,
}

/**
 * Render one pane of the split workspace.
 * @param props - the pane's tabs, its activity state, and the page callbacks.
 */
export function PaneColumn(props: PaneColumnProps): JSX.Element {
  const {
    pane, share, isActive, activeNote, activeBacklinks, anchor, sourceMode, error,
    onActivate, register, onActiveHeading,
    onSelectTab, onCloseTab, onPinTab, onNewTab, onMoveTab, onSplitTab,
  } = props
  const [dropSide, setDropSide] = useState<PaneDropSide | undefined>()
  const tabPath = activeTab(pane.tabs)?.path
  /** The empty new-tab page has no path, so every file feature stays off. */
  const path = tabPath === '' ? undefined : tabPath
  const isMarkdown = path !== undefined && fileTypeOf(path).kind === 'markdown'
  const local = useNoteBundle(isActive ? undefined : path, props.version)
  const note = isActive ? activeNote : local.note
  const backlinks = isActive ? activeBacklinks : local.backlinks

  const scrollRef = useRef<HTMLDivElement>(null)
  const memory = useScrollMemory({
    scrollRef,
    path,
    noteLoaded: note !== undefined && note.path === path,
    onActiveHeading: isActive ? onActiveHeading : NOOP_HEADING,
  })
  useEffect(() => {
    const handlers: PaneHandlers = { onHeading: memory.onHeading, clear: memory.clear }
    register(pane.id, handlers)
    return () => register(pane.id, undefined)
  }, [pane.id, register, memory.onHeading, memory.clear])

  /** Edge under a drag pointer, or undefined when it is not near one. */
  const edgeAt = (event: React.DragEvent<HTMLDivElement>): PaneDropSide | undefined => {
    const rect = event.currentTarget.getBoundingClientRect()
    const distances: readonly [PaneDropSide, number][] = [
      ['left', event.clientX - rect.left],
      ['right', rect.right - event.clientX],
      ['top', event.clientY - rect.top],
      ['bottom', rect.bottom - event.clientY],
    ]
    const nearest = distances.reduce((best, item) => (item[1] < best[1] ? item : best))
    return nearest[1] <= 48 ? nearest[0] : undefined
  }

  return (
    // Pressing anywhere focuses the pane before the click dispatches.
    <div
      className={`${css.pane} ${isActive ? css.paneActive : ''}`.trim()}
      data-pane={pane.id}
      style={{ flexGrow: share }}
      onPointerDownCapture={() => {
        if (!isActive) onActivate()
      }}
      onDragOver={(event) => {
        if (!hasTabDrag(event.dataTransfer)) return
        const side = edgeAt(event)
        if (side === undefined) {
          if (dropSide !== undefined) setDropSide(undefined)
          return
        }
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (dropSide !== side) setDropSide(side)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropSide(undefined)
      }}
      onDrop={(event) => {
        const payload = readTabDrag(event.dataTransfer)
        if (payload === undefined || dropSide === undefined) return
        event.preventDefault()
        event.stopPropagation()
        onSplitTab(pane.id, payload.paneId, payload.index, dropSide)
        setDropSide(undefined)
      }}
    >
      {dropSide === undefined ? null : (
        <div
          className={`${css.paneDrop} ${DROP_CLASS[dropSide]}`.trim()}
          aria-hidden="true"
        />
      )}
      <TabStrip
        t={props.t}
        tabs={pane.tabs.items}
        active={pane.tabs.active}
        note={note}
        path={path}
        paneId={pane.id}
        onSelect={onSelectTab}
        onClose={onCloseTab}
        onPin={onPinTab}
        onNew={onNewTab}
        onMoveTab={onMoveTab}
        onMenu={props.onMenu}
      />
      <MainPane
        t={props.t}
        labels={props.labels}
        vaultName={props.vaultName}
        emptyActions={props.emptyActions}
        onEmptySearch={props.onEmptySearch}
        recentPaths={props.recentPaths}
        onOpenRecent={props.onOpenRecent}
        view={isActive ? props.view : 'note'}
        path={path}
        isMarkdown={isMarkdown}
        note={note}
        backlinks={backlinks}
        scrollRef={scrollRef}
        anchor={isActive ? anchor : undefined}
        sourceMode={isActive && sourceMode}
        error={isActive ? error : undefined}
        version={props.version}
        onRetry={props.onRetry}
        onReading={props.onReading}
        onSwitchToReading={props.onSwitchToReading}
        onSource={props.onSource}
        onSaved={props.onSaved}
        onOpen={props.onOpen}
        onCreate={props.onCreate}
        onTag={props.onTag}
        onPathFilter={props.onPathFilter}
        onMenu={props.onMenu}
        onCenter={props.onCenter}
        onCloseGraph={props.onCloseGraph}
        onOpenSettings={props.onOpenSettings}
      />
    </div>
  )
}

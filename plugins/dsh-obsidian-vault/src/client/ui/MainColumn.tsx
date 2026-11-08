/**
 * The centre of the vault workspace: one or more split panes, each with its
 * tab strip and reading surface, joined by draggable dividers. Pure
 * composition; all state lives in the page.
 * @module dsh-obsidian-vault/client/ui/MainColumn
 */
import { Fragment, useCallback, useRef } from 'react'
import { PaneColumn, type PaneColumnProps, type PaneHandlers } from './PaneColumn.tsx'
import { MIN_PANE_SIZE, type PaneState, type SplitDirection } from './panes.ts'
import { PaneSplitter } from './PaneSplitter.tsx'
import { css } from './theme.ts'

/** Props for {@link MainColumn}: the panes plus the shared surface callbacks. */
export interface MainColumnProps
  extends Omit<PaneColumnProps, 'pane' | 'share' | 'isActive' | 'onActivate' | 'register'> {
  readonly panes: readonly PaneState[]
  readonly activePane: number
  readonly direction: SplitDirection
  /** Mounted panes' reading handlers, keyed by pane id. */
  readonly paneHandlers: { readonly current: Map<number, PaneHandlers> }
  /** Focus the pane at one index. */
  readonly onActivatePane: (index: number) => void
  /** Resize the pane pair around divider `index`; `first` is the share before it. */
  readonly onResizePane: (index: number, first: number) => void
}

/** A pane never shrinks below this many pixels while its divider moves. */
const MIN_PANE_PX = 120

/**
 * Render the pane strip.
 * @param props - pane state plus everything the reading surfaces render from.
 */
export function MainColumn(props: MainColumnProps): JSX.Element {
  const { panes, activePane, direction, paneHandlers, activeNote, activeBacklinks, anchor, sourceMode, error } = props
  const stripRef = useRef<HTMLDivElement>(null)
  // One stable registrar: a pane's effect must not churn on every page render.
  const register = useCallback((id: number, handlers: PaneHandlers | undefined) => {
    if (handlers === undefined) paneHandlers.current.delete(id)
    else paneHandlers.current.set(id, handlers)
  }, [paneHandlers])

  // Convert a pixel delta into a flex-grow delta against the strip's current
  // extent, keeping the pair's combined share constant.
  const resizeBy = useCallback((index: number, deltaPx: number) => {
    const strip = stripRef.current
    const first = props.panes[index]
    const second = props.panes[index + 1]
    if (strip === null || first === undefined || second === undefined) return
    const extent = props.direction === 'row' ? strip.clientWidth : strip.clientHeight
    const total = props.panes.reduce((sum, pane) => sum + pane.size, 0)
    if (extent <= 0 || total <= 0) return
    const sum = first.size + second.size
    const minGrow = Math.max(MIN_PANE_SIZE, (MIN_PANE_PX * total) / extent)
    const requested = first.size + (deltaPx * total) / extent
    props.onResizePane(index, Math.min(Math.max(requested, minGrow), sum - minGrow))
  }, [props])

  const resetPair = useCallback((index: number) => {
    const first = props.panes[index]
    const second = props.panes[index + 1]
    if (first === undefined || second === undefined) return
    props.onResizePane(index, (first.size + second.size) / 2)
  }, [props])

  // The model's size shares need not sum to one (a closed pane takes its share
  // with it), so normalize before they become flex-grow values — a total below
  // one would leave the strip partially empty.
  const totalSize = panes.reduce((sum, pane) => sum + pane.size, 0)

  return (
    <div className={css.mainColumn} data-direction={direction} ref={stripRef}>
      {panes.map((pane, index) => (
        <Fragment key={pane.id}>
          {index === 0
            ? null
            : (
              <PaneSplitter
                direction={direction}
                label={props.t('resizePane')}
                onDelta={(deltaPx) => resizeBy(index - 1, deltaPx)}
                onReset={() => resetPair(index - 1)}
              />
            )}
          <PaneColumn
            t={props.t}
            labels={props.labels}
            vaultName={props.vaultName}
            emptyActions={props.emptyActions}
            onEmptySearch={props.onEmptySearch}
            version={props.version}
            view={props.view}
            pane={pane}
            share={pane.size / totalSize}
            isActive={index === activePane}
            activeNote={activeNote}
            activeBacklinks={activeBacklinks}
            anchor={anchor}
            sourceMode={sourceMode}
            error={error}
            onActivate={() => props.onActivatePane(index)}
            register={register}
            onActiveHeading={props.onActiveHeading}
            onSelectTab={props.onSelectTab}
            onCloseTab={props.onCloseTab}
            onPinTab={props.onPinTab}
            onNewTab={props.onNewTab}
            onMoveTab={props.onMoveTab}
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
        </Fragment>
      ))}
    </div>
  )
}

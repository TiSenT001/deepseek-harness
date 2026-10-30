/**
 * Draggable divider between two split panes. Unlike the docked-column Splitter
 * it reports incremental pixel deltas; MainColumn converts them into flex-grow
 * shares so the pair's combined size stays constant. Double-click evens the
 * pair out.
 * @module dsh-obsidian-vault/client/ui/PaneSplitter
 */
import { useEffect, useRef, useState } from 'react'
import type { SplitDirection } from './panes.ts'
import { css } from './theme.ts'

/** Props for {@link PaneSplitter}. */
export interface PaneSplitterProps {
  /** Layout direction of the pane strip the divider sits in. */
  readonly direction: SplitDirection
  readonly label: string
  /** Pixel delta along the strip's axis since the previous report. */
  readonly onDelta: (deltaPx: number) => void
  /** Even out the two panes around the divider (double-click). */
  readonly onReset: () => void
}

const STEP = 48

/**
 * Render one pane divider.
 * @param props - the strip direction plus the delta and reset callbacks.
 */
export function PaneSplitter({ direction, label, onDelta, onReset }: PaneSplitterProps): JSX.Element {
  const [dragging, setDragging] = useState(false)
  const last = useRef(0)
  const horizontal = direction === 'column'

  useEffect(() => {
    if (!dragging) return
    const cursor = horizontal ? 'row-resize' : 'col-resize'
    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
    }
  }, [dragging, horizontal])

  return (
    <div
      className={`${css.splitter} ${css.splitterPane} ${horizontal ? css.splitterHorizontal : ''} ${dragging ? css.splitterActive : ''}`.trim()}
      role="separator"
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-label={label}
      tabIndex={0}
      data-ov-pane-splitter=""
      title={label}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        last.current = horizontal ? event.clientY : event.clientX
        setDragging(true)
      }}
      onPointerMove={(event) => {
        if (!dragging) return
        const position = horizontal ? event.clientY : event.clientX
        onDelta(position - last.current)
        last.current = position
      }}
      onPointerUp={(event) => {
        if (!dragging) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        setDragging(false)
      }}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        const growKey = horizontal ? 'ArrowDown' : 'ArrowRight'
        const shrinkKey = horizontal ? 'ArrowUp' : 'ArrowLeft'
        if (event.key === growKey) {
          event.preventDefault()
          onDelta(STEP)
        } else if (event.key === shrinkKey) {
          event.preventDefault()
          onDelta(-STEP)
        }
      }}
    />
  )
}

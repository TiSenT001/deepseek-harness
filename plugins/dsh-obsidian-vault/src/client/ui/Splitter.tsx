/**
 * Draggable divider between a docked column and the reading column. Drag,
 * arrow keys, and double-click reset all share the clamped width setter.
 * @module dsh-obsidian-vault/client/ui/Splitter
 */
import { useEffect, useRef, useState } from 'react'
import { CHROME } from './kit/index.ts'
import { css } from './theme.ts'

/** Props for {@link Splitter}. */
export interface SplitterProps {
  readonly side: 'left' | 'right'
  readonly value: number
  readonly label: string
  readonly onChange: (side: 'left' | 'right', value: number) => void
  readonly onReset: (side: 'left' | 'right') => void
}

const STEP = 16

/**
 * Render one vertical splitter.
 * @param props - the column it owns, its width, and the width setters.
 */
export function Splitter({ side, value, label, onChange, onReset }: SplitterProps): JSX.Element {
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ readonly x: number; readonly width: number } | undefined>(undefined)
  const [min, max] = side === 'left' ? [CHROME.leftMin, CHROME.leftMax] : [CHROME.rightMin, CHROME.rightMax]

  useEffect(() => {
    if (!dragging) return
    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
    }
  }, [dragging])

  const resizeFrom = (clientX: number): void => {
    const origin = start.current
    if (origin === undefined) return
    const delta = clientX - origin.x
    onChange(side, origin.width + (side === 'left' ? delta : -delta))
  }

  return (
    <div
      className={`${css.splitter} ${dragging ? css.splitterActive : ''}`.trim()}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      data-ov-splitter={side}
      title={label}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        start.current = { x: event.clientX, width: value }
        setDragging(true)
      }}
      onPointerMove={(event) => {
        if (!dragging) return
        resizeFrom(event.clientX)
      }}
      onPointerUp={(event) => {
        if (!dragging) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        start.current = undefined
        setDragging(false)
      }}
      onPointerCancel={() => {
        start.current = undefined
        setDragging(false)
      }}
      onDoubleClick={() => onReset(side)}
      onKeyDown={(event) => {
        const grow = event.key === (side === 'left' ? 'ArrowRight' : 'ArrowLeft')
        const shrink = event.key === (side === 'left' ? 'ArrowLeft' : 'ArrowRight')
        if (grow) {
          event.preventDefault()
          onChange(side, value + STEP)
        } else if (shrink) {
          event.preventDefault()
          onChange(side, value - STEP)
        } else if (event.key === 'Home') {
          event.preventDefault()
          onChange(side, min)
        } else if (event.key === 'End') {
          event.preventDefault()
          onChange(side, max)
        }
      }}
    />
  )
}

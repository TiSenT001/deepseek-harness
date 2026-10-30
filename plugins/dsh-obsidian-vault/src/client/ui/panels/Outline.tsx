/**
 * Outline panel: heading tree with the heading in view highlighted. Dragging a
 * heading horizontally promotes or demotes it together with its subtree; the
 * drop applies through the page's save action.
 * @module dsh-obsidian-vault/client/ui/panels/Outline
 */
import { useRef, useState } from 'react'
import type { NoteDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { clampHeadingShift, shiftedHeadings } from '../../../vault/heading-level.ts'
import { css } from '../theme.ts'

/** Horizontal pixels of drag per heading level step. */
const STEP_PX = 24
/** Distance below which a press still counts as a click, not a drag. */
const CLICK_TOLERANCE_PX = 4

/** Props for {@link Outline}. */
export interface OutlineProps {
  readonly t: Translate
  readonly note: NoteDto | undefined
  readonly activeHeading: string | undefined
  readonly onHeading: (text: string) => void
  /** Apply a level shift to the heading on a 1-based body line. */
  readonly onShift: (line: number, delta: number) => void
}

/** One in-progress drag: the pressed row and its current clamped preview. */
interface DragState {
  readonly line: number
  readonly startX: number
  moved: boolean
}

/**
 * Render the heading tree for the open note.
 * @param props - the note, the highlighted heading, and the shift action.
 */
export function Outline({ t, note, activeHeading, onHeading, onShift }: OutlineProps): JSX.Element {
  const drag = useRef<DragState | null>(null)
  const suppressClick = useRef(false)
  const [preview, setPreview] = useState<{ readonly line: number; readonly delta: number } | null>(null)

  if (note === undefined || note.headings.length === 0) {
    return <div className={css.empty}>{t('noOutline')}</div>
  }

  const previewLines = preview === null
    ? new Set<number>()
    : new Set(shiftedHeadings(note.headings, preview.line).map(heading => heading.line))
  const draggedHeading = preview === null
    ? undefined
    : note.headings.find(heading => heading.line === preview.line)

  return (
    <>
      {note.headings.map((heading) => {
        const shift = previewLines.has(heading.line) && preview !== null ? preview.delta : 0
        return (
          <button
            key={`${heading.line}:${heading.text}`}
            type="button"
            className={`${css.item} ${heading.text === activeHeading ? css.outlineActive : ''}`}
            style={{ paddingLeft: `${8 + (heading.level + shift - 1) * 10}px` }}
            onClick={() => {
              // A press that became a drag must not also scroll to the heading.
              if (suppressClick.current) {
                suppressClick.current = false
                return
              }
              onHeading(heading.text)
            }}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              drag.current = { line: heading.line, startX: event.clientX, moved: false }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              const current = drag.current
              if (current === null || current.line !== heading.line) return
              if (Math.abs(event.clientX - current.startX) > CLICK_TOLERANCE_PX) current.moved = true
              if (!current.moved) return
              const delta = clampHeadingShift(
                note.headings,
                current.line,
                Math.round((event.clientX - current.startX) / STEP_PX),
              )
              setPreview(delta === 0 ? null : { line: current.line, delta })
            }}
            onPointerUp={(event) => {
              const current = drag.current
              drag.current = null
              setPreview(null)
              if (current === null || !current.moved) return
              suppressClick.current = true
              const delta = clampHeadingShift(
                note.headings,
                current.line,
                Math.round((event.clientX - current.startX) / STEP_PX),
              )
              if (delta !== 0) onShift(current.line, delta)
            }}
          >
            {heading.text}
            {preview !== null && heading.line === preview.line && draggedHeading !== undefined
              ? <span className={css.outlineBadge}>H{draggedHeading.level}→H{draggedHeading.level + preview.delta}</span>
              : null}
          </button>
        )
      })}
    </>
  )
}

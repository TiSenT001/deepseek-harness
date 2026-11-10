/**
 * Read-only viewer for Obsidian `.canvas` documents. Nodes keep their canvas
 * positions and sizes; text nodes render Markdown, file nodes open the target,
 * link nodes open the URL, groups sit behind their children, and edges are
 * drawn as Bézier paths between node sides.
 * @module dsh-obsidian-vault/client/ui/files/CanvasView
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Translate } from '../../i18n.ts'
import { MarkdownText } from '../../primitives.ts'
import { parseJsonCanvas, type JsonCanvasEdge, type JsonCanvasNode } from './json-canvas.ts'
import { css } from '../theme.ts'

/** Props for {@link CanvasView}. */
export interface CanvasViewProps {
  readonly t: Translate
  readonly path: string
  readonly text: string
  readonly onOpenPath?: (path: string, destination?: 'current' | 'new-tab' | 'right') => void
}

interface ViewState {
  readonly x: number
  readonly y: number
  readonly scale: number
}

const COLORS: Readonly<Record<string, string>> = {
  '1': '#e93147',
  '2': '#ec7500',
  '3': '#e0ac00',
  '4': '#08b94e',
  '5': '#00bfbc',
  '6': '#a882ff',
}

const SIDE_ORDER = ['top', 'right', 'bottom', 'left'] as const
type Side = typeof SIDE_ORDER[number]

/**
 * Render one `.canvas` document.
 * @param props - translated labels, file path, raw JSON, and the open callback.
 */
export function CanvasView({ t, path, text, onOpenPath }: CanvasViewProps): JSX.Element {
  const parsed = useMemo(() => parseJsonCanvas(text), [text])
  const viewportRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 })
  const drag = useRef<{ pointerId: number; x: number; y: number; viewX: number; viewY: number } | null>(null)
  const fitted = useRef(false)

  const bounds = useMemo(() => {
    if (!parsed.ok || parsed.nodes.length === 0) return { minX: 0, minY: 0, width: 800, height: 600 }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const node of parsed.nodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }
    return { minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
  }, [parsed])

  const fit = useCallback(() => {
    const viewport = viewportRef.current
    if (viewport === null) return
    const padding = 48
    const scale = Math.max(0.1, Math.min(1.5,
      (viewport.clientWidth - padding * 2) / bounds.width,
      (viewport.clientHeight - padding * 2) / bounds.height,
    ))
    setView({
      scale,
      x: (viewport.clientWidth - bounds.width * scale) / 2,
      y: (viewport.clientHeight - bounds.height * scale) / 2,
    })
  }, [bounds])

  useEffect(() => {
    if (fitted.current) return
    fitted.current = true
    fit()
  }, [fit])

  useEffect(() => {
    const viewport = viewportRef.current
    if (viewport === null) return
    const observer = new ResizeObserver(() => {
      if (fitted.current) fit()
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [fit])

  useEffect(() => {
    const viewport = viewportRef.current
    if (viewport === null) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top
      setView(current => {
        const next = Math.max(0.1, Math.min(4, current.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12)))
        return {
          scale: next,
          x: mx - ((mx - current.x) / current.scale) * next,
          y: my - ((my - current.y) / current.scale) * next,
        }
      })
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [])

  const zoomAtCentre = (factor: number): void => {
    const viewport = viewportRef.current
    if (viewport === null) return
    const mx = viewport.clientWidth / 2
    const my = viewport.clientHeight / 2
    setView(current => {
      const next = Math.max(0.1, Math.min(4, current.scale * factor))
      return {
        scale: next,
        x: mx - ((mx - current.x) / current.scale) * next,
        y: my - ((my - current.y) / current.scale) * next,
      }
    })
  }

  if (!parsed.ok) {
    return (
      <div className={css.canvasFile}>
        <div className={css.codeHead}>
          <span className={css.codeLang}>CANVAS</span>
          <span className={css.codeMeta}>{path}</span>
        </div>
        <div className={css.canvasError}>{t('canvasInvalid')}: {parsed.error}</div>
      </div>
    )
  }

  const local = parsed.nodes.map(node => ({ ...node, x: node.x - bounds.minX, y: node.y - bounds.minY }))
  const byId = new Map(local.map(node => [node.id, node]))
  const groups = local.filter(node => node.type === 'group')
  const others = local.filter(node => node.type !== 'group')

  return (
    <div className={css.canvasFile}>
      <div className={css.codeHead}>
        <span className={css.codeLang}>CANVAS</span>
        <span className={css.codeMeta}>{path} · {t('canvasReadonly')}</span>
        <span className={css.canvasZoom}>
          <button type="button" className={css.canvasToolButton} aria-label={t('zoomOut')} title={t('zoomOut')} onClick={() => zoomAtCentre(1 / 1.15)}>−</button>
          <span className={css.canvasZoomValue}>{Math.round(view.scale * 100)}%</span>
          <button type="button" className={css.canvasToolButton} aria-label={t('zoomIn')} title={t('zoomIn')} onClick={() => zoomAtCentre(1.15)}>+</button>
          <button type="button" className={css.canvasToolButton} onClick={fit}>{t('fitCanvas')}</button>
        </span>
      </div>
      <div
        ref={viewportRef}
        className={css.canvasViewport}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('.ov-canvas-node') !== null) return
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y }
        }}
        onPointerMove={(event) => {
          const current = drag.current
          if (current === null) return
          setView(previous => ({
            ...previous,
            x: current.viewX + event.clientX - current.x,
            y: current.viewY + event.clientY - current.y,
          }))
        }}
        onPointerUp={(event) => {
          if (drag.current === null) return
          event.currentTarget.releasePointerCapture(event.pointerId)
          drag.current = null
        }}
        onPointerCancel={() => { drag.current = null }}
      >
        <div
          className={css.canvasWorld}
          style={{
            width: bounds.width,
            height: bounds.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          <svg className={css.canvasEdges} width={bounds.width} height={bounds.height} aria-hidden="true">
            {parsed.edges.map(edge => (
              <CanvasEdgePath key={edge.id} edge={edge} from={byId.get(edge.fromNode)} to={byId.get(edge.toNode)} />
            ))}
          </svg>
          {groups.map(node => <CanvasNodeCard key={node.id} node={node} t={t} onOpenPath={onOpenPath} />)}
          {others.map(node => <CanvasNodeCard key={node.id} node={node} t={t} onOpenPath={onOpenPath} />)}
        </div>
      </div>
    </div>
  )
}

function CanvasNodeCard({ node, t, onOpenPath }: {
  readonly node: JsonCanvasNode
  readonly t: Translate
  readonly onOpenPath?: CanvasViewProps['onOpenPath']
}): JSX.Element {
  const color = node.color === undefined ? undefined : COLORS[node.color]
  const style = {
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
    ...(color === undefined ? {} : { borderColor: color }),
  }
  if (node.type === 'group') {
    return (
      <div className={`${css.canvasNode} ${css.canvasGroup}`} style={style} data-canvas-node={node.id}>
        {node.label === undefined ? null : <span className={css.canvasGroupLabel}>{node.label}</span>}
      </div>
    )
  }
  if (node.type === 'file') {
    const target = node.file ?? ''
    const name = target.slice(target.lastIndexOf('/') + 1)
    return (
      <button
        type="button"
        className={`${css.canvasNode} ${css.canvasFileNode}`}
        style={style}
        data-canvas-node={node.id}
        onClick={() => { if (target.length > 0) onOpenPath?.(target) }}
      >
        <span className={css.canvasNodeTitle}>{name}</span>
        {node.subpath === undefined ? null : <span className={css.canvasNodeSub}>{node.subpath}</span>}
      </button>
    )
  }
  if (node.type === 'link') {
    return (
      <a
        className={`${css.canvasNode} ${css.canvasLinkNode}`}
        style={style}
        data-canvas-node={node.id}
        href={node.url ?? '#'}
        target="_blank"
        rel="noreferrer"
      >
        <span className={css.canvasNodeTitle}>{node.url ?? ''}</span>
      </a>
    )
  }
  return (
    <div className={`${css.canvasNode} ${css.canvasTextNode}`} style={style} data-canvas-node={node.id}>
      <MarkdownText
        text={node.text ?? ''}
        labels={{ code: { copyLabel: t('copyLabel'), copiedLabel: t('copiedLabel') }, footnotes: t('footnotes') }}
        variant="compact"
      />
    </div>
  )
}

function CanvasEdgePath({ edge, from, to }: {
  readonly edge: JsonCanvasEdge
  readonly from?: JsonCanvasNode
  readonly to?: JsonCanvasNode
}): JSX.Element | null {
  if (from === undefined || to === undefined) return null
  const startSide = edge.fromSide ?? autoSide(from, to)
  const endSide = edge.toSide ?? autoSide(to, from)
  const start = pointOn(from, startSide)
  const end = pointOn(to, endSide)
  const horizontal = startSide === 'left' || startSide === 'right'
  const distance = Math.max(40, Math.abs(horizontal ? end.x - start.x : end.y - start.y) * 0.45)
  const c1 = horizontal ? { x: start.x + (startSide === 'right' ? distance : -distance), y: start.y } : { x: start.x, y: start.y + (startSide === 'bottom' ? distance : -distance) }
  const c2 = horizontal ? { x: end.x + (endSide === 'right' ? distance : -distance), y: end.y } : { x: end.x, y: end.y + (endSide === 'bottom' ? distance : -distance) }
  const color = edge.color === undefined ? undefined : COLORS[edge.color]
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  return (
    <g>
      <path
        d={`M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`}
        fill="none"
        stroke={color ?? 'var(--dsw-alias-border-l3, #4a4a52)'}
        strokeWidth={2}
      />
      {edge.label === undefined ? null : (
        <text x={mid.x} y={mid.y - 4} textAnchor="middle" className={css.canvasEdgeLabel}>{edge.label}</text>
      )}
    </g>
  )
}

function autoSide(node: JsonCanvasNode, other: JsonCanvasNode): Side {
  const dx = (other.x + other.width / 2) - (node.x + node.width / 2)
  const dy = (other.y + other.height / 2) - (node.y + node.height / 2)
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'bottom' : 'top'
}

function pointOn(node: JsonCanvasNode, side: Side): { x: number; y: number } {
  switch (side) {
    case 'top': return { x: node.x + node.width / 2, y: node.y }
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height }
    case 'left': return { x: node.x, y: node.y + node.height / 2 }
    case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 }
  }
}

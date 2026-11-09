/**
 * One frame of the graph: clear, edges, nodes, labels. All animation state
 * lives in the {@link GraphStage}; this module only advances and draws it.
 * @module dsh-obsidian-vault/graph/render/scene
 */
import type { GraphNodeDto } from '../../../protocol.ts'
import type { GraphEdgeInput, SimNode } from '../layout.ts'
import type { GraphSettings } from '../settings.ts'
import { groupColorOf } from './group-color.ts'
import { colorByKey, type GraphColorBy } from './colors.ts'
import { labelAlpha, type LabelBox } from './labels.ts'
import { screenRadius } from './node-size.ts'
import { LABEL_FONT, labelFont, type Palette } from './palette.ts'
import { edgeEntrance, entranceScale, revealEntrance, revealLocal, type RevealPlan } from '../reveal.ts'
import type { GraphStage } from './stage.ts'

/** Above this many edges the hover highlight draws as two batched passes. */
const BATCHED_EDGES = 800

/** What one frame drew; the canvas exposes the counts for probes. */
export interface SceneStats {
  readonly drawnNodes: number
  readonly drawnEdges: number
}

/** Everything one frame needs. */
export interface SceneInput {
  readonly ctx: CanvasRenderingContext2D
  /** CSS-pixel size of the canvas. */
  readonly width: number
  readonly height: number
  readonly zoom: number
  readonly panX: number
  readonly panY: number
  readonly positions: readonly SimNode[]
  readonly edges: readonly GraphEdgeInput[]
  /** Overall replay progress in [0, 1]; 1 means fully revealed. */
  readonly reveal: number
  /** Per-node replay start times. */
  readonly plan: RevealPlan
  readonly nodeInfo: ReadonlyMap<string, GraphNodeDto>
  readonly settings: GraphSettings
  readonly labels: readonly LabelBox[]
  /** Hovered node path, if any. */
  readonly hover: string | undefined
  readonly hasCenter: boolean
  readonly palette: Palette
  /** Damped animation state, advanced by this draw. */
  readonly stage: GraphStage
}

/** The world-space rectangle the camera shows. */
export interface WorldRect {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

/**
 * Invert the canvas camera transform: `translate(center + pan) * scale(zoom)`.
 * @param width - CSS-pixel canvas width.
 * @param height - CSS-pixel canvas height.
 * @param zoom - camera zoom.
 * @param panX - camera pan in screen px.
 * @param panY - camera pan in screen px.
 * @returns the visible world-space rectangle.
 */
export function worldViewport(width: number, height: number, zoom: number, panX: number, panY: number): WorldRect {
  return {
    left: (-width / 2 - panX) / zoom,
    right: (width / 2 - panX) / zoom,
    top: (-height / 2 - panY) / zoom,
    bottom: (height / 2 - panY) / zoom,
  }
}

/** Build the stage key for one edge. */
export function edgeKey(source: string, target: string): string {
  return `${source}\n${target}`
}

/**
 * Draw one frame.
 * @param scene - camera, data, palette, and animation stage for this frame.
 * @returns how many nodes and edges survived viewport culling.
 */
export function drawScene(scene: SceneInput): SceneStats {
  const { ctx, width, height, zoom, positions, edges, reveal, plan, nodeInfo, settings, labels, hover, palette, stage } = scene
  ctx.clearRect(0, 0, width, height)
  const stats = { drawnNodes: 0, drawnEdges: 0 }
  if (positions.length === 0) return stats

  ctx.save()
  ctx.translate(width / 2 + scene.panX, height / 2 + scene.panY)
  ctx.scale(zoom, zoom)

  // World-space viewport for culling: invert the camera transform.
  const view = worldViewport(width, height, zoom, scene.panX, scene.panY)
  // Trivial reject: both endpoints outside the same side of the viewport.
  const edgeOffscreen = (from: SimNode, to: SimNode): boolean =>
    (from.x < view.left && to.x < view.left)
    || (from.x > view.right && to.x > view.right)
    || (from.y < view.top && to.y < view.top)
    || (from.y > view.bottom && to.y > view.bottom)

  const index = new Map(positions.map(node => [node.path, node]))
  const thresholdOf = (path: string): number => plan.thresholds.get(path) ?? 0
  const entranceOf = (path: string): number => revealEntrance(reveal, thresholdOf(path))
  const neighbours = hover === undefined ? undefined : neighbourSet(edges, hover)
  const hovering = neighbours !== undefined
  const batched = edges.length > BATCHED_EDGES
  const scale = settings.display.nodeScale
  const textFade = settings.display.textFade
  const globalLabelAlpha = labelAlpha(zoom, textFade)
  const labelScale = zoom < 1 ? 1 / zoom : 1
  // Arrowheads fade out as the camera zooms out (Obsidian: 2*(zoom-0.3)).

  // --- edges ---
  const baseEdgeWidth = Math.max(0.35, settings.display.linkWidth / zoom)
  const activeEdgeWidth = baseEdgeWidth * 1.6
  const edgeAlphas = new Map<string, number>()
  if (batched) {
    const passes = stage.passes(hovering)
    // During a replay, batch edges into four alpha steps so they bloom with
    // their endpoints instead of snapping in as one stroke.
    const levels = reveal < 1 ? [0.25, 0.5, 0.75, 1] : [1]
    const drawPass = (alpha: number, color: string, lineWidth: number, onlyNeighbours: boolean): void => {
      for (const level of levels) {
        const passAlpha = alpha * level
        if (passAlpha <= 0.01) continue
        ctx.strokeStyle = color
        ctx.globalAlpha = passAlpha
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        for (const edge of edges) {
          const entrance = edgeEntrance(reveal, thresholdOf(edge.source), thresholdOf(edge.target))
          if (entrance < 0.02) continue
          if (reveal < 1 && Math.ceil(entrance * 4) / 4 !== level) continue
          const isNeighbour = hovering && neighbours.has(edge.source) && neighbours.has(edge.target)
          if (onlyNeighbours !== isNeighbour) continue
          const from = index.get(edge.source)
          const to = index.get(edge.target)
          if (from === undefined || to === undefined) continue
          if (edgeOffscreen(from, to)) continue
          if (level === 1) stats.drawnEdges += 1
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          if (onlyNeighbours) edgeAlphas.set(edgeKey(edge.source, edge.target), passAlpha)
        }
        ctx.stroke()
      }
    }
    drawPass(passes.bg, palette.edge, baseEdgeWidth, false)
    drawPass(passes.fg, palette.edgeActive, activeEdgeWidth, true)
  } else {
    for (const edge of edges) {
      const entrance = edgeEntrance(reveal, thresholdOf(edge.source), thresholdOf(edge.target))
      if (entrance < 0.02) continue
      const from = index.get(edge.source)
      const to = index.get(edge.target)
      if (from === undefined || to === undefined) continue
      if (edgeOffscreen(from, to)) continue
      const isNeighbour = hovering && neighbours.has(edge.source) && neighbours.has(edge.target)
      const target = hovering ? (isNeighbour ? 1 : 0.2) : 0.65
      const alpha = stage.edge(edgeKey(edge.source, edge.target), target) * entrance
      if (alpha <= 0.01) continue
      stats.drawnEdges += 1
      edgeAlphas.set(edgeKey(edge.source, edge.target), alpha)
      ctx.strokeStyle = hovering && isNeighbour ? palette.edgeActive : palette.edge
      ctx.globalAlpha = alpha
      ctx.lineWidth = isNeighbour ? activeEdgeWidth : baseEdgeWidth
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }
  }

  // --- nodes ---
  const anims = new Map<string, { fade: number; dim: number; lift: number }>()
  for (const node of positions) {
    const entrance = reveal >= 1 ? 1 : entranceOf(node.path)
    if (entrance <= 0.01) continue
    const radius = screenRadius(node.radius, scale, zoom) * entranceScale(reveal >= 1 ? 1 : revealLocal(reveal, thresholdOf(node.path)))
    if (
      node.x + radius < view.left || node.x - radius > view.right
      || node.y + radius < view.top || node.y - radius > view.bottom
    ) continue
    const info = nodeInfo.get(node.path)
    const kind = info?.kind ?? 'note'
    const active = hover === node.path
    const faded = hovering && !neighbours.has(node.path)
    const isCenter = scene.hasCenter && node.depth === 0
    const group = groupColorOf(settings, node.title, node.path, info?.tags ?? [])
    // Explicit groups win; otherwise ordinary notes take the configured colour
    // mode so folders or tags read without any configuration.
    const mode: GraphColorBy = settings.display.colorBy ?? 'folder'
    const tintTarget = group
      ?? (kind === 'note' && !active && !isCenter
        ? colorByKey(mode, node.path, info?.tags, palette.node)
        : kindFill(palette, kind, active, isCenter))
    const anim = stage.node(node.path, {
      dim: faded ? 0.12 : 1,
      lift: active ? 15 / zoom : 0,
      tint: tintTarget,
    })
    anims.set(node.path, anim)
    const alpha = anim.fade * anim.dim * (active || isCenter ? 1 : 0.85) * entrance
    if (alpha <= 0.02) continue
    stats.drawnNodes += 1
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
    if (kind === 'unresolved') {
      ctx.strokeStyle = palette.node
      ctx.lineWidth = 1.2 / zoom
      ctx.stroke()
    } else {
      ctx.fillStyle = anim.tint
      ctx.fill()
      // Hover ring.
      if (active) {
        ctx.strokeStyle = palette.ring
        ctx.lineWidth = 2.2 / zoom
        ctx.globalAlpha = anim.fade * entrance
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1

  // --- labels ---
  if (labels.length > 0) {
    ctx.font = labelScale === 1 ? LABEL_FONT : labelFont(11 * labelScale)
    ctx.textAlign = 'center'
    for (const label of labels) {
      // Cheap viewport reject; the canvas pre-filters with a wide margin, so
      // this only guards the labels that margin kept.
      const y = label.y + label.radius * scale + 12 * labelScale
      if (y < view.top - 20 * labelScale || y > view.bottom + 20 * labelScale) continue
      const active = hover === label.path
      const anim = anims.get(label.path)
      const fade = (anim?.fade ?? 1) * (reveal >= 1 ? 1 : entranceOf(label.path))
      const alpha = active ? fade : fade * (anim?.dim ?? 1) * globalLabelAlpha
      if (alpha <= 0.02) continue
      ctx.globalAlpha = alpha
      ctx.fillStyle = active ? palette.labelActive : palette.label
      ctx.fillText(label.title, label.x, y + (anim?.lift ?? 0))
    }
    ctx.globalAlpha = 1
  }
  ctx.restore()
  return stats
}

function kindFill(
  palette: Palette,
  kind: GraphNodeDto['kind'],
  active: boolean,
  isCenter: boolean,
): string {
  if (active || isCenter) return palette.nodeActive
  if (kind === 'tag') return palette.nodeTag
  if (kind === 'attachment') return palette.nodeAttachment
  return palette.node
}

function neighbourSet(edges: readonly GraphEdgeInput[], path: string): Set<string> {
  const set = new Set<string>([path])
  for (const edge of edges) {
    if (edge.source === path) set.add(edge.target)
    if (edge.target === path) set.add(edge.source)
  }
  return set
}

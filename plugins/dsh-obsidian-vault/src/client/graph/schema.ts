/**
 * The graph settings panel as data: sections and controls. The panel component
 * renders this schema generically, so adding a setting is a one-line change.
 * @module dsh-obsidian-vault/client/graph/schema
 */
import type { Dict } from '../i18n.ts'

/** One settable control. `path` addresses a value inside `GraphSettings`. */
export type GraphControl =
  | { readonly kind: 'text'; readonly path: string; readonly label: keyof Dict; readonly placeholder?: string }
  | { readonly kind: 'toggle'; readonly path: string; readonly label: keyof Dict }
  | {
    readonly kind: 'select'
    readonly path: string
    readonly label: keyof Dict
    readonly options: readonly { readonly value: string; readonly label: keyof Dict }[]
  }
  | {
    readonly kind: 'number'
    readonly path: string
    readonly label: keyof Dict
    readonly min?: number
    readonly step?: number
  }
  | {
    readonly kind: 'range'
    readonly path: string
    readonly label: keyof Dict
    readonly min: number
    readonly max: number
    readonly step: number
    /**
     * Normalized (0…1) default position the slider should show at its middle,
     * via Obsidian's SJ/MJ warp. Omit for a linear slider.
     */
    readonly curveMid?: number
  }

/** One section of the panel. */
export interface GraphSection {
  readonly id: 'filters' | 'groups' | 'display' | 'forces'
  readonly title: keyof Dict
  readonly controls: readonly GraphControl[]
  /** The groups section renders its own editor instead of generic controls. */
  readonly editableGroups?: boolean
}

/** Sections in display order. */
export const GRAPH_SCHEMA: readonly GraphSection[] = [
  {
    id: 'filters',
    title: 'filters',
    controls: [
      { kind: 'text', path: 'filters.query', label: 'searchFiles' },
      { kind: 'toggle', path: 'filters.existingOnly', label: 'existingOnly' },
      { kind: 'toggle', path: 'filters.showTags', label: 'tagsAsNodes' },
      { kind: 'toggle', path: 'filters.showAttachments', label: 'attachments' },
      { kind: 'toggle', path: 'filters.showOrphans', label: 'orphans' },
    ],
  },
  { id: 'groups', title: 'groups', controls: [], editableGroups: true },
  {
    id: 'display',
    title: 'display',
    controls: [
      {
        kind: 'select',
        path: 'display.colorBy',
        label: 'nodeColor',
        options: [
          { value: 'folder', label: 'colorByFolder' },
          { value: 'tag', label: 'colorByTag' },
          { value: 'uniform', label: 'colorByUniform' },
        ],
      },
      { kind: 'toggle', path: 'display.animate', label: 'animateGraph' },
      { kind: 'toggle', path: 'display.showArrow', label: 'showArrow' },
      { kind: 'number', path: 'display.textFade', label: 'textFade', min: 0, step: 0.05 },
      { kind: 'number', path: 'display.nodeScale', label: 'nodeSize', min: 0, step: 0.1 },
      { kind: 'number', path: 'display.linkWidth', label: 'linkWidth', min: 0, step: 0.1 },
      { kind: 'number', path: 'display.linkOpacity', label: 'linkOpacity', min: 0, step: 0.05 },
    ],
  },
  {
    id: 'forces',
    title: 'forces',
    controls: [
      { kind: 'number', path: 'forces.center', label: 'centerForce', min: 0, step: 0.01 },
      { kind: 'number', path: 'forces.repel', label: 'repelForce', min: 0, step: 0.5 },
      { kind: 'number', path: 'forces.link', label: 'linkForce', min: 0, step: 0.01 },
      { kind: 'number', path: 'forces.linkDistance', label: 'linkDistance', min: 0, step: 10 },
    ],
  },
]

/**
 * Obsidian's slider warp SJ: slider position → normalized value.
 * `SJ(e, t) = 1 - ln(e(1-t) + t) / ln t`; t < 1 biases low values outward.
 * @param position - slider position 0…1.
 * @param curve - warp strength t.
 */
export function sliderToValue(position: number, curve: number): number {
  return 1 - Math.log(position * (1 - curve) + curve) / Math.log(curve)
}

/**
 * Inverse of {@link sliderToValue} (Obsidian's MJ): normalized value → slider
 * position. `MJ(e,t) = (t^(1-e) - t) / (1 - t)`.
 * @param value - normalized value 0…1.
 * @param curve - warp strength t.
 */
export function valueToSlider(value: number, curve: number): number {
  return (Math.pow(curve, 1 - value) - curve) / (1 - curve)
}

/**
 * Solve the warp strength that places `mid` (the normalized default) at slider
 * position 0.5, so defaults sit near the middle of the track. SJ(0.5, ·) is
 * monotonically decreasing, so bisection converges.
 * @param mid - normalized default value 0…1.
 * @returns curve strength t for {@link sliderToValue}/{@link valueToSlider}.
 */
export function curveFor(mid: number): number {
  const target = Math.min(0.98, Math.max(0.02, mid))
  let low = 0.001
  let high = 100
  for (let i = 0; i < 48; i += 1) {
    const t = Math.sqrt(low * high)
    if (sliderToValue(0.5, t) > target) low = t
    else high = t
  }
  return Math.sqrt(low * high)
}

/**
 * Read a dotted path out of the settings object.
 * @param source - any object.
 * @param path - dot-separated path.
 */
export function readPath(source: unknown, path: string): unknown {
  let current: unknown = source
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Write a dotted path into a copy of the settings object.
 * @param source - settings object.
 * @param path - dot-separated path.
 * @param value - replacement value.
 * @returns a new settings object with the value set.
 */
export function writePath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root: Record<string, unknown> = { ...(source as Record<string, unknown>) }
  let cursor = root
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]!
    const next = cursor[key]
    cursor[key] = typeof next === 'object' && next !== null ? { ...(next as Record<string, unknown>) } : {}
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1]!] = value
  return root as T
}

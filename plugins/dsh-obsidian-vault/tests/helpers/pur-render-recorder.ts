/**
 * A recording surface that captures every canvas mutation as one string, in
 * call order. The same recorder drives the upstream golden generator and the
 * kernel, so equal programs produce equal arrays. Text is measured as 10 units
 * per code point.
 * @module dsh-obsidian-vault/tests/helpers/pur-render-recorder
 */
import type { PurCanvasContext } from '../../src/pur-kernel/render-types.ts'

/** Options for {@link RenderRecorder}. */
export interface RenderRecorderOptions {
  /** Provide `roundRect`, as a modern browser canvas does. */
  roundRect?: boolean
}

/** Format call arguments the way the golden fixture stores them. */
function formatArgs(args: readonly (number | string | number[])[]): string {
  return args
    .map((value) => {
      if (Array.isArray(value)) return `[${value.join(',')}]`
      if (typeof value === 'string') return `"${value}"`
      return String(value)
    })
    .join(',')
}

/** Records canvas calls without drawing anything. */
export class RenderRecorder implements PurCanvasContext {
  /** Every call, in order. */
  readonly calls: string[] = []

  /** Image sources handed to `drawImage`, in order. */
  readonly drawn: CanvasImageSource[] = []

  /** Rounded-rectangle support, absent when the option is off. */
  roundRect?: (x: number, y: number, w: number, h: number, radii?: number) => void

  private fillColor = '#000000'
  private strokeColor = '#000000'
  private width = 1
  private cap: CanvasLineCap = 'butt'
  private join: CanvasLineJoin = 'miter'
  private alpha = 1
  private fontText = '10px sans-serif'
  private align: CanvasTextAlign = 'start'
  private baseline: CanvasTextBaseline = 'alphabetic'
  private shadow = 'rgba(0,0,0,0)'
  private shadowSize = 0

  /**
   * Build a recorder.
   * @param options - whether the surface supports `roundRect`.
   */
  constructor(options: RenderRecorderOptions = {}) {
    if (options.roundRect) this.roundRect = (x, y, w, h, radii) => this.calls.push(`roundRect(${formatArgs([x, y, w, h, radii ?? 0])})`)
  }

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this.fillColor
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    this.fillColor = typeof value === 'string' ? value : '[object]'
    this.calls.push(`fillStyle=${this.fillColor}`)
  }

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this.strokeColor
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    this.strokeColor = typeof value === 'string' ? value : '[object]'
    this.calls.push(`strokeStyle=${this.strokeColor}`)
  }

  get lineWidth(): number {
    return this.width
  }

  set lineWidth(value: number) {
    this.width = value
    this.calls.push(`lineWidth=${value}`)
  }

  get lineCap(): CanvasLineCap {
    return this.cap
  }

  set lineCap(value: CanvasLineCap) {
    this.cap = value
    this.calls.push(`lineCap=${value}`)
  }

  get lineJoin(): CanvasLineJoin {
    return this.join
  }

  set lineJoin(value: CanvasLineJoin) {
    this.join = value
    this.calls.push(`lineJoin=${value}`)
  }

  get globalAlpha(): number {
    return this.alpha
  }

  set globalAlpha(value: number) {
    this.alpha = value
    this.calls.push(`globalAlpha=${value}`)
  }

  get font(): string {
    return this.fontText
  }

  set font(value: string) {
    this.fontText = value
    this.calls.push(`font=${value}`)
  }

  get textAlign(): CanvasTextAlign {
    return this.align
  }

  set textAlign(value: CanvasTextAlign) {
    this.align = value
    this.calls.push(`textAlign=${value}`)
  }

  get textBaseline(): CanvasTextBaseline {
    return this.baseline
  }

  set textBaseline(value: CanvasTextBaseline) {
    this.baseline = value
    this.calls.push(`textBaseline=${value}`)
  }

  get shadowColor(): string {
    return this.shadow
  }

  set shadowColor(value: string) {
    this.shadow = value
    this.calls.push(`shadowColor=${value}`)
  }

  get shadowBlur(): number {
    return this.shadowSize
  }

  set shadowBlur(value: number) {
    this.shadowSize = value
    this.calls.push(`shadowBlur=${value}`)
  }

  clearRect(...args: [number, number, number, number]): void { this.record('clearRect', args) }
  fillRect(...args: [number, number, number, number]): void { this.record('fillRect', args) }
  strokeRect(...args: [number, number, number, number]): void { this.record('strokeRect', args) }
  save(): void { this.calls.push('save()') }
  restore(): void { this.calls.push('restore()') }
  translate(...args: [number, number]): void { this.record('translate', args) }
  rotate(...args: [number]): void { this.record('rotate', args) }
  scale(...args: [number, number]): void { this.record('scale', args) }
  beginPath(): void { this.calls.push('beginPath()') }
  closePath(): void { this.calls.push('closePath()') }
  moveTo(...args: [number, number]): void { this.record('moveTo', args) }
  lineTo(...args: [number, number]): void { this.record('lineTo', args) }
  bezierCurveTo(...args: [number, number, number, number, number, number]): void { this.record('bezierCurveTo', args) }
  arc(...args: [number, number, number, number, number]): void { this.record('arc', args) }
  arcTo(...args: [number, number, number, number, number]): void { this.record('arcTo', args) }
  rect(...args: [number, number, number, number]): void { this.record('rect', args) }
  fill(): void { this.calls.push('fill()') }
  stroke(): void { this.calls.push('stroke()') }
  clip(): void { this.calls.push('clip()') }
  setLineDash(segments: number[]): void { this.calls.push(`setLineDash(${formatArgs([segments])})`) }
  fillText(...args: [string, number, number]): void { this.record('fillText', args) }

  /**
   * Measure text as 10 units per code point.
   * @param text - the text to measure.
   * @returns the recorded width.
   */
  measureText(text: string): { width: number } {
    const width = text.length * 10
    this.calls.push(`measureText("${text}")=${width}`)
    return { width }
  }

  drawImage(image: CanvasImageSource, ...args: [number, number, number, number]): void {
    this.drawn.push(image)
    this.record('drawImage', args)
  }

  private record(name: string, args: readonly (number | string)[]): void {
    this.calls.push(`${name}(${formatArgs(args)})`)
  }
}

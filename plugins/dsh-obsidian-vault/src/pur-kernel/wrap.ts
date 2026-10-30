/**
 * Character-level text wrapping identical to the upstream renderer. The caller
 * supplies text measurement, so the kernel does not depend on a canvas context.
 * @module dsh-obsidian-vault/pur-kernel/wrap
 */

/**
 * Measure the rendered width of a candidate line.
 * @param text - the line to measure.
 * @returns the width in the renderer's units (canvas pixels before scaling).
 */
export type PurMeasure = (text: string) => number

/**
 * Wrap text at character granularity, breaking on `\n` first.
 * @param text - the text to wrap; `undefined`-like missing text wraps as empty.
 * @param maxWidth - the widest line the caller accepts.
 * @param measure - width of a candidate line.
 * @returns one entry per rendered line; an empty paragraph yields an empty line.
 */
export function wrapText(text: string | undefined, maxWidth: number, measure: PurMeasure): string[] {
  const lines: string[] = []
  for (const paragraph of (text || '').split('\n')) {
    let currentLine = ''
    for (let index = 0; index < paragraph.length; index++) {
      const char = paragraph.charAt(index)
      const candidate = currentLine + char
      if (measure(candidate) > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = candidate
      }
    }
    if (currentLine) lines.push(currentLine)
    if (paragraph === '') lines.push('')
  }
  return lines
}

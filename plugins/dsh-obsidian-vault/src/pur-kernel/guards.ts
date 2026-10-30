/**
 * Narrowing helpers for values read from `.PurStudio` files and JSON Canvas
 * documents, which stay untrusted until checked.
 * @module dsh-obsidian-vault/pur-kernel/guards
 */
import type { PurElementType, PurSide } from './types.ts'

const ELEMENT_TYPES: readonly PurElementType[] = ['text', 'image', 'note-link', 'code-node', 'group', 'line']
const SIDES: readonly PurSide[] = ['left', 'right', 'top', 'bottom']

/**
 * Read a value as a plain object.
 * @param value - candidate.
 * @returns the record, or undefined for arrays, `null` and primitives.
 */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

/**
 * Tell whether a value names one of the six element kinds.
 * @param value - candidate.
 * @returns true when the value is a {@link PurElementType}.
 */
export function isElementType(value: unknown): value is PurElementType {
  return typeof value === 'string' && (ELEMENT_TYPES as readonly string[]).includes(value)
}

/**
 * Read a finite number, falling back when the value is anything else.
 * @param value - candidate.
 * @param fallback - used for missing, non-numeric and non-finite values.
 * @returns the number.
 */
export function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Read a finite non-zero number, mirroring the upstream `value || fallback`
 * idiom where `0` and `NaN` both take the fallback.
 * @param value - candidate.
 * @param fallback - used for missing, non-numeric, non-finite and zero values.
 * @returns the number.
 */
export function nonZeroNumberOr(value: unknown, fallback: number): number {
  const parsed = numberOr(value, 0)
  return parsed === 0 ? fallback : parsed
}

/**
 * Read a string, falling back when the value is anything else.
 * @param value - candidate.
 * @param fallback - used for missing and non-string values.
 * @returns the string.
 */
export function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Read one of the four routing sides.
 * @param value - candidate.
 * @param fallback - used for any other value.
 * @returns the side.
 */
export function sideOr(value: unknown, fallback: PurSide): PurSide {
  return typeof value === 'string' && (SIDES as readonly string[]).includes(value) ? (value as PurSide) : fallback
}

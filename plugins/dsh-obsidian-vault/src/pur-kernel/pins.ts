/**
 * Reading pin lists from persisted documents.
 * @module dsh-obsidian-vault/pur-kernel/pins
 */
import { PurDocumentError } from './errors.ts'
import { asRecord, stringOr } from './guards.ts'
import { createElementId } from './ids.ts'
import type { PurPin } from './types.ts'

/**
 * Read a code-node pin list.
 * @param value - raw `inputs` or `outputs` value.
 * @param field - document path named in a failure message.
 * @returns the pins, or undefined when the list is absent.
 */
export function readPins(value: unknown, field: string): PurPin[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new PurDocumentError(`${field} is not an array`)
  return value.map((item, index) => {
    const record = asRecord(item)
    if (record === undefined) throw new PurDocumentError(`${field}[${index}] is not an object`)
    const label = record['label']
    if (typeof label !== 'string') throw new PurDocumentError(`${field}[${index}] has no label`)
    return { id: stringOr(record['id'], '') || createElementId(), label }
  })
}

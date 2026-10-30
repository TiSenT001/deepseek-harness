/**
 * Helpers the JavaScript and HTML renderers share for pin wiring.
 * @module dsh-obsidian-vault/pur-kernel/codegen-shared
 */
import type { PurPin } from './types.ts'
import type { PurInputSource, PurPipeline } from './pipeline.ts'

/**
 * Map pipeline ids to their generated variable names.
 * @param pipeline - the pipeline.
 * @returns id to variable name.
 */
export function nameMapOf(pipeline: PurPipeline): Map<string, string> {
  return new Map(pipeline.nodes.map((node) => [node.id, node.safeName]))
}

/**
 * Look up a pipeline node's output pins.
 * @param pipeline - the pipeline.
 * @returns a lookup by node id.
 */
export function outputsLookup(pipeline: PurPipeline): (id: string) => readonly PurPin[] | undefined {
  const byId = new Map(pipeline.nodes.map((node) => [node.id, node.outputs]))
  return (id) => byId.get(id)
}

/**
 * Assignment that reads one upstream output into a consumer's input object.
 * @param varName - consumer variable name.
 * @param pin - consumer input pin.
 * @param source - upstream pin, or undefined when unconnected.
 * @param names - id to variable name.
 * @param outputsOf - output pins by node id.
 * @returns the statement, indented and newline-terminated.
 */
export function jsInputLine(
  varName: string,
  pin: PurPin,
  source: PurInputSource | undefined,
  names: Map<string, string>,
  outputsOf: (id: string) => readonly PurPin[] | undefined,
): string {
  if (source === undefined) return `  ${varName}_inputs['${pin.label}'] = undefined;\n`
  const sourceVar = names.get(source.fromNode) ?? source.fromNode
  const sourcePin = (outputsOf(source.fromNode) ?? []).find((candidate) => candidate.id === source.fromPin)
  const valueName = sourcePin === undefined ? source.fromPin : sourcePin.label
  return `  ${varName}_inputs['${pin.label}'] = results['${sourceVar}'] ? results['${sourceVar}']['${valueName}'] : undefined;\n`
}

/**
 * Render a pipeline as a Python script: one `*_process` function per node in
 * topological order, then an `execute_pipeline` function that wires them.
 * @module dsh-obsidian-vault/pur-kernel/codegen-py
 */
import type { PurCodegenCoreLabels, PurCodegenPythonLabels } from './codegen-labels.ts'
import type { PurPipeline } from './pipeline.ts'

/** Source upstream falls back to when a node declares no code. */
const DEFAULT_PY = 'return {}'

/**
 * Render the pipeline as Python.
 * @param pipeline - built pipeline.
 * @param core - shared labels.
 * @param py - Python-specific labels.
 * @param header - document header already formatted by the adapter.
 * @returns the script text.
 */
export function renderPython(pipeline: PurPipeline, core: PurCodegenCoreLabels, py: PurCodegenPythonLabels, header: string): string {
  const names = new Map(pipeline.nodes.map((node) => [node.id, node.safeName]))
  let out = `# Pur Studio - ${header}\n# ${py.topology(pipeline.nodes.map((node) => node.safeName))}\n\n`

  pipeline.nodes.forEach((node, index) => {
    out += `# ${py.nodeHeading(index + 1, node.title)}\n`
    out += `def ${node.safeName}_process(inputs):\n`
    for (const line of bodyLinesOf(node.linkedCode || node.content || node.code || DEFAULT_PY)) out += `    ${line}\n`
    out += '\n'
  })

  out += `# ${py.pipelineHeading}\ndef execute_pipeline():\n    results = {}\n\n`
  pipeline.nodes.forEach((node, index) => {
    out += `    # ${py.nodeSection(index + 1, node.title)}\n`
    if (node.inputs.length === 0) {
      out += `    results['${node.safeName}'] = ${node.safeName}_process({})\n\n`
      return
    }
    out += `    ${node.safeName}_inputs = {}\n`
    const sources = pipeline.inputMap.get(node.id) ?? new Map()
    for (const pin of node.inputs) {
      const source = sources.get(pin.id)
      if (source === undefined) {
        out += `    ${node.safeName}_inputs['${pin.label}'] = None\n`
        continue
      }
      const sourceVar = names.get(source.fromNode) ?? source.fromNode
      const sourcePin = pipeline.nodes.find((candidate) => candidate.id === source.fromNode)?.outputs.find((candidate) => candidate.id === source.fromPin)
      const valueName = sourcePin === undefined ? source.fromPin : sourcePin.label
      out += `    ${node.safeName}_inputs['${pin.label}'] = results['${sourceVar}']['${valueName}'] if results.get('${sourceVar}') else None\n`
    }
    out += `    results['${node.safeName}'] = ${node.safeName}_process(${node.safeName}_inputs)\n\n`
  })
  out += `    return results\n\nif __name__ == '__main__':\n    try:\n        r = execute_pipeline()\n        import json\n        print('${core.resultBanner}')\n        print(json.dumps(r, indent=2, default=str))\n    except Exception as err:\n        print('${core.errorBanner}', err)\n`
  return out
}

/**
 * Convert node source into an indented Python body, unwrapping JavaScript
 * function syntax the way upstream does.
 * @param source - node source text.
 * @returns body lines, never empty.
 */
function bodyLinesOf(source: string): string[] {
  const raw = source.replace(/\r/g, '').split('\n')
  const joined = raw.join('\n')
  if (!/\bfunction\s+\w*\s*\(/.test(joined) && !/^\s*(inputs)\s*=>/.test(joined)) return raw
  const stripped = raw
    .filter((line) => !/^\s*(function|return\s+\{process\}|const|let|var)\b/.test(line))
    .map((line) => line.replace(/\}$/, '').trim())
    .filter((line) => line !== '')
  return stripped.length === 0 ? [DEFAULT_PY] : stripped
}

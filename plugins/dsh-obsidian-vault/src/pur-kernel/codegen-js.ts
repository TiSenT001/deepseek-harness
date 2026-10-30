/**
 * Render a pipeline as a runnable JavaScript module: node closures in
 * topological order, then an `executePipeline` function that wires them.
 * @module dsh-obsidian-vault/pur-kernel/codegen-js
 */
import type { PurCodegenCoreLabels, PurCodegenJavaScriptLabels } from './codegen-labels.ts'
import { jsInputLine, nameMapOf, outputsLookup } from './codegen-shared.ts'
import type { PurPipeline } from './pipeline.ts'

/** Source upstream falls back to when a node declares no code. */
const DEFAULT_JS = 'function process() { return {}; }'

/**
 * Render the pipeline as JavaScript.
 * @param pipeline - built pipeline.
 * @param core - shared labels.
 * @param js - JavaScript-specific labels.
 * @param header - document header already formatted by the adapter.
 * @returns the module text.
 */
export function renderJavaScript(pipeline: PurPipeline, core: PurCodegenCoreLabels, js: PurCodegenJavaScriptLabels, header: string): string {
  const names = nameMapOf(pipeline)
  const outputsOf = outputsLookup(pipeline)
  let out = `// Pur Studio - ${header}\n\n`

  pipeline.nodes.forEach((node, index) => {
    out += `// ${js.nodeHeading(index + 1, node.title)}\n`
    out += `const ${node.safeName} = (() => {\n`
    for (const line of (node.linkedCode || node.content || node.code || DEFAULT_JS).split('\n')) out += `  ${line}\n`
    out += `  return { process };\n})();\n\n`
  })

  out += `// ${js.pipelineHeading}\nfunction executePipeline() {\n  const results = {};\n\n`
  pipeline.nodes.forEach((node, index) => {
    out += `  // ${js.nodeSection(index + 1, node.title)}\n`
    if (node.inputs.length === 0) {
      out += `  results['${node.safeName}'] = ${node.safeName}.process({});\n\n`
      return
    }
    out += `  const ${node.safeName}_inputs = {};\n`
    const sources = pipeline.inputMap.get(node.id) ?? new Map()
    for (const pin of node.inputs) out += jsInputLine(node.safeName, pin, sources.get(pin.id), names, outputsOf)
    out += `  results['${node.safeName}'] = ${node.safeName}.process(${node.safeName}_inputs);\n\n`
  })
  out += `  return results;\n}\n\ntry {\n  const pipelineResult = executePipeline();\n  console.log('${core.resultBanner}', pipelineResult);\n} catch (err) {\n  console.error('${core.errorBanner}', err);\n}\n`
  return out
}

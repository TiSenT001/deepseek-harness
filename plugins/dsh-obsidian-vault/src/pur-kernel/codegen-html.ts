/**
 * Render a pipeline as a self-contained HTML page that lays out the node cards
 * and runs the pipeline in the browser.
 * @module dsh-obsidian-vault/pur-kernel/codegen-html
 */
import type { PurCodegenHtmlLabels } from './codegen-labels.ts'
import { jsInputLine, nameMapOf, outputsLookup } from './codegen-shared.ts'
import type { PurPipeline } from './pipeline.ts'

/** Source upstream shows on a card when a node declares no code. */
const DEFAULT_HTML = 'function process() { return {}; }'

/**
 * Render the pipeline as an HTML document.
 * @param pipeline - built pipeline.
 * @param labels - HTML-specific labels.
 * @param header - document header already formatted by the adapter.
 * @returns the page text.
 */
export function renderHtml(pipeline: PurPipeline, labels: PurCodegenHtmlLabels, header: string): string {
  const names = nameMapOf(pipeline)
  const outputsOf = outputsLookup(pipeline)
  const cards = pipeline.nodes.map((node, index) => cardOf(node, index, labels)).join('')
  const runner = pipeline.nodes.map((node, index) => runnerBlockOf(pipeline, node, index, names, outputsOf, labels)).join('\n')
  const definitions = pipeline.nodes
    .map((node) => `  const ${node.safeName} = (() => {\n${indent(node.linkedCode || node.content || node.code || DEFAULT_HTML)}\n  return { process };\n  })();`)
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="${labels.lang}">
<head>
<meta charset="UTF-8">
<title>${labels.title(header)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
  h1 { margin: 0 0 8px 0; font-size: 20px; color: #4a9eff; }
  .meta { color: #8b949e; font-size: 12px; margin-bottom: 20px; }
  .toolbar { margin-bottom: 20px; }
  .toolbar button { background: #4a9eff; color: #fff; border: none; border-radius: 4px; padding: 8px 18px; font-size: 13px; font-weight: bold; cursor: pointer; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .node-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }
  .node-title { font-weight: bold; color: #4a9eff; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #21262d; padding-bottom: 6px; }
  .node-pins { display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px; }
  .pin-col { flex: 1; }
  .pin-head { color: #8b949e; margin-bottom: 4px; font-weight: bold; }
  .pin-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .pin-label { color: #c9d1d9; }
  .pin-val { color: #f0883e; font-family: monospace; }
  .pin-empty { color: #6e7681; font-style: italic; }
  .node-src { background: #010409; border: 1px solid #21262d; border-radius: 4px; padding: 8px; font-size: 10px; color: #8b949e; margin: 0; overflow: auto; max-height: 100px; }
  .output { margin-top: 24px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
  .error { background: #3a1d1d; border-color: #7a3636; color: #ff8b8b; }
</style>
</head>
<body>
<div class="meta">${header}</div>
<div class="toolbar"><button id="run-btn">${labels.runButton}</button></div>
<div class="grid">${cards}</div>
<div class="output" id="output">${labels.runPrompt}</div>

<script>
  ${labels.nodesHeading}
${definitions}

  ${labels.helpersHeading}
  function pretty(v) {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    try { return typeof v === 'object' ? JSON.stringify(v, null, 0) : String(v); }
    catch (e) { return String(v); }
  }
  function renderNode(name, inputs, outputs) {
    Object.keys(inputs || {}).forEach(k => {
      const el = document.getElementById('in-' + name + '-' + k);
      if (el) el.textContent = pretty(inputs[k]);
    });
    Object.keys(outputs || {}).forEach(k => {
      const el = document.getElementById('out-' + name + '-' + k);
      if (el) el.textContent = pretty(outputs[k]);
    });
  }

  ${labels.runnerHeading}
  function executePipeline() {
    const results = {};
${runner}
    return results;
  }

  document.getElementById('run-btn').onclick = function () {
    const out = document.getElementById('output');
    out.classList.remove('error');
    try {
      const r = executePipeline();
      out.textContent = '${labels.success}' + JSON.stringify(r, null, 2);
    } catch (err) {
      out.classList.add('error');
      out.textContent = '${labels.failure}' + (err.message || err);
      console.error(err);
    }
  };
</script>
</body>
</html>`
}

/**
 * Render one node card.
 * @param node - pipeline node.
 * @param index - zero-based execution position.
 * @param labels - HTML labels.
 * @returns the card markup.
 */
function cardOf(node: PurPipeline['nodes'][number], index: number, labels: PurCodegenHtmlLabels): string {
  const outs = node.outputs
    .map((pin) => `<div class="pin-row"><span class="pin-label">${pin.label}</span><span class="pin-val" id="out-${node.safeName}-${pin.label}">—</span></div>`)
    .join('')
  const ins = node.inputs
    .map((pin) => `<div class="pin-row"><span class="pin-label">${pin.label}</span><span class="pin-val" id="in-${node.safeName}-${pin.label}">—</span></div>`)
    .join('')
  const source = (node.linkedCode || node.content || node.code || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div class="node-card">
          <div class="node-title">${labels.card(index + 1, node.title)}</div>
          <div class="node-pins">
            <div class="pin-col"><div class="pin-head">${labels.inputs}</div>${ins || `<div class="pin-empty">${labels.noPins}</div>`}</div>
            <div class="pin-col"><div class="pin-head">${labels.outputs}</div>${outs || `<div class="pin-empty">${labels.noPins}</div>`}</div>
          </div>
          <pre class="node-src">${source}</pre>
        </div>`
}

/**
 * Render the statements one node contributes to the runner.
 * @param pipeline - built pipeline.
 * @param node - pipeline node.
 * @param index - zero-based execution position.
 * @param names - id to variable name.
 * @param outputsOf - output pins by node id.
 * @param labels - HTML labels.
 * @returns the statements.
 */
function runnerBlockOf(
  pipeline: PurPipeline,
  node: PurPipeline['nodes'][number],
  index: number,
  names: Map<string, string>,
  outputsOf: (id: string) => readonly { id: string; label: string }[] | undefined,
  labels: PurCodegenHtmlLabels,
): string {
  const head = `  // ${labels.runnerSection(index + 1, node.title)}\n`
  if (node.inputs.length === 0) {
    return `${head}  results['${node.safeName}'] = ${node.safeName}.process({});\n  renderNode('${node.safeName}', {}, results['${node.safeName}']);`
  }
  let block = `${head}  const ${node.safeName}_inputs = {};\n`
  const sources = pipeline.inputMap.get(node.id) ?? new Map()
  for (const pin of node.inputs) block += jsInputLine(node.safeName, pin, sources.get(pin.id), names, outputsOf)
  block += `  results['${node.safeName}'] = ${node.safeName}.process(${node.safeName}_inputs);\n  renderNode('${node.safeName}', ${node.safeName}_inputs, results['${node.safeName}']);`
  return block
}

/**
 * Prefix every line of source with two spaces.
 * @param source - node source text.
 * @returns the indented text.
 */
function indent(source: string): string {
  return source
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
}

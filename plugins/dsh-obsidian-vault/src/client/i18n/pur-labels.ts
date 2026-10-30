/**
 * Build the kernel label bundles from a flat `pur.*` dictionary reader, so
 * both adapters share one mapping. Parameterized labels use `{token}`
 * placeholders interpolated here.
 * @module dsh-obsidian-vault/client/i18n/pur-labels
 */
import type {
  PurCodegenCoreLabels,
  PurCodegenHtmlLabels,
  PurCodegenJavaScriptLabels,
  PurCodegenPythonLabels,
  PurControllerLabels,
  PurExportTextLabels,
  PurMenuEntry,
  PurRenderLabels,
} from '../../pur-kernel/index.ts'

/** Every bundle an adapter hands to the kernel, from one dictionary. */
export interface PurLabelBundles {
  /** Controller copy. */
  controller: PurControllerLabels
  /** Renderer copy. */
  render: PurRenderLabels
  /** Generated-code core fragments. */
  codegenCore: PurCodegenCoreLabels
  /** JavaScript generator fragments. */
  codegenJs: PurCodegenJavaScriptLabels
  /** HTML generator fragments. */
  codegenHtml: PurCodegenHtmlLabels
  /** Python generator fragments. */
  codegenPy: PurCodegenPythonLabels
  /** Export-as-text fragments. */
  exportText: PurExportTextLabels
  /**
   * Resolve a menu entry's display title.
   * @param entry - the menu entry.
   * @returns the literal label, the localized `labelKey` title, or the id.
   */
  menuTitle: (entry: PurMenuEntry) => string
}

/** Interpolate `{token}` placeholders in a dictionary template. */
function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => tokens[key] ?? match)
}

/**
 * Build every label bundle from a dictionary reader.
 * @param read - resolves a `pur.*` key to localized text; unknown keys return the key.
 * @returns the bundles.
 */
export function buildPurLabels(read: (key: string) => string): PurLabelBundles {
  return {
    controller: {
      textPlaceholder: read('pur.textPlaceholder'),
      codeNodeFallbackTitle: read('pur.codeNodeFallbackTitle'),
      copiedElements: (count) => fill(read('pur.copiedElements'), { n: String(count) }),
      relinkedFrom: read('pur.relinkedFrom'),
      relinkedTo: read('pur.relinkedTo'),
      lineCreated: read('pur.lineCreated'),
      connectNeedsTwo: read('pur.connectNeedsTwo'),
      selectTwoToGroup: read('pur.selectTwoToGroup'),
      saved: read('pur.saved'),
      lockedNotice: read('pur.lockedNotice'),
      nodeUpdated: read('pur.nodeUpdated'),
      nodeDeleted: read('pur.nodeDeleted'),
      webLinkCard: read('pur.webLinkCard'),
    },
    render: {
      imageLoading: read('pur.imageLoading'),
      codeNodeFallbackTitle: read('pur.codeNodeFallbackTitle'),
      codeNodeBadge: read('pur.codeNodeBadge'),
      noteLinkFallback: read('pur.noteLinkFallback'),
      codeCardPrefix: read('pur.codeCardPrefix'),
    },
    codegenCore: {
      header: (nodes, edges, time) => fill(read('pur.codegenHeader'), { n: String(nodes), m: String(edges), time }),
      resultBanner: read('pur.codegenResultBanner'),
      errorBanner: read('pur.codegenErrorBanner'),
    },
    codegenJs: {
      nodeHeading: (index, title) => fill(read('pur.codegenJsNodeHeading'), { index: String(index), title }),
      nodeSection: (index, title) => fill(read('pur.codegenJsNodeSection'), { index: String(index), title }),
      pipelineHeading: read('pur.codegenJsPipelineHeading'),
    },
    codegenHtml: {
      lang: read('pur.codegenHtmlLang'),
      title: (header) => fill(read('pur.codegenHtmlTitle'), { header }),
      inputs: read('pur.codegenInputs'),
      outputs: read('pur.codegenOutputs'),
      noPins: read('pur.codegenNoPins'),
      card: (index, title) => fill(read('pur.codegenHtmlCard'), { index: String(index), title }),
      nodesHeading: read('pur.codegenHtmlNodesHeading'),
      helpersHeading: read('pur.codegenHtmlHelpersHeading'),
      runnerHeading: read('pur.codegenHtmlRunnerHeading'),
      runnerSection: (index, title) => fill(read('pur.codegenHtmlRunnerSection'), { index: String(index), title }),
      runButton: read('pur.codegenHtmlRunButton'),
      runPrompt: read('pur.codegenHtmlRunPrompt'),
      success: read('pur.codegenHtmlSuccess'),
      failure: read('pur.codegenHtmlFailure'),
    },
    codegenPy: {
      topology: (names) => fill(read('pur.codegenPyTopology'), { names: names.join(' → ') }),
      nodeHeading: (index, title) => fill(read('pur.codegenPyNodeHeading'), { index: String(index), title }),
      nodeSection: (index, title) => fill(read('pur.codegenPyNodeSection'), { index: String(index), title }),
      pipelineHeading: read('pur.codegenPyPipelineHeading'),
    },
    exportText: {
      fallbackTitle: read('pur.exportFallbackTitle'),
      exportedAt: (time) => fill(read('pur.exportedAt'), { time }),
      groupFallback: read('pur.exportGroupFallback'),
      imageBucket: read('pur.exportImageBucket'),
    },
    menuTitle: (entry) => {
      if (entry.label !== undefined) return entry.label
      if (entry.labelKey === undefined) return entry.id
      const title = read('pur.' + entry.labelKey)
      if (entry.value !== undefined && (entry.labelKey === 'pinInputN' || entry.labelKey === 'pinOutputN')) return `${title} ${entry.value}`
      return title
    },
  }
}

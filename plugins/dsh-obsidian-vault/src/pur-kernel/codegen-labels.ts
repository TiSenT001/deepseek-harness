/**
 * Localized fragments the generated-code renderers interpolate. Adapters fill
 * these from their locale dictionary; the kernel itself holds no copy.
 * @module dsh-obsidian-vault/pur-kernel/codegen-labels
 */

/** Fragments every generated-code format needs. */
export interface PurCodegenCoreLabels {
  /**
   * Document header appended to the generator banner.
   * @param nodeCount - number of pipeline nodes.
   * @param edgeCount - number of pin connections.
   * @param time - locale-formatted generation time.
   * @returns the header text.
   */
  header: (nodeCount: number, edgeCount: number, time: string) => string
  /** Console text preceding the pipeline result. */
  resultBanner: string
  /** Console text preceding an execution error. */
  errorBanner: string
}

/** Fragments the JavaScript renderer interpolates. */
export interface PurCodegenJavaScriptLabels {
  /**
   * Banner above one node variable.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the text after the `//` marker.
   */
  nodeHeading: (index: number, title: string) => string
  /**
   * Banner inside the execution function.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the text after the `//` marker.
   */
  nodeSection: (index: number, title: string) => string
  /** Banner above the execution function, after the `//` marker. */
  pipelineHeading: string
}

/** Fragments the HTML renderer interpolates. */
export interface PurCodegenHtmlLabels {
  /** `lang` attribute of the generated page. */
  lang: string
  /**
   * Browser tab title.
   * @param header - document header.
   * @returns the page title.
   */
  title: (header: string) => string
  /** Column heading above input pins. */
  inputs: string
  /** Column heading above output pins. */
  outputs: string
  /** Placeholder when a node has no pins on a side. */
  noPins: string
  /**
   * Heading of one node card.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the heading text.
   */
  card: (index: number, title: string) => string
  /** Script comment above the node definitions. */
  nodesHeading: string
  /** Script comment above the rendering helpers. */
  helpersHeading: string
  /** Script comment above the pipeline runner. */
  runnerHeading: string
  /**
   * Banner inside the generated runner function.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the text after the `//` marker.
   */
  runnerSection: (index: number, title: string) => string
  /** Run button caption. */
  runButton: string
  /** Output placeholder before the pipeline runs. */
  runPrompt: string
  /** Success text, escaped for a single-quoted JavaScript string, trailing newline included. */
  success: string
  /** Failure text, escaped for a single-quoted JavaScript string, trailing newline included. */
  failure: string
}

/** Fragments the Python renderer interpolates. */
export interface PurCodegenPythonLabels {
  /**
   * Comment listing the execution order.
   * @param names - generated variable names in execution order.
   * @returns the text after the `#` marker.
   */
  topology: (names: readonly string[]) => string
  /**
   * Banner above one node function.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the text after the `#` marker.
   */
  nodeHeading: (index: number, title: string) => string
  /**
   * Banner inside the pipeline function.
   * @param index - one-based execution position.
   * @param title - node title.
   * @returns the text after the `#` marker.
   */
  nodeSection: (index: number, title: string) => string
  /** Comment above the pipeline function, after the `#` marker. */
  pipelineHeading: string
}

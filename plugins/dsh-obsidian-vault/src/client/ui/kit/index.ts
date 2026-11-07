/**
 * The UI kit: class names, the composed stylesheet, tokens, variants, shared
 * surface states, and the surface registry. Components import from here, never
 * from raw style modules.
 * @module dsh-obsidian-vault/client/ui/kit
 */
import { CHROME_STYLE } from './styles/chrome.ts'
import { CONTENT_STYLE } from './styles/content.ts'
import { CONTROLS_STYLE } from './styles/controls.ts'
import { DIALOG_STYLE } from './styles/dialog.ts'
import { EDITOR_STYLE } from './styles/editor.ts'
import { FILE_STYLE } from './styles/files.ts'
import { FRAME_STYLE } from './styles/frame.ts'
import { GRAPH_STYLE } from './styles/graph.ts'
import { PUR_STYLE } from './styles/pur.ts'
import { RESPONSIVE_STYLE } from './styles/responsive.ts'
import { SHELL_STYLE } from './styles/shell.ts'
import { WORKSPACE_STYLE } from './styles/workspace.ts'
import { TOKEN_CSS } from './tokens.ts'
import { VARIANT_CSS } from './variants.ts'

export { css } from './classes.ts'
export { Slider, Toggle } from './controls.tsx'
export { EmptyState, ErrorState, LoadingState, type EmptyStateProps, type ErrorStateProps, type LoadingStateProps } from './states.tsx'
export { RAIL_SURFACES, VIEW_SURFACES, railSurface, type RailId, type RailSurface, type ViewSurface } from './registry.ts'
export { CHROME, EASE, LAYOUT as LAYOUT_TOKENS, MOTION, RADIUS, SPACE, TOKEN_CSS, TYPE } from './tokens.ts'
export { applyVariant, readVariant, VARIANT_ATTRIBUTE, type Variant } from './variants.ts'

/** All component rules, in cascade order: tokens, base, then variant deltas. */
export const STYLE = [
  TOKEN_CSS,
  FRAME_STYLE,
  SHELL_STYLE,
  WORKSPACE_STYLE,
  DIALOG_STYLE,
  CONTENT_STYLE,
  CHROME_STYLE,
  FILE_STYLE,
  EDITOR_STYLE,
  GRAPH_STYLE,
  PUR_STYLE,
  CONTROLS_STYLE,
  RESPONSIVE_STYLE,
  VARIANT_CSS,
].join('\n')

/**
 * Design tokens for the vault UI. Everything visual that is not a colour lives
 * here so a variant can shift the whole surface without touching components.
 * Colours stay on `--dsw-*` tokens; these are spacing/size/timing values.
 * @module dsh-obsidian-vault/client/ui/kit/tokens
 */

/** One spacing step, in px. */
export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const

/** Corner radii, matching Obsidian's `--radius-s/m/l`. */
export const RADIUS = { s: 4, m: 8, l: 12 } as const

/** Motion timings, in ms. */
export const MOTION = { fast: 120, normal: 180, slow: 320 } as const

/** Shared easing so every transition leaves and lands the same way. */
export const EASE = 'cubic-bezier(.2, .7, .3, 1)'

/** Reading column width and page padding. */
export const LAYOUT = { lineWidth: 700, pagePadding: 32 } as const

/** Type scale, in px; `lineHeight` is the body ratio. */
export const TYPE = {
  body: 16,
  uiTiny: 11,
  uiSmall: 12,
  uiMedium: 13,
  uiLarge: 15,
  title: 18,
  lineHeight: 1.5,
} as const

/** Chrome sizes, in px, and the docked column limits. */
export const CHROME = {
  ribbon: 44,
  statusBar: 24,
  splitter: 5,
  leftMin: 220,
  leftMax: 480,
  leftDefault: 248,
  rightMin: 240,
  rightMax: 520,
  rightDefault: 288,
} as const

/** CSS custom properties the kit publishes for stylesheet-level use. */
export const TOKEN_CSS = `:root {
  /* Fixed brand accent: the Host brand token flips to near-white in dark mode,
     which reads as a second ring instead of the vault's blue focus. */
  --ov-accent: #4d6bfe;
  --ov-focus: #4d6bfe;
  --ov-space-xxs: ${SPACE.xxs}px;
  --ov-space-xs: ${SPACE.xs}px;
  --ov-space-sm: ${SPACE.sm}px;
  --ov-space-md: ${SPACE.md}px;
  --ov-space-lg: ${SPACE.lg}px;
  --ov-space-xl: ${SPACE.xl}px;
  --ov-radius-s: ${RADIUS.s}px;
  --ov-radius-m: ${RADIUS.m}px;
  --ov-radius-l: ${RADIUS.l}px;
  --ov-motion-fast: ${MOTION.fast}ms;
  --ov-motion-normal: ${MOTION.normal}ms;
  --ov-ease: ${EASE};
  --ov-font-ui: ${TYPE.uiMedium}px;
  --ov-font-small: ${TYPE.uiSmall}px;
  --ov-font-tiny: ${TYPE.uiTiny}px;
  --ov-line-width: ${LAYOUT.lineWidth}px;
  --ov-page-padding: ${LAYOUT.pagePadding}px;
  --ov-ribbon-width: ${CHROME.ribbon}px;
  --ov-statusbar-height: ${CHROME.statusBar}px;
  --ov-splitter-width: ${CHROME.splitter}px;
}`

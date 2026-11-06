/**
 * Plugin settings: the fields the DSH settings panel renders and the defaults the
 * Host falls back to. Everything the canvas lets a user tune lives here so the
 * panel, the routes and the client read one definition.
 * @module dsh-obsidian-vault/settings
 */
import z from '@deepseek-ai/schemastery'

/** Values used when the settings panel leaves a field empty. */
export const DEFAULT_SETTINGS = {
  vault: '',
  ignore: ['.obsidian', '.trash', '.git', 'node_modules', '.DS_Store', '__pycache__'],
  maxFileBytes: 2 * 1024 * 1024,
  maxIndexBytes: 64 * 1024 * 1024,
  maxDepth: 12,
  runTimeoutMs: 1500,
  allowCodeExecution: true,
  saveDelayMs: 400,
  largeCanvasHintMb: 4,
  showGrid: true,
  exportScale: 1,
  exportTransparent: true,
  exportJpgQuality: 0.9,
  snapEnabled: true,
  snapDistance: 8,
  autoPanMaxSpeed: 12,
  lineHitTolerance: 25,
} as const

/** Settings after defaults are applied and numbers are clamped. */
export interface Settings {
  /** Configured vault root; empty means auto-detect. */
  vault: string
  /** Directory names skipped while walking. */
  ignore: readonly string[]
  /** Largest note parsed into the index, in bytes. */
  maxFileBytes: number
  /** Total note text kept in memory, in bytes. */
  maxIndexBytes: number
  /** Depth limit for the directory walk. */
  maxDepth: number
  /** Wall-clock limit for one code-node evaluation, in milliseconds. */
  runTimeoutMs: number
  /** Whether the canvas may run code nodes at all. */
  allowCodeExecution: boolean
  /** Delay before an edit is written to disk, in milliseconds. */
  saveDelayMs: number
  /** Embedded-image size above which the pane suggests externalizing, in MB. */
  largeCanvasHintMb: number
  /** Initial grid visibility for a canvas without its own preference. */
  showGrid: boolean
  /** Bitmap export multiplier: 1 is pixel-exact, 2 is a retina copy. */
  exportScale: number
  /** Whether PNG exports keep a transparent background. */
  exportTransparent: boolean
  /** JPEG quality for image exports, 0.4 to 1. */
  exportJpgQuality: number
  /** Whether dragging latches onto neighbours. */
  snapEnabled: boolean
  /** Snap radius in screen pixels. */
  snapDistance: number
  /** Auto-pan speed ceiling in world units per frame. */
  autoPanMaxSpeed: number
  /** Click tolerance for connections, in screen pixels. */
  lineHitTolerance: number
}

/** The subset the browser half needs. */
export interface ClientSettings {
  /** Wall-clock limit for one evaluation, in milliseconds. */
  runTimeoutMs: number
  /** Delay before an edit is written to disk. */
  saveDelayMs: number
  /** Embedded-image size above which the pane suggests externalizing. */
  largeCanvasHintMb: number
  /** Initial grid visibility. */
  showGrid: boolean
  /** Whether code nodes may run. */
  allowCodeExecution: boolean
  /** Bitmap export multiplier. */
  exportScale: number
  /** Whether PNG exports keep a transparent background. */
  exportTransparent: boolean
  /** JPEG quality for image exports. */
  exportJpgQuality: number
  /** Whether dragging latches onto neighbours. */
  snapEnabled: boolean
  /** Snap radius in screen pixels. */
  snapDistance: number
  /** Auto-pan speed ceiling in world units per frame. */
  autoPanMaxSpeed: number
  /** Click tolerance for connections, in screen pixels. */
  lineHitTolerance: number
}

/** Schema the settings panel renders. */
export const Config = z.object({
  vault: z.string().default('').description('库根目录；留空则自动探测 .obsidian 所在目录'),
  ignore: z.array(z.string()).default([...DEFAULT_SETTINGS.ignore]).description('建索引时跳过的目录名'),
  maxFileBytes: z.natural().default(DEFAULT_SETTINGS.maxFileBytes).description('单篇笔记进入索引的最大字节数'),
  maxIndexBytes: z.natural().default(DEFAULT_SETTINGS.maxIndexBytes).description('索引中保留的笔记正文总量，超出后按需读取'),
  maxDepth: z.natural().default(DEFAULT_SETTINGS.maxDepth).description('目录遍历深度上限'),
  runTimeoutMs: z.natural().default(DEFAULT_SETTINGS.runTimeoutMs).description('代码节点单次运行超时（毫秒，200–10000）'),
  allowCodeExecution: z.boolean().default(DEFAULT_SETTINGS.allowCodeExecution).description('允许在画布里运行代码节点'),
  saveDelayMs: z.natural().default(DEFAULT_SETTINGS.saveDelayMs).description('编辑后写盘的防抖延迟（毫秒，100–5000）'),
  largeCanvasHintMb: z.natural().default(DEFAULT_SETTINGS.largeCanvasHintMb).description('提示外部化图片的文档体积阈值（MB）'),
  showGrid: z.boolean().default(DEFAULT_SETTINGS.showGrid).description('新画布默认显示网格'),
  exportScale: z.natural().default(DEFAULT_SETTINGS.exportScale).description('导出位图的缩放倍率（1–3）'),
  exportTransparent: z.boolean().default(DEFAULT_SETTINGS.exportTransparent).description('PNG 导出保留透明背景'),
  exportJpgQuality: z.number().default(DEFAULT_SETTINGS.exportJpgQuality).description('JPG 导出质量（0.4–1，步长 0.05）'),
  snapEnabled: z.boolean().default(DEFAULT_SETTINGS.snapEnabled).description('拖动时吸附到相邻卡片'),
  snapDistance: z.natural().default(DEFAULT_SETTINGS.snapDistance).description('吸附半径（屏幕像素，0–40）'),
  autoPanMaxSpeed: z.natural().default(DEFAULT_SETTINGS.autoPanMaxSpeed).description('拖到边缘时每帧最大平移量（1–60）'),
  lineHitTolerance: z.natural().default(DEFAULT_SETTINGS.lineHitTolerance).description('点击连线的容差（屏幕像素，8–60）'),
})

/**
 * Clamp a numeric setting into a range.
 * @param value - candidate value.
 * @param fallback - value used when the candidate is not a finite number.
 * @param min - smallest accepted value.
 * @param max - largest accepted value.
 * @returns the clamped value.
 */
function clamp(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * Clamp a fractional setting into a range.
 * @param value - candidate value.
 * @param fallback - value used when the candidate is not a finite number.
 * @param min - smallest accepted value.
 * @param max - largest accepted value.
 * @returns the clamped value, rounded to two decimals.
 */
function clampFloat(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100
}

/**
 * Resolve raw loader config into the runtime settings.
 * @param input - value the Loader handed to `apply`, possibly empty or malformed.
 * @returns every field with defaults applied and numbers clamped.
 */
export function resolveSettings(input: unknown): Settings {
  const raw = input !== null && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const ignore = Array.isArray(raw['ignore'])
    ? (raw['ignore'] as unknown[]).filter((entry): entry is string => typeof entry === 'string')
    : [...DEFAULT_SETTINGS.ignore]
  return {
    vault: typeof raw['vault'] === 'string' ? raw['vault'] : DEFAULT_SETTINGS.vault,
    ignore,
    maxFileBytes: clamp(raw['maxFileBytes'], DEFAULT_SETTINGS.maxFileBytes, 64 * 1024, 512 * 1024 * 1024),
    maxIndexBytes: clamp(raw['maxIndexBytes'], DEFAULT_SETTINGS.maxIndexBytes, 1024 * 1024, 8 * 1024 * 1024 * 1024),
    maxDepth: clamp(raw['maxDepth'], DEFAULT_SETTINGS.maxDepth, 1, 64),
    runTimeoutMs: clamp(raw['runTimeoutMs'], DEFAULT_SETTINGS.runTimeoutMs, 200, 10_000),
    allowCodeExecution: typeof raw['allowCodeExecution'] === 'boolean' ? raw['allowCodeExecution'] : DEFAULT_SETTINGS.allowCodeExecution,
    exportScale: clamp(raw['exportScale'], DEFAULT_SETTINGS.exportScale, 1, 3),
    exportTransparent: typeof raw['exportTransparent'] === 'boolean' ? raw['exportTransparent'] : DEFAULT_SETTINGS.exportTransparent,
    exportJpgQuality: clampFloat(raw['exportJpgQuality'], DEFAULT_SETTINGS.exportJpgQuality, 0.4, 1),
    snapEnabled: typeof raw['snapEnabled'] === 'boolean' ? raw['snapEnabled'] : DEFAULT_SETTINGS.snapEnabled,
    snapDistance: clamp(raw['snapDistance'], DEFAULT_SETTINGS.snapDistance, 0, 40),
    autoPanMaxSpeed: clamp(raw['autoPanMaxSpeed'], DEFAULT_SETTINGS.autoPanMaxSpeed, 1, 60),
    lineHitTolerance: clamp(raw['lineHitTolerance'], DEFAULT_SETTINGS.lineHitTolerance, 8, 60),
    saveDelayMs: clamp(raw['saveDelayMs'], DEFAULT_SETTINGS.saveDelayMs, 100, 5_000),
    largeCanvasHintMb: clamp(raw['largeCanvasHintMb'], DEFAULT_SETTINGS.largeCanvasHintMb, 1, 500),
    showGrid: typeof raw['showGrid'] === 'boolean' ? raw['showGrid'] : DEFAULT_SETTINGS.showGrid,
  }
}

/**
 * Pick the fields the browser half needs.
 * @param settings - resolved settings.
 * @returns the client subset.
 */
export function clientSettings(settings: Settings): ClientSettings {
  return {
    runTimeoutMs: settings.runTimeoutMs,
    saveDelayMs: settings.saveDelayMs,
    largeCanvasHintMb: settings.largeCanvasHintMb,
    showGrid: settings.showGrid,
    allowCodeExecution: settings.allowCodeExecution,
    exportScale: settings.exportScale,
    exportTransparent: settings.exportTransparent,
    exportJpgQuality: settings.exportJpgQuality,
    snapEnabled: settings.snapEnabled,
    snapDistance: settings.snapDistance,
    autoPanMaxSpeed: settings.autoPanMaxSpeed,
    lineHitTolerance: settings.lineHitTolerance,
  }
}

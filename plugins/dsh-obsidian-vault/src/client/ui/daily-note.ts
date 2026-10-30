/**
 * Daily-note configuration from Obsidian's `daily-notes.json`. The format
 * tokens cover what Obsidian's core plugin documents for its default formats;
 * any other text is kept literally.
 * @module dsh-obsidian-vault/client/ui/daily-note
 */

/** The `.obsidian` file that configures daily notes. */
export const DAILY_CONFIG = 'daily-notes'

/** Obsidian's default date format for a new daily note. */
export const DEFAULT_DAILY_FORMAT = 'YYYY-MM-DD'

/** Fields read from `daily-notes.json`; unknown keys are ignored. */
export interface DailyNoteConfig {
  readonly folder?: string
  /** Date format using `YYYY`, `YY`, `MM`, `M`, `DD`, and `D` tokens. */
  readonly format?: string
  /** Vault-relative path of the note used as a template. */
  readonly template?: string
}

/** Where today's daily note lives. */
export interface DailyTarget {
  /** Folder to create before the note, when configured. */
  readonly folder?: string
  readonly path: string
  readonly template?: string
}

/** A non-empty, trimmed string, or `undefined` for anything else. */
function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/** Normalise a vault-relative folder: separators unified, edges trimmed. */
function folderOf(value: unknown): string | undefined {
  const raw = text(value)
  if (raw === undefined) return undefined
  const trimmed = raw.replace(/^[\\/]+|[\\/]+$/g, '').replace(/\\/g, '/')
  return trimmed.length === 0 ? undefined : trimmed
}

/**
 * Read the daily-note fields out of the parsed configuration.
 * @param value - the parsed `daily-notes.json`, or `undefined` when absent.
 * @returns the fields this plugin uses; missing or mistyped fields are dropped.
 */
export function parseDailyConfig(value: unknown): DailyNoteConfig {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const folder = folderOf(record.folder)
  const format = text(record.format)
  const template = folderOf(record.template)
  return {
    ...(folder === undefined ? {} : { folder }),
    ...(format === undefined ? {} : { format }),
    ...(template === undefined ? {} : { template }),
  }
}

/**
 * Expand a daily-note date format.
 * @param format - token string; unknown characters stay literal.
 * @param date - the day to format, in local time.
 * @returns the file name without extension.
 */
export function formatDailyName(format: string, date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return format.replace(/YYYY|YY|MM|M|DD|D/g, (token) => {
    switch (token) {
      case 'YYYY':
        return String(date.getFullYear())
      case 'YY':
        return String(date.getFullYear()).slice(-2)
      case 'MM':
        return pad(date.getMonth() + 1)
      case 'M':
        return String(date.getMonth() + 1)
      case 'DD':
        return pad(date.getDate())
      default:
        return String(date.getDate())
    }
  })
}

/**
 * Resolve today's note path from the configuration.
 * @param value - the parsed `daily-notes.json`, or `undefined` when absent.
 * @param now - the day to name the note after.
 * @returns the folder to ensure, the Markdown path, and any template path.
 */
export function dailyTarget(value: unknown, now: Date): DailyTarget {
  const config = parseDailyConfig(value)
  const name = formatDailyName(config.format ?? DEFAULT_DAILY_FORMAT, now)
  const file = `${name}.md`
  return {
    ...(config.folder === undefined ? {} : { folder: config.folder }),
    path: config.folder === undefined ? file : `${config.folder}/${file}`,
    ...(config.template === undefined ? {} : { template: config.template }),
  }
}

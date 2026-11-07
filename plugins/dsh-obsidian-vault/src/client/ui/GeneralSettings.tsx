/**
 * General settings section: reading, search, layout and the vault/index fields
 * the plugin owns. Reading, search and layout preferences persist in
 * `localStorage` and apply on the next render; the vault/index fields go through
 * the Host's saved settings file and apply after a DSH restart.
 * @module dsh-obsidian-vault/client/ui/GeneralSettings
 */
import { useCallback, useEffect, useState } from 'react'
import { fetchPurClientSettings, savePurClientSettings } from '../api-vault.ts'
import type { PurClientSettingsDto, PurSettingsPatch } from '../api-vault.ts'
import type { Translate } from '../i18n.ts'
import { css, SettingsRow, Toggle } from './kit/index.ts'
import { Select } from './kit/select.tsx'
import { DEFAULT_WIDTHS, WIDTHS_KEY, clampPane, parseWidths, serializeWidths } from './layoutPrefs.ts'
import { INLINE_BACKLINKS_KEY, parseInlineBacklinks, serializeInlineBacklinks } from './notePrefs.ts'
import { SEARCH_OPTIONS_KEY, parseSearchOptions, serializeSearchOptions } from './searchPrefs.ts'
import type { SearchOptions } from './searchPrefs.ts'

/** Bytes per megabyte; the vault/index fields are edited in MB. */
const MB = 1024 * 1024

/**
 * Read a stored preference without throwing when storage is unavailable.
 * @param key - localStorage key.
 * @returns the stored string, or null.
 */
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Private mode or a blocked store simply means "use the defaults".
    return null
  }
}

/**
 * Persist a preference without letting a full store break the dialog.
 * @param key - localStorage key.
 * @param value - serialized value.
 */
function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // A failed write leaves the current session value intact.
  }
}

/** Draft of the vault/index form; numbers stay text while editing. */
interface VaultDraft {
  vault: string
  ignoreText: string
  maxFileMb: string
  maxIndexMb: string
  maxDepth: string
}

/**
 * Build the vault/index draft from the Host payload.
 * @param dto - effective settings.
 * @returns the draft.
 */
function vaultDraftOf(dto: PurClientSettingsDto): VaultDraft {
  const round = (bytes: number | undefined, fallback: number): string =>
    bytes === undefined ? String(fallback) : String(Math.round((bytes / MB) * 10) / 10)
  return {
    vault: dto.vault ?? '',
    ignoreText: (dto.ignore ?? []).join('\n'),
    maxFileMb: round(dto.maxFileBytes, 2),
    maxIndexMb: dto.maxIndexBytes === undefined ? '64' : String(Math.round(dto.maxIndexBytes / MB)),
    maxDepth: dto.maxDepth === undefined ? '12' : String(dto.maxDepth),
  }
}

/**
 * Build the save patch from the draft, falling back on malformed numbers. The
 * canvas fields ride along unchanged: the Host stores one patch for the whole
 * dialog, so a section may not drop its siblings' values.
 * @param dto - effective settings the draft was built from.
 * @param draft - edited values.
 * @returns the patch to store.
 */
function vaultPatchOf(dto: PurClientSettingsDto, draft: VaultDraft): PurSettingsPatch {
  const numberIn = (text: string, fallback: number): number => {
    const parsed = Number(text)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  return {
    runTimeoutMs: dto.runTimeoutMs,
    allowCodeExecution: dto.allowCodeExecution,
    saveDelayMs: dto.saveDelayMs,
    largeCanvasHintMb: dto.largeCanvasHintMb,
    showGrid: dto.showGrid,
    exportScale: dto.exportScale,
    exportTransparent: dto.exportTransparent,
    exportJpgQuality: dto.exportJpgQuality,
    gridOpacity: dto.gridOpacity,
    snapEnabled: dto.snapEnabled,
    snapDistance: dto.snapDistance,
    autoPanMaxSpeed: dto.autoPanMaxSpeed,
    lineHitTolerance: dto.lineHitTolerance,
    vault: draft.vault.trim(),
    ignore: draft.ignoreText.split(/[\n,]/).map(entry => entry.trim()).filter(entry => entry.length > 0),
    maxFileBytes: Math.round(numberIn(draft.maxFileMb, 2) * MB),
    maxIndexBytes: Math.round(numberIn(draft.maxIndexMb, 64) * MB),
    maxDepth: Math.round(numberIn(draft.maxDepth, 12)),
  }
}

/** Props for {@link GeneralSettings}. */
export interface GeneralSettingsProps {
  readonly t: Translate
}

/**
 * Render the general settings sections.
 * @param props - translator.
 */
export function GeneralSettings({ t }: GeneralSettingsProps): JSX.Element {
  const [inlineBacklinks, setInlineBacklinks] = useState(() => parseInlineBacklinks(readLocal(INLINE_BACKLINKS_KEY)))
  const [search, setSearch] = useState(() => parseSearchOptions(readLocal(SEARCH_OPTIONS_KEY)))
  const [widths, setWidths] = useState(() => parseWidths(readLocal(WIDTHS_KEY)))
  const [dto, setDto] = useState<PurClientSettingsDto | undefined>()
  const [draft, setDraft] = useState<VaultDraft | undefined>()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  const loadVault = useCallback(() => {
    setError(undefined)
    void fetchPurClientSettings()
      .then((next) => {
        setDto(next)
        setDraft(vaultDraftOf(next))
      })
      .catch(() => setError(t('canvasSettingsLoadFailed')))
  }, [t])

  useEffect(() => {
    loadVault()
  }, [loadVault])

  const flipBacklinks = useCallback((next: boolean) => {
    setInlineBacklinks(next)
    writeLocal(INLINE_BACKLINKS_KEY, serializeInlineBacklinks(next))
  }, [])

  const updateSearch = useCallback((patch: Partial<SearchOptions>) => {
    setSearch((current) => {
      const next = { ...current, ...patch }
      writeLocal(SEARCH_OPTIONS_KEY, serializeSearchOptions(next))
      return next
    })
    setNotice(t('settingsSavedLocal'))
  }, [t])

  const updateWidth = useCallback((side: 'left' | 'right', text: string) => {
    setWidths((current) => {
      const next = { ...current, [side]: clampPane(side, Number(text)) }
      writeLocal(WIDTHS_KEY, serializeWidths(next))
      return next
    })
  }, [])

  const resetWidths = useCallback(() => {
    setWidths(DEFAULT_WIDTHS)
    writeLocal(WIDTHS_KEY, serializeWidths(DEFAULT_WIDTHS))
    setNotice(t('settingsSavedLocal'))
  }, [t])

  const saveVault = useCallback(() => {
    if (draft === undefined || dto === undefined) return
    setSaving(true)
    setNotice(undefined)
    void savePurClientSettings(vaultPatchOf(dto, draft))
      .then((next) => {
        setDto(next)
        setDraft(vaultDraftOf(next))
        setNotice(t('settingsSavedVault'))
      })
      .catch(() => setError(t('canvasSettingsFailed')))
      .finally(() => setSaving(false))
  }, [draft, dto, t])

  return (
    <div className={css.settings}>
      <div className={css.settingsGroup}>{t('settingsGroupReading')}</div>
      <SettingsRow label={t('settingInlineBacklinks')} hint={t('settingInlineBacklinksHint')}>
        <Toggle checked={inlineBacklinks} label="" ariaLabel={t('settingInlineBacklinks')} onChange={flipBacklinks} />
      </SettingsRow>

      <div className={css.settingsGroup}>{t('settingsGroupSearch')}</div>
      <SettingsRow label={t('settingSearchMatchCase')}>
        <Toggle checked={search.matchCase} label="" ariaLabel={t('settingSearchMatchCase')} onChange={matchCase => updateSearch({ matchCase })} />
      </SettingsRow>
      <SettingsRow label={t('settingSearchRegex')}>
        <Toggle checked={search.regex} label="" ariaLabel={t('settingSearchRegex')} onChange={regex => updateSearch({ regex })} />
      </SettingsRow>
      <SettingsRow label={t('settingSearchSort')}>
        <Select
          value={search.sort}
          options={[
            { value: 'relevance', label: t('settingSearchSortRelevance') },
            { value: 'name', label: t('settingSearchSortName') },
          ]}
          ariaLabel={t('settingSearchSort')}
          onChange={(value) => updateSearch({ sort: value === 'name' ? 'name' : 'relevance' })}
        />
      </SettingsRow>
      <SettingsRow label={t('settingSearchCompact')} hint={t('settingSearchCompactHint')}>
        <Toggle checked={search.compact} label="" ariaLabel={t('settingSearchCompact')} onChange={compact => updateSearch({ compact })} />
      </SettingsRow>

      <div className={css.settingsGroup}>{t('settingsGroupLayout')}</div>
      <SettingsRow label={t('settingPaneLeft')} unit="px">
        <input className={css.settingsInput} type="number" min={160} max={640} value={widths.left} onChange={event => updateWidth('left', event.target.value)} />
      </SettingsRow>
      <SettingsRow label={t('settingPaneRight')} unit="px">
        <input className={css.settingsInput} type="number" min={200} max={720} value={widths.right} onChange={event => updateWidth('right', event.target.value)} />
      </SettingsRow>
      <div className={css.settingsActions}>
        <button type="button" className={css.dialogButton} onClick={resetWidths}>
          {t('settingPaneReset')}
        </button>
      </div>

      <div className={css.settingsGroup}>{t('settingsGroupIndex')}</div>
      {error === undefined ? null : <div className={css.dialogError}>{error}</div>}
      {draft === undefined
        ? (error === undefined ? null : (
            <div className={css.settingsActions}>
              <button type="button" className={css.dialogButton} onClick={loadVault}>
                {t('pluginRefresh')}
              </button>
            </div>
          ))
        : (
          <>
            <SettingsRow label={t('settingVault')} hint={t('settingVaultHint')}>
              <input className={css.settingsInput} placeholder={t('settingVaultAuto')} value={draft.vault} onChange={event => setDraft({ ...draft, vault: event.target.value })} />
            </SettingsRow>
            <SettingsRow label={t('settingIgnore')} hint={t('settingIgnoreHint')}>
              <textarea className={css.settingsTextarea} rows={3} value={draft.ignoreText} onChange={event => setDraft({ ...draft, ignoreText: event.target.value })} />
            </SettingsRow>
            <SettingsRow label={t('settingMaxFile')} hint={t('settingMaxFileHint')} unit="MB">
              <input className={css.settingsInput} type="number" min={0.1} max={512} step={0.1} value={draft.maxFileMb} onChange={event => setDraft({ ...draft, maxFileMb: event.target.value })} />
            </SettingsRow>
            <SettingsRow label={t('settingMaxIndex')} hint={t('settingMaxIndexHint')} unit="MB">
              <input className={css.settingsInput} type="number" min={1} max={8192} value={draft.maxIndexMb} onChange={event => setDraft({ ...draft, maxIndexMb: event.target.value })} />
            </SettingsRow>
            <SettingsRow label={t('settingMaxDepth')} hint={t('settingMaxDepthHint')}>
              <input className={css.settingsInput} type="number" min={1} max={64} value={draft.maxDepth} onChange={event => setDraft({ ...draft, maxDepth: event.target.value })} />
            </SettingsRow>
            <div className={css.settingsHint}>{t('settingsRestartHint')}</div>
            <div className={css.settingsActions}>
              <button type="button" className={css.dialogButton} disabled={saving} onClick={saveVault}>
                {t('save')}
              </button>
            </div>
          </>
        )}
      {notice === undefined ? null : <div className={css.settingsHint}>{notice}</div>}
    </div>
  )
}

/**
 * The graph settings panel, rendered from {@link GRAPH_SCHEMA}: every control
 * writes one dotted path back into the settings object.
 * @module dsh-obsidian-vault/client/ui/GraphSettingsPanel
 */
import { useMemo } from 'react'
import type { GraphSettings } from '../graph/settings'
import {
  curveFor,
  GRAPH_SCHEMA,
  readPath,
  sliderToValue,
  valueToSlider,
  writePath,
  type GraphControl,
} from '../graph/schema'
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'
import { Slider, Toggle } from './kit/controls.tsx'

/** Props for {@link GraphSettingsPanel}. */
export interface GraphSettingsPanelProps {
  readonly t: Translate
  readonly settings: GraphSettings
  readonly onChange: (next: GraphSettings) => void
  readonly onClose: () => void
}

const GROUP_COLORS = ['#4d6bfe', '#3fb950', '#d29922', '#f85149', '#a371f7', '#39c5cf']

/**
 * Render the settings popover.
 * @param props - current settings and change callbacks.
 */
export function GraphSettingsPanel({ t, settings, onChange, onClose }: GraphSettingsPanelProps): JSX.Element {
  return (
    <div className={css.graphPanel} role="dialog" aria-label={t('graphSettings')}>
      <div className={css.graphPanelHead}>
        <strong>{t('graphSettings')}</strong>
        <span className={css.grow} />
        <button
          type="button"
          className={css.iconButton}
          title={t('close')}
          aria-label={t('close')}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className={css.graphPanelBody}>
        {GRAPH_SCHEMA.map(section => (
          <section key={section.id} className={css.graphPanelSection}>
            <h4 className={css.graphPanelTitle}>{t(section.title)}</h4>
            {section.editableGroups === true
              ? (
                <>
                  {settings.groups.map((group, index) => (
                    <div key={`${group.query}-${index}`} className={css.groupRow}>
                      <input
                        className={css.graphText}
                        value={group.query}
                        placeholder={t('groupQuery')}
                        aria-label={t('groupQuery')}
                        onChange={(event) => {
                          const groups = settings.groups.map((item, position) =>
                            position === index ? { ...item, query: event.target.value } : item)
                          onChange({ ...settings, groups })
                        }}
                      />
                      <input
                        type="color"
                        className={css.groupColor}
                        value={group.color}
                        aria-label={t('groupColor')}
                        onChange={(event) => {
                          const groups = settings.groups.map((item, position) =>
                            position === index ? { ...item, color: event.target.value } : item)
                          onChange({ ...settings, groups })
                        }}
                      />
                      <button
                        type="button"
                        className={css.button}
                        aria-label={t('removeGroup')}
                        onClick={() => onChange({
                          ...settings,
                          groups: settings.groups.filter((_, position) => position !== index),
                        })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={css.button}
                    onClick={() => onChange({
                      ...settings,
                      groups: [...settings.groups, {
                        query: '',
                        color: GROUP_COLORS[settings.groups.length % GROUP_COLORS.length]!,
                      }],
                    })}
                  >
                    {t('addGroup')}
                  </button>
                </>
              )
              : section.controls.map(control => renderControl(control, settings, onChange, t))}
          </section>
        ))}
      </div>
    </div>
  )
}

/** One select row: the stored value is a string, rendered as its option label. */
function renderSelect(
  control: Extract<GraphControl, { kind: 'select' }>,
  settings: GraphSettings,
  onChange: (next: GraphSettings) => void,
  t: Translate,
): JSX.Element {
  const current = String(readPath(settings, control.path) ?? '')
  return (
    <label key={control.path} className={css.graphField}>
      <span>{t(control.label)}</span>
      <select
        className={css.graphText}
        value={current}
        aria-label={t(control.label)}
        onChange={(event) => onChange(writePath(settings, control.path, event.target.value))}
      >
        {control.options.map(option => (
          <option key={option.value} value={option.value}>{t(option.label)}</option>
        ))}
      </select>
    </label>
  )
}

function renderControl(
  control: GraphControl,
  settings: GraphSettings,
  onChange: (next: GraphSettings) => void,
  t: Translate,
): JSX.Element {
  const value = readPath(settings, control.path)
  const label = t(control.label)
  if (control.kind === 'toggle') {
    return (
      <Toggle
        key={control.path}
        checked={value === true}
        label={label}
        onChange={(checked) => onChange(writePath(settings, control.path, checked))}
      />
    )
  }
  if (control.kind === 'select') return renderSelect(control, settings, onChange, t)
  if (control.kind === 'range') {
    const current = typeof value === 'number' ? value : control.min
    return (
      <RangeControl
        key={control.path}
        control={control}
        value={current}
        label={label}
        onChange={(next) => onChange(writePath(settings, control.path, next))}
      />
    )
  }
  return (
    <label key={control.path} className={css.graphField}>
      <span>{label}</span>
      <input
        className={css.graphText}
        value={typeof value === 'string' ? value : ''}
        placeholder={control.placeholder}
        onChange={(event) => onChange(writePath(settings, control.path, event.target.value))}
      />
    </label>
  )
}

/** One range row; warped sliders memoize their SJ/MJ curve. */
function RangeControl({ control, value, label, onChange }: {
  readonly control: Extract<GraphControl, { readonly kind: 'range' }>
  readonly value: number
  readonly label: string
  readonly onChange: (value: number) => void
}): JSX.Element {
  const mapping = useMemo(() => {
    if (control.curveMid === undefined) return undefined
    const curve = curveFor(control.curveMid)
    const span = control.max - control.min
    return {
      toPosition: (v: number): number => valueToSlider((v - control.min) / span, curve),
      fromPosition: (t: number): number => control.min + sliderToValue(t, curve) * span,
    }
  }, [control.curveMid, control.min, control.max])
  return (
    <Slider
      value={value}
      min={control.min}
      max={control.max}
      step={control.step}
      label={label}
      onChange={onChange}
      format={round}
      {...(mapping ?? {})}
    />
  )
}

function round(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

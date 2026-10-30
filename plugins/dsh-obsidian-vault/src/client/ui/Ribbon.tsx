/**
 * The left activity rail: files, search, the graph, and the right-rail toggle up
 * top; the settings gear pinned below the spacer. It sits inside the workspace,
 * so the explorer and reading column keep their own scroll.
 * @module dsh-obsidian-vault/client/ui/Ribbon
 */
import type { Translate } from '../i18n.ts'
import { Icon, type IconName } from './Icon.tsx'
import { css } from './theme.ts'

/** Rail entries. */
export type RibbonId = 'files' | 'search' | 'graph' | 'plugin' | 'rail' | 'settings'

interface Entry {
  readonly id: RibbonId
  readonly icon: IconName
  readonly label: Parameters<Translate>[0]
}

const ENTRIES: readonly Entry[] = [
  { id: 'files', icon: 'files', label: 'files' },
  { id: 'search', icon: 'search', label: 'search' },
  { id: 'graph', icon: 'graph', label: 'graph' },
  // Mirrors the plugin's own ribbon icon: opening the plugin view is what its
  // `addRibbonIcon` callback does inside the frame.
  { id: 'plugin', icon: 'plugin', label: 'openPurStudio' },
  { id: 'rail', icon: 'panelRight', label: 'toggleRail' },
]

/** Props for {@link Ribbon}. */
export interface RibbonProps {
  readonly t: Translate
  /** Set while the explorer is visible. Search and settings are actions, never pressed. */
  readonly active: 'files' | undefined
  readonly graphOpen: boolean
  /** Set while the right rail is open and renderable. */
  readonly railOpen: boolean
  readonly onSelect: (id: RibbonId) => void
}

/**
 * Render the activity rail.
 * @param props - the selected entry and the selection callback.
 */
export function Ribbon({ t, active, graphOpen, railOpen, onSelect }: RibbonProps): JSX.Element {
  return (
    <nav className={css.ribbon} aria-label={t('vault')}>
      {ENTRIES.map((entry) => {
        // Only the explorer, graph, and rail entries hold a pressed state;
        // search and the plugin icon are actions.
        const pressed = entry.id === 'graph'
          ? graphOpen
          : entry.id === 'rail' ? railOpen : entry.id === active
        return (
          <button
            key={entry.id}
            type="button"
            className={`${css.ribbonItem} ${pressed ? css.ribbonItemActive : ''}`.trim()}
            title={t(entry.label)}
            aria-label={t(entry.label)}
            aria-pressed={pressed}
            onClick={() => onSelect(entry.id)}
          >
            <Icon name={entry.icon} size={17} />
          </button>
        )
      })}
      <div className={css.ribbonSpacer} />
      <button
        type="button"
        className={css.ribbonItem}
        title={t('settings')}
        aria-label={t('settings')}
        aria-pressed={false}
        onClick={() => onSelect('settings')}
      >
        <Icon name="settings" size={17} />
      </button>
    </nav>
  )
}

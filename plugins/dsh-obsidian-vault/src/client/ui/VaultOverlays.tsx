/**
 * The vault page's transient surfaces: quick switcher, context menu, vault
 * manager, and the settings dialog. The page owns their state; this file only
 * renders.
 * @module dsh-obsidian-vault/client/ui/VaultOverlays
 */
import type { Translate } from '../i18n.ts'
import type { CommandEntry } from './commands.ts'
import { ContextMenu } from './menu/ContextMenu.tsx'
import type { MenuGroup } from './menu/types.ts'
import { QuickSwitcher, type QuickMode } from './QuickSwitcher.tsx'
import { SettingsDialog } from './SettingsDialog.tsx'
import { VaultManager } from './vaults/VaultManager.tsx'
import type { Variant } from './kit/index.ts'

/** An open quick-switcher request: the mode and its pre-filled query. */
export interface QuickRequest {
  readonly mode: QuickMode
  readonly query: string
}

/** An open context menu, already resolved to its groups. */
export interface OpenMenu {
  readonly x: number
  readonly y: number
  readonly groups: readonly MenuGroup[]
}

/** Props for {@link VaultOverlays}. */
export interface VaultOverlaysProps {
  readonly t: Translate
  readonly quick: QuickRequest | undefined
  readonly menu: OpenMenu | undefined
  readonly vaultOpen: boolean
  readonly settingsOpen: boolean
  readonly variant: Variant
  /** Palette commands listed by the command mode. */
  readonly commands: readonly CommandEntry[]
  /** Directory picking through the Host; absent where the shell has none. */
  readonly pickDirectory?: () => Promise<string | null>
  readonly hasPicker?: () => boolean
  readonly onQuickOpen: (path: string) => void
  readonly onQuickCommand: (id: string) => void
  readonly onQuickClose: () => void
  readonly onMenuClose: () => void
  readonly onVaultSwitched: () => void
  readonly onVaultClose: () => void
  readonly onVariant: (variant: Variant) => void
  readonly onSettingsClose: () => void
}

/**
 * Render whichever overlays are open.
 * @param props - the open surfaces and their close callbacks.
 */
export function VaultOverlays(props: VaultOverlaysProps): JSX.Element {
  const {
    t, quick, menu, vaultOpen, settingsOpen, variant, commands, pickDirectory, hasPicker,
    onQuickOpen, onQuickCommand, onQuickClose, onMenuClose, onVaultSwitched, onVaultClose,
    onVariant, onSettingsClose,
  } = props

  return (
    <>
      {quick === undefined
        ? null
        : (
          <QuickSwitcher
            t={t}
            initialMode={quick.mode}
            initialQuery={quick.query}
            commands={commands}
            onOpen={onQuickOpen}
            onCommand={onQuickCommand}
            onClose={onQuickClose}
          />
        )}
      {menu === undefined
        ? null
        : (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            groups={menu.groups}
            label={t('moreActions')}
            onClose={onMenuClose}
          />
        )}
      {vaultOpen
        ? (
          <VaultManager
            t={t}
            {...(pickDirectory === undefined ? {} : { pickDirectory })}
            {...(hasPicker === undefined ? {} : { hasPicker })}
            onSwitched={onVaultSwitched}
            onClose={onVaultClose}
          />
        )
        : null}
      {settingsOpen
        ? (
          <SettingsDialog
            t={t}
            onClose={onSettingsClose}
          />
        )
        : null}
    </>
  )
}

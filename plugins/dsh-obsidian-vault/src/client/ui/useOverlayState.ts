/**
 * Open/close state for the page's transient surfaces: quick switcher, context
 * menu, vault manager, and settings dialog. One hook owns them so Escape
 * handling and command dispatch share a single definition of "close
 * everything".
 * @module dsh-obsidian-vault/client/ui/useOverlayState
 */
import { useCallback, useRef, useState } from 'react'
import type { MenuScene } from './menu/registry.ts'
import type { QuickRequest } from './VaultOverlays.tsx'

/** One open context menu: which scene and where. */
export interface MenuState {
  readonly scene: MenuScene
  readonly x: number
  readonly y: number
}

/** Options for {@link useOverlayState}. */
export interface OverlayStateOptions {
  /** Open a note path; the quick switcher may request a new tab. */
  readonly openPath: (path: string, options?: { readonly newTab?: boolean }) => void
}

/** Overlay surface state plus the callbacks that mutate it. */
export interface OverlayState {
  readonly quick: QuickRequest | undefined
  readonly menu: MenuState | undefined
  readonly vaultOpen: boolean
  readonly settingsOpen: boolean
  /** Set when the switcher was opened for a new tab; consumed on acceptance. */
  readonly newTabPending: { current: boolean }
  readonly openQuick: () => void
  readonly openSearch: () => void
  readonly openCommands: () => void
  /** Open the switcher in full-text mode scoped to one tag. */
  readonly openTagSearch: (tag: string) => void
  readonly toggleQuick: () => void
  readonly closeQuick: () => void
  readonly openMenu: (scene: MenuScene, x: number, y: number) => void
  readonly closeMenu: () => void
  readonly openVaults: () => void
  readonly closeVaults: () => void
  readonly openSettings: () => void
  readonly closeSettings: () => void
  /** Close every transient surface (Escape). */
  readonly closeTransient: () => void
  /** Quick-switcher acceptance: honours the pending new-tab flag. */
  readonly onQuickOpen: (path: string) => void
}

/**
 * Own the page's overlay surfaces.
 * @param options - the note opener the switcher resolves into.
 */
export function useOverlayState({ openPath }: OverlayStateOptions): OverlayState {
  const [quick, setQuick] = useState<QuickRequest | undefined>()
  const [menu, setMenu] = useState<MenuState | undefined>()
  const [vaultOpen, setVaultOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const newTabPending = useRef(false)

  const openQuick = useCallback(() => setQuick({ mode: 'files', query: '' }), [])
  const openSearch = useCallback(() => setQuick({ mode: 'search', query: '' }), [])
  const openCommands = useCallback(() => setQuick({ mode: 'commands', query: '' }), [])
  const openTagSearch = useCallback((tag: string) => setQuick({ mode: 'search', query: `#${tag}` }), [])
  const toggleQuick = useCallback(() => {
    setQuick(value => (value === undefined ? { mode: 'files', query: '' } : undefined))
  }, [])
  const closeQuick = useCallback(() => {
    newTabPending.current = false
    setQuick(undefined)
  }, [])
  const openMenu = useCallback((scene: MenuScene, x: number, y: number) => {
    setMenu({ scene, x, y })
  }, [])
  const closeMenu = useCallback(() => setMenu(undefined), [])
  const openVaults = useCallback(() => setVaultOpen(true), [])
  const closeVaults = useCallback(() => setVaultOpen(false), [])
  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const closeTransient = useCallback(() => {
    setQuick(undefined)
    setVaultOpen(false)
    setSettingsOpen(false)
  }, [])
  const onQuickOpen = useCallback((next: string) => {
    const asNew = newTabPending.current
    newTabPending.current = false
    openPath(next, { newTab: asNew })
  }, [openPath])

  return {
    quick, menu, vaultOpen, settingsOpen, newTabPending,
    openQuick, openSearch, openCommands, openTagSearch, toggleQuick, closeQuick,
    openMenu, closeMenu, openVaults, closeVaults, openSettings, closeSettings,
    closeTransient, onQuickOpen,
  }
}

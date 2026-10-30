/**
 * Page-wide keyboard shortcuts: the quick switcher, full-text search, the
 * command palette, Escape, and history navigation.
 * @module dsh-obsidian-vault/client/ui/useVaultShortcuts
 */
import { useEffect } from 'react'

/** Input for {@link useVaultShortcuts}. */
export interface VaultShortcutInput {
  /** Ctrl/Cmd+O: open the file quick switcher, or close it when already open. */
  readonly onToggleQuick: () => void
  /** Ctrl/Cmd+F: open full-text search. */
  readonly onSearch: () => void
  /** Ctrl/Cmd+P: open the palette in command mode. */
  readonly onCommands: () => void
  /** Escape: close every transient surface. */
  readonly onEscape: () => void
  /** Alt+Left. */
  readonly onBack: () => void
  /** Alt+Right. */
  readonly onForward: () => void
}

/**
 * Install the page shortcuts on `window`.
 * @param input - the commands each shortcut runs.
 */
export function useVaultShortcuts({
  onToggleQuick, onSearch, onCommands, onEscape, onBack, onForward,
}: VaultShortcutInput): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const accel = event.ctrlKey || event.metaKey
      if (accel && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        onToggleQuick()
        return
      }
      if (accel && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        onSearch()
        return
      }
      if (accel && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        onCommands()
        return
      }
      if (event.key === 'Escape') {
        onEscape()
        return
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        onBack()
        return
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        onForward()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack, onCommands, onEscape, onForward, onSearch, onToggleQuick])
}

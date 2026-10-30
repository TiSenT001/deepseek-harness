/**
 * Vault manager dialog: recent vaults, open-another-folder, and create-new.
 * Opening a folder without `.obsidian` asks once, through an inline confirm
 * card, before the Host activates it.
 * @module dsh-obsidian-vault/client/ui/vaults/VaultManager
 */
import { useCallback, useEffect, useState } from 'react'
import type { VaultInspectDto, VaultListDto } from '../../../protocol.ts'
import { createVault, fetchVaults, forgetVault, inspectVault, openVault } from '../../api.ts'
import type { Translate } from '../../i18n.ts'
import { Icon } from '../Icon.tsx'
import { css } from '../kit/index.ts'

/** Props for {@link VaultManager}. */
export interface VaultManagerProps {
  readonly t: Translate
  /** Directory picking through the Host; absent outside the desktop/Web shell. */
  readonly pickDirectory?: () => Promise<string | null>
  /**
   * Probe for picker availability. The gateway mounts `remote.*` after this
   * plugin applies, so the probe runs per render instead of once up front.
   */
  readonly hasPicker?: () => boolean
  /** Fired after the active vault changed so the page can drop stale state. */
  readonly onSwitched: () => void
  readonly onClose: () => void
}

/**
 * Render the vault manager overlay.
 * @param props - translator, picker access, and dismissal callbacks.
 */
export function VaultManager({ t, pickDirectory, hasPicker, onSwitched, onClose }: VaultManagerProps): JSX.Element {
  const [list, setList] = useState<VaultListDto | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [confirm, setConfirm] = useState<VaultInspectDto | undefined>()
  const pickerUnavailable = pickDirectory === undefined || (hasPicker !== undefined && !hasPicker())

  useEffect(() => {
    let cancelled = false
    void fetchVaults()
      .then((snapshot) => {
        if (!cancelled) setList(snapshot)
      })
      .catch(() => {
        if (!cancelled) setError(t('loadingVaults'))
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const applyOpen = useCallback((path: string, init: boolean) => {
    setBusy(true)
    setError(undefined)
    void openVault(path, init)
      .then(() => {
        onSwitched()
        onClose()
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t('vaultSwitchFailed'))
        setBusy(false)
      })
  }, [onSwitched, onClose, t])

  const chooseFolder = useCallback(() => {
    if (pickerUnavailable || busy) return
    setBusy(true)
    setError(undefined)
    setConfirm(undefined)
    // Hand the busy flag to applyOpen so the rows stay inert while the Host
    // switches the index.
    let handedOff = false
    void (async () => {
      const picked = pickDirectory === undefined ? null : await pickDirectory()
      if (picked === null) return
      const probe = await inspectVault(picked)
      if (!probe.exists) {
        setError(t('vaultMissing'))
        return
      }
      if (probe.configured || probe.registered) {
        handedOff = true
        applyOpen(probe.path, false)
        return
      }
      setConfirm(probe)
    })()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('vaultSwitchFailed')))
      .finally(() => {
        if (!handedOff) setBusy(false)
      })
  }, [pickDirectory, pickerUnavailable, busy, applyOpen, t])

  const createNew = useCallback(() => {
    if (pickerUnavailable || busy) return
    setBusy(true)
    setError(undefined)
    setConfirm(undefined)
    void (async () => {
      const picked = pickDirectory === undefined ? null : await pickDirectory()
      if (picked === null) return
      await createVault(picked)
      onSwitched()
      onClose()
    })()
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t('vaultCreateFailed'))
        setBusy(false)
      })
  }, [pickDirectory, pickerUnavailable, busy, onSwitched, onClose, t])

  const forget = useCallback((id: string, active: boolean) => {
    setBusy(true)
    setError(undefined)
    void forgetVault(id)
      .then((snapshot) => {
        setList(snapshot)
        // Forgetting the active vault makes the Host activate the next one, so
        // the page must drop its tabs and reload against the new index.
        if (active) onSwitched()
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('vaultForgetFailed')))
      .finally(() => setBusy(false))
  }, [onSwitched, t])

  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className={css.dialog}
        role="dialog"
        aria-label={t('vaultManager')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('vaultManager')}</span>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={t('close')}
            title={t('close')}
            onClick={onClose}
          >
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          {error === undefined ? null : <div className={css.dialogError}>{error}</div>}
          <div className={css.dialogActions}>
            <button
              type="button"
              className={css.dialogButton}
              disabled={pickerUnavailable || busy}
              onClick={chooseFolder}
            >
              <Icon name="files" size={13} />
              {t('openFolder')}
            </button>
            <button
              type="button"
              className={css.dialogButton}
              disabled={pickerUnavailable || busy}
              onClick={createNew}
            >
              <Icon name="newFolder" size={13} />
              {t('newVault')}
            </button>
          </div>
          {pickerUnavailable ? <div className={css.dialogHint}>{t('pickerUnavailable')}</div> : null}
          {confirm === undefined
            ? null
            : (
              <div className={css.dialogConfirm}>
                <div className={css.dialogConfirmTitle}>{t('vaultUnconfigured')}</div>
                <div className={css.dialogConfirmPath}>{confirm.path}</div>
                <div className={css.dialogHint}>{t('vaultUnconfiguredHint')}</div>
                <div className={css.dialogActions}>
                  <button
                    type="button"
                    className={`${css.dialogButton} ${css.dialogButtonPrimary}`}
                    disabled={busy}
                    onClick={() => applyOpen(confirm.path, true)}
                  >
                    {t('initVault')}
                  </button>
                  <button
                    type="button"
                    className={css.dialogButton}
                    disabled={busy}
                    onClick={() => applyOpen(confirm.path, false)}
                  >
                    {t('openAnyway')}
                  </button>
                  <button
                    type="button"
                    className={css.dialogButton}
                    disabled={busy}
                    onClick={() => setConfirm(undefined)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          {list === undefined
            ? <div className={css.dialogHint}>{t('loadingVaults')}</div>
            : list.vaults.length === 0
              ? <div className={css.dialogHint}>{t('vaultListEmpty')}</div>
              : (
                <div className={css.vaultList}>
                  {list.vaults.map(vault => (
                    <div className={css.vaultRow} key={vault.id}>
                      <button
                        type="button"
                        className={css.vaultRowMain}
                        disabled={busy || vault.active === true}
                        onClick={() => applyOpen(vault.path, false)}
                      >
                        <span className={css.vaultRowName}>
                          {vault.name}
                          {vault.active === true ? <span className={css.vaultRowTag}>{t('activeVaultTag')}</span> : null}
                        </span>
                        <span className={css.vaultRowPath}>{vault.path}</span>
                      </button>
                      <button
                        type="button"
                        className={css.vaultRowForget}
                        title={t('forgetVault')}
                        aria-label={t('forgetVault')}
                        disabled={busy}
                        onClick={() => forget(vault.id, vault.active === true)}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  )
}

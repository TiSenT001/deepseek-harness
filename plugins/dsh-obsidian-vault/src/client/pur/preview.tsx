/**
 * Full-size preview for one plugin-owned canvas image. The three "open" menu
 * entries land here: `current` and `new-tab` centre the panel, `right` docks it
 * to the right half, so every destination has a real in-app behaviour instead
 * of a blocked `window.open`.
 * @module dsh-obsidian-vault/client/pur/preview
 */
import { useEffect } from 'react'
import type { PurOpenDestination } from '../../pur-kernel/index.ts'
import { purAssetUrl } from '../api.ts'
import type { Translate } from '../i18n.ts'
import { css } from '../ui/theme.ts'

/** Props for {@link PurAssetPreview}. */
export interface PurAssetPreviewProps {
  /** Translator for the close label. */
  readonly t: Translate
  /** Asset id, without the `pur-asset:` scheme. */
  readonly id: string
  /** Where the preview should sit. */
  readonly destination: PurOpenDestination
  /** Dismiss the preview. */
  readonly onClose: () => void
}

/**
 * Render the image preview overlay.
 * @param props - the asset, its placement and the dismiss callback.
 */
export function PurAssetPreview({ t, id, destination, onClose }: PurAssetPreviewProps): JSX.Element {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const docked = destination === 'right'
  return (
    <div
      role="presentation"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: docked ? 'flex-end' : 'center',
        padding: docked ? 0 : 24,
      }}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('previewImage')}
        style={{
          position: 'relative',
          width: docked ? '50%' : 'auto',
          height: docked ? '100%' : 'auto',
          maxWidth: '92%',
          maxHeight: '92%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <img
          src={purAssetUrl(`pur-asset:${id}`)}
          alt=""
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
        <button
          type="button"
          className={css.dialogClose}
          aria-label={t('close')}
          title={t('close')}
          onClick={onClose}
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

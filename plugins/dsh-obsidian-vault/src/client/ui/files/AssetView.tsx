/**
 * Image preview pane for plugin-owned canvas assets. A `pur-asset:<id>` path is
 * not a vault file, so this view resolves it through the asset route and offers
 * the same zoom and pan gestures the canvas uses, instead of the browser's bare
 * image document.
 * @module dsh-obsidian-vault/client/ui/files/AssetView
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Translate } from '../../i18n.ts'
import { purAssetUrl } from '../../api.ts'
import type { MenuScene } from '../menu/registry.ts'
import { css } from '../theme.ts'

/** Props for {@link AssetView}. */
export interface AssetViewProps {
  /** The translator. */
  readonly t: Translate
  /** `pur-asset:<id>` path. */
  readonly path: string
  /** Open the shared context menu; absent leaves right-click native. */
  readonly onMenu?: (scene: MenuScene, x: number, y: number) => void
}

/** Zoom limits, matching the canvas so the two feel like one tool. */
const MIN_SCALE = 0.1
const MAX_SCALE = 8

/**
 * Render one plugin asset at full size.
 * @param props - the asset path and the menu hook.
 */
export function AssetView({ t, path, onMenu }: AssetViewProps): JSX.Element {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [failed, setFailed] = useState(false)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const id = path.slice('pur-asset:'.length)

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setFailed(false)
  }, [path])

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setScale((current) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, current * (event.deltaY < 0 ? 1.1 : 0.9))))
  }, [])

  return (
    <div
      className={css.fileView}
      onContextMenu={(event) => {
        if (onMenu === undefined) return
        event.preventDefault()
        onMenu({ kind: 'tree-file', path }, event.clientX, event.clientY)
      }}
    >
      <div className={css.codeHead}>
        <span className={css.codeLang}>{t('previewImage')}</span>
        <span className={css.codeMeta}>{id} · {Math.round(scale * 100)}%</span>
        <button
          type="button"
          className={css.item}
          onClick={() => {
            setScale(1)
            setOffset({ x: 0, y: 0 })
          }}
        >
          {t('resetView')}
        </button>
      </div>
      <div
        className={css.fileView}
        style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}
        onWheel={onWheel}
        onMouseDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
        }}
        onMouseMove={(event) => {
          const drag = dragRef.current
          if (drag === null) return
          setOffset({ x: drag.ox + (event.clientX - drag.x), y: drag.oy + (event.clientY - drag.y) })
        }}
        onMouseUp={() => {
          dragRef.current = null
        }}
        onMouseLeave={() => {
          dragRef.current = null
        }}
      >
        {failed
          ? <div className={css.empty}>{t('noteImageFailed')}</div>
          : (
            <img
              src={purAssetUrl(path)}
              alt=""
              draggable={false}
              onError={() => setFailed(true)}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                userSelect: 'none',
              }}
            />
          )}
      </div>
    </div>
  )
}

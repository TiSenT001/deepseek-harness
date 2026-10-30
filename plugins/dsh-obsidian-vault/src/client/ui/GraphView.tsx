/**
 * Link graph: composes the data, layout, and camera hooks into the toolbar,
 * canvas, settings panel, and empty states. The simulation owns node
 * positions; React only seeds them.
 * @module dsh-obsidian-vault/client/ui/GraphView
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GraphNodeDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import { GraphCanvas } from './GraphCanvas.tsx'
import { GraphSettingsPanel } from './GraphSettingsPanel.tsx'
import { GraphToolbar } from './GraphToolbar.tsx'
import { useGraphCamera, type GraphCamera } from './graph/useGraphCamera.ts'
import { useGraphData } from './graph/useGraphData.ts'
import { useGraphLayout } from './graph/useGraphLayout.ts'
import type { MenuScene } from './menu/registry.ts'
import { css } from './theme.ts'

/** Props for {@link GraphView}. */
export interface GraphViewProps {
  readonly t: Translate
  readonly center: string | undefined
  /** Index revision; a bump refetches so the graph follows vault changes. */
  readonly version: number | undefined
  readonly onOpen: (path: string) => void
  /** Make a note the local-graph centre without leaving the graph view. */
  readonly onCenter: (path: string) => void
  /** Create an unresolved target when its ghost node is clicked. */
  readonly onCreate: (target: string) => void
  /** Filter by a tag when its tag node is clicked. */
  readonly onTag: (tag: string) => void
  readonly onClose: () => void
  /** Ask the page to open the shared context menu for a right-clicked node. */
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
}

/**
 * Render the graph around the open note.
 * @param props - center path, labels, and navigation callbacks.
 */
export function GraphView(props: GraphViewProps): JSX.Element {
  const { t, center, version, onOpen, onCenter, onCreate, onTag, onClose, onMenu } = props
  const [panelOpen, setPanelOpen] = useState(false)
  /** The whole vault; the toolbar flips this, and `center` applies otherwise. */
  const [global, setGlobal] = useState(false)
  const draggingRef = useRef<string | null>(null)
  /** Filled once the camera exists; the data hook only needs the callback. */
  const fitSlot = useRef<GraphCamera['fit'] | null>(null)

  const scope = global ? undefined : center

  const onScopeChange = useCallback((focus: string | undefined) => {
    fitSlot.current?.(focus ?? null)
  }, [])

  const data = useGraphData({ center: scope, version, onScopeChange })
  const layout = useGraphLayout({ visible: data.visible, forces: data.settings.forces })
  const camera = useGraphCamera({
    positionsRef: layout.positionsRef,
    loopRef: layout.loopRef,
    settledRef: layout.settledRef,
  })
  fitSlot.current = camera.fit

  // Settings (palette, widths, forces) and the visible node set change without
  // touching the stage, so they must wake the canvas loop.
  useEffect(() => {
    layout.loopRef.current?.()
  }, [data.settings, data.visible, layout.loopRef])

  const activate = (node: GraphNodeDto): void => {
    if (node.kind === 'unresolved') {
      onCreate(node.title)
      return
    }
    if (node.kind === 'tag') {
      onTag(node.tags?.[0] ?? node.title.replace(/^#/, ''))
      return
    }
    if (scope !== undefined) {
      // Local graph: the clicked note becomes the new centre. Glide the camera
      // so it sits under the cursor while the refetch runs; zoom-to-fit takes
      // over once the new neighbourhood arrives.
      const clicked = layout.positionsRef.current.find(item => item.path === node.path)
      if (clicked !== undefined) camera.glideTo(clicked.x, clicked.y)
      onCenter(node.path)
      return
    }
    onOpen(node.path)
  }

  const layingOut = data.visible.nodes.length > 0 && layout.positions.length === 0

  return (
    <div className={css.note} style={{ height: '100%', position: 'relative' }}>
      <GraphToolbar
        t={t}
        center={scope}
        nodes={data.visible.nodes.length}
        edges={data.visible.edges.length}
        layingOut={layingOut}
        query={data.settings.filters.query}
        tag={data.settings.filters.tag}
        tagOptions={data.tagOptions}
        depth={data.depth}
        panelOpen={panelOpen}
        onToggleScope={() => setGlobal(value => !value)}
        onQuery={(query) => data.updateSettings(current => ({
          ...current,
          filters: { ...current.filters, query },
        }))}
        onTag={(tag) => data.updateSettings(current => ({
          ...current,
          filters: { ...current.filters, tag },
        }))}
        onDepth={data.setDepth}
        onTogglePanel={() => setPanelOpen(value => !value)}
        onReplay={layout.replay}
        onReset={() => camera.fit(scope ?? null)}
        onClose={onClose}
      />
      <div ref={camera.surfaceRef} style={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
        <GraphCanvas
          positions={layout.positionsRef}
          edges={layout.edgesRef}
          camera={camera.cameraRef}
          hidden={layout.hiddenRef}
          nodeInfo={layout.nodeInfoRef}
          settings={data.settingsRef}
          hasCenter={scope !== undefined}
          loop={layout.loopRef}
          onHover={noopHover}
          onActivate={activate}
          onContext={(node, x, y) => {
            if (node !== undefined) onMenu({ kind: 'graph-node', node }, x, y)
          }}
          onDragStart={(path) => {
            draggingRef.current = path
            // A new drag supersedes any camera glide or zoom-to-fit.
            camera.dragBegins()
            layout.pin(path)
          }}
          onDragMove={(clientX, clientY) => {
            const path = draggingRef.current
            if (path === null) return
            const point = camera.toWorld({ clientX, clientY })
            layout.movePin(path, point.x, point.y)
          }}
          onDragEnd={() => {
            const path = draggingRef.current
            draggingRef.current = null
            // Release into the live simulation: the graph springs around the
            // dropped position and cools on its own.
            if (path !== null) layout.unpin(path)
          }}
          onPan={(dx, dy) => camera.panBy(dx, dy)}
          onPanFling={(vx, vy) => camera.fling(vx, vy)}
          onZoom={(factor, clientX, clientY) => camera.zoomAt(factor, clientX, clientY)}
        />
      </div>
      {panelOpen
        ? (
          <GraphSettingsPanel
            t={t}
            settings={data.settings}
            onChange={data.updateSettings}
            onClose={() => setPanelOpen(false)}
          />
        )
        : null}
      {data.loadError === undefined ? null : (
        <div className={css.banner}>
          {t('loadFailed')}: {data.loadError}
          <button type="button" className={css.button} onClick={data.retry}>
            {t('refresh')}
          </button>
        </div>
      )}
      {data.visible.nodes.length === 0 && data.loadError === undefined
        ? <div className={css.empty}>{t('noResults')}</div>
        : null}
      {layout.positions.length === 0 && layingOut
        ? <div className={css.empty} style={{ pointerEvents: 'none' }}>{t('layingOut')}</div>
        : null}
    </div>
  )
}

/** Hover state lives in the canvas renderer; the page has nothing to show. */
function noopHover(): void {
  // Rendering reads the shared drag object, so there is nothing to do here.
}

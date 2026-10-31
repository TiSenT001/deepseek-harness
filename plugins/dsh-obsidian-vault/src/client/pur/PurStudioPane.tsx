/**
 * The React Pur Studio pane: hosts the kernel controller over a `<canvas>`,
 * repainting on a rAF loop (dirty flag plus momentum frames), persisting
 * debounced through the bridge, and routing kernel effects to the overlays.
 * Popout and pin-top degrade to `pur.unsupportedFeature` notices inside the
 * menu host.
 * @module dsh-obsidian-vault/client/pur/PurStudioPane
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PurController, createElementId, elementAt, executeEffects, screenToWorld } from '../../pur-kernel/index.ts'
import type { PurControllerEffect, PurControllerEnv, PurMenuContext, PurPointerEvent, PurRenderPreferences } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import { LoadingState } from '../ui/kit/index.ts'
import { createPurMenuHost, exportSelectedText } from './host.ts'
import type { PurMenuHostDeps } from './host.ts'
import { purBundles } from './labels.ts'
import { PurImageCache, loadStudioDocument, resolveNoteLink, saveStudioDocument } from './loader.ts'
import { fetchCodeSnippets } from '../api.ts'
import { refreshNoteLinks } from './refresh-links.ts'
import { VaultWriteConflict } from '../api.ts'
import { useAsk } from '../ui/useAsk.tsx'
import type { PurMenuState } from './menu.tsx'
import type { PurOpenDestination } from '../../pur-kernel/index.ts'
import { createPurPaneHandlers, registerPurPaneCommands } from './pane-commands.ts'
import { PurPaneOverlays } from './pane-overlays.tsx'
import type { PurEditorState, PurPickerState, PurPromptState } from './pane-overlays.tsx'
import { pointerEventOf } from './pane-events.ts'
import { startPurPaintLoop, wirePurPaneDrop, wirePurPaneWheel } from './pane-paint.ts'
import { pasteIntoCanvas } from './paste-drop.ts'
import type { PurInsertDeps } from './paste-drop.ts'
import { createPurSink } from './sink.ts'

/** Canvas colours and grid toggle, fixed for the web client. */
const PREFERENCES: PurRenderPreferences = { backgroundColor: 'transparent', gridColor: '#333333', showGrid: true }

/** Props for {@link PurStudioPane}. */
export interface PurStudioPaneProps {
  /** The workspace translator. */
  readonly t: Translate
  /** Vault-relative `.PurStudio` document path. */
  readonly path: string
  /** Open another vault path; newly created canvases navigate to themselves. */
  readonly onOpenPath?: (path: string, destination?: PurOpenDestination) => void
}

/**
 * Render one `.PurStudio` document as an interactive canvas.
 * @param props - the translator and the document path.
 */
export function PurStudioPane({ t, path, onOpenPath }: PurStudioPaneProps): JSX.Element {
  const labels = useMemo(() => purBundles(t), [t])
  const ask = useAsk(t)
  const [ready, setReady] = useState(false)
  const [menu, setMenu] = useState<PurMenuState | null>(null)
  const [editor, setEditor] = useState<PurEditorState | null>(null)
  const [prompt, setPrompt] = useState<PurPromptState | null>(null)
  const [picker, setPicker] = useState<PurPickerState | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [snippets, setSnippets] = useState<readonly { id: string; title: string }[]>([])
  const snippetsRef = useRef<readonly { id: string; title: string }[]>([])
  const [preview, setPreview] = useState<{ id: string; destination: PurOpenDestination } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Canvas size is read on demand: the controller uses it for fit-to-view and
  // paste centring, and the element only exists after the first paint.
  const [env] = useState((): PurControllerEnv => ({
    get canvasWidth(): number {
      return canvasRef.current?.clientWidth ?? 1
    },
    get canvasHeight(): number {
      return canvasRef.current?.clientHeight ?? 1
    },
    createId: createElementId,
    now: () => Date.now(),
    hasOpenDialog: () => dialogRef.current,
  }))
  const [images] = useState(() => new PurImageCache())
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<PurController | null>(null)
  const hostDepsRef = useRef<PurMenuHostDeps | null>(null)
  const openMenuRef = useRef<(clientX: number, clientY: number) => void>(() => undefined)
  const dialogRef = useRef(false)
  const dirtyRef = useRef(true)
  const saveTimerRef = useRef<number | null>(null)
  const noticeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    dialogRef.current = editor !== null || prompt !== null || picker !== null
  }, [editor, prompt, picker])

  const showNotice = useCallback((text: string) => {
    setNotice(text)
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 3000)
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      const controller = controllerRef.current
      if (controller === null) return
      const document = { elements: controller.state.elements, viewState: controller.state.view }
void saveStudioDocument(path, document).catch(async (error: unknown) => {
        if (error instanceof VaultWriteConflict) {
          const overwrite = await ask.askConfirm(`${t('pur.saveConflictTitle')}\n\n${t('pur.saveConflictBody')}`)
          if (overwrite) await saveStudioDocument(path, document, true).catch(() => showNotice(t('pur.saveFailed')))
          else showNotice(t('pur.saveConflictKept'))
          return
        }
        showNotice(t('pur.saveFailed'))
      })
    }, 400)
  }, [path, t, showNotice])

  const sink = useMemo(
    () =>
      createPurSink(() => ({
        markDirty: () => {
          dirtyRef.current = true
        },
        scheduleSave,
        notice: showNotice,
        setCursor: (cursor) => {
          const canvas = canvasRef.current
          if (canvas !== null) canvas.style.cursor = cursor
        },
        openEditor: (kind, id) => setEditor({ kind, id }),
        ...(onOpenPath === undefined ? {} : { openPath: (next: string) => onOpenPath(next) }),
        openMenu: (clientX, clientY) => openMenuRef.current(clientX, clientY),
        exportText: () => {
          const hostDeps = hostDepsRef.current
          if (hostDeps !== null) exportSelectedText(hostDeps)
        },
      })),
    [scheduleSave, showNotice],
  )

  const run = useCallback((effects: readonly PurControllerEffect[]) => executeEffects(effects, sink), [sink])

  // The snippet library lives in plugin data, so it is read once per mount and
  // refreshed whenever the user saves a node.
  useEffect(() => {
    snippetsRef.current = snippets
  }, [snippets])

  useEffect(() => {
    if (!ready) return
    void fetchCodeSnippets()
      .then((nodes) => setSnippets(nodes.map((node) => ({ id: node.id, title: node.title }))))
      .catch(() => undefined)
  }, [ready])

  // A note-link card caches the note text, so it drifts when the note changes
  // on disk. Re-read on focus: no polling, and an open dialog or editor is
  // left alone.
  useEffect(() => {
    if (!ready) return undefined
    const refresh = (): void => {
      const controller = controllerRef.current
      if (controller === null || dialogRef.current) return
      void refreshNoteLinks(controller).then((result) => {
        if (result.updated > 0) run([{ type: 'render' }])
      }).catch(() => undefined)
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [ready, run])

  const openMenu = useCallback(
    (clientX: number, clientY: number): void => {
      const canvas = canvasRef.current
      const controller = controllerRef.current
      if (canvas === null || controller === null) return
      const rect = canvas.getBoundingClientRect()
      const canvasX = clientX - rect.left
      const canvasY = clientY - rect.top
      // The DSH pane cannot pop out, pin or reveal files, so the menu model
      // omits those entries instead of offering actions that only report back.
      const context: PurMenuContext = {
        activeFileIsMarkdown: false,
        isPopout: false,
        isPinned: false,
        supportsPopout: true,
        supportsPinTop: false,
        supportsReveal: false,
      }
      const { model, effects } = controller.contextMenu(canvasX, canvasY, context)
      run(effects)
      const world = screenToWorld(controller.state.view, canvasX, canvasY)
      const target = elementAt(controller.state.elements, world.x, world.y, controller.state.view.scale)
      setMenu({ x: clientX, y: clientY, world, ...(target !== null ? { targetId: target.id } : {}), model })
    },
    [run],
  )

  // The sink is memoized ahead of `openMenu`; the ref keeps the entry fresh.
  useEffect(() => {
    openMenuRef.current = openMenu
  }, [openMenu])

  const menuHost = useMemo(
    () =>
      createPurMenuHost(() => {
        const hostDeps = hostDepsRef.current
        if (hostDeps === null) throw new Error('pur pane: menu dispatched before the document loaded')
        return hostDeps
      }),
    [],
  )

  const insertDeps = useMemo((): PurInsertDeps => ({ webLinkCard: labels.controller.webLinkCard, resolveNote: resolveNoteLink, run }), [labels, run])

  // Load the document; recreating the controller drops undo history, so this
  // runs only when the path or the language actually changes.
  useEffect(() => {
    let cancelled = false
    setReady(false)
    controllerRef.current = null
    void loadStudioDocument(path).then((document) => {
      if (cancelled) return
      controllerRef.current = new PurController(env, labels.controller, document.elements, document.viewState)
      dirtyRef.current = true
      setReady(true)
    })
    return () => {
      cancelled = true
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const controller = controllerRef.current
      if (controller !== null) {
        // Best-effort flush of the outgoing document.
        void saveStudioDocument(path, { elements: controller.state.elements, viewState: controller.state.view }).catch(() => undefined)
      }
    }
  }, [path, labels, env])

  // The host context is refreshed every render; the registration below must not
  // depend on it, or a prop whose identity changes would re-register the
  // commands, notify the palette holder, re-render this pane and loop.
  useEffect(() => {
    const controller = controllerRef.current
    if (controller === null || !ready) return
    hostDepsRef.current = {
      t,
      labels,
      controller,
      path,
      images,
      preferences: PREFERENCES,
      notice: showNotice,
      run,
      openEditor: (kind, id) => setEditor({ kind, id }),
      promptText: (title, initial) => new Promise((resolve) => setPrompt({ title, initial, resolve })),
      pickNote: () => new Promise((resolve) => setPicker({ resolve })),
      ...(onOpenPath === undefined ? {} : { openPath: onOpenPath }),
      reloadSnippets: () => {
        void fetchCodeSnippets()
          .then((nodes) => setSnippets(nodes.map((node) => ({ id: node.id, title: node.title }))))
          .catch(() => undefined)
      },
      openPreview: (id, destination) => setPreview({ id, destination }),
    }
  })

  // Palette commands live while the document is loaded; the palette mirrors
  // them while this file is the active tab.
  useEffect(() => {
    if (!ready) return undefined
    return registerPurPaneCommands(path, createPurPaneHandlers(() => controllerRef.current, () => hostDepsRef.current, menuHost, run))
  }, [path, ready, menuHost, run])

  // Non-passive wheel: zoom must never scroll the workspace.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null || !ready) return
    return wirePurPaneWheel(canvas, () => controllerRef.current, run)
  }, [ready, run])

  // Native drop: the kernel flow needs the container as `currentTarget`.
  useEffect(() => {
    const container = containerRef.current
    if (container === null || !ready) return
    return wirePurPaneDrop(container, () => controllerRef.current, insertDeps)
  }, [ready, insertDeps])

  // The frame loop: advance momentum, repaint when dirty, repaint on resize.
  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (canvas === null || container === null) return
    return startPurPaintLoop(container, canvas, {
      env,
      images,
      preferences: PREFERENCES,
      controller: () => controllerRef.current,
      labels: () => labels.render,
      dirtyRef,
    })
  }, [ready, labels, env, images])

  if (!ready) return <LoadingState label={t('loadingFile')} />
  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onPaste={(event) => {
        const controller = controllerRef.current
        if (controller !== null) pasteIntoCanvas(controller, event.nativeEvent, insertDeps)
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{ width: '100%', height: '100%', display: 'block', outline: 'none', touchAction: 'none' }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.focus()
          const controller = controllerRef.current
          if (controller !== null) run(controller.pointerDown(pointerEventOf(event)))
        }}
        onPointerMove={(event) => {
          const controller = controllerRef.current
          if (controller !== null) run(controller.pointerMove(pointerEventOf(event)))
        }}
        onPointerUp={(event) => {
          const controller = controllerRef.current
          if (controller !== null) run(controller.pointerUp(pointerEventOf(event)))
        }}
        onDoubleClick={(event) => {
          const controller = controllerRef.current
          if (controller !== null) run(controller.doubleClick(pointerEventOf(event)))
        }}
        onKeyDown={(event) => {
          const controller = controllerRef.current
          if (controller === null) return
          const result = controller.keyDown({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey })
          if (!result.handled) return
          event.preventDefault()
          run(result.effects)
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      <PurPaneOverlays
        t={t}
        labels={labels}
        menu={menu}
        editor={editor}
        prompt={prompt}
        picker={picker}
        notice={notice}
        controller={() => controllerRef.current}
        menuHost={menuHost}
        run={run}
        closeMenu={() => setMenu(null)}
        closeEditor={() => setEditor(null)}
        closePrompt={() => setPrompt(null)}
        closePicker={() => setPicker(null)}
      />
      {ask.node}
    </div>
  )
}

/**
 * Graph data: settings load/save (local storage first paint, `graph.json` as
 * the durable copy), tag options, the debounced graph fetch, and the orphan
 * filter that decides which nodes the renderer sees.
 * @module dsh-obsidian-vault/client/ui/graph/useGraphData
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GraphDto, TagCountDto } from '../../../protocol.ts'
import { fetchGraph, fetchTags } from '../../api.ts'
import { createGraphSettingsSaver, loadHostGraphSettings } from '../../graph/persist.ts'
import { loadGraphSettings, saveGraphSettings, type GraphSettings } from '../../graph/settings.ts'

/** Input for {@link useGraphData}. */
export interface GraphDataInput {
  readonly center: string | undefined
  /** Index revision; a bump refetches so the graph follows vault changes. */
  readonly version: number | undefined
  /** A scope change reframes the camera; filter edits keep the viewpoint. */
  readonly onScopeChange: (focus: string | undefined) => void
}

/** Settings, filters, and the fetched graph. */
export interface GraphData {
  readonly settings: GraphSettings
  /** Live settings for the canvas renderer, which reads them every frame. */
  readonly settingsRef: { current: GraphSettings }
  /** Mark the user as having touched a control, then apply the change. */
  readonly updateSettings: (next: GraphSettings | ((current: GraphSettings) => GraphSettings)) => void
  readonly tagOptions: readonly TagCountDto[]
  readonly loadError: string | undefined
  readonly depth: number
  readonly setDepth: (depth: number) => void
  /** Graph after the orphan filter, ready for layout. */
  readonly visible: GraphDto
  /** Ask for a refetch without changing any filter. */
  readonly retry: () => void
}

const EMPTY: GraphDto = { nodes: [], edges: [] }

/**
 * Own graph settings and fetched data.
 * @param input - centre path, index revision, and the scope-change hook.
 * @returns the settings, filters, and visible graph.
 */
export function useGraphData({ center, version, onScopeChange }: GraphDataInput): GraphData {
  const [settings, setSettings] = useState<GraphSettings>(loadGraphSettings)
  const [graph, setGraph] = useState<GraphDto>(EMPTY)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [depth, setDepth] = useState(1)
  const [tagOptions, setTagOptions] = useState<readonly TagCountDto[]>([])
  const [reloadToken, setReloadToken] = useState(0)
  /** Scope (centre + depth) the last successful fetch served, for fit triggers. */
  const scopeRef = useRef('')
  /** Value graph.json load applied; writes skip it, so loading never saves. */
  const baselineRef = useRef<GraphSettings | undefined>(undefined)
  /** True once the user changed a control, so a late load must not overwrite. */
  const touchedRef = useRef(false)
  const settingsRef = useRef<GraphSettings>(settings)
  const saverRef = useRef(createGraphSettingsSaver())

  /** Route every control change through the user-touched marker. */
  const updateSettings = useCallback((next: GraphSettings | ((current: GraphSettings) => GraphSettings)) => {
    touchedRef.current = true
    setSettings(next)
  }, [])

  settingsRef.current = settings

  useEffect(() => {
    saveGraphSettings(settings)
    // The vault's graph.json is the durable copy; local storage only carries
    // the first paint. Writes start once the document loaded, and skip the
    // value that load itself just applied.
    if (baselineRef.current === undefined || baselineRef.current === settings) return
    saverRef.current.save(settings)
  }, [settings])

  useEffect(() => {
    let cancelled = false
    void loadHostGraphSettings().then((host) => {
      if (cancelled) return
      const applied = host !== undefined && !touchedRef.current ? host : settingsRef.current
      baselineRef.current = applied
      if (host !== undefined && !touchedRef.current) setSettings(host)
    })
    return () => {
      cancelled = true
      saverRef.current.dispose()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchTags()
      .then((items) => {
        if (!cancelled) setTagOptions(items)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const filters = settings.filters
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void fetchGraph(center, depth, {
        query: filters.query,
        tag: filters.tag,
        includeUnresolved: !filters.existingOnly,
        includeAttachments: filters.showAttachments,
        includeTags: filters.showTags,
      })
        .then((result) => {
          if (cancelled) return
          setGraph(result)
          // A scope change (mount, centre, depth) reframes the camera; typing
          // in the filter box keeps the current viewpoint.
          const scope = `${center ?? ''}@${depth}`
          if (scopeRef.current !== scope) {
            scopeRef.current = scope
            onScopeChange(center)
          }
        })
        .then(() => {
          if (!cancelled) setLoadError(undefined)
        })
        .catch((cause: unknown) => {
          if (cancelled) return
          // Keep the previous graph so a failed refresh doesn't blank the
          // canvas; the banner tells the user the data is stale.
          setLoadError(cause instanceof Error ? cause.message : String(cause))
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [center, depth, filters, onScopeChange, reloadToken, version])

  const visible = useMemo(() => {
    if (filters.showOrphans) return graph
    const degree = new Map<string, number>()
    for (const edge of graph.edges) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1)
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1)
    }
    const nodes = graph.nodes.filter(node => (degree.get(node.path) ?? 0) > 0 || node.depth === 0)
    const kept = new Set(nodes.map(node => node.path))
    return { nodes, edges: graph.edges.filter(edge => kept.has(edge.source) && kept.has(edge.target)) }
  }, [graph, filters.showOrphans])

  const retry = useCallback(() => setReloadToken(value => value + 1), [])

  return { settings, settingsRef, updateSettings, tagOptions, loadError, depth, setDepth, visible, retry }
}

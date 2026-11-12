/**
 * Main-bundle lazy boundary for the Pur Studio pane. The heavy pane lives in
 * `client.pur.js` and is fetched through the module loader's `require.async`.
 * @module dsh-obsidian-vault/client/pur/lazy
 */
import { lazy, Suspense, type ComponentType } from 'react'
import type { PurStudioPaneProps } from './PurStudioPane.tsx'

interface PurChunkModule {
  readonly PurStudioPane: ComponentType<PurStudioPaneProps>
}

interface AsyncRequire {
  readonly async?: (specifier: string) => Promise<unknown>
}

interface RequireHost {
  readonly __OV_REQUIRE__?: AsyncRequire
}

let pending: Promise<PurChunkModule> | undefined

/** Load the package-local Pur chunk once. */
function loadPurChunk(): Promise<PurChunkModule> {
  if (pending !== undefined) return pending
  const asynchronous = (globalThis as typeof globalThis & RequireHost).__OV_REQUIRE__?.async
  if (asynchronous === undefined) return Promise.reject(new Error('Pur chunk loader is unavailable'))
  pending = asynchronous('./client.pur.js').then((module) => module as PurChunkModule)
  return pending
}

const LazyPurStudioPane = lazy(async () => {
  const module = await loadPurChunk()
  return { default: module.PurStudioPane }
})

/**
 * Render the Pur Studio pane, loading its chunk on first use.
 * @param props - the pane props.
 */
export function PurStudioLazy(props: PurStudioPaneProps): JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyPurStudioPane {...props} />
    </Suspense>
  )
}

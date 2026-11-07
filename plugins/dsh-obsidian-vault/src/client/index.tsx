/**
 * Browser half: register the vault workspace as a global main panel and its
 * icon in the left sidebar rail. The page itself lives in `ui/VaultPage`.
 * @module dsh-obsidian-vault/client
 */
import type { ReactNode } from 'react'
import { BUILD_ID } from './build.ts'
import { createT, detectLang } from './i18n.ts'
import { createNoteTriggerSource } from './composer/note-trigger.ts'
import { VaultPage } from './ui/VaultPage.tsx'

console.info('[obsidian-vault] build', BUILD_ID)

/** Services the browser half reads. */
export const inject: readonly string[] = ['slots']

/** Panel id shared by the rail entry and the main panel it selects. */
const PANEL_ID = 'obsidian'

interface SlotRegistration {
  readonly name: string
  readonly id?: string
  readonly key?: string
  readonly order?: number
  readonly label?: string | (() => string)
}

/** The slice of the Client context the registration needs. */
export interface ClientContext {
  readonly slots: {
    register(options: SlotRegistration, component: (props: never) => ReactNode): () => void
    /** Wait for the slot's declaration before contributing into it. */
    inject(name: string, callback: () => () => void): () => void
  }
  effect(callback: () => (() => void) | void, label?: string): () => void
  get(name: string): unknown
  /**
   * Run `callback` once the named services exist, waiting for late providers.
   * @param deps - service names to wait for.
   * @param callback - the scope that owns the contribution.
   */
  inject?(deps: readonly string[], callback: (scope: ClientContext) => void): unknown
}

/** The directory-picker Remote result, as the gateway shapes it. */
type PickResult =
  | { readonly ok: true; readonly value: string | null }
  | { readonly ok: false; readonly error: { readonly message: string } }

interface DirectoryPickerLike {
  pick(): Promise<PickResult>
}

/**
 * Read the picker Remote at call time. The gateway mounts its `remote.*`
 * namespaces after this plugin applies, so resolving in `apply` would always
 * miss; a composition without the picker keeps resolving to `undefined`.
 * @param ctx - Client plugin context.
 */
function pickerOf(ctx: ClientContext): DirectoryPickerLike | undefined {
  return ctx.get('remote.directoryPicker') as DirectoryPickerLike | undefined
}

/**
 * Register the panel entry and its page. Both contributions wait for their
 * slot declaration, so activation order against `ui-sidebar` and `ui-layout`
 * does not matter.
 * @param ctx - Client plugin context.
 */
export function apply(ctx: ClientContext): void {
  const hasPicker = (): boolean => pickerOf(ctx) !== undefined
  const pickDirectory = async (): Promise<string | null> => {
    const picker = pickerOf(ctx)
    if (picker === undefined) throw new Error('directory picker unavailable')
    const result = await picker.pick()
    if (!result.ok) throw new Error(result.error.message)
    return result.value
  }
  const page = (): JSX.Element => <VaultPage hasPicker={hasPicker} pickDirectory={pickDirectory} />
  ctx.effect(
    () => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: PANEL_ID,
      order: 20,
      label: () => createT(detectLang())('panel'),
    }, VaultIcon as unknown as (props: never) => ReactNode)),
    'obsidian-vault: panel entry',
  )
  ctx.effect(
    () => ctx.slots.inject('main', () => ctx.slots.register(
      { name: 'main', key: PANEL_ID },
      page as unknown as (props: never) => ReactNode,
    )),
    'obsidian-vault: page',
  )
  installNoteTrigger(ctx)
}

/**
 * Register the `@笔记` composer source once the input-trigger service exists.
 * A composition without the conversation input surface simply never calls back.
 * @param ctx - Client plugin context.
 */
function installNoteTrigger(ctx: ClientContext): void {
  const register = (scope: ClientContext): void => {
    const service = scope.get('inputTriggers') as { registerSource?: (source: unknown) => () => void } | undefined
    if (service?.registerSource === undefined) return
    scope.effect(
      () => service.registerSource?.(createNoteTriggerSource()),
      'obsidian-vault: @ note source',
    )
  }
  if (ctx.inject !== undefined) {
    ctx.inject(['inputTriggers'], register)
    return
  }
  register(ctx)
}

/**
 * The rail glyph: a lined notebook.
 * @param props - requested square edge in pixels.
 */
function VaultIcon({ size = 16 }: { readonly size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="1.5" width="10" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

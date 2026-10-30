/**
 * The explorer column: the tree plus, while docked, its resize handle.
 * @module dsh-obsidian-vault/client/ui/ExplorerColumn
 */
import type { TagCountDto, TreeNodeDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import { Explorer } from './Explorer.tsx'
import { Splitter } from './Splitter.tsx'
import type { MenuActions } from './menu/types.ts'
import type { MenuScene } from './menu/registry.ts'
import { css } from './theme.ts'

/** Props for {@link ExplorerColumn}. */
export interface ExplorerColumnProps {
  readonly t: Translate
  readonly nodes: readonly TreeNodeDto[]
  readonly tags: readonly TagCountDto[]
  readonly activePath: string | undefined
  readonly filter: string
  readonly onFilter: (value: string) => void
  readonly onTag: (tag: string) => void
  readonly actions: MenuActions
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  readonly collapseRef: { readonly current: (() => void) | null }
  /** True below the docked breakpoint, where the pane becomes a drawer. */
  readonly narrow: boolean
  readonly open: boolean
  readonly width: number
  readonly onResize: (width: number) => void
  readonly onResetWidth: () => void
}

/**
 * Render the explorer and its splitter.
 * @param props - tree data, drawer state, and the pane width.
 */
export function ExplorerColumn(props: ExplorerColumnProps): JSX.Element {
  const {
    t, nodes, tags, activePath, filter, onFilter, onTag, actions, onMenu, collapseRef,
    narrow, open, width, onResize, onResetWidth,
  } = props

  return (
    <>
      <Explorer
        t={t}
        nodes={nodes}
        tags={tags}
        activePath={activePath}
        filter={filter}
        onFilter={onFilter}
        onTag={onTag}
        actions={actions}
        onMenu={onMenu}
        collapseRef={collapseRef}
        className={narrow
          ? (open ? css.paneOpen : '')
          : (open ? '' : css.paneHidden)}
      />
      {open && !narrow
        ? (
          <Splitter
            side="left"
            value={width}
            label={t('resizeExplorer')}
            onChange={(_side, value) => onResize(value)}
            onReset={onResetWidth}
          />
        )
        : null}
    </>
  )
}

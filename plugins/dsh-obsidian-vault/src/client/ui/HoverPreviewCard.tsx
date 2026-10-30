/**
 * The hover preview card shown next to a hovered note link.
 * @module dsh-obsidian-vault/client/ui/HoverPreviewCard
 */
import type { PreviewCard } from './useHoverPreview.ts'
import { css } from './theme.ts'

/** Props for {@link HoverPreviewCard}. */
export interface HoverPreviewCardProps {
  readonly preview: PreviewCard | undefined
}

/**
 * Render the preview card, when there is one.
 * @param props - the card to show.
 */
export function HoverPreviewCard({ preview }: HoverPreviewCardProps): JSX.Element | null {
  if (preview === undefined) return null
  return (
    <div className={css.preview} style={{ left: preview.x, top: preview.y }} role="tooltip">
      <div className={css.previewTitle}>{preview.title}</div>
      <div className={css.previewBody}>{preview.excerpt}</div>
    </div>
  )
}

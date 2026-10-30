/**
 * Responsive overrides, mounted last so they win over the docked column widths:
 * the right rail overlays below 1100px, the explorer becomes a drawer below 860px.
 */
export const RESPONSIVE_STYLE = `@media (max-width: 1100px) {
  .ov-rail {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(320px, 82vw);
    z-index: 45;
    border-left: 1px solid var(--dsw-alias-border-l1, #2a2a30);
    background: var(--dsw-alias-bg-layer-1, #1d1d22);
    transform: translateX(102%);
    transition: transform var(--ov-motion-normal) var(--ov-ease);
  }
  /* A parked drawer slides past the workspace body, which can sit in from the
     viewport edge; hiding it keeps the closed pane off-screen and unclickable. */
  .ov-rail:not(.ov-pane-open) { visibility: hidden; }
  .ov-rail.ov-pane-open { transform: none; box-shadow: -10px 0 28px rgba(0, 0, 0, .45); }
  .ov-splitter:not(.ov-splitter-pane) { display: none; }
  .ov-statusbar-narrow-hide { display: none; }
}
@media (max-width: 860px) {
  .ov-explorer {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(288px, 84vw);
    z-index: 45;
    border-right: 1px solid var(--dsw-alias-border-l1, #2a2a30);
    background: var(--dsw-alias-bg-layer-1, #1d1d22);
    transform: translateX(-102%);
    transition: transform var(--ov-motion-normal) var(--ov-ease);
  }
  .ov-explorer:not(.ov-pane-open) { visibility: hidden; }
  .ov-explorer.ov-pane-open { transform: none; box-shadow: 10px 0 28px rgba(0, 0, 0, .45); }
  .ov-ribbon { flex-basis: 40px; width: 40px; }
  .ov-statusbar { gap: 8px; padding: 0 6px; }
}
`

/** FRAME_STYLE rules: ribbon, splitters, status bar, shared states, tab overflow. */
export const FRAME_STYLE = `
/* Workspace frame. */
.ov-shell {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}
.ov-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  position: relative;
}
.ov-main-column {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}
.ov-main-column[data-direction="row"] { flex-direction: row; }
.ov-main-column[data-direction="column"] { flex-direction: column; }
/* Split panes share the strip by their flex-grow size; the dividers between
   them carry the separator line. */
.ov-pane {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
/* Two classes so the rule outranks the panes' own display rules, which the
   later style blocks declare with equal specificity. */
.ov-explorer.ov-pane-hidden, .ov-rail.ov-pane-hidden { display: none; }
.ov-ribbon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 0 0 var(--ov-ribbon-width);
  width: var(--ov-ribbon-width);
  padding: 6px 0;
  border-right: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-base, #16161a);
}
.ov-ribbon-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--ov-radius-s);
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  cursor: pointer;
  transition: background var(--ov-motion-fast) var(--ov-ease), color var(--ov-motion-fast) var(--ov-ease);
}
.ov-ribbon-item:hover {
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-ribbon-item-active,
.ov-ribbon-item-active:hover {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.ov-ribbon-spacer { flex: 1 1 auto; }
.ov-splitter {
  position: relative;
  flex: 0 0 var(--ov-splitter-width);
  width: var(--ov-splitter-width);
  border: 0;
  padding: 0;
  background: none;
  cursor: col-resize;
  touch-action: none;
  z-index: 2;
}
.ov-splitter::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 1px;
  background: var(--dsw-alias-border-l1, #2a2a30);
  transition: background var(--ov-motion-fast) var(--ov-ease);
}
.ov-splitter:hover::after,
.ov-splitter:focus-visible::after,
.ov-splitter-active::after {
  background: var(--dsw-alias-brand-primary, #4d6bfe);
}
.ov-splitter:focus-visible { outline: none; }
/* Pane dividers reuse the splitter chrome; the horizontal variant draws a
   row-resize line across the strip. */
.ov-splitter-h {
  width: auto;
  height: var(--ov-splitter-width);
  cursor: row-resize;
}
.ov-splitter-h::after {
  top: 2px;
  bottom: auto;
  left: 0;
  right: 0;
  width: auto;
  height: 1px;
}
.ov-scrim {
  position: absolute;
  inset: 0;
  z-index: 44;
  border: 0;
  padding: 0;
  background: rgba(0, 0, 0, .32);
  cursor: default;
}

/* Status bar. */
.ov-statusbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 var(--ov-statusbar-height);
  height: var(--ov-statusbar-height);
  padding: 0 10px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-base, #16161a);
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: var(--ov-font-tiny);
  white-space: nowrap;
  overflow: hidden;
}
.ov-statusbar-group { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.ov-statusbar-group + .ov-statusbar-group { margin-left: auto; }
.ov-statusbar-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: var(--ov-radius-s);
  padding: 0 3px;
}
.ov-statusbar-item:hover { color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-statusbar-muted { color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-statusbar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #3fb950);
  flex: 0 0 auto;
}
.ov-statusbar-dot[data-state="stale"] { background: var(--dsw-alias-state-warning-primary, #d29922); }
.ov-statusbar-dot[data-state="error"] { background: var(--dsw-alias-state-error-primary, #f85149); }

/* Shared surface states. */
.ov-state {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: auto;
  padding: 28px 24px;
  text-align: center;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-state-icon { color: var(--dsw-alias-label-tertiary, #8b8b94); opacity: .8; }
.ov-state-title { font-size: var(--ov-font-ui); color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-state-hint { font-size: var(--ov-font-small); max-width: 320px; line-height: 1.55; }
.ov-state-action {
  margin-top: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  border-radius: var(--ov-radius-s);
  padding: 4px 10px;
  font: inherit;
  font-size: var(--ov-font-small);
  cursor: pointer;
}
.ov-state-action:hover {
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-error-state {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 12px;
  padding: 6px 10px;
  border-radius: var(--ov-radius-s);
  font-size: var(--ov-font-small);
  color: var(--dsw-alias-state-error-primary, #ff6b6b);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ff6b6b) 12%, transparent);
}
.ov-error-message { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ov-error-action {
  border: 1px solid currentColor;
  background: none;
  color: inherit;
  border-radius: var(--ov-radius-s);
  padding: 1px 8px;
  font: inherit;
  font-size: var(--ov-font-tiny);
  cursor: pointer;
  opacity: .9;
}
.ov-error-action:hover { opacity: 1; }

/* Tab overflow menu. */
.ov-tab-overflow {
  position: absolute;
  top: calc(100% + 2px);
  right: 8px;
  z-index: 50;
  min-width: 200px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
  border-radius: var(--ov-radius-m);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, .4);
}
.ov-tab-overflow-row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: var(--ov-radius-s);
}
.ov-tab-overflow-row:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-tab-overflow-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--ov-font-small);
  text-align: left;
  padding: 5px 7px;
  border-radius: var(--ov-radius-s);
  cursor: pointer;
}
.ov-tab-overflow-item:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-tab-overflow-active { color: var(--dsw-alias-brand-primary, #7d94ff); font-weight: 600; }
.ov-tab-overflow-close {
  margin-left: auto;
  border: 0;
  background: none;
  color: inherit;
  opacity: .5;
  font-size: var(--ov-font-small);
  line-height: 1;
  padding: 1px 4px;
  border-radius: var(--ov-radius-s);
  cursor: pointer;
}
.ov-tab-overflow-close:hover { opacity: 1; background: var(--dsw-alias-bg-layer-3, #2b2b33); }
.ov-doctab-drop { box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary, #4d6bfe); }
`

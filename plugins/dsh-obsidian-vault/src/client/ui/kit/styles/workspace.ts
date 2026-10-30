/** WORKSPACE_STYLE rules. */
export const WORKSPACE_STYLE = `
.ov-explorer {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: var(--ov-left-width, 248px);
  min-height: 0;
  border-right: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-explorer-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px 0;
  flex-wrap: wrap;
}
.ov-explorer-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  border-radius: 6px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  padding: 0;
}
.ov-explorer-tool:hover {
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-explorer-select {
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  border-radius: 4px;
  font: inherit;
  font-size: 11px;
  padding: 2px 4px;
  max-width: 112px;
}
.ov-explorer-tags {
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 1 auto;
  min-height: 0;
  max-height: 40%;
  display: flex;
  flex-direction: column;
}
.ov-explorer-tags-head {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  font-size: 11px;
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: 7px 10px;
  cursor: pointer;
  flex: 0 0 auto;
}
.ov-explorer-tags-head:hover { color: var(--dsw-alias-label-primary, #e8e8ea); }
.ov-explorer-tags-body {
  overflow: auto;
  min-height: 0;
  padding: 0 10px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-content: flex-start;
}
.ov-tag-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: none;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font: inherit;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  cursor: pointer;
}
.ov-tag-chip:hover {
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-tag-chip.ov-active {
  color: var(--dsw-alias-brand-primary, #7d94ff);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 12%, transparent);
}
.ov-tag-chip-count { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 10px; }
.ov-menu {
  position: fixed;
  z-index: 70;
  min-width: 150px;
  max-height: calc(100vh - 8px);
  overflow-y: auto;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, .4);
}
.ov-menu:focus { outline: none; }
.ov-menu-sub { z-index: 80; }
.ov-menu-group { display: flex; flex-direction: column; }
.ov-menu-group + .ov-menu-group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 12px;
  padding: 6px 9px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-menu-item:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-menu-item-active,
.ov-menu-item-active:hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 16%, transparent);
}
.ov-menu-item[aria-disabled="true"] { opacity: .42; cursor: default; }
.ov-menu-item[aria-disabled="true"]:hover { background: none; }
.ov-menu-item-danger,
.ov-menu-item-danger:hover { color: #ff8a80; }
.ov-menu-item-danger.ov-menu-item-active:hover {
  background: color-mix(in srgb, #ff8a80 16%, transparent);
}
.ov-menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  flex: 0 0 auto;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
}
.ov-menu-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-menu-shortcut {
  flex: 0 0 auto;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-menu-caret { flex: 0 0 auto; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-filter {
  margin: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  font: inherit;
  font-size: 12px;
}
.ov-filter:focus { outline: 1px solid var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-tree { overflow: auto; padding: 0 4px 8px; min-height: 0; flex: 1 1 auto; }
.ov-dir, .ov-file {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ov-chevron {
  display: inline-block;
  width: 10px;
  flex: 0 0 auto;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 10px;
}
.ov-file-icon {
  display: inline-block;
  width: 5px;
  height: 5px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
  opacity: .45;
}
.ov-dir { color: var(--dsw-alias-label-secondary, #b6b6bd); font-size: 12px; }
.ov-file:hover, .ov-dir:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-active { background: var(--dsw-alias-bg-layer-2, #232329); color: var(--dsw-alias-brand-primary, #7d94ff); }
.ov-file.ov-selected, .ov-dir.ov-selected {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 10%, transparent);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary, #4d6bfe);
}
.ov-main { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; min-width: 0; }
.ov-note { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.ov-note-head {
  padding: 10px 16px 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
/* The breadcrumb takes the row's spare width; the source switch stays put. */
.ov-note-head-row { display: flex; align-items: center; gap: 10px; }
.ov-note-head-row .ov-breadcrumb { flex: 1 1 auto; min-width: 0; flex-wrap: wrap; }
.ov-note-head-row .ov-button { flex: 0 0 auto; }
.ov-title { font-size: 18px; font-weight: 600; margin: 0 0 2px; }
.ov-path { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-chip {
  display: inline-block;
  margin: 6px 6px 0 0;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;
  color: var(--dsw-alias-brand-primary, #7d94ff);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 14%, transparent);
}
.ov-scroll { flex: 1 1 auto; overflow: auto; padding: 32px 32px 64px; min-height: 0; }
.ov-rail {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: var(--ov-right-width, 288px);
  min-height: 0;
  border-left: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-tabs { display: flex; gap: 2px; padding: 8px 8px 0; flex-wrap: wrap; }
.ov-tab {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-tab.ov-active { color: var(--dsw-alias-label-primary, #e8e8ea); background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-panel { overflow: auto; padding: 8px; min-height: 0; flex: 1 1 auto; }
.ov-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-item:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-item-meta { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; margin-top: 2px; word-break: break-word; }
.ov-empty { margin: auto; text-align: center; color: var(--dsw-alias-label-tertiary, #8b8b94); padding: 24px; }
.ov-empty-hint { font-size: 12px; margin-top: 6px; }
.ov-quick-layer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  z-index: 40;
}
.ov-quick {
  width: min(560px, 92vw);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(0, 0, 0, .45);
}
.ov-quick-input {
  border: 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  padding: 12px 14px;
}
.ov-quick-input:focus { outline: none; }
.ov-quick-list { overflow: auto; padding: 6px; }
.ov-quick-item { display: flex; align-items: baseline; gap: 8px; }
.ov-quick-kind { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-quick-line { display: flex; align-items: baseline; gap: 8px; }
.ov-quick-snippet {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
}
.ov-quick-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  padding: 6px 12px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  flex: 0 0 auto;
}
.ov-quick-mode { color: var(--dsw-alias-brand-primary, #7d94ff); font-weight: 600; }
.ov-quick-hint { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; }
.ov-preview {
  position: fixed;
  z-index: 60;
  width: 340px;
  max-height: 170px;
  overflow: hidden;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .45);
  pointer-events: none;
}
.ov-preview-title { font-weight: 600; font-size: 12.5px; margin-bottom: 4px; }
.ov-preview-body { font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-outline-active {
  color: var(--dsw-alias-brand-primary, #7d94ff);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 12%, transparent);
}
.ov-panel .ov-item { touch-action: pan-y; }
.ov-outline-badge {
  margin-left: 6px;
  font-size: 10px;
  color: var(--dsw-alias-brand-primary, #7d94ff);
  white-space: nowrap;
}
.ov-section-title {
  font-size: 11px;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  padding: 8px 8px 4px;
}
.ov-tab-count {
  margin-left: 4px;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-breadcrumb { display: flex; align-items: center; gap: 2px; font-size: 11.5px; }
.ov-breadcrumb-item {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  padding: 0 2px;
  border-radius: 3px;
  cursor: pointer;
}
.ov-breadcrumb-item:hover { color: var(--dsw-alias-label-primary, #e8e8ea); background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-breadcrumb-sep { color: var(--dsw-alias-label-tertiary, #8b8b94); opacity: .6; }
.ov-plugin-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.ov-plugin-view-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-plugin-view-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b8b8c0);
}
.ov-plugin-frame {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 0;
  background: var(--dsw-alias-bg-primary, #17171a);
}
.ov-plugin-frame-error {
  flex: 0 0 auto;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--dsw-alias-status-error, #e5534b);
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  white-space: pre-wrap;
}
`

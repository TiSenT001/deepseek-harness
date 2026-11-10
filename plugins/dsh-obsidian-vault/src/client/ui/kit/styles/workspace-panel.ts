/**
 * Panel rules: outline, backlinks, tags, properties and the split panes.
 * @module dsh-obsidian-vault/client/ui/kit/styles/workspace-panel
 */
export const WORKSPACE_PANEL_STYLE = `
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
.ov-quick-replace {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px 8px;
}
.ov-quick-replace-input { flex: 1 1 auto; min-width: 0; padding: 8px 2px; font-size: 13px; }
.ov-quick-replace-button {
  flex: 0 0 auto;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font: inherit;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}
.ov-quick-replace-button:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  border-color: var(--dsw-alias-border-l3, #4a4a52);
}
.ov-quick-replace-button:disabled { opacity: .45; cursor: default; }
.ov-quick-replace-status {
  padding: 0 12px 8px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
  line-height: 1.5;
}
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
}`

/**
 * Reading rules: note header, body typography, callouts and inline widgets.
 * @module dsh-obsidian-vault/client/ui/kit/styles/workspace-note
 */
export const WORKSPACE_NOTE_STYLE = `
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
.ov-filter:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); }
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
.ov-note { display: flex; flex-direction: column; min-height: 0; min-width: 0; height: 100%; overflow: hidden; container-type: inline-size; }
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

/* Empty tab: vault title, quick-switch prompt, and action cards. */
.ov-vault-empty {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.ov-vault-empty-body {
  width: min(520px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ov-vault-empty-title {
  margin: 0;
  font-size: 21px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--dsw-alias-label-primary, #f9fafb);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-vault-empty-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: text;
}
.ov-vault-empty-search:hover { border-color: var(--dsw-alias-border-l2, #3a3a42); }
.ov-vault-empty-search:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);
  outline-offset: 1px;
}
.ov-vault-empty-search-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-vault-empty-kbd {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 4px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  font-size: 11px;
  line-height: 1.4;
}
.ov-vault-empty-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.ov-vault-empty-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f9fafb);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.ov-vault-empty-card:hover {
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #f9fafb) 5%, transparent);
}
.ov-vault-empty-card:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);
  outline-offset: 1px;
}
.ov-vault-empty-card-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-vault-empty-hint {
  margin: 0;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}
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
  box-shadow: 0 18px 48px rgba(0, 0, 0, .45);`

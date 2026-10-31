/**
 * Shell and explorer rules: the workspace frame, the file tree and its tools.
 * @module dsh-obsidian-vault/client/ui/kit/styles/workspace-shell
 */
export const WORKSPACE_SHELL_STYLE = `
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
  overflow-x: hidden;
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
  white-space: nowrap;
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
}`

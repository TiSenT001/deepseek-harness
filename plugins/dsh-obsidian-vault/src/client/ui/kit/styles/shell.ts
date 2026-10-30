/** SHELL_STYLE rules. */
export const SHELL_STYLE = `
.ov-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary, #e8e8ea);
  background: var(--dsw-alias-bg-base, #16161a);
  font: 13px/1.5 var(--dsw-font-body, system-ui, sans-serif);
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-border-l2, #3a3a42) transparent;
}
.ov-root::-webkit-scrollbar, .ov-root ::-webkit-scrollbar { width: 6px; height: 6px; }
.ov-root::-webkit-scrollbar-track, .ov-root ::-webkit-scrollbar-track { background: transparent; }
.ov-root::-webkit-scrollbar-thumb, .ov-root ::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2, #3a3a42); border-radius: 3px; }
.ov-root::-webkit-scrollbar-thumb:hover, .ov-root ::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-top {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-brand { font-weight: 600; font-size: 13px; padding: 0 2px 0 4px; }
.ov-top-group { display: inline-flex; align-items: center; gap: 2px; }
.ov-grow { flex: 1 1 auto; }
.ov-button {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  border-radius: 6px;
  padding: 4px 8px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.ov-button:hover {
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-button[disabled] { opacity: .4; cursor: default; }
.ov-button[disabled]:hover { background: none; color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  border-radius: 6px;
  cursor: pointer;
}
.ov-icon-button:hover {
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-icon-button[disabled] { opacity: .35; cursor: default; }
.ov-icon-button[disabled]:hover { background: none; color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-icon-button-active,
.ov-icon-button-active:hover {
  color: var(--dsw-alias-brand-primary, #7d94ff);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 14%, transparent);
}
.ov-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  border-radius: 7px;
  padding: 4px 9px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.ov-pill:hover {
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-pill-kbd {
  font-size: 10.5px;
  line-height: 15px;
  padding: 0 4px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-menu-layer { position: fixed; inset: 0; z-index: 60; }
.ov-banner {
  margin: 8px 12px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--dsw-alias-state-error-primary, #ff6b6b);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ff6b6b) 12%, transparent);
}
`

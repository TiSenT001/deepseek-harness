/**
 * PurStudio canvas chrome: the element editor dialog frame, its sections and
 * field layouts, the menu sizing, the hover hint chip and the notice toast.
 * Every visual value comes from the shared tokens so the canvas panels read
 * like the rest of the workspace.
 * @module dsh-obsidian-vault/client/ui/kit/styles/pur
 */
export const PUR_STYLE = `
.ov-pur-dialog { width: min(460px, 92vw); max-height: 86vh; }
.ov-pur-dialog-wide { width: min(560px, 92vw); }
.ov-pur-esc { margin-left: auto; }
.ov-pur-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-pur-section { display: flex; flex-direction: column; gap: 8px; }
.ov-pur-section-head { display: flex; align-items: center; gap: 8px; }
.ov-pur-section-title {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-pur-section-rule { flex: 1; height: 1px; background: var(--dsw-alias-border-l1, #2a2a30); }
.ov-pur-fields { display: grid; gap: 8px; }
.ov-pur-row { display: flex; gap: 8px; align-items: center; }
.ov-pur-col { display: flex; flex-direction: column; gap: 4px; }
.ov-pur-span { grid-column: 1 / -1; justify-self: start; }
.ov-pur-start { align-self: flex-start; }
.ov-pur-check { display: flex; gap: 8px; align-items: center; }
.ov-pur-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; tab-size: 2; }
.ov-pur-menu { width: max-content; min-width: 168px; max-width: 280px; }
.ov-pur-menu-sub { min-width: 180px; max-height: 60vh; }
.ov-pur-menu-slider { width: 90px; }
.ov-pur-note-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; }
.ov-pur-hint {
  position: absolute;
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .35);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  pointer-events: none;
  z-index: 6;
}
.ov-pur-notice {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  pointer-events: none;
}
`

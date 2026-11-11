/**
 * Dialog and vault-manager rules: the overlay card, its action buttons, the
 * recent-vault rows, and the topbar vault switcher. Plain rules only; media
 * queries stay in the responsive module.
 * @module dsh-obsidian-vault/client/ui/kit/styles/dialog
 */
export const DIALOG_STYLE = `
.ov-vault-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  margin-left: -2px;
  padding: 3px 7px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
}
.ov-vault-switch:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-vault-switch-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-vault-switch svg { flex: 0 0 auto; opacity: .6; }
.ov-dialog-layer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: 45;
}
.ov-dialog.ov-settings-dialog { width: min(760px, 94vw); max-height: 82vh; }
.ov-plugin-chevron {
  display: inline-block;
  margin-right: 2px;
  font-size: 10px;
  opacity: .55;
  transition: transform .12s ease;
}
.ov-plugin-chevron[data-open="true"] { transform: rotate(90deg); }
.ov-dialog {
  width: min(620px, 94vw);
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(0, 0, 0, .45);
}
.ov-dialog-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-dialog-title { font-weight: 600; font-size: 13px; }
.ov-dialog-close {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  border-radius: 6px;
  cursor: pointer;
}
.ov-dialog-close:hover {
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-dialog-body {
  overflow: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ov-dialog-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ov-dialog-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  border-radius: 7px;
  padding: 5px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.ov-dialog-button:hover {
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-dialog-button[disabled] { opacity: .4; cursor: default; }
.ov-dialog-button[disabled]:hover {
  border-color: var(--dsw-alias-border-l1, #2a2a30);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
}
.ov-dialog-button-primary {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 16%, transparent);
  color: var(--dsw-alias-brand-primary, #7d94ff);
}
.ov-dialog-button-primary:hover {
  color: var(--dsw-alias-brand-primary, #7d94ff);
}
.ov-dialog-hint { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-dialog-error {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  color: var(--dsw-alias-state-error-primary, #ff6b6b);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ff6b6b) 12%, transparent);
}
.ov-dialog-confirm {
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 7px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--dsw-alias-bg-layer-2, #232329);
}
.ov-dialog-confirm-title { font-weight: 600; font-size: 12.5px; }
.ov-dialog-confirm-path {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  word-break: break-all;
}
.ov-vault-list { display: flex; flex-direction: column; gap: 6px; }
.ov-vault-row {
  display: flex;
  align-items: stretch;
  gap: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
}
.ov-vault-row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 7px;
}
.ov-vault-row-main:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-vault-row-main[disabled] { opacity: .5; cursor: default; }
.ov-vault-row-name { font-weight: 600; display: flex; align-items: center; gap: 6px; min-width: 0; }
.ov-vault-row-tag {
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 600;
  color: var(--dsw-alias-brand-primary, #7d94ff);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 40%, transparent);
  border-radius: 4px;
  padding: 0 4px;
  line-height: 14px;
}
.ov-vault-row-path {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-vault-row-forget {
  flex: 0 0 auto;
  align-self: center;
  margin-right: 6px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  border-radius: 5px;
  cursor: pointer;
}
.ov-vault-row-forget:hover {
  color: var(--dsw-alias-state-error-primary, #ff6b6b);
  background: var(--dsw-alias-bg-layer-2, #232329);
}
.ov-dialog-section { display: flex; flex-direction: column; gap: 6px; }
.ov-dialog-section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-dialog-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 9px;
  margin-bottom: 12px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #1b1b1f);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font: inherit;
  outline: none;
}
.ov-dialog-input:focus { border-color: var(--dsw-alias-border-l2, #3a3a42); }
.ov-dialog-layer-center { align-items: center; padding-top: 0; }
.ov-field { display: block; }
.ov-field-label {
  display: block;
  margin-bottom: 2px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #1b1b1f);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  color-scheme: dark;
}
.ov-input:focus {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);
  outline-offset: 1px;
}
textarea.ov-input { resize: vertical; }
.ov-color-swatch {
  width: 46px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
.ov-color-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
/* Named workspace layouts */
.ov-layouts-dialog { width: min(560px, 94vw); }
.ov-layouts-form { display: flex; gap: 8px; }
.ov-layouts-form .ov-dialog-input { flex: 1 1 auto; }
.ov-layouts-hint {
  margin: 7px 0 10px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
  line-height: 1.5;
}
.ov-layouts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: min(52vh, 420px);
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}
.ov-layouts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1b1b1f);
}
.ov-layouts-info { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.ov-layouts-name {
  overflow: hidden;
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-layouts-meta { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-layouts-actions { display: flex; flex: none; gap: 6px; }
.ov-layouts-empty {
  margin: 8px 0 0;
  padding: 16px;
  border: 1px dashed var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  text-align: center;
}
/* New-note-from-template dialog */
.ov-template-dialog { width: min(420px, 94vw); }
.ov-template-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.ov-template-label { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-template-empty {
  margin: 4px 0;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  line-height: 1.6;
}
/* Tag rename / merge dialog */
.ov-tag-dialog { width: min(440px, 94vw); }
.ov-tag-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 9px; }
.ov-tag-label { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-tag-hint {
  margin: 2px 0 8px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
  line-height: 1.5;
}
.ov-tag-preview {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font-size: 12px;
}
.ov-tag-error { margin: 0 0 8px; color: var(--dsw-alias-state-error-primary, #f85149); font-size: 12px; }
/* File-recovery snapshots */
.ov-history-dialog { width: min(820px, 94vw); }
.ov-history-layout {
  display: grid;
  grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
  gap: 10px;
  min-height: 240px;
}
.ov-history-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 46vh;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}
.ov-history-row {
  display: flex;
  width: 100%;
  padding: 7px 9px;
  flex-direction: column;
  gap: 2px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ov-history-row:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-history-row-active { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-history-time { font-size: 12px; color: var(--dsw-alias-label-primary, #e8e8ea); }
.ov-history-size { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-history-preview {
  max-height: 46vh;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #1b1b1f);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.ov-history-status {
  margin: 8px 0 0;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  line-height: 1.5;
}
`

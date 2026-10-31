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
  border-color: var(--dsw-alias-brand-primary, #4d6bfe);
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
`

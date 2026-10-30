/** EDITOR_STYLE rules: the Markdown source editor, its status line, and the conflict bar. */
export const EDITOR_STYLE = `/* Editor: one textarea filling the reading area below the header. */
.ov-editor-view {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.ov-editor-area {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 20px 24px;
  border: 0;
  outline: none;
  resize: none;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font-family: var(--dsw-font-code, ui-monospace, monospace);
  font-size: 13px;
  line-height: 1.7;
  tab-size: 4;
  white-space: pre-wrap;
}
.ov-editor-area:focus { box-shadow: inset 0 0 0 1px var(--dsw-alias-brand-primary, #7d94ff); }
.ov-editor-status {
  padding: 5px 14px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11.5px;
}
.ov-editor-conflict {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d29922) 14%, transparent);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font-size: 12px;
}
.ov-editor-conflict-text { flex: 1 1 auto; min-width: 0; }
.ov-editor-conflict button { flex: 0 0 auto; }
`

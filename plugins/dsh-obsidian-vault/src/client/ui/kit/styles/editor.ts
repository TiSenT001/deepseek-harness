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
/* The colour layer and the transparent textarea must share every metric, or the
   caret drifts from the painted glyphs; only their colours differ. */
.ov-editor-canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
}
.ov-editor-highlight,
.ov-editor-area {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 16px 20px 24px;
  border: 0;
  font-family: var(--dsw-font-code, ui-monospace, monospace);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
}
.ov-editor-highlight {
  overflow: hidden;
  pointer-events: none;
  color: var(--dsw-alias-label-primary, #e8e8ea);
  background: transparent;
}
.ov-editor-area {
  overflow: auto;
  resize: none;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: var(--dsw-alias-brand-primary, #7d94ff);
  scrollbar-width: none;
}
.ov-editor-area::-webkit-scrollbar { width: 0; height: 0; }
.ov-editor-area::selection { background: color-mix(in srgb, var(--dsw-alias-brand-primary, #7d94ff) 28%, transparent); color: transparent; }
.ov-editor-highlight .ov-md-frontmatter { color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-editor-highlight .ov-md-heading { color: var(--dsw-alias-brand-primary, #7d94ff); }
.ov-editor-highlight .ov-md-code { color: var(--dsw-alias-state-success-primary, #3fb950); }
.ov-editor-highlight .ov-md-inline-code { color: var(--dsw-alias-state-success-primary, #3fb950); }
.ov-editor-highlight .ov-md-quote { color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-editor-highlight .ov-md-list { color: var(--dsw-alias-state-warning-primary, #d29922); }
.ov-editor-highlight .ov-md-link { color: var(--dsw-alias-brand-primary, #7d94ff); }
.ov-editor-highlight .ov-md-tag { color: var(--dsw-alias-state-warning-primary, #d29922); }
.ov-editor-highlight .ov-md-bold { color: var(--dsw-alias-label-primary, #e8e8ea); }
.ov-editor-highlight .ov-md-italic { color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-editor-find {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-2, #24242a);
}
.ov-editor-find-input {
  min-width: 140px;
  max-width: 220px;
  padding: 3px 7px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font-size: 12px;
}
.ov-editor-find-input:focus {
  outline: 1px solid var(--dsw-alias-brand-primary, #7d94ff);
  outline-offset: 1px;
}
.ov-editor-find-count {
  min-width: 56px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11.5px;
}
.ov-editor-area:focus { box-shadow: inset 0 0 0 2px var(--ov-focus, #4d6bfe); }
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

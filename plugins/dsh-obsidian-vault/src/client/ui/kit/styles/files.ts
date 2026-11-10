/** FILE_STYLE rules: code view, image/PDF previews, metadata cards, tokens. */
export const FILE_STYLE = `/* Code view: one row per source line so the gutter stays aligned. */
.ov-code-view, .ov-file-view {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}
.ov-code-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  font-size: 12px;
}
.ov-code-lang {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.ov-code-meta { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11.5px; }
/* Read-only JSON Canvas viewer */
.ov-canvas-host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; }
.ov-canvas-file { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; }
.ov-canvas-viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  cursor: grab;
  touch-action: none;
}
.ov-canvas-viewport:active { cursor: grabbing; }
.ov-canvas-world { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.ov-canvas-edges { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
.ov-canvas-node {
  position: absolute;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font: inherit;
  text-align: left;
}
.ov-canvas-text-node { padding: 10px 12px; font-size: 13px; line-height: 1.55; overflow: auto; }
.ov-canvas-text-node > *:first-child { margin-top: 0; }
.ov-canvas-text-node > *:last-child { margin-bottom: 0; }
.ov-canvas-group {
  border-style: dashed;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #232329) 55%, transparent);
  pointer-events: none;
}
.ov-canvas-group-label {
  position: absolute;
  top: 7px;
  left: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
  letter-spacing: .02em;
}
.ov-canvas-file-node, .ov-canvas-link-node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  cursor: pointer;
  text-decoration: none;
}
.ov-canvas-file-node:hover, .ov-canvas-link-node:hover { border-color: var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-canvas-node-title { overflow: hidden; font-size: 13px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.ov-canvas-node-sub { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; }
.ov-canvas-link-node .ov-canvas-node-title { color: var(--dsw-alias-brand-primary, #7d94ff); }
.ov-canvas-zoom { display: flex; align-items: center; gap: 3px; margin-left: auto; }
.ov-canvas-zoom-value { min-width: 38px; color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; text-align: center; }
.ov-canvas-tool-button {
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font: inherit;
  font-size: 12px;
  padding: 2px 7px;
  cursor: pointer;
}
.ov-canvas-tool-button:hover { color: var(--dsw-alias-label-primary, #e8e8ea); background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-canvas-error { padding: 20px; color: var(--dsw-alias-state-error-primary, #f85149); font-size: 12px; }
.ov-canvas-edge-label { fill: var(--dsw-alias-label-secondary, #b6b6bd); font-size: 11px; }
.ov-code-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.ov-code-body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 10px 0 20px;
  font-family: var(--dsw-font-code, ui-monospace, monospace);
  font-size: 12.5px;
  line-height: 1.65;
  tab-size: 4;
}
.ov-code-line { display: flex; gap: 14px; padding-right: 18px; }
.ov-code-line:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-code-line-no {
  flex: 0 0 auto;
  width: 46px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  opacity: .55;
  user-select: none;
}
.ov-code-text { white-space: pre; }
.ov-code-notice {
  padding: 7px 14px;
  font-size: 12px;
  color: var(--dsw-alias-state-warning-primary, #d29922);
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d29922) 12%, transparent);
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-source-bar {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}

/* Image and PDF previews. */
.ov-file-media {
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: auto;
  min-height: 0;
}
.ov-file-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: repeating-conic-gradient(#202027 0% 25%, #26262e 0% 50%) 50% / 18px 18px;
}
.ov-file-frame { flex: 1 1 auto; width: 100%; min-height: 0; border: 0; background: #fff; }

/* Metadata card for binaries and downloads. */
.ov-file-info {
  max-width: 520px;
  margin: 48px auto;
  padding: 18px 20px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
}
.ov-file-info-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-file-info-key { color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-file-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 6px 12px;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 6px;
  color: var(--dsw-alias-brand-primary, #7d94ff);
  font-size: 12.5px;
  text-decoration: none;
}
.ov-file-download:hover { background: var(--dsw-alias-bg-layer-2, #232329); text-decoration: none; }

/* Token colours, keyed to the default dark theme. */
.ov-tk-comment { color: #7f8899; font-style: italic; }
.ov-tk-string { color: #98c379; }
.ov-tk-number { color: #d19a66; }
.ov-tk-keyword { color: #c678dd; }
.ov-tk-literal { color: #d19a66; }
.ov-tk-function { color: #61afef; }
.ov-tk-attr { color: #e5c07b; }
.ov-tk-tag { color: #e06c75; }
.ov-tk-punct { color: #8b93a1; }

`

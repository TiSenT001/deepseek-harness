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

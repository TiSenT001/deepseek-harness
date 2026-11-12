/** CONTENT_STYLE rules. */
export const CONTENT_STYLE = `/* Document typography, closer to Obsidian's reading view. */
.ov-document { max-width: 700px; margin: 0 auto; font-size: 16px; line-height: 1.5; }
.ov-document h1, .ov-document h2, .ov-document h3,
.ov-document h4, .ov-document h5, .ov-document h6 {
  line-height: 1.3;
  font-weight: 650;
  margin: 2.5rem 0 0.55rem;
}
.ov-document h1 { font-size: 1.618em; }
.ov-document h2 { font-size: 1.462em; }
.ov-document h3 { font-size: 1.318em; }
.ov-document h4 { font-size: 1.188em; }
.ov-document h5 { font-size: 1.076em; }
.ov-document h6 { font-size: 1em; }
.ov-document h5, .ov-document h6 { color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-document p { margin: 0 0 1rem; }
.ov-document ul, .ov-document ol { margin: 0 0 1rem; padding-left: 1.6em; }
.ov-document li { margin: 0.18em 0; }
.ov-document li > p { margin: 0; }
.ov-document blockquote {
  margin: 1em 0;
  padding: 0.2em 0 0.2em 0.9em;
  border-left: 2px solid var(--dsw-alias-brand-primary, #4d6bfe);
  color: var(--dsw-alias-label-secondary, #b6b6bd);
}
.ov-document code {
  font-family: var(--dsw-font-code, ui-monospace, monospace);
  font-size: 0.88em;
  padding: 0.12em 0.36em;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-2, #232329);
}
.ov-document pre {
  margin: 1em 0;
  padding: 12px 14px;
  border-radius: 8px;
  overflow: auto;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-document pre code { padding: 0; background: none; font-size: 0.86em; }
.ov-document table {
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.94em;
}
.ov-document th, .ov-document td {
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  padding: 5px 10px;
  text-align: left;
}
.ov-document th { background: var(--dsw-alias-bg-layer-2, #232329); font-weight: 600; }
.ov-document hr {
  border: 0;
  border-top: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  margin: 1.6em 0;
}
.ov-document a { color: var(--dsw-alias-brand-primary, #7d94ff); text-decoration: none; }
.ov-document a:hover { text-decoration: underline; }
.ov-document a.ov-unresolved { color: var(--dsw-alias-label-tertiary, #8b8b94); text-decoration: underline dashed; }
.ov-document a.ov-ambiguous { text-decoration: underline dotted; }
.ov-document a[href*="/tag?"] {
  color: var(--dsw-alias-brand-primary, #7d94ff);
  text-decoration: none;
  border-radius: 4px;
  padding: 0 2px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 12%, transparent);
}
.ov-document li.task-list-item, .ov-document .contains-task-list li { list-style: none; }
.ov-document li.task-list-item { margin-left: -1.2em; }
.ov-document input[type="checkbox"] { margin-right: 0.45em; accent-color: var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-highlight {
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d29922) 32%, transparent);
  color: inherit;
  padding: 0.05em 0.2em;
  border-radius: 3px;
}

/* Obsidian-style property list above the note body. */
.ov-properties {
  margin: 0 0 18px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  font-size: 12.5px;
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 14px;
}
.ov-property-row { display: contents; }
.ov-property-key {
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.ov-property-icon { opacity: .7; font-size: 11px; width: 14px; text-align: center; }
.ov-property-value { color: var(--dsw-alias-label-primary, #e8e8ea); word-break: break-word; }
.ov-property-editable {
  margin: 0;
  padding: 1px 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: text;
}
.ov-property-editable:hover { border-color: var(--dsw-alias-border-l1, #2a2a30); background: var(--dsw-alias-bg-layer-2, #24242a); }
.ov-property-editable:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 1px; }
.ov-property-edit { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
.ov-property-input {
  min-width: 140px;
  max-width: 320px;
  padding: 2px 6px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font: inherit;
}
.ov-property-input:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 1px; }
.ov-property-error { color: var(--dsw-alias-state-error-primary, #f85149); font-size: 11.5px; }
.ov-tag-row { margin: 0 0 14px; display: flex; flex-wrap: wrap; gap: 6px; }
.ov-tag-row .ov-chip { margin: 0; cursor: pointer; border: 0; font: inherit; font-size: 11px; }

/* Obsidian-style callout blocks, colored per callout kind. */
.ov-callout {
  --ov-callout-color: var(--dsw-alias-brand-primary, #4d6bfe);
  margin: 12px 0;
  padding: 10px 14px;
  border-left: 3px solid var(--ov-callout-color);
  border-radius: 4px;
  background: color-mix(in srgb, var(--ov-callout-color) 9%, transparent);
}
.ov-callout[data-callout="warning"],
.ov-callout[data-callout="caution"],
.ov-callout[data-callout="attention"] { --ov-callout-color: var(--dsw-alias-state-warning-primary, #d29922); }
.ov-callout[data-callout="danger"],
.ov-callout[data-callout="error"],
.ov-callout[data-callout="failure"],
.ov-callout[data-callout="fail"],
.ov-callout[data-callout="bug"] { --ov-callout-color: var(--dsw-alias-state-error-primary, #f85149); }
.ov-callout[data-callout="success"],
.ov-callout[data-callout="check"],
.ov-callout[data-callout="done"] { --ov-callout-color: var(--dsw-alias-state-success-primary, #3fb950); }
.ov-callout[data-callout="tip"],
.ov-callout[data-callout="hint"],
.ov-callout[data-callout="important"] { --ov-callout-color: var(--dsw-alias-state-success-primary, #3fb950); }
.ov-callout[data-callout="question"],
.ov-callout[data-callout="help"],
.ov-callout[data-callout="faq"] { --ov-callout-color: var(--dsw-alias-state-warning-primary, #d29922); }
.ov-callout[data-callout="quote"],
.ov-callout[data-callout="cite"] { --ov-callout-color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-callout-head { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12.5px; cursor: default; }
.ov-callout-title { display: inline-flex; align-items: center; gap: 6px; color: var(--ov-callout-color); }
.ov-callout-mark { width: 6px; height: 6px; border-radius: 50%; background: var(--ov-callout-color); }
.ov-callout-body { margin-top: 6px; }
.ov-callout-body > *:first-child { margin-top: 0; }
.ov-callout-body > *:last-child { margin-bottom: 0; }
details.ov-callout > summary { list-style: none; }
details.ov-callout > summary::-webkit-details-marker { display: none; }
details.ov-callout > summary::before { content: '▸'; margin-right: 4px; opacity: .6; }
details.ov-callout[open] > summary::before { content: '▾'; }

/* Backlink list below the document body. */
.ov-doc-backlinks {
  margin-top: 2.2rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ov-doc-backlinks-title {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  margin-bottom: 6px;
}
.ov-doc-backlink-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.ov-doc-backlink-row:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-doc-backlink-title { color: var(--dsw-alias-brand-primary, #7d94ff); font-size: 13px; }
.ov-doc-backlink-context {
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Reading-view image fallback: a failed image keeps its box as a quiet block. */
.ov-document img.ov-note-image-failed { display: none; }
.ov-document .ov-note-image-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0 8px;
  border: 1px dashed var(--dsw-alias-border-l2, #3a3a42);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.ov-media-embed {
  display: flex;
  max-width: 100%;
  margin: 14px auto;
  padding: 8px;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
}
.ov-media-embed[data-media-kind="audio"] { padding: 10px 12px; }
.ov-media-frame {
  width: 100%;
  height: min(70vh, 620px);
  border: 0;
  border-radius: 6px;
  background: #fff;
}
.ov-media-video {
  width: 100%;
  max-height: 70vh;
  border-radius: 6px;
  background: #000;
}
.ov-media-audio { width: 100%; }
.ov-media-caption {
  display: flex;
  margin: 0;
  justify-content: flex-end;
  font-size: 11px;
}
.ov-media-open {
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  text-decoration: none;
}
.ov-media-open:hover {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  text-decoration: underline;
}

.ov-mermaid {
  display: flex;
  justify-content: center;
  margin: 12px 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #1b1b1f);
}

.ov-mermaid svg {
  max-width: 100%;
  height: auto;
}

.ov-mermaid-failed {
  display: block;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
}`

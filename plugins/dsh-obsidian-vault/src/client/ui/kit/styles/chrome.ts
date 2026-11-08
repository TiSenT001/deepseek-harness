/** CHROME_STYLE rules. */
export const CHROME_STYLE = `/* Document tabs. */
.ov-tabbar {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 0 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1, #2a2a30) 50%, transparent);
  flex: 0 0 auto;
}
.ov-tabstrip {
  display: flex;
  align-items: stretch;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.ov-tabstrip::-webkit-scrollbar { display: none; }
.ov-doctab {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px 6px 0 0;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  cursor: pointer;
  max-width: 190px;
  white-space: nowrap;
}
.ov-doctab:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-doctab-active {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  background: var(--dsw-alias-bg-layer-2, #232329);
  box-shadow: inset 0 -2px 0 var(--dsw-alias-brand-primary, #4d6bfe);
}
.ov-doctab-preview .ov-doctab-label { font-style: italic; }
.ov-backlink-group { margin: 2px 0 10px; }
.ov-backlink-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-backlink-head:hover { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-backlink-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-backlink-count { margin-left: auto; font-weight: 400; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-backlink-more {
  border: 0;
  background: none;
  color: var(--dsw-alias-brand-primary, #4d6bfe);
  font: inherit;
  font-size: 11px;
  padding: 2px 8px;
  cursor: pointer;
}
.ov-bookmark-row { display: flex; align-items: flex-start; gap: 4px; }
.ov-bookmark-row .ov-item { flex: 1 1 auto; min-width: 0; }
.ov-bookmark-remove {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 6px 4px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-bookmark-remove:hover { color: var(--dsw-alias-state-error-primary, #ff6b6b); background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-plugin-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.ov-plugin-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  margin-bottom: 6px;
}
.ov-plugin-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ov-plugin-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
button.ov-plugin-info {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  padding: 0;
  cursor: pointer;
}
.ov-plugin-name { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12.5px; }
.ov-plugin-version { font-weight: 400; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-plugin-meta {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ov-plugin-desc { font-size: 11.5px; color: var(--dsw-alias-label-secondary, #b6b6bd); }
.ov-plugin-toggle { flex: 0 0 auto; margin-top: 1px; }
.ov-plugin-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-plugin-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
}
.ov-plugin-detail-label { color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-settings { display: flex; flex-direction: column; gap: 6px; padding: 4px 0 2px; }
.ov-settings-group {
  margin-top: 8px;
  font-size: 10.5px;
  letter-spacing: .04em;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-settings > .ov-settings-group:first-child { margin-top: 0; }
.ov-settings-row {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.ov-settings-row:has(.ov-settings-textarea) { align-items: start; }
.ov-settings-row:has(.ov-settings-textarea) .ov-settings-label { padding-top: 6px; }
.ov-settings-label {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ov-settings-control { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 26px; }
.ov-settings-input::-webkit-outer-spin-button,
.ov-settings-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ov-settings-input {
  appearance: textfield;
  -moz-appearance: textfield;
  width: 100%;
  max-width: 200px;
  box-sizing: border-box;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.10));
  color: inherit;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.3));
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  color-scheme: dark;
}
.ov-settings-textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 54px;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.10));
  color: inherit;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.3));
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.5;
  font-family: inherit;
  color-scheme: dark;
}
.ov-settings-input:focus,
.ov-settings-textarea:focus {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);
  outline-offset: 1px;
}
.ov-settings-unit { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-settings-hint { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-settings-actions { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.ov-image-choice { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; cursor: pointer; }
.ov-image-choice input { margin: 0; }
.ov-flash { animation: ov-flash 1.6s ease-out; }
@keyframes ov-flash {
  0% { background: rgba(77, 107, 254, .3); }
  100% { background: transparent; }
}
.ov-narrow-only { display: none; }
.ov-graph-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-graph-stats {
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 12px;
  white-space: nowrap;
}
@media (max-width: 720px) {
  .ov-pill-label, .ov-pill-kbd { display: none; }
}
.ov-skeleton { padding: 28px 32px; display: flex; flex-direction: column; gap: 14px; }
.ov-skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255, 255, 255, .06), rgba(255, 255, 255, .12), rgba(255, 255, 255, .06));
  background-size: 200% 100%;
  animation: ov-skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes ov-skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (max-width: 1100px) {
  .ov-narrow-only { display: inline-flex; }
}
.ov-doctab-label { overflow: hidden; text-overflow: ellipsis; }
.ov-doctab-close {
  border: 0;
  background: none;
  color: inherit;
  opacity: .55;
  font-size: 12px;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 4px;
  cursor: pointer;
}
.ov-doctab-close:hover { opacity: 1; background: var(--dsw-alias-bg-layer-3, #2b2b33); }
.ov-doctab-new {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 15px;
  padding: 0 10px;
  cursor: pointer;
}
.ov-doctab-overflow {
  border: 0;
  background: none;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 11px;
  padding: 0 7px;
  cursor: pointer;
  border-radius: var(--ov-radius-s);
}
.ov-doctab-overflow:hover { color: var(--dsw-alias-label-primary, #e8e8ea); background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-doctab-overflow[aria-expanded="true"] { color: var(--dsw-alias-brand-primary, #7d94ff); background: var(--dsw-alias-bg-layer-2, #232329); }

/* Search surface. */
.ov-search { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.ov-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  flex: 0 0 auto;
}
.ov-search-input {
  flex: 1 1 auto;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.ov-search-input:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-search-count { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 12px; white-space: nowrap; }
.ov-search-list { overflow: auto; padding: 6px 10px 24px; min-height: 0; }
.ov-search-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.ov-search-item:hover, .ov-search-item.ov-active { background: var(--dsw-alias-bg-layer-2, #232329); }
.ov-search-item-head { display: flex; align-items: baseline; gap: 8px; }
.ov-search-title { font-weight: 600; font-size: 13px; }
.ov-search-kind { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
.ov-search-path { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; margin-top: 1px; }
.ov-search-snippet {
  margin-top: 4px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  line-height: 1.5;
}
.ov-search-snippet .ov-highlight { font-weight: 600; }

`

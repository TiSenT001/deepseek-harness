/** GRAPH_STYLE rules. */
export const GRAPH_STYLE = `/* Graph filter controls. */
.ov-graph-canvas { width: 100%; height: 100%; background: var(--dsw-alias-bg-base, #16161a); }
.ov-graph-filter {
  flex: 0 1 130px;
  min-width: 72px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  font: inherit;
  font-size: 12px;
}
.ov-graph-filter:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-graph-select {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  color: inherit;
  font: inherit;
  font-size: 12px;
}

/* Graph settings popover. */
.ov-graph-hint {
  margin: 6px 0 0;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font-size: 10.5px;
  line-height: 1.5;
}
.ov-graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
}
.ov-graph-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 180px;
  padding: 2px 7px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font-size: 11px;
  cursor: pointer;
}
.ov-graph-legend-item:hover { border-color: var(--dsw-alias-border-l2, #3a3a42); }
.ov-graph-legend-item-active,
.ov-graph-legend-item-active:hover {
  color: var(--dsw-alias-label-primary, #e8e8ea);
  border-color: var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.ov-graph-legend-item-active .ov-graph-legend-count {
  color: var(--dsw-alias-label-secondary, #b6b6bd);
}
.ov-graph-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.ov-graph-legend-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-graph-legend-count { color: var(--dsw-alias-label-tertiary, #8b8b94); }

.ov-graph-panel {
  position: absolute;
  top: 48px;
  right: 12px;
  z-index: 30;
  width: 240px;
  max-height: calc(100% - 64px);
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 16px 40px rgba(0, 0, 0, .45);
  font-size: 12px;
}
.ov-graph-panel *, .ov-graph-panel *::before, .ov-graph-panel *::after { box-sizing: border-box; }
.ov-graph-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #2a2a30);
}
.ov-graph-panel-body { overflow-y: auto; overflow-x: hidden; padding: 6px 10px 12px; }
.ov-graph-panel-section { padding: 6px 0; border-bottom: 1px dashed var(--dsw-alias-border-l1, #2a2a30); }
.ov-graph-panel-section:last-child { border-bottom: 0; }
.ov-graph-panel-title {
  margin: 4px 0 6px;
  font-size: 11px;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
}
.ov-graph-field { display: flex; flex-direction: column; gap: 4px; padding: 3px 0; }
.ov-graph-text {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: inherit;
  font: inherit;
  font-size: 12px;
  width: 100%;
}
.ov-graph-text:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-group-row { display: grid; grid-template-columns: 1fr 32px 26px; gap: 6px; align-items: center; padding: 3px 0; }
.ov-group-color { width: 28px; height: 24px; padding: 0; border: 1px solid var(--dsw-alias-border-l1, #2a2a30); border-radius: 4px; background: none; }

/* Tag picker popover. */
.ov-tag-picker { position: relative; flex: 0 0 auto; }
.ov-tagpop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 70;
  width: 232px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 16px 40px rgba(0, 0, 0, .45);
  overflow: hidden;
}
.ov-tagpop-input {
  margin: 8px 8px 6px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: inherit;
  font: inherit;
  font-size: 12px;
}
.ov-tagpop-input:focus { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); }
.ov-tagpop-list { overflow-y: auto; min-height: 0; padding: 0 4px 6px; }
.ov-tagpop-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--dsw-alias-label-secondary, #b6b6bd);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}
.ov-tagpop-item:hover { background: var(--dsw-alias-bg-layer-2, #232329); color: var(--dsw-alias-label-primary, #e8e8ea); }
.ov-tagpop-item.ov-tagpop-active,
.ov-tagpop-item.ov-tagpop-active:hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 14%, transparent);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-tagpop-item[data-selected="true"] { color: var(--dsw-alias-brand-primary, #7d94ff); }
.ov-tagpop-count { color: var(--dsw-alias-label-tertiary, #8b8b94); font-size: 11px; flex: 0 0 auto; }
`

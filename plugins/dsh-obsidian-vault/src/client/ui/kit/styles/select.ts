/** SELECT_STYLE rules: the kit dropdown trigger and its listbox. */
export const SELECT_STYLE = `/* Kit select: one token set for the trigger and the open list. */
.ov-select { position: relative; display: inline-flex; min-width: 0; }
.ov-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 120px;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.10));
  color: inherit;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.3));
  border-radius: var(--ov-radius-s, 4px);
  padding: 4px 8px;
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}
.ov-select-trigger:hover { border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.5)); }
.ov-select-trigger:focus-visible {
  outline: 2px solid var(--ov-focus, #4d6bfe);
  outline-offset: 1px;
  border-color: var(--ov-focus, #4d6bfe);
}
.ov-select-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-select-chevron { flex: 0 0 auto; font-size: 10px; opacity: 0.7; }
.ov-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 60;
  min-width: 100%;
  max-height: 260px;
  overflow: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  border-radius: var(--ov-radius-s, 4px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
}
.ov-select-option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: 0;
  background: none;
  color: inherit;
  border-radius: 3px;
  padding: 5px 8px;
  font: inherit;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
.ov-select-option:hover { background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14)); }
.ov-select-option[data-active='true'] {
  color: var(--ov-accent, #4d6bfe);
  background: color-mix(in srgb, var(--ov-accent, #4d6bfe) 14%, transparent);
}
.ov-select-option:focus-visible {
  outline: 2px solid var(--ov-focus, #4d6bfe);
  outline-offset: -2px;
}
`

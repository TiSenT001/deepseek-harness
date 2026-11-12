/** CONTROLS_STYLE rules: kit Toggle and Slider (Obsidian setting-item look). */
export const CONTROLS_STYLE = `/* Kit toggle: hidden checkbox drives a sliding switch. */
.ov-kit-toggle { display: flex; align-items: center; gap: 8px; padding: 3px 0; cursor: pointer; }
.ov-kit-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
.ov-kit-toggle-track {
  flex: 0 0 auto;
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3, #2c2c33);
  border: 1px solid var(--dsw-alias-border-l1, #2a2a30);
  position: relative;
  transition: background .15s ease;
}
.ov-kit-toggle-knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary, #b6b6bd);
  transition: transform .15s ease, background .15s ease;
}
.ov-kit-toggle[data-on="true"] .ov-kit-toggle-track {
  background: var(--dsw-alias-brand-primary, #4d6bfe);
}
.ov-kit-toggle[data-on="true"] .ov-kit-toggle-knob { transform: translateX(14px); background: #fff; }
.ov-kit-toggle input:focus-visible + .ov-kit-toggle-track { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 2px; }
.ov-kit-toggle-label { color: var(--dsw-alias-label-secondary, #b6b6bd); }

/* Kit slider: label | track | value row. */
.ov-kit-slider { display: grid; grid-template-columns: minmax(0, 1fr) 84px 26px; align-items: center; gap: 6px; padding: 4px 0; }
.ov-kit-slider-label { color: var(--dsw-alias-label-secondary, #b6b6bd); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ov-kit-slider-track {
  position: relative;
  height: 16px;
  cursor: pointer;
  touch-action: none;
  border-radius: 4px;
}
.ov-kit-slider-track::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 6px;
  height: 4px;
  border-radius: 2px;
  background: var(--dsw-alias-bg-layer-3, #2c2c33);
}
.ov-kit-slider-fill {
  position: absolute;
  left: 0;
  top: 6px;
  height: 4px;
  border-radius: 2px;
  background: var(--dsw-alias-brand-primary, #4d6bfe);
}
.ov-kit-slider-thumb {
  position: absolute;
  top: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--dsw-alias-label-primary, #e8e8ea);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  transition: transform .1s ease;
}
.ov-kit-slider[data-dragging="true"] .ov-kit-slider-thumb,
.ov-kit-slider-track:focus-visible .ov-kit-slider-thumb { transform: translate(-50%, -50%) scale(1.2); }
.ov-kit-slider-track:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 2px; }
.ov-kit-slider-tip {
  position: absolute;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-3, #2c2c33);
  border: 1px solid var(--dsw-alias-border-l2, #3a3a42);
  color: var(--dsw-alias-label-primary, #e8e8ea);
  font-size: 11px;
  pointer-events: none;
  white-space: nowrap;
}
.ov-kit-slider-value { text-align: right; color: var(--dsw-alias-label-tertiary, #8b8b94); }
.ov-kit-slider[data-editable="true"] { grid-template-columns: minmax(0, 1fr) 76px 52px; }
.ov-kit-slider-input {
  width: 52px;
  min-width: 0;
  padding: 2px 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8b8b94);
  font: inherit;
  text-align: right;
  appearance: textfield;
}
.ov-kit-slider-input:hover { border-color: var(--dsw-alias-border-l2, #3a3a42); }
.ov-kit-slider-input:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary, #4d6bfe);
  background: var(--dsw-alias-bg-layer-2, #232329);
  color: var(--dsw-alias-label-primary, #e8e8ea);
}
.ov-kit-slider-input::-webkit-inner-spin-button,
.ov-kit-slider-input::-webkit-outer-spin-button { appearance: none; margin: 0; }
`

/**
 * 控制台样式表。
 *
 * 客户端插件只装载一个 JS 包，没有独立 CSS 资源，所以样式以文本注入 <head>；
 * 按 id 去重，HMR 重载不会叠加多份。颜色、圆角一律取 DSH 主题令牌，
 * 明暗主题自动成立；只有日志控制台用固定深色底（两种主题下都是深底浅字的终端观感）。
 */

const STYLE_ID = 'dsh-brain-console-styles'

const STYLES = `
.bc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  font-size: var(--dsh-content-font-size-secondary, 13px);
  line-height: 1.5;
}

.bc-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 28px;
}

.bc-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1160px;
  margin: 0 auto;
}

/* ---- 标题行 ---- */
.bc-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}
.bc-logo {
  display: inline-flex;
  color: var(--dsw-alias-label-secondary);
}
.bc-title {
  margin: 0;
  font-size: calc(var(--dsh-content-font-size, 14px) + 2px);
  font-weight: 500;
  letter-spacing: -0.01em;
}
.bc-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-count-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-idle-primary);
}
/* 点的填充色表示「全部运行」（成功色）；开启开机自启时，同一个点再套一圈成功色描边，
   两个状态叠在一个点上（双色）。悬停整颗胶囊给出自启说明。 */
.bc-count[data-tone='all'] .bc-count-dot {
  background: var(--dsw-alias-state-success-primary);
}
.bc-count[data-autostart='on'] .bc-count-dot {
  box-shadow: 0 0 0 1px var(--dsw-alias-bg-layer-1), 0 0 0 2.5px var(--dsw-alias-state-success-primary);
}
.bc-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}
.bc-updated {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* ---- 连接 / 操作提示 ---- */
.bc-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-inline-start: 3px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-notice[data-kind='action'] {
  border-inline-start-color: var(--dsw-alias-state-warn-primary);
}
.bc-notice-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.bc-notice-title {
  font-weight: 500;
}
.bc-notice-text {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-notice-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}

/* ---- 概览指标 ---- */
.bc-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.bc-kpi {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-kpi[data-tone='warn'] {
  border-color: transparent;
  background: var(--dsw-alias-state-warn-tertiary);
}
.bc-kpi-label {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-kpi-value {
  font-size: calc(var(--dsh-content-font-size, 14px) + 6px);
  font-weight: 500;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-kpi-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 可点开的指标卡（失败边明细） */
.bc-kpi-action {
  cursor: pointer;
  font: inherit;
  text-align: left;
}
@media (hover: hover) {
  .bc-kpi-action:hover {
    border-color: var(--dsw-alias-border-l4);
  }
}
/* 顶部异常提示 chip：只有运行中但健康探测失败时出现 */
.bc-header-alert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: 22px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 45%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 10%, transparent);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
@media (hover: hover) {
  .bc-header-alert:hover {
    background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 16%, transparent);
  }
}
.bc-header-alert:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}

/* 指标卡里的迷你趋势线 */
.bc-spark {
  display: block;
  margin-top: 3px;
  color: var(--dsw-alias-label-tertiary);
}

/* ---- 指标趋势对话框 ---- */
.bc-trend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bc-trend-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.bc-trend-ranges {
  display: flex;
  align-items: center;
  gap: 2px;
}
.bc-trend-readout {
  margin-left: auto;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-trend-chart {
  padding: 4px 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  cursor: crosshair;
}
.bc-trend-chart svg {
  display: block;
}
.bc-trend-line {
  fill: none;
  stroke: var(--dsw-alias-brand-primary);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.bc-trend-area {
  fill: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);
  stroke: none;
}
.bc-backup-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.bc-backup-restore,
.bc-backup-cancel {
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  cursor: pointer;
}
.bc-backup-restore:hover:not(:disabled),
.bc-backup-cancel:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.bc-backup-restore-danger {
  border-color: var(--dsw-alias-state-error-primary, #e35d6a);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-backup-restore:disabled,
.bc-backup-cancel:disabled {
  opacity: 0.45;
  cursor: default;
}
.bc-badge-auto {
  margin-left: 8px;
  padding: 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
}

.bc-auto-summary {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-auto-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bc-auto-row {
  padding: 7px 4px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-auto-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}
.bc-auto-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #3fb950);
}
.bc-auto-row[data-ok='false'] .bc-auto-dot {
  background: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-auto-unit {
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  font-family: var(--ds-font-family-code, monospace);
}
.bc-auto-attempt,
.bc-auto-ok,
.bc-auto-time {
  color: var(--dsw-alias-label-tertiary);
}
.bc-auto-time {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.bc-auto-sub,
.bc-auto-bundle {
  margin-left: 15px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-auto-bundle {
  margin-top: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-auto-bundle-link {
  color: var(--dsw-alias-label-secondary);
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}
.bc-auto-bundle-link:hover {
  color: var(--dsw-alias-label-primary);
}

.bc-trend-limit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-trend-limit-input {
  width: 96px;
  padding: 2px 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
}

.bc-trend-chart {
  position: relative;
}
.bc-trend-threshold {
  stroke: var(--dsw-alias-state-warning-primary, #e0b341);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
  opacity: 0.8;
}
.bc-trend-threshold-tag {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  padding: 1px 7px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 45%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #1d1d22) 88%, transparent);
  color: var(--dsw-alias-state-warning-primary, #e0b341);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  pointer-events: none;
  backdrop-filter: blur(2px);
}
.bc-trend-threshold-tag-over {
  color: var(--dsw-alias-label-primary, #f9fafb);
  border-color: var(--dsw-alias-state-error-primary, #e35d6a);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 22%, var(--dsw-alias-bg-layer-1, #1d1d22));
}
.bc-trend-delta {
  margin-right: 8px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary);
}
.bc-trend-delta-bad {
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font-weight: 600;
}

.bc-trend-marker {
  position: absolute;
  box-sizing: border-box;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border: 1.5px solid var(--dsw-alias-label-primary, #f9fafb);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1, #1d1d22);
  box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--dsw-alias-label-primary, #f9fafb) 12%, transparent);
  pointer-events: none;
}
.bc-trend-guide {
  stroke: var(--dsw-alias-border-l4);
  stroke-width: 1;
}
.bc-trend-dot {
  fill: var(--dsw-alias-brand-primary);
}
.bc-trend-axis {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-trend-empty {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-trend-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}

/* ---- 分组与卡片 ---- */
.bc-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bc-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bc-section-name {
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}
.bc-section-count {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-section-warn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 45%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e35d6a) 10%, transparent);
  color: var(--dsw-alias-state-error-primary, #e35d6a);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
.bc-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
.bc-rule {
  flex: 1 1 auto;
  height: 1px;
  background: var(--dsw-alias-border-l1);
}
.bc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}
.bc-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 11px 13px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.bc-card-top {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.bc-name {
  min-width: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-port {
  flex: none;
  padding: 0 6px;
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-interactive-bg-hover-solid);
  color: var(--dsw-alias-label-tertiary);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}
.bc-spacer {
  flex: 1 1 auto;
}
.bc-desc {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
}
.bc-meta-state {
  color: var(--dsw-alias-label-secondary);
}
.bc-meta-state[data-abnormal='true'] {
  color: var(--dsw-alias-state-error-primary);
}
.bc-meta-detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bc-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}
/* 图标按钮：28×28 方形，16px 图标居中；忙碌时保持可见（禁用态默认变淡） */
.bc-icon-btn {
  padding: 0;
  width: 28px;
}
.bc-icon-btn[aria-busy='true']:disabled {
  opacity: 1;
  cursor: progress;
}
/* 开关型图标按钮的按下态（例如该单元的日志面板正开着） */
.bc-icon-btn[aria-pressed='true'] {
  background: var(--dsw-alias-button-ghost-active-fill);
}
/* 破坏性动作平时与普通图标同色，悬停才转成错误色，避免一排红块压过内容 */
.bc-danger {
  color: var(--dsw-alias-label-secondary);
}
@media (hover: hover) {
  .bc-danger:hover:not(:disabled) {
    color: var(--dsw-alias-state-error-primary);
    background: var(--dsw-alias-interactive-bg-hover-danger);
  }
}
.bc-danger:focus-visible:not(:disabled) {
  color: var(--dsw-alias-state-error-primary);
}

/* ---- 备份清理对话框 ---- */
.bc-backup-keep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.bc-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xs);
  overflow: hidden;
}
.bc-stepper-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.bc-stepper-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-solid);
  color: var(--dsw-alias-label-primary);
}
.bc-stepper-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.bc-stepper-value {
  min-width: 28px;
  text-align: center;
  color: var(--dsw-alias-label-primary);
  font-variant-numeric: tabular-nums;
}
.bc-backup-list {
  display: flex;
  flex-direction: column;
  max-height: 280px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  --dsh-scrollbar-thumb: var(--dsw-alias-border-l2);
}
.bc-backup-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-backup-row + .bc-backup-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-backup-row[data-doomed='true'] {
  background: var(--dsw-alias-state-error-tertiary);
}
.bc-backup-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bc-backup-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-backup-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-backup-tag {
  flex: none;
  min-width: 44px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary);
}
.bc-backup-row[data-doomed='true'] .bc-backup-tag {
  color: var(--dsw-alias-state-error-primary);
}
.bc-backup-empty {
  padding: 32px 0;
  text-align: center;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-backup-error {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-inline-start: 3px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.bc-backup-done {
  margin-top: 8px;
  color: var(--dsw-alias-state-success-primary);
  font-size: 12px;
}

/* ---- 缓存清理对话框 ---- */
.bc-cache-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: auto;
  max-height: 300px;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-cache-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-cache-row + .bc-cache-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-cache-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}
.bc-cache-row[data-risk='protected'] .bc-cache-main {
  cursor: default;
}
.bc-cache-check {
  flex: none;
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
.bc-cache-lock {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cache-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.bc-cache-size {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.bc-cache-tag {
  flex: none;
  min-width: 48px;
  text-align: right;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cache-row[data-risk='confirm'] .bc-cache-tag {
  color: var(--dsw-alias-state-warn-primary);
}
.bc-cache-note {
  padding-left: 23px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.bc-cache-section {
  margin: 10px 0 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-cache-dir {
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  word-break: break-all;
}
.bc-cache-dir code {
  font-family: var(--ds-font-family-code, monospace);
}
.bc-cache-failed {
  color: var(--dsw-alias-state-warn-primary);
}

/* ---- 失败边明细 ---- */
.bc-failed-list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-failed-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 10px;
  font-size: 12px;
}
.bc-failed-row + .bc-failed-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-failed-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.bc-failed-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-failed-count {
  flex: none;
  color: var(--dsw-alias-state-error-primary);
  font-variant-numeric: tabular-nums;
}
.bc-failed-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.bc-failed-more {
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 单元详情 ---- */
.bc-detail-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
}
.bc-detail-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
  padding: 4px 0;
  font-size: 12px;
}
.bc-detail-row + .bc-detail-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.bc-detail-label {
  color: var(--dsw-alias-label-tertiary);
}
.bc-detail-value {
  margin: 0;
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}
.bc-detail-mono {
  font-family: var(--ds-font-family-code, monospace);
  font-size: 11px;
}

/* ---- 分组停止确认 ---- */
.bc-stop-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0 0 10px;
  padding: 9px 12px;
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.bc-stop-item {
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  color: var(--dsw-alias-label-primary);
}
.bc-stop-note {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 空态 / 载入态 ---- */
.bc-loading,
.bc-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- 底部日志控制台 ---- */
.bc-dock {
  display: flex;
  flex: none;
  flex-direction: column;
  width: calc(100% - 48px);
  max-width: 1160px;
  margin: 0 auto 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1);
}
.bc-dock-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-dock-title {
  font-weight: 500;
}
.bc-dock-sub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.bc-dock-spacer {
  flex: 1 1 auto;
}
.bc-dock-filter {
  width: 150px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 12px;
}
.bc-dock-filter::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.bc-dock-filter:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.bc-dock-match {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.bc-dock-lines {
  flex: none;
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--dsw-radius-xs);
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
@media (hover: hover) {
  .bc-dock-lines:hover {
    border-color: var(--dsw-alias-border-l3);
    color: var(--dsw-alias-label-primary);
  }
}
.bc-dock-lines:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.bc-dock-body {
  height: 200px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  background: var(--dsw-static-neutral-bluish-1000);
  color: var(--dsw-static-neutral-bluish-100);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  --dsh-scrollbar-thumb: var(--dsw-static-neutral-bluish-750);
  --dsh-scrollbar-thumb-hover: var(--dsw-static-neutral-bluish-600);
}

/* ---- 窄窗口 ---- */
@media (max-width: 720px) {
  .bc-scroll {
    padding: 14px 14px 20px;
  }
  .bc-inner {
    gap: 16px;
  }
  .bc-header-actions {
    width: 100%;
    margin-left: 0;
  }
  .bc-updated {
    margin-right: auto;
  }
  .bc-dock-filter {
    width: 110px;
  }
  .bc-dock {
    width: calc(100% - 28px);
    margin-bottom: 12px;
  }
  .bc-dock-body {
    height: 160px;
  }
  /* 窄屏：卡片操作按钮换到第二行，单元名拿到整行宽度，不再截成 brain_se… */
  .bc-card-top {
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .bc-card-top .bc-spacer {
    flex: 1 1 100%;
    height: 0;
  }
  .bc-actions {
    margin-left: auto;
  }
}
.bc-embed-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.bc-embed-job {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.04));
}
.bc-embed-job-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-embed-job-head strong {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.bc-embed-job-head > span {
  flex: 1 1 auto;
  font-variant-numeric: tabular-nums;
}
.bc-embed-current {
  margin-top: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-embed-failures {
  margin-top: 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-embed-failures summary {
  cursor: pointer;
}
.bc-embed-failures ul {
  margin: 6px 0 0;
  padding-left: 16px;
  max-height: 120px;
  overflow: auto;
}
.bc-embed-failures code {
  font-size: 11px;
}

.bc-failed-ignore {
  flex: none;
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  cursor: pointer;
}
.bc-failed-ignore:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
}
.bc-failed-ignore:disabled {
  opacity: 0.45;
  cursor: default;
}

/* 统一对话框容器：dialog 限高到视口可用区，内容区自己滚动，头/脚固定。 */
.bc-dialog-capped {
  max-height: 100%;
}
.bc-dialog-content {
  min-height: 0;
  max-height: 100%;
}
.bc-dialog-scroll {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.bc-index-health {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bc-index-health h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.bc-index-note {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary);
}
.bc-index-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-index-row strong {
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
  text-align: right;
}
.bc-index-warn {
  color: var(--dsw-alias-state-warning-primary, #e0b341) !important;
}
.bc-index-sample {
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary);
}
.bc-index-domain-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px auto;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-index-domain-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.bc-index-domain-bar {
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.bc-index-domain-bar > div {
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-label-primary, #f9fafb);
}
.bc-index-domain-row > span:last-child {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.bc-cron-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 4px 0 8px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 35%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #e0b341) 8%, transparent);
  font-size: 11.5px;
  color: var(--dsw-alias-label-secondary);
}
.bc-cron-alert-text {
  color: var(--dsw-alias-label-primary);
}
.bc-cron-alert-actions {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}
.bc-cron-flag {
  margin-left: 6px;
  padding: 0 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary);
}
.bc-cron-row[data-zombie='true'] {
  opacity: 0.55;
}

.bc-cron-all {
  margin-top: 6px;
}
.bc-cron-all > summary {
  cursor: pointer;
  list-style: none;
  padding: 2px 0;
  font-size: 11.5px;
  color: var(--dsw-alias-label-tertiary);
  user-select: none;
}
.bc-cron-all > summary::-webkit-details-marker {
  display: none;
}
.bc-cron-all > summary::before {
  content: '▸';
  margin-right: 6px;
  display: inline-block;
  transition: transform 0.12s ease;
}
.bc-cron-all[open] > summary::before {
  transform: rotate(90deg);
}
.bc-cron-all-list {
  margin-top: 4px;
  padding-left: 2px;
}

.bc-cron-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.bc-cron-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #3fb950);
}
.bc-cron-row[data-status='warn'] .bc-cron-dot {
  background: var(--dsw-alias-state-warning-primary, #e0b341);
}
.bc-cron-row[data-status='bad'] .bc-cron-dot {
  background: var(--dsw-alias-state-error-primary, #e35d6a);
}
.bc-cron-row[data-status='unknown'] .bc-cron-dot {
  background: var(--dsw-alias-label-tertiary, #8b8b94);
}
.bc-cron-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--ds-font-family-code, monospace);
}
.bc-cron-age {
  color: var(--dsw-alias-label-primary);
  font-variant-numeric: tabular-nums;
}
.bc-cron-interval {
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

.bc-index-health {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bc-index-section {
  display: block;
  margin: 0 0 4px;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.bc-index-section:last-child {
  border-bottom: 0;
}
.bc-index-section > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.bc-index-section > summary::-webkit-details-marker {
  display: none;
}
.bc-index-section > summary::before {
  content: '▸';
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  transition: transform 0.12s ease;
}
.bc-index-section[open] > summary::before {
  transform: rotate(90deg);
}
.bc-index-section > summary h4 {
  margin: 0;
}
.bc-index-section > summary:hover h4 {
  color: var(--dsw-alias-label-primary);
}
.bc-auto {
  display: flex;
  flex-direction: column;
}

.bc-coverage {
  height: 4px;
  margin: 4px 0 8px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
}
.bc-coverage-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-label-primary, #f9fafb);
  transition: width 0.2s ease;
}
`

/**
 * 注入控制台样式表。已有同 id 的元素时改写其内容，
 * 这样 HMR 重新求值模块也会带上新样式，而不会留下旧的一份。
 */
export function ensureConsoleStyles(): void {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    existing.textContent = STYLES
    return
  }
  const element = document.createElement('style')
  element.id = STYLE_ID
  element.textContent = STYLES
  document.head.append(element)
}

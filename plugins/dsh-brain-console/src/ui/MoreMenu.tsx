/**
 * 头部「更多」菜单：把备份、清理备份、清理缓存、开机启动收纳成一个 ⋯ 入口。
 *
 * 菜单语义：立即备份 / 清理备份… / 清理缓存…（各自打开对话框）/ 开机启动（勾选态 = 已开启）。
 * 外部点击、Esc、焦点归还都交给宿主的 Menu 原语，不自己维护浮层。
 */
import { useState } from 'react'
import { Button, IconEllipsis, Menu, type SharedMenuEntry } from './primitives.ts'

/** 开机启动的可写状态。 */
export interface AutostartState {
  /** 当前平台是否支持（不支持时不显示这一行） */
  supported: boolean
  /** 是否已开启登录自启 */
  enabled: boolean
}

export interface MoreMenuProps {
  /** 开机启动状态；管理器没回报时为 null */
  autostart: AutostartState | null
  /** 正在执行的动作（'backup' / 'autostart' 等），执行期间禁用菜单行 */
  busy: string | null
  onBackup: () => void
  onPrune: () => void
  onCaches: () => void
  /** 打开「索引与嵌入状态」对话框 */
  onIndex: () => void
  /** 打开「自动恢复记录」对话框 */
  onAutoRecover: () => void
  /** 打开「系统体检」对话框 */
  onCheckup: () => void
  /** 打开「存储概览」对话框 */
  onStorage: () => void
  /** 下载诊断包 zip */
  onDiagnostics: () => void
  onToggleAutostart: () => void
  /** 关闭启动器（停全部单元并结束管理器） */
  onShutdown: () => void
}

/**
 * 渲染「更多」图标按钮与它收纳的菜单。
 * @param props - 开机启动状态、忙碌标记与各动作
 * @returns 菜单入口（含锚定菜单）
 */
export function MoreMenu({
  autostart, busy, onBackup, onPrune, onCaches, onIndex, onAutoRecover, onCheckup, onStorage, onDiagnostics, onToggleAutostart, onShutdown,
}: MoreMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const items: SharedMenuEntry[] = [
    { id: 'backup', label: busy === 'backup' ? '备份中…' : '立即备份', disabled: busy !== null },
    { id: 'prune', label: '清理备份…', disabled: busy !== null },
    { id: 'caches', label: '清理缓存…', disabled: busy !== null },
    { type: 'separator', id: 'index-separator' },
    { id: 'index', label: '索引与嵌入状态…', disabled: busy !== null },
    { id: 'auto-recover', label: '自动恢复记录…', disabled: busy !== null },
    { id: 'checkup', label: '系统体检…', disabled: busy !== null },
    { id: 'storage', label: '存储概览…', disabled: busy !== null },
    { id: 'diagnostics', label: '下载诊断包', disabled: busy !== null },
  ]
  if (autostart !== null && autostart.supported) {
    items.push(
      { type: 'separator', id: 'autostart-separator' },
      { id: 'autostart', label: busy === 'autostart' ? '设置中…' : '开机启动', disabled: busy !== null },
    )
  }
  items.push(
    { type: 'separator', id: 'shutdown-separator' },
    { id: 'shutdown', label: '关闭启动器…', disabled: busy !== null },
  )

  const select = (id: string): void => {
    setOpen(false)
    if (id === 'backup') onBackup()
    else if (id === 'prune') onPrune()
    else if (id === 'caches') onCaches()
    else if (id === 'index') onIndex()
    else if (id === 'auto-recover') onAutoRecover()
    else if (id === 'checkup') onCheckup()
    else if (id === 'storage') onStorage()
    else if (id === 'diagnostics') onDiagnostics()
    else if (id === 'autostart') onToggleAutostart()
    else if (id === 'shutdown') onShutdown()
  }

  return (
    <Menu
      open={open}
      anchor={(
        <Button
          size="sm"
          variant="ghost"
          className="bc-icon-btn"
          icon={<IconEllipsis size={16} />}
          aria-label="更多操作"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        />
      )}
      items={items}
      selectedId={autostart?.enabled === true ? 'autostart' : undefined}
      onSelect={select}
      onClose={() => setOpen(false)}
      align="end"
      side="bottom"
      portal
    />
  )
}

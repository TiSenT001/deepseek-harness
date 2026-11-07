/**
 * BrainConsoleIcon — TiSenT Brain 面板图标。
 *
 * 图形来源：**Lucide `waypoints`（ISC 许可，
 * https://unpkg.com/lucide-static@0.460.0/icons/waypoints.svg）**。
 * 不自绘：四个节点由连接线串起来，正是「神经链接 / 服务接线」的语义。
 *
 * 与 Windows 启动器 exe 内嵌的 ICO 是同一份路径
 * （`G:/个人知识库/.brain/tools/launcher/brain.ico`，透明底，白描边 + 深描边打底，
 *  Windows 浅色/深色主题都可见），面板与任务管理器看到的是同一个标志。
 *
 * 用法（侧边栏 tab descriptor）：
 *   icon: (size: number) => <BrainConsoleIcon size={size} />
 */

export interface BrainConsoleIconProps {
  /** 图标边长（px），侧边栏通常传 16 / 20 */
  size?: number
  /** 无障碍标签，默认「TiSenT Brain」 */
  title?: string
}

export function BrainConsoleIcon({ size = 16, title = 'TiSenT Brain' }: BrainConsoleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="m10.2 6.3-3.9 3.9" />
      <circle cx="4.5" cy="12" r="2.5" />
      <path d="M7 12h10" />
      <circle cx="19.5" cy="12" r="2.5" />
      <path d="m13.8 17.7 3.9-3.9" />
      <circle cx="12" cy="19.5" r="2.5" />
    </svg>
  )
}

export default BrainConsoleIcon

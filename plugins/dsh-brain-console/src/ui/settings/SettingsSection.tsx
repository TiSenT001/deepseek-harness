/**
 * 设置页的一个分组容器：标题 + 说明 + 内容。
 */
import type { ReactNode } from 'react'

export interface SettingsSectionProps {
  /** 分组标题 */
  title: string
  /** 一句话说明 */
  description?: ReactNode
  /** 分组内容 */
  children: ReactNode
}

/**
 * 渲染设置分组。
 * @param props - 标题、说明与内容
 * @returns 分组元素
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps): JSX.Element {
  return (
    <section className="bc-settings-group">
      <h3>{title}</h3>
      {description !== undefined && <p>{description}</p>}
      {children}
    </section>
  )
}

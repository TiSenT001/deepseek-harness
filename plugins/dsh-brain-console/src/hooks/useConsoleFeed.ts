/**
 * 面板数据源：轮询管理器（单元列表 / 概览 / 开机启动状态）。
 *
 * 5 秒一次；手动刷新时额外触发一次外部回调（趋势历史也顺手刷新）。
 * 连接失败只记录错误、保留上一份数据，避免面板闪成空白。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { jget } from '../api.ts'
import { reasonOf } from '../ui/errors.ts'
import { formatClock } from '../ui/format.ts'
import type { Overview, Unit } from '../ui/types.ts'

/** 自动刷新间隔（毫秒）。 */
const POLL_MS = 5000

/** 开机启动状态（不支持时为 supported=false）。 */
export interface AutostartState {
  supported: boolean
  enabled: boolean
}

export interface ConsoleFeed {
  units: Unit[]
  overview: Overview | null
  autostart: AutostartState | null
  /** 首次拉取是否已返回（用于展示连接中占位） */
  loaded: boolean
  /** 手动刷新进行中 */
  refreshing: boolean
  connectionError: string | null
  /** 最近一次成功刷新的时刻文本 */
  updatedAt: string | null
  /** 立即拉一次；manual=true 时显示刷新态并触发 onManualRefresh */
  load: (manual?: boolean) => Promise<void>
}

/**
 * 轮询管理器状态。
 * @param onManualRefresh - 手动刷新时的额外回调（例如刷新趋势历史）
 * @returns 单元列表、概览与刷新入口
 */
export function useConsoleFeed(onManualRefresh?: () => void): ConsoleFeed {
  const [units, setUnits] = useState<Unit[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [autostart, setAutostart] = useState<AutostartState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  // 回调放 ref：load 的引用必须稳定，否则轮询用的 effect 每帧重建、变成请求风暴
  const manualRefresh = useRef(onManualRefresh)
  manualRefresh.current = onManualRefresh

  const load = useCallback(async (manual = false): Promise<void> => {
    if (manual) setRefreshing(true)
    try {
      const [unitsAnswer, status, boot] = await Promise.all([
        jget<{ units: Unit[] }>('/units'),
        jget<Overview>('/status'),
        jget<AutostartState>('/autostart').catch(() => null),
      ])
      setUnits(unitsAnswer.units)
      setOverview(status)
      setAutostart(boot)
      setConnectionError(null)
      setUpdatedAt(formatClock(Date.now()))
      if (manual) manualRefresh.current?.()
    } catch (error) {
      setConnectionError(reasonOf(error))
    } finally {
      setLoaded(true)
      if (manual) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  return { units, overview, autostart, loaded, refreshing, connectionError, updatedAt, load }
}

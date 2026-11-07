/**
 * 趋势历史：一次取满一年，对话框里再按 7/30/90/365 天切窗口。
 *
 * 采样一天四次（6 小时一行），不需要跟着 5 秒轮询走；挂载时和手动刷新时各拉一次。
 */
import { useCallback, useState } from 'react'
import { loadHistory } from '../api.ts'
import type { HistoryListing } from '../ui/types.ts'

export interface HistoryFeed {
  history: HistoryListing | null
  /** 重新拉取；失败时保留上一份数据（指标卡退化成纯数值） */
  refreshHistory: () => Promise<void>
}

/**
 * 指标历史数据源。
 * @returns 历史序列与刷新入口
 */
export function useHistory(): HistoryFeed {
  const [history, setHistory] = useState<HistoryListing | null>(null)

  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      setHistory(await loadHistory())
    } catch {
      // 历史取不到不影响主面板
    }
  }, [])

  return { history, refreshHistory }
}

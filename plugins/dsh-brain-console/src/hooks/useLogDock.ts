/**
 * 日志控制台状态：打开/关闭、4 秒静默刷新、暂停、行数切换、清空。
 *
 * 刷新只更新「还开着的那个单元」——轮询回来时面板可能已经关了或换了单元。
 */
import { useCallback, useEffect, useState } from 'react'
import { jget, postManager } from '../api.ts'
import { reasonOf } from '../ui/errors.ts'
import { formatClock } from '../ui/format.ts'

/** 日志一次读取的行数档位（点「N 行」循环）。 */
export const LOG_LINE_OPTIONS = [120, 300, 1000] as const

/** 日志面板打开时的静默刷新间隔（毫秒）。 */
const LOG_POLL_MS = 4000

/** 日志面板的一次读取结果。 */
export interface LogState {
  name: string
  text: string
  at: string
  loading: boolean
}

export interface LogDock {
  log: LogState | null
  /** 当前打开的单元名；未打开为 null */
  logName: string | null
  /** 每次读取的行数档位 */
  lines: number
  /** 自动刷新是否暂停 */
  paused: boolean
  /** 清空请求进行中 */
  clearing: boolean
  readLog: (name: string, silent?: boolean, lines?: number) => Promise<void>
  toggleLog: (name: string) => void
  cycleLines: () => void
  setPaused: (paused: boolean) => void
  closeLog: () => void
  /** 截断当前单元日志并重读；失败抛出（页面转成提示） */
  clearLogNow: () => Promise<void>
}

/**
 * 日志控制台状态机。
 * @returns 当前日志、刷新/暂停/行数/清空入口
 */
export function useLogDock(): LogDock {
  const [log, setLog] = useState<LogState | null>(null)
  const [lines, setLines] = useState<number>(LOG_LINE_OPTIONS[0])
  const [paused, setPaused] = useState(false)
  const [clearing, setClearing] = useState(false)

  const readLog = useCallback(async (name: string, silent = false, readLines = lines): Promise<void> => {
    if (!silent) {
      setLog((previous) => previous?.name === name
        ? { ...previous, loading: true }
        : { name, text: '', at: '', loading: true })
    }
    try {
      const answer = await jget<{ log: string }>(`/units/${name}/log?lines=${readLines}`)
      setLog((previous) => previous !== null && previous.name === name
        ? { name, text: answer.log || '（暂无日志）', at: formatClock(Date.now()), loading: false }
        : previous)
    } catch (error) {
      // 静默轮询失败保留上一次内容，不把面板刷成错误
      if (silent) return
      setLog((previous) => previous !== null && previous.name === name
        ? { name, text: `读取失败：${reasonOf(error)}`, at: formatClock(Date.now()), loading: false }
        : previous)
    }
  }, [lines])

  // 面板开着时静默跟随：4 秒一次，不打断用户向上翻看；暂停时完全停
  const logName = log?.name ?? null
  useEffect(() => {
    if (logName === null || paused) return
    const timer = setInterval(() => { void readLog(logName, true) }, LOG_POLL_MS)
    return () => clearInterval(timer)
  }, [logName, paused, readLog])

  const toggleLog = useCallback((name: string): void => {
    setLog((previous) => {
      if (previous?.name === name) return null
      setPaused(false)
      void readLog(name)
      return previous
    })
  }, [readLog])

  const cycleLines = (): void => {
    const current = LOG_LINE_OPTIONS.indexOf(lines as (typeof LOG_LINE_OPTIONS)[number])
    const next = LOG_LINE_OPTIONS[(current + 1) % LOG_LINE_OPTIONS.length] ?? LOG_LINE_OPTIONS[0]
    setLines(next)
    if (log !== null) void readLog(log.name, true, next)
  }

  const closeLog = (): void => setLog(null)

  const clearLogNow = useCallback(async (): Promise<void> => {
    if (log === null) return
    setClearing(true)
    try {
      await postManager(`/units/${log.name}/truncate-log`)
      await readLog(log.name, true)
    } finally {
      setClearing(false)
    }
  }, [log, readLog])

  return { log, logName, lines, paused, clearing, readLog, toggleLog, cycleLines, setPaused, closeLog, clearLogNow }
}

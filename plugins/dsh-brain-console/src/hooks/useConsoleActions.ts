/**
 * 面板的写操作：单元启停、分组批量、随管理器启动、接管、备份。
 *
 * 所有动作都走同一套节奏：置 busy → 请求管理器 → 重新拉 /units（以管理器为准）
 * → 清 busy。失败收敛成一行提示放在 actionError 里。
 *
 * 「停止有在跑依赖者的单元先确认」是页面层的交互决策，不放在这里：
 * 这里只负责真正下发。
 */
import { useCallback, useState } from 'react'
import {
  ACTION_LABEL, postJson, postManager,
  type BatchRestartResult, type BatchStartResult, type BatchStopResult,
} from '../api.ts'
import { reasonOf } from '../ui/errors.ts'
import type { Unit, UnitAction } from '../ui/types.ts'
import type { LogState } from './useLogDock.ts'

export interface ConsoleActionsParams {
  /** 当前单元列表（批量启动要挑出已停止的） */
  units: Unit[]
  /** 重新拉取面板数据 */
  load: (manual?: boolean) => Promise<void>
  /** 当前打开的日志（重启后要跟着刷新） */
  log: LogState | null
  readLog: (name: string, silent?: boolean, lines?: number) => Promise<void>
}

export interface ConsoleActions {
  busy: string | null
  actionError: string | null
  setActionError: (value: string | null) => void
  act: (name: string, action: UnitAction) => Promise<void>
  startGroup: (group: string) => Promise<void>
  stopGroupNow: (group: string, names: string[]) => Promise<void>
  restartGroupNow: (group: string, names: string[]) => Promise<void>
  setUnitEnabled: (name: string, enabled: boolean) => Promise<void>
  adoptUnit: (name: string) => Promise<void>
  backup: () => Promise<void>
}

/**
 * 组装面板写操作。
 * @param params - 单元列表、刷新入口与日志读取
 * @returns busy/error 状态与各动作
 */
export function useConsoleActions({ units, load, log, readLog }: ConsoleActionsParams): ConsoleActions {
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const act = useCallback(async (name: string, action: UnitAction): Promise<void> => {
    setBusy(`${name}:${action}`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/${action}`)
      await load()
      if (log?.name === name) await readLog(name)
    } catch (error) {
      setActionError(`${name} ${ACTION_LABEL[action]}失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }, [load, log, readLog])

  // 分组批量启动：优先走管理器侧批量接口（一次请求、服务端顺序下发）；
  // 老版本管理器没有该路由（404）时退回逐个下发，面板不必等服务端升级。
  const startGroup = useCallback(async (group: string): Promise<void> => {
    const targets = units.filter((unit) => unit.group === group && !unit.running)
    if (targets.length === 0) return
    setBusy(`group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchStartResult>('/units/start-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const unit of targets) {
          try {
            await postManager(`/units/${unit.name}/start`)
          } catch (error) {
            failures.push(`${unit.name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
    } catch (error) {
      setActionError(`${group}批量启动失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没启动：${failures.join('；')}`)
  }, [load, units])

  const stopGroupNow = useCallback(async (group: string, names: string[]): Promise<void> => {
    setBusy(`stop-group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchStopResult>('/units/stop-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const name of names) {
          try {
            await postManager(`/units/${name}/stop`)
          } catch (error) {
            failures.push(`${name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
    } catch (error) {
      setActionError(`${group}批量停止失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没停下来：${failures.join('；')}`)
  }, [load])

  const restartGroupNow = useCallback(async (group: string, names: string[]): Promise<void> => {
    setBusy(`restart-group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchRestartResult>('/units/restart-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const name of names) {
          try {
            await postManager(`/units/${name}/restart`)
          } catch (error) {
            failures.push(`${name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
      if (log !== null && names.includes(log.name)) await readLog(log.name, true)
    } catch (error) {
      setActionError(`${group}批量重启失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没重启：${failures.join('；')}`)
  }, [load, log, readLog])

  // 单元级设置：随管理器启动（只改持久意愿，不立即起停）
  const setUnitEnabled = useCallback(async (name: string, enabled: boolean): Promise<void> => {
    setBusy(`${name}:enabled`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/enabled`, { enabled })
      await load()
    } catch (error) {
      setActionError(`${name} 设置失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }, [load])

  // 接管：把外部进程重启为管理器直接子进程（会中断一次）
  const adoptUnit = useCallback(async (name: string): Promise<void> => {
    setBusy(`${name}:adopt`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/adopt`)
      await load()
    } catch (error) {
      setActionError(`${name} 接管失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }, [load])

  // 立即备份一次（备份文件落在 .brain/backups，返回后刷新"上次备份"）
  const backup = useCallback(async (): Promise<void> => {
    setBusy('backup')
    setActionError(null)
    try {
      await postManager('/actions/backup')
      await load()
    } catch (error) {
      setActionError(`备份失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }, [load])

  return { busy, actionError, setActionError, act, startGroup, stopGroupNow, restartGroupNow, setUnitEnabled, adoptUnit, backup }
}

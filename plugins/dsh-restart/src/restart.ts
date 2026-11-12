/**
 * Detached restart helper. It runs in its own process (no console window),
 * stops the host that scheduled it, waits for the port to be released, then
 * launches the same argv and cwd again. All failures go to
 * `<DSH_HOME>/logs/restart-helper.log`; a broken restart must not be silent.
 * @module dsh-restart/helper
 */
import { spawn } from 'node:child_process'
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import net from 'node:net'

interface Payload {
  readonly parentPid: number
  readonly argv: readonly string[]
  readonly execArgv: readonly string[]
  readonly cwd: string
  readonly port: number
}

const rawArgument = process.argv[2]
const rawPayload = rawArgument !== undefined && existsSync(rawArgument) ? readFileSync(rawArgument, 'utf8') : rawArgument
const payload = parsePayload(rawPayload)
const logPath = join(dshHome(), 'logs', 'restart-helper.log')
const hostLog = join(dshHome(), 'logs', 'restart-host.log')

log(`scheduled: parent=${payload.parentPid} port=${payload.port} cwd=${payload.cwd}`)

await sleep(350)
await forceKillTree(payload.parentPid)

const args = withoutOpenFlag([...payload.execArgv, ...payload.argv])
if (args.length === 0) {
  log('abort: empty restart argv')
  process.exit(1)
}
mkdirSync(join(dshHome(), 'logs'), { recursive: true })

for (let attempt = 1; attempt <= 10; attempt += 1) {
  const out = openSync(hostLog, 'a')
  let child
  try {
    appendFileSync(out, `\n===== ${new Date().toISOString()} restart attempt ${attempt} =====\n`)
    child = spawn(process.execPath, args, {
      cwd: payload.cwd,
      env: process.env,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', out, out],
    })
    child.unref()
    log(`launched attempt ${attempt} pid=${child.pid ?? 'unknown'} port=${payload.port}: ${args.join(' ')}`)
  } catch (cause) {
    log(`attempt ${attempt} launch failed: ${cause instanceof Error ? cause.stack ?? cause.message : String(cause)}`)
  } finally {
    closeSync(out)
  }
  await sleep(3_000)
  if (child !== undefined && child.exitCode === null) {
    if (await waitFor(() => portOpen(payload.port), 20_000, 250)) {
      log(`ready: port ${payload.port} is listening`)
      process.exit(0)
    }
  }
  log(`attempt ${attempt} did not listen${child?.exitCode !== null ? ` (exit ${String(child?.exitCode)})` : ''}; retrying`)
  await sleep(2_000)
}

log(`abort: port ${payload.port} did not accept a new host after 10 attempts; see ${hostLog}`)
process.exit(1)

function parsePayload(raw: string | undefined): Payload {
  try {
    const value = JSON.parse(raw ?? '') as Partial<Payload>
    if (typeof value.parentPid !== 'number' || !Array.isArray(value.argv) || typeof value.cwd !== 'string' || typeof value.port !== 'number') {
      throw new Error('invalid payload')
    }
    return {
      parentPid: value.parentPid,
      argv: value.argv.filter((item): item is string => typeof item === 'string'),
      execArgv: Array.isArray(value.execArgv) ? value.execArgv.filter((item): item is string => typeof item === 'string') : [],
      cwd: value.cwd,
      port: value.port,
    }
  } catch {
    log(`abort: invalid payload: ${String(raw).slice(0, 200)}`)
    process.exit(2)
  }
}

function dshHome(): string {
  const configured = process.env.DSH_HOME
  return configured !== undefined && configured.trim().length > 0 ? resolve(configured) : join(homedir(), '.dsh')
}

function log(message: string): void {
  try {
    mkdirSync(join(dshHome(), 'logs'), { recursive: true })
    appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`, 'utf8')
  } catch {
    // A failed log must not keep a half-restarted host alive.
  }
}


async function forceKillTree(pid: number): Promise<void> {
  if (process.platform !== 'win32') {
    try { process.kill(pid, 'SIGKILL') } catch { /* already gone */ }
    return
  }
  await new Promise<void>((resolvePromise) => {
    const child = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], { windowsHide: true, stdio: 'ignore' })
    child.once('exit', () => resolvePromise())
    child.once('error', () => resolvePromise())
  })
  log(`force-killed process tree ${pid}`)
}


function portOpen(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    const finish = (open: boolean): void => {
      socket.destroy()
      resolvePromise(open)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(800, () => finish(false))
  })
}

function withoutOpenFlag(argv: readonly string[]): string[] {
  const args = argv.filter(arg => arg !== '--open')
  return args.includes('--no-open') ? [...args] : [...args, '--no-open']
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds))
}

async function waitFor(predicate: () => boolean | Promise<boolean>, timeoutMs: number, intervalMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return true
    await sleep(intervalMs)
  }
  return false
}

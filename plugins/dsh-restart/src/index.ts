/**
 * Host half of dsh-restart: one authenticated route that hands the running
 * process to a detached helper, which stops this host and starts the same
 * command again with no console window.
 * @module dsh-restart
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'

/** Cordis plugin name. */
export const name = 'restart'

/** Services the Host half needs before it can mount. */
export const inject = ['webServer']

const API_BASE = '/restart/api'
/** Duplicate clicks are refused while a restart is already in flight. */
let restartingUntil = 0

interface RouteHost {
  readonly webServer: {
    register(route: {
      readonly kind: 'prefix'
      readonly path: string
      readonly handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
    }): () => void
  }
  get(name: string): unknown
  effect(callback: () => () => void, label?: string): () => void
  logger?: { info?(message: string): void; warn(...args: unknown[]): void }
}

interface TrustGate {
  requestRejection?(request: { readonly headers: IncomingMessage['headers'] }): 401 | 403 | undefined
}

/**
 * Mount the restart route.
 * @param ctx - plugin context carrying the Web carrier.
 */
export function apply(ctx: RouteHost): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_BASE,
    handler: (request, response) => handle(ctx, request, response),
  }), 'dsh-restart: route')
}

async function handle(ctx: RouteHost, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const gate = ctx.get('connection') as TrustGate | undefined
  const rejection = gate?.requestRejection?.({ headers: request.headers })
  if (rejection !== undefined) {
    send(response, rejection, { error: 'forbidden' })
    return
  }
  const url = new URL(request.url ?? '/', 'http://localhost')
  const route = url.pathname.slice(API_BASE.length).replace(/^\//, '')
  if (route === 'ping') {
    send(response, 200, { ok: true })
    return
  }
  if (route !== 'restart') {
    send(response, 404, { error: 'not found' })
    return
  }
  if (request.method !== 'POST') {
    send(response, 405, { error: 'POST required' })
    return
  }
  if (Date.now() < restartingUntil) {
    send(response, 429, { error: 'restart already scheduled' })
    return
  }
  const helper = fileURLToPath(new URL('./restart.js', import.meta.url))
  if (!existsSync(helper)) {
    send(response, 500, { error: `restart helper missing: ${helper}` })
    return
  }
  const payload = JSON.stringify({
    parentPid: process.pid,
    argv: process.argv.slice(1),
    execArgv: process.execArgv,
    cwd: process.cwd(),
    port: portOf(process.argv),
  })
  try {
    launchOutsideJob(ctx, helper, payload)
  } catch (cause) {
    ctx.logger?.warn?.(`dsh-restart: helper failed to start: ${messageOf(cause)}`)
    send(response, 500, { error: messageOf(cause) })
    return
  }
  restartingUntil = Date.now() + 30_000
  ctx.logger?.info?.('dsh-restart: restart scheduled')
  // The response must reach the browser before the helper stops this process.
  send(response, 202, { ok: true, scheduled: true })
}

function launchOutsideJob(ctx: RouteHost, helper: string, payload: string): void {
  const logs = join(dshHome(), 'logs')
  mkdirSync(logs, { recursive: true })
  const request = join(logs, 'restart-request.json')
  writeFileSync(request, payload, 'utf8')
  if (process.platform !== 'win32') {
    const child = spawn(process.execPath, [helper, request], { cwd: process.cwd(), env: process.env, detached: true, stdio: 'ignore' })
    child.unref()
    return
  }
  // The host's child processes die with it (Tool Sandbox job). The scheduled
  // task runs outside that job; wscript starts Node with no console window.
  const vbs = join(logs, 'restart-request.vbs')
  const command = `${quoteVbs(process.execPath)} & " " & ${quoteVbs(helper)} & " " & ${quoteVbs(request)}`
  writeFileSync(vbs, [
    'Set sh = CreateObject("WScript.Shell")',
    `sh.Run ${command}, 0, False`,
    '',
  ].join('\r\n'), 'utf8')
  // ShellExecute hands the launch to Explorer, outside the host's job. The
  // PowerShell bridge exits immediately; wscript then starts Node hidden.
  const script = `(New-Object -ComObject Shell.Application).ShellExecute('wscript.exe', '//B "${vbs.replace(/'/g, "''")}"', '', 'open', 0)`
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded], {
    windowsHide: true,
    stdio: 'ignore',
  })
  child.unref()
}

function quoteVbs(value: string): string {
  return `"""${value.replace(/"/g, '""')}"""`
}

function dshHome(): string {
  const configured = process.env.DSH_HOME
  return configured !== undefined && configured.trim().length > 0 ? resolve(configured) : join(homedir(), '.dsh')
}

function portOf(argv: readonly string[]): number {
  const index = argv.lastIndexOf('--port')
  if (index !== -1) {
    const value = Number(argv[index + 1])
    if (Number.isInteger(value) && value > 0 && value < 65_536) return value
  }
  return 3080
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

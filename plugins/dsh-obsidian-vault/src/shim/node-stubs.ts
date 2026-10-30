/**
 * The frame's Node-builtin stubs. `path` and `crypto` are real minimal
 * implementations; `fs` answers only the synchronous graph.json read (from the
 * document the host embedded at serve time); everything else — child_process,
 * electron, os, fs writes — throws `UnsupportedObsidianApi`, and the plugin's
 * desktop-only features degrade on that.
 * @module dsh-obsidian-vault/shim/node-stubs
 */
import { UnsupportedObsidianApi } from './errors.ts'
import { pathStub } from './path.ts'
import { sha256Hex } from './sha256.ts'

const GRAPH_JSON_SUFFIX = '.obsidian/graph.json'

/** Bytes accepted by the Buffer shim and the hash stub. */
type ByteInput = Uint8Array | { readonly bytes: Uint8Array } | string

function toBytes(input: ByteInput): Uint8Array {
  if (input instanceof Uint8Array) return input
  if (typeof input === 'string') return new TextEncoder().encode(input)
  return input.bytes
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    out += BASE64_ALPHABET.charAt(a >> 2)
    out += BASE64_ALPHABET.charAt(((a & 3) << 4) | (b >> 4))
    out += i + 1 < bytes.length ? BASE64_ALPHABET.charAt(((b & 15) << 2) | (c >> 6)) : '='
    out += i + 2 < bytes.length ? BASE64_ALPHABET.charAt(c & 63) : '='
  }
  return out
}

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/** The slice of Node's `Buffer` pur-studio touches: `from` plus `toString`. */
class BufferShim {
  readonly bytes: Uint8Array

  private constructor(bytes: Uint8Array) {
    this.bytes = bytes
  }

  /**
   * Wrap bytes or text.
   * @param data - bytes, an ArrayBuffer, or a string.
   */
  static from(data: Uint8Array | ArrayBuffer | string): BufferShim {
    if (typeof data === 'string') return new BufferShim(new TextEncoder().encode(data))
    if (data instanceof Uint8Array) return new BufferShim(data)
    return new BufferShim(new Uint8Array(data))
  }

  /**
   * Encode the wrapped bytes.
   * @param encoding - `base64`, `hex`, or `utf8`.
   */
  toString(encoding?: string): string {
    if (encoding === 'base64') return toBase64(this.bytes)
    if (encoding === 'hex') return toHex(this.bytes)
    return new TextDecoder().decode(this.bytes)
  }
}

/** Install the Buffer shim on the frame's global scope when absent. */
export function installBuffer(scope: object): void {
  if (!('Buffer' in scope)) {
    Object.defineProperty(scope, 'Buffer', { value: BufferShim, configurable: true })
  }
}

function uuid(): string {
  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = toHex(bytes)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Build the `require`-able Node stubs.
 * @param graphJson - the vault's graph.json document, or null when absent.
 * @returns the module map: name to exports object.
 */
export function buildNodeStubs(graphJson: unknown): Record<string, unknown> {
  const unsupported = (label: string): () => never => {
    return () => {
      throw new UnsupportedObsidianApi(label)
    }
  }
  return {
    path: pathStub,
    crypto: {
      randomUUID: uuid,
      createHash: (algorithm: string) => {
        if (algorithm !== 'sha256') throw new UnsupportedObsidianApi(`crypto.createHash(${algorithm})`)
        const chunks: Uint8Array[] = []
        return {
          update(data: ByteInput) {
            chunks.push(toBytes(data))
            return this
          },
          digest(encoding: string): string {
            if (encoding !== 'hex') throw new UnsupportedObsidianApi(`crypto digest ${encoding}`)
            const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
            const bytes = new Uint8Array(total)
            let offset = 0
            for (const chunk of chunks) {
              bytes.set(chunk, offset)
              offset += chunk.length
            }
            return sha256Hex(bytes)
          },
        }
      },
    },
    fs: {
      existsSync: (path: unknown): boolean => {
        if (typeof path === 'string' && path.replace(/\\/g, '/').endsWith(GRAPH_JSON_SUFFIX)) return graphJson !== null
        throw new UnsupportedObsidianApi('fs.existsSync')
      },
      readFileSync: (path: unknown): string => {
        if (typeof path === 'string' && path.replace(/\\/g, '/').endsWith(GRAPH_JSON_SUFFIX) && graphJson !== null) {
          return JSON.stringify(graphJson)
        }
        throw new UnsupportedObsidianApi('fs.readFileSync')
      },
      writeFileSync: unsupported('fs.writeFileSync'),
      readdirSync: unsupported('fs.readdirSync'),
      mkdirSync: unsupported('fs.mkdirSync'),
      statSync: unsupported('fs.statSync'),
      promises: new Proxy({}, {
        get: () => {
          throw new UnsupportedObsidianApi('fs.promises')
        },
      }),
    },
    os: {
      tmpdir: unsupported('os.tmpdir'),
      homedir: unsupported('os.homedir'),
      platform: unsupported('os.platform'),
    },
    child_process: {
      exec: unsupported('child_process.exec'),
      execFile: unsupported('child_process.execFile'),
      execSync: unsupported('child_process.execSync'),
      spawn: unsupported('child_process.spawn'),
    },
    electron: {
      remote: new Proxy({}, {
        get: () => {
          throw new UnsupportedObsidianApi('electron.remote')
        },
      }),
    },
  }
}

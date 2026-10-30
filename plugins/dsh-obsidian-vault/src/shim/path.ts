/**
 * The minimal `path` module the frame answers: posix-style joins and splits,
 * which is what vault-relative plugin code needs. The desktop-only paths pur
 * builds (Python discovery, temp files) never get this far — the surrounding
 * `fs`/`child_process` stubs throw first.
 * @module dsh-obsidian-vault/shim/path
 */

function segments(path: string): string[] {
  return path.split(/[/\\]+/).filter(part => part.length > 0 && part !== '.')
}

export const pathStub = {
  sep: '/',
  join(...parts: string[]): string {
    return segments(parts.join('/')).join('/')
  },
  normalize(path: string): string {
    return segments(path).join('/')
  },
  dirname(path: string): string {
    const parts = segments(path)
    return parts.length <= 1 ? '.' : parts.slice(0, -1).join('/')
  },
  basename(path: string, extension?: string): string {
    const name = segments(path).pop() ?? ''
    return extension !== undefined && name.endsWith(extension) ? name.slice(0, -extension.length) : name
  },
  extname(path: string): string {
    const name = segments(path).pop() ?? ''
    const dot = name.lastIndexOf('.')
    return dot > 0 ? name.slice(dot) : ''
  },
  resolve(...parts: string[]): string {
    return segments(parts.join('/')).join('/')
  },
}

/**
 * Enforce the module boundary between the vault workspace and the canvas.
 *
 * Layers (left may import right; never the other way around):
 *
 *   pur-kernel        canvas domain model and logic; imports nothing outside itself
 *   client/pur        canvas React UI; may use the kernel, the kit, i18n and api clients
 *   client/ui (kit)   shared visual layer (classes, tokens, primitives such as the ask dialog)
 *   client/ui (rest)  vault workspace UI; may use the canvas only through the kernel barrel
 *   vault/, routes    host side; may read canvas documents through the kernel barrel, never client code
 *   client/*.ts       workspace shell helpers (api clients, loader, i18n runtime)
 *
 * Run with `node scripts/check-boundaries.mjs`; exits 1 on a violation.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const SRC = join(ROOT, 'src')
const KERNEL = 'pur-kernel/'

/** Every TypeScript file below src. */
function walk(directory) {
  const out = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (/\.tsx?$/.test(entry)) out.push(path)
  }
  return out
}

/** Area of one source file, relative to src. */
function areaOf(rel) {
  if (rel === 'settings.ts' || rel === 'protocol.ts') return 'shared'
  if (rel === 'index.ts' || rel.startsWith('routes') || rel === 'routes-shared.ts' || rel === 'vault-endpoints.ts' || rel === 'config-endpoints.ts' || rel === 'plugin-endpoints.ts' || rel === 'http.ts' || rel === 'code-snippets.ts' || rel === 'system-open.ts' || rel === 'package-root.ts' || rel === 'merge.ts') return 'host'
  if (rel.startsWith('vault/')) return 'host'
  if (rel.startsWith(KERNEL)) return 'canvas-kernel'
  if (rel.startsWith('pur-obsidian/')) return 'obsidian-adapter'
  if (rel.startsWith('client/pur/')) return 'canvas-ui'
  if (rel.startsWith('client/ui/kit/')) return 'kit'
  if (rel.startsWith('client/ui/')) return 'workspace-ui'
  if (rel === 'client/i18n.ts' || rel.startsWith('client/i18n/')) return 'shared'
  if (rel === 'client/api.ts' || rel === 'client/api-vault.ts' || rel === 'client/api-core.ts') return 'shared'
  if (rel.startsWith('client/')) return 'workspace-client'
  return 'other'
}

/** Resolve a relative import to a src-relative path, or null for packages. */
function resolveImport(importer, specifier) {
  if (!specifier.startsWith('.')) return null
  let target = resolve(dirname(importer), specifier)
  if (statSync(target, { throwIfNoEntry: false })?.isDirectory()) target = join(target, 'index.ts')
  return relative(SRC, target).replace(/\\/g, '/')
}

/** True when the file is the canvas kernel's public barrel. */
function isKernelBarrel(target) {
  return target === 'pur-kernel/index.ts'
}

const violations = []

for (const file of walk(SRC)) {
  const rel = relative(SRC, file).replace(/\\/g, '/')
  const area = areaOf(rel)
  const text = readFileSync(file, 'utf8')
  const specifiers = [...text.matchAll(/^\s*(?:import|export)\b[^'"]*from\s*['"]([^'"]+)['"]/gm)].map((match) => match[1])
  for (const specifier of specifiers) {
    if (specifier.startsWith('node:') || /^(fs|path|os|http|url|crypto|child_process|worker_threads)$/.test(specifier)) {
      if (area === 'canvas-kernel' || area === 'canvas-ui') {
        violations.push(`${rel}: ${area} must stay platform-neutral but imports "${specifier}"`)
      }
      continue
    }
    const target = resolveImport(file, specifier)
    if (target === null) continue
    const targetArea = areaOf(target)

    if (area === 'canvas-kernel' && targetArea !== 'canvas-kernel') {
      violations.push(`${rel}: canvas kernel may only import its own modules, found "${specifier}"`)
    }
    if (area === 'canvas-ui' && (targetArea === 'workspace-ui' || targetArea === 'workspace-client' || targetArea === 'host' || targetArea === 'obsidian-adapter')) {
      violations.push(`${rel}: canvas UI must not import ${targetArea} ("${specifier}")`)
    }
    const canvasFacade = target === 'client/pur/integration.ts'
    if (area === 'workspace-ui' && ((targetArea === 'canvas-ui' && !canvasFacade) || (targetArea === 'canvas-kernel' && !isKernelBarrel(target)))) {
      violations.push(`${rel}: workspace UI may use the canvas only through pur-kernel/index.ts or client/pur/integration.ts ("${specifier}")`)
    }
    if (area === 'host' && targetArea.startsWith('client/')) {
      violations.push(`${rel}: host code must not import client code ("${specifier}")`)
    }
    if (area === 'host' && targetArea === 'canvas-kernel' && !isKernelBarrel(target)) {
      violations.push(`${rel}: host may read canvas documents only through pur-kernel/index.ts ("${specifier}")`)
    }
    if (area === 'obsidian-adapter' && (targetArea === 'canvas-ui' || targetArea === 'workspace-ui')) {
      violations.push(`${rel}: the Obsidian adapter must not depend on browser UI ("${specifier}")`)
    }
  }
}

if (violations.length > 0) {
  console.error('module boundary violations:')
  for (const line of violations) console.error('  ' + line)
  process.exit(1)
}
console.log('module boundaries: ok')

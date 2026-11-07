/**
 * Release preflight for dsh-obsidian-vault: no publishing, only checks that the
 * tarball would contain the runtime files and that the metadata a public package
 * needs is present. Run with `npm run release:check`.
 * @module dsh-obsidian-vault/scripts/release-check
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const failures = []
const warnings = []

/** Metadata a published package needs; `private` is reported, not required off. */
function checkMetadata() {
  if (pkg.private === true) warnings.push('package.json still has "private": true — publish is blocked until a release commit removes it')
  if (typeof pkg.name !== 'string' || pkg.name.length === 0) failures.push('missing package name')
  if (typeof pkg.version !== 'string') failures.push('missing version')
  if (pkg.license === undefined) failures.push('missing license field')
  if (pkg.author === undefined) warnings.push('missing author (decide the public identity before publishing)')
  if (pkg.repository === undefined) warnings.push('missing repository (npm page will not link the source)')
  if (pkg.publishConfig?.access !== 'public') warnings.push('publishConfig.access should be "public"')
  if (pkg.dsh?.bundle?.patch === undefined) failures.push('missing dsh.bundle.patch')
  if (pkg.dsh?.client?.platform !== 'web') failures.push('dsh.client.platform must be "web"')
}

/** Expected runtime files and forbidden working-tree directories. */
const REQUIRED = [
  'package.json',
  'README.md',
  'lib/index.js',
  'lib/client.js',
  'cordis.patch.yml',
  'scaffold/vault/知识库总览/kb-conventions.md',
  'scaffold/vault/知识库总览/笔记编写规范.md',
  'scaffold/obsidian/app.json',
  'scaffold/obsidian/graph.json',
]
const FORBIDDEN = ['src/', 'tests/', 'scripts/', 'docs/', '.data/', '.artifacts/', 'node_modules/', 'obsidian/', 'upstream/', 'dist/']

/** Pack the package and inspect the reported file list. */
function checkTarball() {
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const parsed = JSON.parse(raw)
  const entry = Array.isArray(parsed) ? parsed[0] : parsed
  const files = entry.files.map(file => file.path)
  const size = entry.size ?? 0

  for (const required of REQUIRED) {
    if (!files.includes(required)) failures.push(`tarball is missing ${required}`)
  }
  for (const file of files) {
    if (FORBIDDEN.some(prefix => file.startsWith(prefix))) failures.push(`tarball leaks working-tree path ${file}`)
  }
  if (size > 5 * 1024 * 1024) failures.push(`tarball is ${(size / 1048576).toFixed(1)}MB; expected under 5MB`)
  return { files: files.length, size, unpacked: entry.unpackedSize ?? 0 }
}

checkMetadata()
let tarball = null
try {
  tarball = checkTarball()
} catch (error) {
  failures.push(`npm pack --dry-run failed: ${error instanceof Error ? error.message : String(error)}`)
}

console.log(`release check for ${pkg.name}@${pkg.version}`)
if (tarball !== null) {
  console.log(`  tarball: ${tarball.files} files, ${(tarball.size / 1024).toFixed(1)}KB packed, ${(tarball.unpacked / 1024).toFixed(1)}KB unpacked`)
}
for (const warning of warnings) console.log(`  warn: ${warning}`)
for (const failure of failures) console.error(`  FAIL: ${failure}`)
if (failures.length > 0) process.exitCode = 1
else console.log(`  ok${warnings.length === 0 ? '' : ' (with warnings)'}`)

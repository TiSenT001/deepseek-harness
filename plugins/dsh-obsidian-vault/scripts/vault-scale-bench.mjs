/**
 * Vault-scale gate: generate a synthetic vault of Markdown notes, build the index
 * through the same `VaultIndex` the host uses, and fail when indexing or search
 * exceeds the recorded budgets. It covers the notes side, which the canvas benches
 * do not: the numbers here are what a growing vault costs on the first scan.
 *
 * Usage:
 *   node --experimental-strip-types scripts/vault-scale-bench.mjs [--notes 2000] [--queries 60] [--json]
 *
 * Budgets default to values that fail on an order-of-magnitude regression, not on
 * machine noise; override with --index-budget-ms and --search-budget-ms.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { VaultIndex } from '../src/vault/index.ts'
import { NodeFs } from '../tests/helpers/node-fs.ts'

/** Read one numeric flag. */
function flag(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  const value = Number(process.argv[index + 1])
  return Number.isFinite(value) ? value : fallback
}

const notes = flag('--notes', 2000)
const queries = flag('--queries', 60)
const indexBudgetMs = flag('--index-budget-ms', 8000)
const searchBudgetMs = flag('--search-budget-ms', 400)
const folderCount = 20

/** One synthetic note with frontmatter, tags, links and enough body to parse. */
function noteBody(index) {
  const folder = index % folderCount
  const target = (index + 1) % notes
  const lines = [
    '---',
    `title: 合成笔记 ${index}`,
    `created: 2026-0${(index % 9) + 1}-${String((index % 27) + 1).padStart(2, '0')}`,
    `tags: [合成标签${index % 12}, 性能]`,
    `count: ${index}`,
    '---',
    `# 合成笔记 ${index}`,
    '',
    `这是第 ${index} 篇用于索引基准的合成笔记，位于合成文件夹 ${folder}。`,
    `引用下一篇：[[合成文件夹 ${(target % folderCount)}/合成笔记 ${target}]]。`,
    '',
    '## 小节',
    '',
    '- 列表项一',
    '- 列表项二',
    '',
    `搜索关键字：性能索引 基准 第${index % 40}组`,
    '',
    '```js',
    `const value = ${index}`,
    '```',
    '',
    `#合成标签${index % 12} #性能`,
    '',
  ]
  return lines.join('\n')
}

const root = await mkdtemp(join(tmpdir(), 'ov-vault-bench-'))
try {
  for (let folder = 0; folder < folderCount; folder += 1) {
    await mkdir(join(root, `合成文件夹 ${folder}`), { recursive: true })
  }
  await Promise.all(Array.from({ length: notes }, async (_, index) => {
    const folder = index % folderCount
    const path = join(root, `合成文件夹 ${folder}`, `合成笔记 ${index}.md`)
    await writeFile(path, noteBody(index), 'utf8')
  }))

  const vault = new VaultIndex(new NodeFs(root), {
    root,
    ignore: ['.obsidian', '.trash'],
    maxFileBytes: 2 * 1024 * 1024,
    maxIndexBytes: 256 * 1024 * 1024,
    maxDepth: 12,
  })

  const beforeHeap = process.memoryUsage().heapUsed
  const startedIndex = performance.now()
  await vault.refresh()
  const indexMs = performance.now() - startedIndex
  const heapMb = (process.memoryUsage().heapUsed - beforeHeap) / 1024 / 1024

  const terms = ['性能索引', '合成笔记 7', 'tag:#性能', '列表项', '基准 第12组']
  const timings = []
  for (let index = 0; index < queries; index += 1) {
    const term = terms[index % terms.length]
    const started = performance.now()
    vault.search(term)
    timings.push(performance.now() - started)
  }
  timings.sort((left, right) => left - right)
  const p95 = timings[Math.min(timings.length - 1, Math.floor(timings.length * 0.95))] ?? 0

  const status = vault.status()
  const result = {
    notes,
    folders: folderCount,
    indexedNotes: status.notes,
    indexMs: Math.round(indexMs),
    searchP95Ms: Number(p95.toFixed(1)),
    heapMb: Number(heapMb.toFixed(1)),
    budgets: { indexMs: indexBudgetMs, searchP95Ms: searchBudgetMs },
  }
  const failures = []
  if (result.indexedNotes !== notes) failures.push(`indexed ${result.indexedNotes} of ${notes} notes`)
  if (result.indexMs > indexBudgetMs) failures.push(`index ${result.indexMs}ms > ${indexBudgetMs}ms`)
  if (result.searchP95Ms > searchBudgetMs) failures.push(`search p95 ${result.searchP95Ms}ms > ${searchBudgetMs}ms`)

  if (process.argv.includes('--json')) console.log(JSON.stringify({ ...result, failures }, null, 1))
  else {
    console.log(`notes ${result.indexedNotes}/${notes} · index ${result.indexMs}ms (budget ${indexBudgetMs}) · search p95 ${result.searchP95Ms}ms (budget ${searchBudgetMs}) · heap ${result.heapMb}MB`)
    for (const failure of failures) console.error(`FAIL ${failure}`)
  }
  process.exitCode = failures.length === 0 ? 0 : 1
} finally {
  await rm(root, { recursive: true, force: true })
}

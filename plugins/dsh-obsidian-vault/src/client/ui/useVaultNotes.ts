/**
 * Daily notes and template commands for the palette. The hook reads
 * `daily-notes.json` and `templates.json`, resolves today's path, and turns the
 * template folder's notes into palette entries. Creation always goes through
 * the page's existing APIs and reload.
 * @module dsh-obsidian-vault/client/ui/useVaultNotes
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TreeNodeDto } from '../../protocol.ts'
import { createFolder, createNote, fetchFile, readObsidianConfig, saveNote } from '../api.ts'
import type { Translate } from '../i18n.ts'
import type { CommandEntry } from './commands.ts'
import { DAILY_CONFIG, dailyTarget } from './daily-note.ts'

/** Everything the daily and template commands need from the page. */
export interface VaultNoteInput {
  readonly t: Translate
  readonly openPath: (path: string) => void
  readonly reload: () => Promise<void>
  readonly setError: (message: string | undefined) => void
  /** Active index root; the configuration is re-read when the vault changes. */
  readonly root: string | undefined
  readonly tree: readonly TreeNodeDto[]
  /** In-app text prompt; embedded webviews block the native one. */
  readonly askText: (title: string, initial?: string) => Promise<string | null>
}

const message = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause))

/** The template folder configured in `templates.json`, when it names one. */
function templateFolder(value: unknown): string | undefined {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const folder = record.folder
  if (typeof folder !== 'string' || folder.trim().length === 0) return undefined
  return folder.trim().replace(/^[\\/]+|[\\/]+$/g, '').replace(/\\/g, '/') || undefined
}

/** Vault-relative Markdown paths under one folder. */
function filesUnder(nodes: readonly TreeNodeDto[], folder: string): string[] {
  const out: string[] = []
  for (const node of nodes) {
    if (node.kind === 'dir') out.push(...filesUnder(node.children ?? [], folder))
    else if (/\.md$/i.test(node.path) && node.path.startsWith(`${folder}/`)) out.push(node.path)
  }
  return out
}

/**
 * Build the daily-note and template commands for the current vault.
 * @param input - translator, navigation, the active root, and the note tree.
 * @returns palette commands, daily first, then one per template note.
 */
export function useVaultNotes(input: VaultNoteInput): readonly CommandEntry[] {
  const { t, openPath, reload, setError, root, tree, askText } = input
  const [templates, setTemplates] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    void readObsidianConfig('templates')
      .then((doc) => {
        if (!cancelled) setTemplates(templateFolder(doc.value))
      })
      .catch(() => {
        // A vault without a readable templates config simply has no templates.
        if (!cancelled) setTemplates(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [root])

  /** Fill a freshly created, still empty note from its template. */
  const seed = useCallback(async (template: string, path: string): Promise<void> => {
    const target = await fetchFile(path)
    if ((target.text ?? '').trim().length > 0) return
    const source = await fetchFile(template)
    await saveNote(path, source.text ?? '')
  }, [])

  const createFromTemplate = useCallback((template: string): void => {
    void askText(t('newNotePrompt'), t('untitled')).then((name) => {
    if (name === null || name.trim().length === 0) return
    const trimmed = name.trim()
    const path = /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`
    void createNote(path)
      .then(async (ok) => {
        if (!ok) {
          setError(t('createFailed'))
          return
        }
        try {
          await seed(template, path)
        } catch {
          // An unusable template must not block opening the new note.
        }
        await reload()
        openPath(path)
      })
      .catch((cause: unknown) => setError(message(cause)))
    })
  }, [askText, openPath, reload, seed, setError, t])

  const openDaily = useCallback((): void => {
    void (async () => {
      try {
        const config = await readObsidianConfig(DAILY_CONFIG)
        const target = dailyTarget(config.value, new Date())
        if (target.folder !== undefined) await createFolder(target.folder)
        if (!await createNote(target.path)) {
          setError(t('createFailed'))
          return
        }
        if (target.template !== undefined) {
          try {
            await seed(target.template, target.path)
          } catch {
            // A missing template must not block opening today's note.
          }
        }
        await reload()
        openPath(target.path)
      } catch (cause) {
        setError(message(cause))
      }
    })()
  }, [askText, openPath, reload, seed, setError, t])

  return useMemo<readonly CommandEntry[]>(() => {
    const daily: CommandEntry = { id: 'daily.open', label: t('dailyNote'), run: openDaily }
    const known = templates === undefined ? [] : filesUnder(tree, templates)
    return [
      daily,
      ...known.map((path) => {
        const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/i, '')
        return { id: `template:${path}`, label: `${t('templateNew')} · ${name}`, run: () => createFromTemplate(path) }
      }),
    ]
  }, [createFromTemplate, openDaily, t, templates, tree])
}

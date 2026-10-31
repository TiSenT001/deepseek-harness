/**
 * Standalone canvas window: the page the 弹出为独立窗口 entry opens in a browser
 * window of its own. It mounts one `.PurStudio` document with the same pane the
 * workspace uses, so zoom, pan, editing and saving behave identically; only the
 * workspace chrome is missing.
 * @module dsh-obsidian-vault/client/popout
 */
import { createRoot } from 'react-dom/client'
import { createT, detectLang } from './i18n.ts'
import { PurStudioPane } from './pur/PurStudioPane.tsx'
import { STYLE } from './ui/kit/index.ts'

/** Query parameter carrying the document path. */
const PATH_PARAM = 'path'

/**
 * Mount the canvas for the document named in the query string.
 * @param container - element to render into.
 */
function mount(container: HTMLElement): void {
  const url = new URL(window.location.href)
  const path = url.searchParams.get(PATH_PARAM) ?? ''
  const t = createT(detectLang())
  const root = createRoot(container)
  if (path === '') {
    root.render(
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#ddd' }}>
        <style>{STYLE}</style>
        {t('loadFailed')}
      </div>,
    )
    return
  }
  document.title = path.slice(path.lastIndexOf('/') + 1)
  root.render(
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      <style>{STYLE}</style>
      <PurStudioPane t={t} path={path} />
    </div>,
  )
}

const container = document.getElementById('root')
if (container !== null) mount(container)

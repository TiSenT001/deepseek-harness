/**
 * Standalone Mermaid bundle served on demand. The reading view injects
 * `/obsidian/api/mermaid.js` only after finding a diagram, so notes without
 * diagrams never parse the large library.
 * @module dsh-obsidian-vault/client/mermaid-render
 */
import mermaid from 'mermaid'

/** Shape the reading view calls through `window.__OV_MERMAID__`. */
interface MermaidRenderer {
  render(id: string, source: string): Promise<{ readonly svg: string }>
}

declare global {
  interface Window {
    __OV_MERMAID__?: MermaidRenderer
  }
}

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'dark' })
window.__OV_MERMAID__ = {
  render: (id, source) => mermaid.render(id, source),
}

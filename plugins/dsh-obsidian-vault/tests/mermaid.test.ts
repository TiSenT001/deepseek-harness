import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isMermaidFence } from '../src/client/ui/note/enhanceMermaid.ts'

test('recognises the language classes a code renderer may attach', () => {
  assert.equal(isMermaidFence({ className: 'language-mermaid' } as HTMLElement), true)
  assert.equal(isMermaidFence({ className: 'hljs lang-mermaid' } as HTMLElement), true)
  assert.equal(isMermaidFence({ className: 'language-javascript' } as HTMLElement), false)
  assert.equal(isMermaidFence({ className: '' } as HTMLElement), false)
})

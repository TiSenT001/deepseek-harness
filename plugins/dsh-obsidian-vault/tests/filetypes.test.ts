import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extensionOf, fileTypeOf, isPreviewableFile, normalizeLanguage } from '../src/filetypes.ts'

test('routes markdown, images, PDFs, and whitelisted text to their own views', () => {
  assert.equal(fileTypeOf('note.md').kind, 'markdown')
  assert.equal(fileTypeOf('note.markdown').language, 'markdown')
  assert.equal(fileTypeOf('media/pic.PNG').kind, 'image')
  assert.equal(fileTypeOf('media/pic.png').mime, 'image/png')
  assert.equal(fileTypeOf('doc.pdf').kind, 'pdf')
  assert.equal(fileTypeOf('src/app.ts').kind, 'code')
  assert.equal(fileTypeOf('src/app.ts').language, 'typescript')
  assert.equal(fileTypeOf('data/rows.csv').language, 'csv')
})

test('leaves unknown extensions binary and non-previewable', () => {
  const spec = fileTypeOf('archive.zip')
  assert.equal(spec.kind, 'binary')
  assert.equal(spec.previewable, false)
  assert.equal(spec.language, undefined)
  assert.equal(isPreviewableFile('archive.zip'), false)
  assert.equal(isPreviewableFile('doc.pdf'), true)
  assert.equal(isPreviewableFile('src/app.ts'), true)
})

test('reads the extension without the dot, lowercased', () => {
  assert.equal(extensionOf('folder/App.TS'), 'ts')
  assert.equal(extensionOf('README'), '')
  assert.equal(extensionOf('.gitignore'), '')
  assert.equal(extensionOf('a.b/c.d.md'), 'md')
})

test('normalizes fence aliases to tokenizer keys', () => {
  assert.equal(normalizeLanguage('ts'), 'typescript')
  assert.equal(normalizeLanguage('TSX'), 'typescript')
  assert.equal(normalizeLanguage('js'), 'javascript')
  assert.equal(normalizeLanguage('py'), 'python')
  assert.equal(normalizeLanguage('yml'), 'yaml')
  assert.equal(normalizeLanguage('c++'), 'cpp')
  assert.equal(normalizeLanguage('  Shell '), 'bash')
  assert.equal(normalizeLanguage('brainfuck'), 'brainfuck')
  assert.equal(normalizeLanguage(undefined), undefined)
  assert.equal(normalizeLanguage('   '), undefined)
})

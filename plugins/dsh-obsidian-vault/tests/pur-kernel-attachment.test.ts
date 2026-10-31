import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { attachmentName } from '../src/pur-kernel/index.ts'

/** Vault attachment folder the adapter writes into. */
const ATTACHMENT_DIR = '附件'

/** Fixed hex digest for the naming cases that do not depend on content. */
const HEX = '0123456789abcdef'

/** PNG signature plus a few payload bytes, enough to distinguish contents. */
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x2a, 0x07])

/**
 * Hex SHA-256 of a payload, the digest the adapter feeds to `attachmentName`.
 * @param bytes - file contents.
 * @returns the lowercase hex digest.
 */
function digestOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

test('resolves the same bytes imported twice to one attachment path', () => {
  const first = `${ATTACHMENT_DIR}/${attachmentName('screenshot.png', digestOf(PNG_BYTES))}`
  const second = `${ATTACHMENT_DIR}/${attachmentName('screenshot.png', digestOf(new Uint8Array(PNG_BYTES)))}`
  assert.equal(first, second)
  assert.equal(first, `${ATTACHMENT_DIR}/${digestOf(PNG_BYTES).slice(0, 8)}-screenshot.png`)
})

test('gives different bytes different paths', () => {
  const other = digestOf(new Uint8Array([...PNG_BYTES, 0x04]))
  assert.notEqual(other, digestOf(PNG_BYTES))
  const first = attachmentName('screenshot.png', digestOf(PNG_BYTES))
  const second = attachmentName('screenshot.png', other)
  assert.notEqual(first, second)
  assert.equal(first.slice(9), second.slice(9))
  assert.equal(second.slice(0, 8), other.slice(0, 8))
})

test('prefixes exactly eight hash characters', () => {
  assert.equal(attachmentName('x.png', 'abcdef0123456789'), 'abcdef01-x.png')
  assert.equal(attachmentName('x.png', 'abc'), 'abc-x.png')
})

test('keeps spaces and Chinese characters readable', () => {
  assert.equal(attachmentName('我的 截图 2024-01-02 10.00.00.png', HEX), '01234567-我的 截图 2024-01-02 10.00.00.png')
})

test('preserves the source extension', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['photo.PNG', '.PNG'],
    ['扫描件.jpeg', '.jpeg'],
    ['画布.webp', '.webp'],
    ['archive.tar.gz', '.gz'],
  ]
  for (const [name, extension] of cases) {
    const result = attachmentName(name, HEX)
    assert.equal(result, `01234567-${name}`)
    assert.ok(result.endsWith(extension))
  }
})

test('replaces characters a vault path cannot hold', () => {
  assert.equal(attachmentName('a<b>c:d"e/f\\g|h?i*j.png', HEX), '01234567-a_b_c_d_e_f_g_h_i_j.png')
  assert.equal(attachmentName('report (final) [1] #2.png', HEX), '01234567-report (final) [1] #2.png')
})

test('flattens path separators and control characters', () => {
  assert.equal(attachmentName('../../images/图.png', HEX), '01234567-.._.._images_图.png')
  assert.equal(attachmentName('line\nbreak\u0000name.png', HEX), '01234567-line_break_name.png')
})

test('falls back when the source name has nothing addressable', () => {
  assert.equal(attachmentName('', HEX), '01234567-image.png')
  assert.equal(attachmentName('   ', HEX), '01234567-image.png')
})

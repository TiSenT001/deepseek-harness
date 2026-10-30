import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scanHeadings, scanTags, scanWikiLinks } from '../src/vault/syntax.ts'

test('scanWikiLinks reads plain, aliased, anchored, block, and embedded links', () => {
  const links = scanWikiLinks([
    'See [[Alpha]] and [[Beta|second]] here.',
    'Jump to [[Gamma#Detail]] or [[#Local]].',
    'Embed ![[Delta]] and ![[Delta#Part]] and block [[Epsilon#^b12]].',
  ].join('\n'))
  assert.deepEqual(links.map(link => ({
    target: link.target,
    alias: link.alias,
    anchor: link.anchor,
    block: link.block,
    embed: link.embed,
    line: link.line,
  })), [
    { target: 'Alpha', alias: undefined, anchor: undefined, block: undefined, embed: false, line: 1 },
    { target: 'Beta', alias: 'second', anchor: undefined, block: undefined, embed: false, line: 1 },
    { target: 'Gamma', alias: undefined, anchor: 'Detail', block: undefined, embed: false, line: 2 },
    { target: '', alias: undefined, anchor: 'Local', block: undefined, embed: false, line: 2 },
    { target: 'Delta', alias: undefined, anchor: undefined, block: undefined, embed: true, line: 3 },
    { target: 'Delta', alias: undefined, anchor: 'Part', block: undefined, embed: true, line: 3 },
    { target: 'Epsilon', alias: undefined, anchor: undefined, block: 'b12', embed: false, line: 3 },
  ])
})

test('scanWikiLinks skips fenced code and inline code', () => {
  const source = [
    'real [[One]]',
    '```md',
    '[[Two]]',
    '```',
    '~~~',
    '[[Three]]',
    '~~~',
    'inline `[[Four]]` stays text',
  ].join('\n')
  assert.deepEqual(scanWikiLinks(source).map(link => link.target), ['One'])
})

test('scanWikiLinks ignores malformed brackets', () => {
  assert.deepEqual(scanWikiLinks('[[unclosed and [[nested [x]]], [[]]').map(link => link.target), [])
})

test('scanTags finds inline tags and skips code', () => {
  const source = [
    'Text with #alpha and #nested/beta.',
    '`#inline` is code.',
    '```',
    '#fenced',
    '```',
    'A heading follows',
    '# Heading is not a tag',
    'End #gamma/',
  ].join('\n')
  assert.deepEqual(scanTags(source), ['alpha', 'nested/beta', 'gamma'])
})

test('scanHeadings records level, text, and line', () => {
  const source = [
    '# Title',
    '',
    'text',
    '## Section ##',
    '```',
    '# not a heading',
    '```',
    '###### Deep',
  ].join('\n')
  assert.deepEqual(scanHeadings(source), [
    { level: 1, text: 'Title', line: 1 },
    { level: 2, text: 'Section', line: 4 },
    { level: 6, text: 'Deep', line: 8 },
  ])
})

test('CRLF documents scan the same as LF documents', () => {
  const source = ['# Title', '', 'Link [[Other]] and #tag', '## Section'].join('\r\n')
  assert.deepEqual(scanHeadings(source).map(heading => heading.text), ['Title', 'Section'])
  assert.deepEqual(scanWikiLinks(source).map(link => link.target), ['Other'])
  assert.deepEqual(scanTags(source), ['tag'])
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesQuery, parseQuery, tokenize, type QueryDoc } from '../src/vault/query.ts'

const doc: QueryDoc = {
  path: 'notes/Alpha.md',
  title: 'Alpha',
  content: [
    '# Alpha',
    '',
    'meeting notes about work',
    '',
    '## Tasks',
    '',
    '- [ ] call the bank',
    '- [x] pay the bill',
    '',
    '> quoted line',
  ].join('\n'),
  tags: ['work', 'daily'],
  frontmatter: { type: 'meeting', status: 'open' },
  headings: [
    { level: 1, text: 'Alpha', line: 1 },
    { level: 2, text: 'Tasks', line: 5 },
  ],
}

const other: QueryDoc = { ...doc, path: 'notes/Beta.md', title: 'Beta', content: 'nothing relevant', tags: ['personal'] }

const run = (query: string, target: QueryDoc = doc): boolean => matchesQuery(parseQuery(query), target)

test('plain text matches title, path, content and tags', () => {
  assert.equal(run('Alpha'), true)
  assert.equal(run('notes/'), true)
  assert.equal(run('meeting'), true)
  assert.equal(run('daily'), true)
  assert.equal(run('missing'), false)
})

test('tokens: phrases, fields, parentheses and negation', () => {
  const tokens = tokenize('file:"a b" -tag:#work (x OR y)')
  assert.deepEqual(tokens.map(token => token.type), ['field', 'neg', 'field', 'lparen', 'term', 'or', 'term', 'rparen'])
})

test('bare #tag is a tag field query', () => {
  assert.deepEqual(tokenize('#work').map(token => token.type), ['field'])
  assert.equal(run('#work'), true)
  assert.equal(run('#daily'), true)
  assert.equal(run('#personal'), false)
  assert.equal(run('#personal', other), true)
  assert.equal(run('#work bank'), true)
  assert.equal(run('#work -bank'), false)
})

test('OR matches either side', () => {
  assert.equal(run('meeting OR nothing'), true)
  assert.equal(run('nothing OR missing'), false)
})

test('negation excludes matches', () => {
  assert.equal(run('meeting -bank'), false)
  assert.equal(run('meeting -personal'), true)
})

test('parentheses group terms', () => {
  // `(meeting bank)` is an implicit AND: both terms must appear.
  assert.equal(run('(meeting bank) OR nothing'), true)
  assert.equal(run('(meeting bank) OR pay'), true)
  assert.equal(run('(meeting nowhere) OR nothing'), false)
})

test('file: matches only the title', () => {
  assert.equal(run('file:Alpha'), true)
  assert.equal(run('file:meeting'), false)
})

test('path: matches only the path', () => {
  assert.equal(run('path:notes'), true)
  assert.equal(run('path:Alpha'), true)
})

test('content: searches the body', () => {
  assert.equal(run('content:bank'), true)
  assert.equal(run('content:Alpha'), true)
})

test('tag: matches a tag with or without the hash', () => {
  assert.equal(run('tag:#work'), true)
  assert.equal(run('tag:work'), true)
  assert.equal(run('tag:personal'), false)
})

test('line: requires all nested terms on one line', () => {
  assert.equal(run('line:(meeting work)'), true)
  assert.equal(run('line:(meeting bill)'), false)
})

test('block: requires the terms in one paragraph', () => {
  assert.equal(run('block:(meeting work)'), true)
})

test('section: confines terms to one heading section', () => {
  // A level-1 section includes its subsections, matching Obsidian.
  assert.equal(run('section:(Tasks call)'), true)
  assert.equal(run('section:(Alpha call)'), true)
  assert.equal(run('section:(Tasks meeting)'), true)
})

test('task: distinguishes open and done items', () => {
  assert.equal(run('task:bank'), true)
  assert.equal(run('task-todo:bank'), true)
  assert.equal(run('task-done:bank'), false)
  assert.equal(run('task-done:bill'), true)
})

test('match-case and ignore-case control sensitivity', () => {
  assert.equal(run('match-case:alpha'), false)
  assert.equal(run('match-case:Alpha'), true)
  assert.equal(run('ignore-case:ALPHA'), true)
})

test('property queries match keys and values', () => {
  assert.equal(run('[type]'), true)
  assert.equal(run('[type:meeting]'), true)
  assert.equal(run('[type:call]'), false)
})

test('plain query does not match unrelated documents', () => {
  assert.equal(run('meeting', other), false)
  assert.equal(run('content:meeting', other), false)
  assert.equal(run('tag:work', other), false)
})

test('regex queries match the body', () => {
  assert.equal(run('/meet.ng/'), true)
  assert.equal(run('/MEETING/'), true)
  assert.equal(run('/nope\\d+/'), false)
})

test('invalid regex falls back to a literal search', () => {
  assert.equal(run('/[unclosed/'), false)
})

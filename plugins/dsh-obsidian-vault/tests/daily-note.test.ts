import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_DAILY_FORMAT, dailyTarget, formatDailyName, parseDailyConfig,
} from '../src/client/ui/daily-note.ts'

test('an absent configuration keeps the note at the root with the default format', () => {
  const target = dailyTarget(undefined, new Date(2026, 9, 28))
  assert.deepEqual(target, { path: '2026-10-28.md' })
  assert.equal(DEFAULT_DAILY_FORMAT, 'YYYY-MM-DD')
})

test('the configured folder and format build a nested path', () => {
  const target = dailyTarget({ folder: 'Daily', format: 'YYYY/MM/DD' }, new Date(2026, 0, 5))
  assert.deepEqual(target, { folder: 'Daily', path: 'Daily/2026/01/05.md' })
})

test('folder and template slashes are normalised and empty values dropped', () => {
  assert.deepEqual(parseDailyConfig({ folder: '/Daily\\Notes/', format: '', template: '/Tpl.md' }), {
    folder: 'Daily/Notes',
    template: 'Tpl.md',
  })
  assert.deepEqual(parseDailyConfig({ folder: '  ', template: 42 }), {})
  assert.deepEqual(parseDailyConfig('not json'), {})
})

test('format tokens expand single and padded numbers', () => {
  const date = new Date(2026, 1, 9)
  assert.equal(formatDailyName('YYYY-MM-DD', date), '2026-02-09')
  assert.equal(formatDailyName('YY-M-D', date), '26-2-9')
  assert.equal(formatDailyName('周报-DD', date), '周报-09')
})

test('the template path travels with the daily target', () => {
  const target = dailyTarget({ folder: 'Daily', template: 'Templates/Day.md' }, new Date(2026, 11, 31))
  assert.deepEqual(target, { folder: 'Daily', path: 'Daily/2026-12-31.md', template: 'Templates/Day.md' })
})

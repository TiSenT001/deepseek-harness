import { writeFileSync } from 'node:fs'
import { buildPurFixture } from './tests/helpers/pur-fixture.ts'

/** A one pixel PNG, enough for the reader to treat the row as a picture. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const fixture = buildPurFixture({
  images: [
    { id: 0, width: 640, height: 480, bytes: PNG },
    { id: 1, width: 320, height: 240, bytes: PNG },
  ],
  items: [
    { id: 0, x: 100, y: 100, scale: 1, image: 0, name: 'loose' },
    { id: 1, x: 900, y: 500, group: true, name: '分组' },
    { id: 2, parent: 1, x: 910, y: 510, scale: 1, image: 1, name: 'inner-a' },
    { id: 3, parent: 1, x: 1010, y: 510, scale: 1, image: 1, name: 'inner-b' },
    { id: 4, x: 300, y: 900, note: '<p>组外备注</p>', noteBackgroundColor: '#80112233' },
  ],
})

writeFileSync('G:/Software/dsh-temp/group-fixture.pur', fixture)
console.log('fixture written', fixture.length, 'bytes')

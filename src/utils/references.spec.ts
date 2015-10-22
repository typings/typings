import test = require('blue-tape')
import { join } from 'path'
import * as references from './references'

test('references', t => {
  t.test('parse references from string', t => {
    const actual = references.extractReferences([
      '/// <reference path="foobar.d.ts" />',
      '',
      '///\t<reference\t path="example.d.ts"/>'
    ].join('\n'), __dirname)

    const expected = [
      {
        start: 0,
        end: 37,
        path: join(__dirname, 'foobar.d.ts')
      },
      {
        start: 38,
        end: 75,
        path: join(__dirname, 'example.d.ts')
      }
    ]

    t.deepEqual(actual, expected)
    t.end()
  })

  t.test('compile a path to reference string', t => {
    const actual = references.toReference('foobar.d.ts', __dirname)
    const expected = '/// <reference path="foobar.d.ts" />'

    t.equal(actual, expected)
    t.end()
  })
})

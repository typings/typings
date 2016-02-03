import test = require('blue-tape')
import Promise = require('any-promise')
import { EOL } from 'os'
import { join } from 'path'
import { bundle } from './bundle'
import { VERSION } from './typings'
import { PROJECT_NAME } from './utils/config'

test('bundle', t => {
  t.test('bundle everything', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/bundle')

    return bundle({
      source: FIXTURE_DIR,
      name: 'example'
    })
      .then(function (data) {
        t.equal(data.main, [
          `// Compiled using ${PROJECT_NAME}@${VERSION}`,
          `// Source: custom_typings/test.d.ts`,
          `declare module \'example~test\' {`,
          `export function test (): string;`,
          `}`,
          ``,
          `// Compiled using ${PROJECT_NAME}@${VERSION}`,
          `// Source: index.d.ts`,
          `declare module \'example/index\' {`,
          `import { test } from \'example~test\'`,
          `}`,
          `declare module \'example\' {}`
        ].join(EOL))
      })
  })
})

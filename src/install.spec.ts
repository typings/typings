import test = require('tape')
import { EOL } from 'os'
import { join, relative } from 'path'
import { install } from './install'
import { readFile } from './utils/fs'
import { VERSION } from './typings'

const pkg = require('../package.json')

test('install', t => {
  t.test('install dependencies', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/install-fixture')

    return install({
      cwd: FIXTURE_DIR,
      production: false
    })
      .then(function () {
        return Promise.all([
          readFile(join(FIXTURE_DIR, 'typings/main.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/browser.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/main/definitions/test/test.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/browser/definitions/test/test.d.ts'), 'utf8')
        ])
      })
      .then(function ([mainDts, browserDts, mainFile, browserFile]) {
        t.equal(mainDts, `/// <reference path="main/definitions/test/test.d.ts" />${EOL}`)
        t.equal(browserDts, `/// <reference path="browser/definitions/test/test.d.ts" />${EOL}`)

        t.equal(mainFile, browserFile)
        t.equal(mainFile, [
          `// Compiled using typings@${VERSION}`,
          `// Source: ${relative(FIXTURE_DIR, join(FIXTURE_DIR, 'custom_typings/test.d.ts'))}`,
          `declare module \'test\' {`,
          `  function test(): boolean`,
          ``,
          `  export default test`,
          `}`
        ].join(EOL))
      })
  })
})

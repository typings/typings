import test = require('blue-tape')
import Promise = require('native-or-bluebird')
import { EOL } from 'os'
import { join, relative } from 'path'
import { install, installDependency } from './install'
import { readFile, readConfig } from './utils/fs'
import { CONFIG_FILE } from './utils/config'
import { VERSION } from './typings'

const pkg = require('../package.json')

test('install', t => {
  t.test('install everything', t => {
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
          readFile(join(FIXTURE_DIR, 'typings/browser/definitions/test/test.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/main/ambient/test/test.d.ts'), 'utf8'),
        ])
      })
      .then(function ([mainDts, browserDts, mainFile, browserFile, ambientMainFile]) {
        t.equal(mainDts, [
          `/// <reference path="main/ambient/test/test.d.ts" />`,
          `/// <reference path="main/definitions/test/test.d.ts" />`,
          ``
        ].join(EOL))
        t.equal(browserDts, [
          `/// <reference path="browser/ambient/test/test.d.ts" />`,
          `/// <reference path="browser/definitions/test/test.d.ts" />`,
          ``
        ].join(EOL))

        t.equal(mainFile, browserFile)
        t.equal(mainFile, [
          `// Compiled using typings@${VERSION}`,
          `// Source: ${relative(FIXTURE_DIR, join(FIXTURE_DIR, 'custom_typings/definition.d.ts'))}`,
          `declare module \'test\' {`,
          `  function test(): boolean`,
          ``,
          `  export default test`,
          `}`
        ].join(EOL))

        t.equal(ambientMainFile, [
          `// Compiled using typings@${VERSION}`,
          `// Source: ${relative(FIXTURE_DIR, join(FIXTURE_DIR, 'custom_typings/ambient.d.ts'))}`,
          `declare module "x" { }`
        ].join(EOL))
      })
  })

  t.test('install dependency', t => {
    const DEPENDENCY = 'file:custom_typings/definition.d.ts'
    const AMBIENT_DEPENDENCY = 'file:custom_typings/ambient.d.ts'
    const FIXTURE_DIR = join(__dirname, '__test__/install-dependency-fixture')

    return Promise.all([
      installDependency(DEPENDENCY, {
        cwd: FIXTURE_DIR,
        saveDev: true,
        name: 'test'
      }),
      installDependency(AMBIENT_DEPENDENCY, {
        cwd: FIXTURE_DIR,
        saveDev: true,
        ambient: true,
        name: 'ambient-test'
      })
    ])
      .then(function () {
        return readConfig(join(FIXTURE_DIR, CONFIG_FILE))
      })
      .then(function (config) {
        t.deepEqual(config, {
          devDependencies: {
            test: DEPENDENCY
          },
          ambientDevDependencies: {
            'ambient-test': AMBIENT_DEPENDENCY
          }
        })
      })
  })
})

import test = require('blue-tape')
import Promise = require('any-promise')
import thenify = require('thenify')
import { unlink } from 'fs'
import { join } from 'path'
import { init } from './init'
import { CONFIG_FILE } from './utils/config'
import { readJson } from './utils/fs'

test('init', t => {
  t.test('init an empty file', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/init')
    const path = join(FIXTURE_DIR, CONFIG_FILE)

    return init({ cwd: FIXTURE_DIR })
      .then(function () {
        return readJson(path)
      })
      .then(function (config) {
        t.ok(typeof config === 'object')
      })
      .then(function () {
        return thenify(unlink)(path)
      })
  })

  t.test('upgrade from tsd', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/init-upgrade')
    const path = join(FIXTURE_DIR, CONFIG_FILE)

    return init({ cwd: FIXTURE_DIR, upgrade: true })
      .then(function () {
        return readJson(path)
      })
      .then(function (config) {
        t.deepEqual(config, {
          ambientDependencies: {
            codemirror: 'github:DefinitelyTyped/DefinitelyTyped/codemirror/codemirror.d.ts#01ce3ccf7f071514ff5057ef32a4550bf0b81dfe',
            jquery: 'github:DefinitelyTyped/DefinitelyTyped/jquery/jquery.d.ts#01ce3ccf7f071514ff5057ef32a4550bf0b81dfe',
            node: 'github:DefinitelyTyped/DefinitelyTyped/node/node.d.ts#3b2ed809b9e8f7dc4fcc1d80199129a0b73fb277'
          }
        })
      })
      .then(function () {
        return thenify(unlink)(path)
      })
  })

  t.test('guess project name', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/init-guess-name')
    const path = join(FIXTURE_DIR, CONFIG_FILE)

    return init({ cwd: FIXTURE_DIR})
      .then(function () {
        return readJson(path)
      })
      .then(function (config) {
        t.equals(config.name, 'typings-test')
      })
      .then(function () {
        return thenify(unlink)(path)
      })     
  })
})

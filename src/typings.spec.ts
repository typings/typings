import test = require('blue-tape')
import { VERSION } from './typings'

const pkg = require('../package.json')

test('typings', t => {
  t.test('version', t => {
    t.equal(VERSION, pkg.version)
    t.end()
  })
})

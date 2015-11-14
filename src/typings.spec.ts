import test = require('tape')
import { version } from './typings'

const pkg = require('../package.json')

test('typings', t => {
  t.test('version', t => {
    t.equal(version(), pkg.version)
    t.end()
  })
})

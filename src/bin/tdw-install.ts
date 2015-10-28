#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { install, installDependency } from '../tdw'
import { wrapExecution } from '../utils/cli'

require('es6-promise').polyfill()

interface Args {
  _: string[]
  save?: boolean
  saveDev?: boolean
  saveAmbient?: boolean
  name: string
  verbose: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveAmbient', 'saveDev', 'ambient', 'verbose'],
  string: ['name'],
  alias: {
    save: ['S'],
    saveAmbient: ['A', 'save-ambient'],
    saveDev: ['save-dev', 'D'],
    name: ['n'],
    ambient: ['a'],
    verbose: ['v']
  }
})

const options = extend(args, { cwd: process.cwd() })

if (!args._.length) {
  wrapExecution(install(options), options)
} else {
  wrapExecution(installDependency(args._[0], options), options)
}

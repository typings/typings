#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { uninstallDependency } from '../typings'
import { wrapExecution } from '../utils/cli'

interface Args {
  _: string[]
  save: boolean
  saveDev: boolean
  saveAmbient: boolean
  ambient: boolean
  verbose: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveAmbient', 'saveDev', 'ambient', 'verbose'],
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

if (args._.length) {
  wrapExecution(uninstallDependency(args._[0], options), options)
}

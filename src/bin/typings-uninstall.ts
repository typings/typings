#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { uninstallDependency } from '../typings'
import { loader } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'

interface Args {
  save: boolean
  saveAmbient: boolean
  saveDev: boolean
  saveAmbientDev: boolean
  ambient: boolean
  verbose: boolean
  help: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveAmbient', 'saveDev', 'saveAmbientDev', 'ambient', 'verbose', 'help'],
  alias: {
    save: ['S'],
    saveAmbient: ['A', 'save-ambient'],
    saveDev: ['D', 'save-dev'],
    saveAmbientDev: ['save-ambient-dev'],
    name: ['n'],
    ambient: ['a'],
    verbose: ['v'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} uninstall <pkg> [--ambient] [--save|--save-dev|--save-ambient|--save-ambient-dev]

Aliases: r, rm, remove, un
`)

  process.exit(0)
}

const options = extend(args, { cwd: process.cwd() })

if (args._.length) {
  loader(uninstallDependency(args._[0], options), options)
}

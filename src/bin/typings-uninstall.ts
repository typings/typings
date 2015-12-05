#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { uninstallDependency } from '../typings'
import { loader } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'

interface Args {
  save: boolean
  saveDev: boolean
  ambient: boolean
  verbose: boolean
  help: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveDev', 'ambient', 'verbose', 'help'],
  alias: {
    save: ['S'],
    saveDev: ['D', 'save-dev'],
    name: ['n'],
    ambient: ['A'],
    verbose: ['v'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} uninstall <pkg> [--save|--save-dev] [--ambient]

Aliases: r, rm, remove, un
`)

  process.exit(0)
}

const options = extend(args, { cwd: process.cwd() })

if (args._.length) {
  loader(uninstallDependency(args._[0], options), options)
}

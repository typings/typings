#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { install, installDependency } from '../typings'
import { wrapExecution } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'

interface Args {
  _: string[]
  save?: boolean
  saveDev?: boolean
  saveAmbient?: boolean
  name: string
  verbose: boolean
  help: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveAmbient', 'saveDev', 'ambient', 'verbose', 'help'],
  string: ['name'],
  alias: {
    save: ['S'],
    saveAmbient: ['A', 'save-ambient'],
    saveDev: ['save-dev', 'D'],
    name: ['n'],
    ambient: ['a'],
    verbose: ['v'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} install (with no arguments, in package directory)
${PROJECT_NAME} install <pkg>[@<version>]
${PROJECT_NAME} install file:<path>
${PROJECT_NAME} install github:<github username>/<github project>[/<path>][#<commit>]
${PROJECT_NAME} install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
${PROJECT_NAME} install <http:// url>

Aliases: i, in
Options: [--save|--save-dev|--save-ambient] [--ambient]
`)

  process.exit(0)
}

const options = extend(args, { cwd: process.cwd() })

if (!args._.length) {
  wrapExecution(install(options), options)
} else {
  wrapExecution(installDependency(args._[0], options), options)
}

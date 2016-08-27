#!/usr/bin/env node

import minimist = require('minimist')
import wordwrap = require('wordwrap')
import hasUnicode = require('has-unicode')
import { join, relative, resolve } from 'path'
import chalk = require('chalk')
import updateNotifier = require('update-notifier')
import extend = require('xtend')
import { EventEmitter } from 'events'
import { handle, logWarning, logInfo } from './support/cli'
import { Emitter } from 'typings-core'
import { aliases } from './aliases'

const pkg = require('../package.json')

interface Argv {
  help: boolean
  version: boolean
  dev: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  verbose: boolean
  production: boolean
  cwd?: string
  out?: string
  source?: string
  offset?: number
  limit?: number
  sort?: string
  unicode?: boolean
}

interface Args extends Argv {
  _: string[]
  emitter: Emitter
}

const unicodeConfig = process.env.TYPINGS_CONFIG_UNICODE || process.env.NPM_CONFIG_UNICODE

const argv = minimist<Argv>(process.argv.slice(2), {
  boolean: ['version', 'save', 'saveDev', 'savePeer', 'global', 'verbose', 'production', 'unicode'],
  string: ['cwd', 'out', 'name', 'source', 'offset', 'limit', 'sort'],
  alias: {
    global: ['G'],
    version: ['v'],
    save: ['S'],
    saveDev: ['save-dev', 'D'],
    savePeer: ['savePeer', 'P'],
    verbose: ['V'],
    out: ['o'],
    help: ['h']
  },
  default: {
    unicode: unicodeConfig ? isTrue(unicodeConfig) : hasUnicode(),
    production: process.env.NODE_ENV === 'production'
  }
})

function isTrue (value: string) {
  return value === '1' || value === 'true'
}

const cwd = argv.cwd ? resolve(argv.cwd) : process.cwd()
const emitter: Emitter = new EventEmitter()
const args: Args = extend(argv, { emitter, cwd })

// Notify the user of updates.
updateNotifier({ pkg }).notify()

// Execute with normalizations applied.
exec(args)

// Log warnings on enoent events.
emitter.on('enoent', function ({ path }) {
  logWarning(`Path "${path}" is missing`, 'enoent')
})

// Log warning when typings come packaged.
emitter.on('hastypings', function ({ name, typings }) {
  logWarning(
    `Typings for "${name}" already exist in "${relative(cwd, typings)}". You should ` +
    `let TypeScript resolve the packaged typings and uninstall the copy installed by Typings`,
    'hastypings'
  )
})

// Emit postmessage events.
emitter.on('postmessage', function ({ message, name }) {
  logInfo(`${name}: ${message}`, 'postmessage')
})

// Log bad locations.
emitter.on('badlocation', function ({ raw }) {
  logWarning(`"${raw}" is mutable and may change, consider specifying a commit hash`, 'badlocation')
})

// Log deprecated registry versions.
emitter.on('deprecated', function ({ date, raw, parent }) {
  // Only log warnings for top-level packages.
  if (parent == null || parent.raw == null) {
    logWarning(`${date.toLocaleDateString()}: "${raw}" is deprecated (updated, replaced or removed)`, 'deprecated')
  }
})

// Log prune usages.
emitter.on('prune', function ({ name, global, resolution }) {
  const suffix = chalk.gray(` (${resolution})` + (global ? ' (global)' : ''))

  logInfo(`${name}${suffix}`, 'prune')
})

/**
 * Handle the CLI commands.
 */
function exec (options: Args): any {
  if (options._.length) {
    const command = aliases[options._[0]]
    const args = options._.slice(1)

    if (command != null) {
      if (options.help) {
        return console.log(command.help())
      }

      return handle(command.exec(args, options), options)
    }
  } else if (options.version) {
    console.log(pkg.version)
    return
  }

  const wrap = wordwrap(4, 80)

  console.log(`
Usage: typings <command>

Commands:
${wrap(Object.keys(aliases).sort().join(', '))}

typings <command> -h   Get help for <command>
typings <command> -V   Enable verbose logging

typings --version      Print the CLI version

typings@${pkg.version} ${join(__dirname, '..')}
`)
}

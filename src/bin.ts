#!/usr/bin/env node

import minimist = require('minimist')
import wordwrap = require('wordwrap')
import { join, relative } from 'path'
import chalk = require('chalk')
import updateNotifier = require('update-notifier')
import extend = require('xtend')
import { EventEmitter } from 'events'
import { handle, logWarning, logInfo } from './support/cli'
import { Emitter } from 'typings-core'
import { aliases } from './aliases'

const pkg = require('../package.json')
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

interface Argv {
  help: boolean
  version: boolean
  dev: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  verbose: boolean
  cwd: string
  out: string
  production: boolean
}

interface Args extends Argv {
  _: string[]
  emitter: Emitter
}

const argv = minimist<Argv>(process.argv.slice(2), {
  boolean: ['version', 'save', 'saveDev', 'savePeer', 'ambient', 'verbose', 'dev', 'production'],
  string: ['cwd', 'out', 'name'],
  alias: {
    ambient: ['A'],
    version: ['v'],
    save: ['S'],
    saveDev: ['save-dev', 'D'],
    savePeer: ['savePeer', 'P'],
    verbose: ['V'],
    out: ['o'],
    help: ['h']
  }
})

const cwd = process.cwd()
const emitter: Emitter = new EventEmitter()
const isDev = IS_PRODUCTION ? argv.dev : !argv.production
const args: Args = extend({ cwd }, argv, { emitter, dev: isDev, production: !isDev })

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
  logWarning(`"${raw}" is a mutable location and may change, consider specifying a commit hash`, 'badlocation')
})

// Log deprecated registry versions.
emitter.on('deprecated', function ({ date, raw, parent }) {
  if (parent == null) {
    logWarning(`${date.toLocaleString()}: "${raw}" is deprecated (outdated or removed)`, 'deprecated')
  } else if (parent.raw) {
    logWarning(`${date.toLocaleString()}: "${raw}" has been deprecated (used by "${parent.raw}")`, 'deprecated')
  } else {
    logWarning(`${date.toLocaleString()}: "${raw}" has been deprecated`, 'deprecated')
  }
})

emitter.on('prune', function ({ name, ambient, browser }) {
  const suffix = chalk.gray((ambient ? ' (ambient)' : '') + (browser ? ' (browser)' : ''))

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

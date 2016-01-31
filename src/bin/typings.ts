#!/usr/bin/env node

import minimist = require('minimist')
import wordwrap = require('wordwrap')
import { spawn } from 'child_process'
import { join } from 'path'
import updateNotifier = require('update-notifier')
import { VERSION } from '../typings'
import { PROJECT_NAME, CACHE_DIR } from '../utils/config'
import insight from '../utils/insight'

const pkg = require('../../package.json')

const ALIASES: { [cmd: string]: string } = {
  // Install.
  i: 'install',
  in: 'install',
  install: 'install',
  // Remove.
  r: 'uninstall',
  rm: 'uninstall',
  remove: 'uninstall',
  uninstall: 'uninstall',
  // Init.
  init: 'init',
  // List.
  ls: 'list',
  ll: 'list',
  la: 'list',
  list: 'list',
  // Bundle.
  bundle: 'bundle',
  // Search.
  search: 'search'
}

interface Args {
  version: boolean
  cache: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['version', 'cache'],
  alias: {
    version: ['v'],
    cache: ['c']
  },
  stopEarly: true
})

// Notify the user of updates.
updateNotifier({ pkg }).notify()

// Prompt for insight tracking on the first execution.
if (insight.optOut == null) {
  insight.track('downloaded')
  insight.askPermission(null, () => handle(args))
} else {
  handle(args)
}

/**
 * Wrap CLI logic in a handler for the initial prompt.
 */
function handle (args: Args & minimist.ParsedArgs) {
  // Track the first two CLI arguments.
  insight.track.apply(insight, ['cli'].concat(
    minimist(process.argv.slice(2))._.slice(0, 2)
  ))

  if (args.version) {
    console.log(VERSION)
    process.exit(0)
  }

  if (args.cache) {
    console.log(CACHE_DIR)
    process.exit(0)
  }

  const command = ALIASES[args._[0]]

  if (typeof command === 'string') {
    const bin = join(__dirname, `typings-${command}.js`)
    const argv = [bin].concat(args._.slice(1))
    const proc = spawn(process.execPath, argv, { stdio: 'inherit' })

    proc.on('close', (code?: number) => process.exit(code))

    proc.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        console.error(`"${bin}" does not exist, try --help`)
      } else if (err.code == 'EACCES') {
        console.error(`"${bin}" is not executable, try chmod or run with root`)
      }

      process.exit(1)
    })

    return
  }

  const wrap = wordwrap(4, 80)

  console.log(`
Usage: ${PROJECT_NAME} <command>

Commands:
${wrap(Object.keys(ALIASES).sort().join(', '))}

${PROJECT_NAME} <command> -h            Get help for <command>
${PROJECT_NAME} <command> --no-insight  Disable insights for <command>

${PROJECT_NAME} --version               Print the CLI version
${PROJECT_NAME} --cache                 Print the path to the cache directory

${PROJECT_NAME}@${VERSION} ${join(__dirname, '../..')}
`)
}

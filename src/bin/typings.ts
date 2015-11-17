#!/usr/bin/env node

import minimist = require('minimist')
import wordwrap = require('wordwrap')
import { spawn } from 'child_process'
import { join } from 'path'
import updateNotifier = require('update-notifier')
import { VERSION } from '../typings'
import { PROJECT_NAME } from '../utils/config'
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
  list: 'list'
}

interface Argv {
  _: string[]
  version: boolean
}

const argv = minimist<Argv>(process.argv.slice(2), {
  boolean: ['version'],
  alias: {
    version: ['v']
  },
  stopEarly: true
})

// Notify the user of updates.
updateNotifier({ pkg }).notify()

// Prompt for insight tracking on the first execution.
if (insight.optOut == null) {
  insight.track('downloaded')
  insight.askPermission(null, function () {
    return handle(argv)
  })
} else {
  handle(argv)
}

/**
 * Wrap CLI logic in a handler for the initial prompt.
 */
function handle (argv: Argv) {
  const args = argv._

  // Track the first two CLI arguments.
  insight.track.apply(insight, ['cli'].concat(args.slice(0, 2)))

  if (argv.version) {
    console.log(VERSION)

    process.exit(0)
  }

  const command = ALIASES[args[0]]

  if (typeof command === 'string') {
    const args = argv._.slice(1)
    args.unshift(join(__dirname, `typings-${command}.js`))
    return spawn(process.execPath, args, { stdio: 'inherit' })
  }

  const wrap = wordwrap(4, 80)

  console.log(`
Usage: ${PROJECT_NAME} <command>

Commands:
${wrap(Object.keys(ALIASES).sort().join(', '))}

${PROJECT_NAME} <command> -h            Get help for <command>
${PROJECT_NAME} <command> --no-insight  Disable insights for <command>

${PROJECT_NAME}@${VERSION} ${join(__dirname, '../..')}
`)
}

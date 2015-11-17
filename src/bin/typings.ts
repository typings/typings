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

interface Args {
  version: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
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
    return handle(args)
  })
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

  const command = ALIASES[args._[0]]

  if (typeof command === 'string') {
    const argv = args._.slice(1)
    argv.unshift(join(__dirname, `typings-${command}.js`))
    return spawn(process.execPath, argv, { stdio: 'inherit' })
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

#!/usr/bin/env node

import minimist = require('minimist')
import wordwrap = require('wordwrap')
import { spawn } from 'child_process'
import { join } from 'path'
import { VERSION } from '../typings'
import { PROJECT_NAME } from '../utils/config'

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
  init: 'init'
}

const argv = minimist<{ _: string[] }>(process.argv.slice(2), {
  stopEarly: true
})

const command = ALIASES[argv._[0]]

if (command != null) {
  spawn(`typings-${command}`, argv._.slice(1), { stdio: 'inherit' })
} else {
  const wrap = wordwrap(4, 80)

  console.log(`
Usage: ${PROJECT_NAME} <command>

Commands:
${wrap(Object.keys(ALIASES).sort().join(', '))}

${PROJECT_NAME} <cmd> -h     get help for <cmd>

${PROJECT_NAME}@${VERSION} ${join(__dirname, '../..')}
`)
}

#!/usr/bin/env node

import minimist = require('minimist')
import { spawn } from 'child_process'

const VERSION = '0.0.1'

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
  // Print documentation.

  // Commands:
  // install [src] --name [name]
  // uninstall [name]
  // init
  // search [query]
  // prune
  // validate
  // convert [location] --out [directory]
}

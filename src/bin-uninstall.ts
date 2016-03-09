#!/usr/bin/env node

import Promise = require('any-promise')
import { uninstallDependency } from 'typings-core'
import { logError } from './support/cli'

export function help () {
  return `
typings uninstall <name> [--save|--save-dev|--save-peer] [--ambient]

Options:
  [--save|-S]       Remove from "dependencies"
  [--save-dev|-D]   Remove from "devDependencies"
  [--save-peer|-P]  Remove from "peerDependencies"
  [--ambient|-A]    Remove from the ambient version of dependencies
    [-SA]           Remove from "ambientDependencies"
    [-DA]           Remove from "ambientDevDependencies"

Aliases: r, rm, remove, un
`
}

export interface Options {
  cwd: string
  save: boolean
  saveDev: boolean
  savePeer: boolean
  ambient: boolean
  verbose: boolean
  help: boolean
}

export function exec (args: string[], options: Options) {
  if (args.length === 0) {
    logError(help())
    return
  }

  return Promise.all(args.map(name => {
    return uninstallDependency(name, options)
  }))
}

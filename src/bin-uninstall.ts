#!/usr/bin/env node

import Promise = require('any-promise')
import { uninstallDependency } from 'typings-core'

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

export function exec (names: string[], options: Options) {
  return Promise.all(names.map(name => {
    return uninstallDependency(name, options)
  }))
}

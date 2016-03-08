#!/usr/bin/env node

import Promise = require('any-promise')
import { uninstallDependency } from 'typings-core'

export function help () {
  console.log(`
typings uninstall <name> [--save|--save-dev|--save-peer] [--ambient]

Aliases: r, rm, remove, un
Options:
 [-S|--save]      Remove from dependency list
 [-D|--save-dev]  Remove from devDependency list
 [--save-peer]    Remove from peerDependency list
 [--ambient]      ???
 [-SA]            Remove from ambientDependency list
 [-DA]            Remove from ambientDevDependency list
`)
}

export interface Options {
  cwd: string
  save: boolean
  saveDev: boolean
  ambient: boolean
  verbose: boolean
  help: boolean
}

export function exec (names: string[], options: Options) {
  return Promise.all(names.map(name => {
    return uninstallDependency(name, options)
  }))
}

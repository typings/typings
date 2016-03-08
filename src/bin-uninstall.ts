#!/usr/bin/env node

import Promise = require('any-promise')
import { uninstallDependency } from 'typings-core'
import { loader } from './support/cli'

export function help () {
  console.log(`
typings uninstall <name> [--save|--save-dev|--save-peer] [--ambient]

Aliases: r, rm, remove, un
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
  return loader(
    Promise.all(names.map(name => {
      return uninstallDependency(name, options)
    })),
    options
  )
}

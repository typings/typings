import Promise = require('any-promise')
import { uninstallDependencies } from 'typings-core'
import { logError } from './support/cli'

export function help () {
  return `
typings uninstall <name> [--save|--save-dev|--save-peer] [--global]

Options:
  [--save|-S]       Remove from "dependencies"
  [--save-dev|-D]   Remove from "devDependencies"
  [--save-peer|-P]  Remove from "peerDependencies"
  [--global|-G]     Remove from the global version of dependencies
    [-SG]           Remove from "globalDependencies"
    [-DG]           Remove from "globalDevDependencies"

Aliases: r, rm, remove, un
`
}

export interface Options {
  cwd: string
  save: boolean
  saveDev: boolean
  savePeer: boolean
  global: boolean
  verbose: boolean
  help: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  if (args.length === 0) {
    logError(help())
    return
  }

  return uninstallDependencies(args, options)
}

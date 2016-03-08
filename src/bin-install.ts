#!/usr/bin/env node

import Promise = require('any-promise')
import { install, installDependencyRaw, Emitter } from 'typings-core'
import { loader, archifyDependencyTree } from './support/cli'

export function help () {
  console.log(`
typings install (with no arguments, in package directory)
typings install <name>=<location>
typings install [<source>!]<pkg>[@<version>]
typings install file:<path>
typings install github:<github username>/<github project>[/<path>][#<commit>]
typings install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
typings install npm:<package>
typings install bower:<package>
typings install <https?:// url>

Aliases: i, in
Options: [--name] [--save|--save-dev|--save-peer] [--ambient] [--production]
`)
}

export interface Options {
  cwd: string
  verbose: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  ambient: boolean
  emitter: Emitter
}

export function exec (args: string[], options: Options) {
  if (args.length === 0) {
    return loader(install(options), options)
      .then(({ tree }) => {
        console.log(archifyDependencyTree(tree, options))
      })
  }

  return Promise.all(args.map(arg => {
    return installDependencyRaw(arg, options)
  }))
    .then(results => {
      for (const result of results) {
        console.log(archifyDependencyTree(result.tree, options))
      }
    })
}

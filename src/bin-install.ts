#!/usr/bin/env node

import Promise = require('any-promise')
import { install, installDependencyRaw, Emitter } from 'typings-core'
import { archifyDependencyTree, logInfo } from './support/cli'

export function help () {
  console.log(`
typings install (with no arguments, in package directory)
typings install [<name>=]<location>

  <name>      Module name of the installed definition
  <location>  The location to read from (described below)

typings install [<source>!]<pkg>[@<version>][#<tag>]
typings install file:<path>
typings install github:<org>/<repo>[/<path>][#<commitish>]
typings install bitbucket:<org>/<repo>[/<path>][#<commitish>]
typings install npm:<pkg>[/<path>]
typings install bower:<pkg>[/<path>]
typings install http(s)://<domain>/<path>

  <source>    The registry mirror (E.g. "npm", "bower", "env", "global", "dt", ...)
  <path>      Path to a \`.d.ts\` file or \`typings.json\`

Options:
  [--save|-S]       Persist to "dependencies"
  [--save-dev|-D]   Persist to "devDependencies"
  [--save-peer|-P]  Persist to "peerDependencies"
  [--ambient|-A]    Install and persist as an ambient definition
    [-SA]           Persist to "ambientDependencies"
    [-DA]           Persist to "ambientDevDependencies"
  [--production]    Install only production dependencies (omits dev dependencies)

Aliases: i, in
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

export function exec (args: string[], options: Options): Promise<void> {
  const { emitter } = options

  if (args.length === 0) {
    return install(options)
      .then(({ tree }) => {
        console.log(archifyDependencyTree(tree, options))
      })
  }

  // Keep track of emitted references.
  const references: string[] = []

  // Log messages on stripped references.
  emitter.on('reference', function ({ reference, name }) {
    if (references.indexOf(reference) === -1) {
      logInfo(`Stripped reference "${reference}" during installation of "${name}"`, 'reference')

      references.push(reference)
    }
  })

  return Promise.all(args.map(arg => {
    return installDependencyRaw(arg, options)
  }))
    .then(results => {
      for (const result of results) {
        console.log(archifyDependencyTree(result.tree, options))
      }
    })
}

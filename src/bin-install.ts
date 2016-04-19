#!/usr/bin/env node

import Promise = require('any-promise')
import { install, installDependenciesRaw, Emitter } from 'typings-core'
import listify = require('listify')
import { archifyDependencyTree, logInfo } from './support/cli'

export function help () {
  return `
typings install (with no arguments, in package directory)
typings install [<name>=]<location>

  <name>      Module name of the installed definition
  <location>  The location to read from (described below)

Valid Locations:
  [<source>!]<pkg>[@<version>][#<tag>]
  file:<path>
  github:<org>/<repo>[/<path>][#<commitish>]
  bitbucket:<org>/<repo>[/<path>][#<commitish>]
  npm:<pkg>[/<path>]
  bower:<pkg>[/<path>]
  http(s)://<host>/<path>

  <source>    The registry mirror: "npm", "bower", "env", "global", "lib" or "dt"
              When not specified, \`defaultSource\` or \`defaultAmbientSource\` in
              \`.typingsrc\` will be used.
  <path>      Path to a \`.d.ts\` file or \`typings.json\`
  <host>      A domain name (with optional port)
  <version>   A semver range (E.g. ">=4.0")
  <tag>       The specific tag of a registry entry
  <commitish> A git commit, tag or branch

Options:
  [--save|-S]       Persist to "dependencies"
  [--save-dev|-D]   Persist to "devDependencies"
  [--save-peer|-P]  Persist to "peerDependencies"
  [--ambient|-A]    Install and persist as an ambient definition
    [-SA]           Persist to "ambientDependencies"
    [-DA]           Persist to "ambientDevDependencies"
  [--production]    Install only production dependencies (omits dev dependencies)

Aliases: i, in
`
}

export interface Options {
  cwd: string
  verbose: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  ambient: boolean
  emitter: Emitter
  production: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  const { emitter } = options

  if (args.length === 0) {
    return install(options)
      .then((result) => {
        console.log(archifyDependencyTree(result))
      })
  }

  // Keep track of emitted references.
  const references: string[] = []

  // Log messages on stripped references.
  emitter.on('reference', function ({ reference, name }) {
    if (references.indexOf(reference) === -1) {
      logInfo(`Stripped reference "${reference}" during installation from "${name}"`, 'reference')

      references.push(reference)
    }
  })

  // Log ambient dependencies list.
  emitter.on('ambientdependencies', function ({ name, dependencies }) {
    const deps = Object.keys(dependencies).map(x => JSON.stringify(x))

    if (deps.length) {
      logInfo(
        `"${name}" lists ambient dependencies on ${listify(deps)} and should be installed`,
        'ambientdependencies'
      )
    }
  })

  return installDependenciesRaw(args, options)
    .then(results => {
      for (const result of results) {
        console.log(archifyDependencyTree(result))
      }
    })
}

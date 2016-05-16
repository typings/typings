#!/usr/bin/env node

import Promise = require('any-promise')
import { install, installDependenciesRaw, Emitter } from 'typings-core'
import { archifyDependencyTree } from './support/cli'

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
              When not specified, \`defaultSource\` in \`.typingsrc\` will be used.
  <path>      Path to a \`.d.ts\` file or \`typings.json\`
  <host>      A domain name (with optional port)
  <version>   A semver range (E.g. ">=4.0")
  <tag>       The specific tag of a registry entry
  <commitish> A git commit, tag or branch

Options:
  [--save|-S]       Persist to "dependencies"
  [--save-dev|-D]   Persist to "devDependencies"
  [--save-peer|-P]  Persist to "peerDependencies"
  [--global|-G]     Install and persist as an global definition
    [-SG]           Persist to "globalDependencies"
    [-DG]           Persist to "globalDevDependencies"
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
  global: boolean
  emitter: Emitter
  production: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  if (args.length === 0) {
    return install(options)
      .then((result) => {
        console.log(archifyDependencyTree(result))
      })
  }

  return installDependenciesRaw(args, options)
    .then(results => {
      for (const result of results) {
        console.log(archifyDependencyTree(result))
      }
    })
}

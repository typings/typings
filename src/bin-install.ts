import Promise = require('any-promise')
import listify = require('listify')
import { install, installDependenciesRaw, Emitter } from 'typings-core'
import { archifyDependencyTree, logInfo, logError } from './support/cli'

export function help () {
  return `
typings install (with no arguments, in package directory)
typings install [<name>=]<location>

  <name>      Alternate name of the definition
  <location>  The location to read from (described below)

Valid Locations:
  [<source>~]<pkg>[@<version>][#<tag>]
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
  [--global|-G]     Install and persist as a global definition
    [-SG]           Persist to "globalDependencies"
    [-DG]           Persist to "globalDevDependencies"
  [--production]    Install only production dependencies (omits dev dependencies)

Aliases: i, in
`
}

export interface Options {
  verbose: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  global: boolean
  unicode: boolean
  emitter: Emitter
  production: boolean
  cwd: string
  name?: string
  source?: string
  /**
   * Deprecated
   */
  ambient: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  const { emitter, unicode } = options

  if (typeof options.ambient !== 'undefined') {
    logError('The "ambient" flag is deprecated. Please use "global" instead', 'deprecated')
    return
  }

  if (args.length === 0) {
    return install(options)
      .then((result) => {
        const { name, tree } = result

        console.log(archifyDependencyTree({ name, tree, unicode }))
      })
  }

  // Log messages on stripped references.
  emitter.on('reference', function ({ reference, resolution, name }) {
    logInfo(`Stripped reference "${reference}" during installation from "${name}" (${resolution})`, 'reference')
  })

  // Log global dependencies list.
  emitter.on('globaldependencies', function ({ name, dependencies }) {
    const deps = Object.keys(dependencies).map(x => JSON.stringify(x))

    if (deps.length) {
      logInfo(
        `"${name}" lists global dependencies on ${listify(deps)} that must be installed manually`,
        'globaldependencies'
      )
    }
  })

  return installDependenciesRaw(args, options)
    .then(results => {
      for (const result of results) {
        const { name, tree } = result

        console.log(archifyDependencyTree({ name, tree, unicode }))
      }
    })
}

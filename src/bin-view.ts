import Promise = require('any-promise')
import columnify = require('columnify')
import { viewEntry, viewVersions } from 'typings-core'
import { logError } from './support/cli'

export function help () {
  return `
typings view <pkg>

  <pkg>  A registry expression like \`[<source>~]<pkg>\`

Options:
  [--versions]  List all package versions

Aliases: info
`
}

export interface Options {
  versions: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  if (args.length === 0) {
    logError(help())
    return
  }

  if (options.versions) {
    return viewVersions(args[0], options)
      .then(versions => console.log(columnify(versions)))
  }

  return viewEntry(args[0], options)
    .then(entry => console.log(columnify(entry)))
}

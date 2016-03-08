import Promise = require('any-promise')
import columnify = require('columnify')
import { viewEntry, viewVersions } from 'typings-core'

export function help () {
  return `
typings view <pkg>

  <pkg>  A registry expression like \`[<source>!]<pkg>\`

Options:
  [--versions]    List all package versions
  [--ambient|-A]  View \`<pkg>\` from the default ambient source

Aliases: info
`
}

export interface Options {
  ambient: boolean
  versions: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  if (options.versions) {
    return viewVersions(args[0], options)
      .then(versions => console.log(columnify(versions)))
  }

  return viewEntry(args[0], options)
    .then(entry => console.log(columnify(entry)))
}

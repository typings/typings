import Promise = require('any-promise')
import { archifyDependencyTree, spinner } from './support/cli'
import { list } from 'typings-core'

export function help () {
  return `
typings list

Options:
  [--production] List only production dependencies (omit dev dependencies)

Aliases: la, ll, ls
`
}

export interface Options {
  cwd: string
  production: boolean
  verbose: boolean
  unicode: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return spinner(list(options))
    .then(function (tree) {
      console.log(archifyDependencyTree({ tree, unicode: options.unicode }))
    })
}

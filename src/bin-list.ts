import Promise = require('any-promise')
import { archifyDependencyTree } from './support/cli'
import { list } from 'typings-core'

export function help () {
  return `
typings list

Print the typings dependency tree for the current project.

Options:
  [--production] List only production dependencies (omit dev dependencies)

Aliases: la, ll, ls
`
}

export interface Options {
  cwd: string
  production: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return list(options)
    .then(function (tree) {
      console.log(archifyDependencyTree({ tree }))
    })
}

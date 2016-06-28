import Promise = require('any-promise')
import { prune } from 'typings-core'

export function help () {
  return `
typings prune

Options:
  [--production] Also prune non-production dependencies
`
}

export interface Options {
  cwd: string
  production: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return prune(options)
}

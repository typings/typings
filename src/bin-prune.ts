import { prune } from 'typings-core'
import { spinner } from './support/cli'

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
  return spinner(prune(options))
}

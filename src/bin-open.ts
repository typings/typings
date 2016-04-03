import { open } from 'typings-core'
import { logError } from './support/cli'

export function help () {
  return `
typings open <location>

  <location>  A known Typings location with scheme (see typings install -h)
`
}

export function exec (args: string[]) {
  if (args.length === 0) {
    logError(help())
    return
  }

  console.log(open(args[0]))
}

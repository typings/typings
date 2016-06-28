import Promise = require('any-promise')
import { init } from 'typings-core'

export function help () {
  return `
typings init

Options:
  [--upgrade]    Upgrade \`tsd.json\` to \`typings.json\`
`
}

export interface Options {
  verbose: boolean
  cwd: string
  upgrade: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  const { cwd, upgrade } = options

  return init({ cwd, upgrade })
}

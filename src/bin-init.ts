import Promise = require('any-promise')
import { init } from 'typings-core'

export function help () {
  return `
typings init

Initialize a new typings.json file. If you're currently using TSD, you can use \`--upgrade\` to convert \`tsd.json\` to \`typings.json\`.

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

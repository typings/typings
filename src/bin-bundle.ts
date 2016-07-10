import Promise = require('any-promise')
import { bundle } from 'typings-core'

export function help () {
  return `
typings bundle --out <filepath>

Bundle the current project types into an single global module.

Options:
  [--out|-o] <filepath>  The bundled output file path
  [--global|-G]          Bundle as an global definition
`
}

export interface Options {
  cwd: string
  name: string
  out: string
  global: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<any> {
  return bundle(options)
}

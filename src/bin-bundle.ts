import { bundle } from 'typings-core'
import { spinner } from './support/cli'

export function help () {
  return `
typings bundle --out <filepath>

Options:
  [--out|-o] <filepath>  The bundled output file path
  [--global|-G]          Bundle as a global definition
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
  return spinner(bundle(options))
}

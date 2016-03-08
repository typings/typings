#!/usr/bin/env node

import Promise = require('any-promise')
import { bundle } from 'typings-core'

export function help () {
  return `
typings bundle --out <directory>

Options:
  [--out|-o] <directory> The bundled output directory
  [--name] <name>        Bundle module name
  [--ambient|-A]         Bundle as an ambient definition
`
}

export interface Options {
  cwd: string
  name: string
  out: string
  ambient: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<any> {
  return bundle(options)
}

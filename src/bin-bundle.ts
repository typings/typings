#!/usr/bin/env node

import Promise = require('any-promise')
import { bundle } from 'typings-core'

export function help () {
  return `
typings bundle --out <directory>

Options:
  [--out|-o] <directory> The bundled output directory
  [--name] <name>        Bundle module name
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

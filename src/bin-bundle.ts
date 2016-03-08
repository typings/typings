#!/usr/bin/env node

import Promise = require('any-promise')
import { bundle } from 'typings-core'

export function help () {
  console.log(`
typings bundle -o|--out <directory>

Options:
  [--name] <module name> Target module name
  [-A|--ambient]            Bundle as ambient module
`)
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

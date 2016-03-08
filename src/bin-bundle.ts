#!/usr/bin/env node

import Promise = require('any-promise')
import { loader } from './support/cli'
import { bundle } from 'typings-core'

export function help () {
  console.log(`
typings bundle --name [string]

Options: [--out] [--ambient]
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
  return loader(bundle(options), options)
}

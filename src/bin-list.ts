#!/usr/bin/env node

import Promise = require('any-promise')
import { archifyDependencyTree } from './support/cli'
import { list } from 'typings-core'

export function help () {
  console.log(`
typings ls [--ambient] [--production]

Aliases: la, ll, list
Options:
  [-A|--ambient]  Search for ambient module
                  Also search in DefinitelyTyped
  [--production]
`)
}

export interface Options {
  cwd: string
  dev: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return list(options)
    .then(function (tree) {
      console.log(archifyDependencyTree(tree))
    })
}

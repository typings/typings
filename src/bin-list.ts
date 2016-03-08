#!/usr/bin/env node

import Promise = require('any-promise')
import { loader, archifyDependencyTree } from './support/cli'
import { list } from 'typings-core'

// TODO: Enable `list` command in core.

export function help () {
  console.log(`
typings ls [--ambient] [--production]

Aliases: la, ll, list
`)
}

export interface Options {
  cwd: string
  dev: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return loader(list(options), options)
    .then(function (tree) {
      console.log(archifyDependencyTree(tree))
    })
}

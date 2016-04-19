#!/usr/bin/env node

import Promise = require('any-promise')
import { prune } from 'typings-core'

export function help () {
  return `
typings list

Options:
  [--production] List only production dependencies (omit dev dependencies)

Aliases: la, ll, ls
`
}

export interface Options {
  cwd: string
  production: boolean
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  return prune(options)
}

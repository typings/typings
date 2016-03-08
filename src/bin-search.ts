#!/usr/bin/env node

import Promise = require('any-promise')
import columnify = require('columnify')
import { search } from 'typings-core'

export function help () {
  console.log(`
typings search [query]

Options:
 [--ambient]         Search for ambient module
                     Also search in DefinitelyTyped
 [--name] <name>     ???
 [--source] <source> Search from: npm|dt|global
 [--offset] <x>      Skip first x results
 [--limit] <x>       Limit to x results
`)
}

export interface Options {
  name: string
  source: string
  offset: string
  limit: string
  ambient: boolean
  order: string
  sort: string
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  const query = args[0]
  const { ambient, source, offset, limit, order, sort } = options

  return search({ ambient, source, query, offset, limit, order, sort })
    .then(function ({ results, total }) {
      if (total === 0) {
        console.log('No results found for search')
        return
      }

      console.log(`Viewing ${results.length} of ${total}`)
      console.log('')
      console.log(columnify(results))
    })
}

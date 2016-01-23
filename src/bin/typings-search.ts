#!/usr/bin/env node

import minimist = require('minimist')
import columnify = require('columnify')
import { search } from '../typings'
import { loader } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'

interface Args {
  name: string
  source: string
  offset: string
  limit: string
  verbose: boolean
  help: boolean
  ambient: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['verbose', 'help', 'ambient'],
  string: ['name', 'source'],
  alias: {
    name: ['n'],
    source: ['s'],
    offset: ['o'],
    limit: ['l'],
    verbose: ['v'],
    help: ['h'],
    ambient: ['A']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} search [query] [--ambient]

Options: [--name] [--source] [--offset] [--limit]
`)

  process.exit(0)
}

const { verbose, name, source, limit, offset, ambient } = args

loader(search(args._[0], { name, source, limit, offset, ambient }), { verbose })
  .then(function (result) {
    const { results, total } = result

    if (total === 0) {
      console.log(`No results found searching ${ambient ? 'ambient' : 'module'} definitions`)
      return
    }

    if (results.length === total) {
      console.log(`Showing ${total} results...`)
    } else {
      console.log(`Showing ${results.length} of ${total} results...`)
    }

    console.log()
    console.log(columnify(results))
  })

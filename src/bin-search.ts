import Promise = require('any-promise')
import columnify = require('columnify')
import { search } from 'typings-core'

export function help () {
  return `
typings search [query]

Options:
  [--name] <name>     Search for definitions by exact name (E.g. only "react")
  [--source] <source> The registry mirror (E.g. "npm", "bower", "env", "global", "dt", ...)
  [--offset] <x>      Skip first "x" results (default: 0)
  [--limit] <x>       Limit to "x" results (default: 20, max: 100)
  [--order] <order>   Direction to sort results (default: "asc", enum: "asc" or "desc")
  [--sort] <column>   Order results by a column (E.g. "versions", "name", ...)
`
}

export interface Options {
  name: string
  source: string
  offset: string
  limit: string
  order: string
  sort: string
  verbose: boolean
}

export function exec (args: string[], options: Options): Promise<void> {
  const query = args[0]
  const { name, source, offset, limit, order, sort } = options

  return search({ name, source, query, offset, limit, order, sort })
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

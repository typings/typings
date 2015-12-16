import extend = require('xtend')
import { search as searchRegistry, SearchResults } from './lib/registry'

export interface Options {
  name?: string
  source?: string
  offset?: number | string
  limit?: number | string
}

/**
 * Search the registry for typings.
 */
export function search (query: string, options: Options = {}) {
  return searchRegistry(extend(options, { query }))
}

import extend = require('xtend')
import Promise = require('any-promise')
import { search as searchRegistry, SearchResults } from './lib/registry'

export interface Options {
  name?: string
  source?: string
  offset?: number | string
  limit?: number | string
  ambient?: boolean
}

/**
 * Search the registry for typings.
 */
export function search (query: string, options: Options = {}) {
  return searchRegistry(extend(options, { query }))
}

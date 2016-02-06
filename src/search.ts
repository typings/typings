import extend = require('xtend')
import Promise = require('any-promise')
import { search as searchRegistry, SearchResults } from './lib/registry'

export interface SearchOptions {
  name?: string
  source?: string
  offset?: number | string
  limit?: number | string
  ambient?: boolean
}

/**
 * Search the registry for typings.
 */
export function search (query: string, options: SearchOptions = {}) {
  return searchRegistry(extend(options, { query }))
}

import invariant = require('invariant')
import Promise = require('any-promise')
import { stringify } from 'querystring'
import pick = require('object.pick')
import { readJsonFrom } from '../utils/fs'

/**
 * The registry base URL.
 */
const REGISTRY_URL = 'https://api.typings.org'

/**
 * Valid sources in the registry.
 */
export const VALID_SOURCES: { [source: string]: string } = {
  dt: 'DefinitelyTyped',
  npm: 'NPM',
  github: 'GitHub',
  bower: 'Bower',
  common: 'Common',
  shared: 'Shared',
  lib: 'Library',
  env: 'Environment',
  global: 'Global'
}

/**
 * Query parameters used for searching.
 */
export interface SearchOptions {
  query?: string
  name?: string
  source?: string
  offset?: string
  limit?: string
  ambient?: boolean
}

/**
 * API search query response.
 */
export interface SearchResults {
  total: number
  results: Array<{ name: string; source: string; homepage: string; description: string; }>
}

/**
 * Search the typings registry.
 */
export function search (options: SearchOptions): Promise<SearchResults> {
  if (options.source && !isValidSource(options.source)) {
    return Promise.reject(new TypeError(`Invalid registry source: ${options.source}`))
  }

  const query = pick(options, ['query', 'name', 'source', 'offset', 'limit', 'ambient'])

  return readJsonFrom(`${REGISTRY_URL}/search?${stringify(query)}`)
}

/**
 * A project version from the registry.
 */
export interface ProjectVersion {
  version: string
  description: string
  compiler: string
  location: string
}

/**
 * Get matching project versions.
 */
export function getVersions (source: string, name: string, version?: string): Promise<{ versions: ProjectVersion[] }> {
  if (!isValidSource(source)) {
    return Promise.reject(new TypeError(`Invalid registry source: ${source}`))
  }

  const sourceParam = encodeURIComponent(source)
  const nameParam = encodeURIComponent(name)

  if (version == null) {
    return readJsonFrom(`${REGISTRY_URL}/versions/${sourceParam}/${nameParam}`)
  }

  return readJsonFrom(`${REGISTRY_URL}/versions/${sourceParam}/${nameParam}/${encodeURIComponent(version)}`)
}

/**
 * Check if a dependency looks like a registry reference.
 */
export function isRegistryPath (path: string) {
  return path.indexOf(':') === -1
}

/**
 * Parse the dependency into parts.
 */
export function parseRegistryPath (dep: string) {
  const [name, version] = dep.split('@')

  return { name, version }
}

/**
 * Source validity check.
 */
function isValidSource (source: string): boolean {
  return VALID_SOURCES.hasOwnProperty(source)
}

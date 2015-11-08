import invariant = require('invariant')
import semver = require('semver')
import arrify = require('arrify')
import { readJsonFrom } from '../utils/fs'
import { normalizeSlashes } from '../utils/path'

/**
 * Valid sources in the registry.
 */
export const VALID_SOURCES = [
  'npm',
  'github',
  'bower',
  'ambient',
  'common'
]

/**
 * Registry installation options.
 */
export interface ReadOptions {
  name: string
  source: string
  version: string
}

/**
 * The registry JSON format.
 */
export interface RegistryJson {
  version: {
    [version: string]: string | string[]
  }
}

/**
 * Read a dependency from the registry.
 */
export function read (options: ReadOptions) {
  const { source, name } = options
  const path = `${normalizeSlashes(name)}.json`
  const url = `https://raw.githubusercontent.com/typings/registry/master/${source}/${path}`

  invariant(
    VALID_SOURCES.indexOf(source) > -1,
    `Source should be one of: ${VALID_SOURCES.join(', ')}`
  )

  return readJsonFrom(url)
    .then(
      function (entry: RegistryJson) {
        return select(entry, options)
      },
      function (error: any) {
        if (error.type === 'EINVALIDSTATUS') {
          return Promise.reject(new TypeError(
            `Unable to find "${name}" from "${source}" in the registry. ` +
            `If you can contribute this typing, please help us out - https://github.com/typings/registry`
          ))
        }

        return Promise.reject(error)
      }
    )
}

/**
 * Select a version from the registry entry.
 */
export function select (entry: RegistryJson, options: ReadOptions) {
  const { version, name } = options
  const versions = Object.keys(entry.version).sort(semver.compare)

  if (version == null) {
    return arrify(entry.version[versions.pop()])
  }

  let match: string

  for (const value of versions) {
    if (semver.satisfies(value, version)) {
      match = value
    }
  }

  if (match == null) {
    throw new TypeError(`Unable to find "${name}@${version}". Available: ${versions.join(', ')}`)
  }

  return arrify(entry.version[match])
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

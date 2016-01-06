import invariant = require('invariant')
import { parse, format, resolve as resolveUrl } from 'url'
import { normalize, join, basename, dirname } from 'path'
import { Dependency } from '../interfaces/main'
import { CONFIG_FILE } from './config'
import { isDefinition, normalizeSlashes, inferDefinitionName, sanitizeDefinitionName } from './path'

/**
 * Parse the git host options from the raw string.
 */
function gitFromPath (src: string) {
  const index = src.indexOf('#')
  const sha = index === -1 ? 'master' : src.substr(index + 1)
  const segments = index === -1 ? src.split('/') : src.substr(0, index).split('/')
  const org = segments.shift()
  const repo = segments.shift()
  let path = segments.join('/')

  // Automatically look for the config file in the root.
  if (segments.length === 0) {
    path = CONFIG_FILE
  } else if (!isDefinition(path) && segments[segments.length - 1] !== CONFIG_FILE) {
    path += `/${CONFIG_FILE}`
  }

  return { org, repo, path, sha }
}

/**
 * Split the protocol from the rest of the string.
 */
function splitProtocol (raw: string): [string, string] {
  const index = raw.indexOf(':')

  if (index === -1) {
    return [undefined, raw]
  }

  return [raw.substr(0, index), normalizeSlashes(raw.substr(index + 1))]
}

/**
 * Parse the dependency string.
 */
export function parseDependency (raw: string): Dependency {
  const [type, src] = splitProtocol(raw)

  if (type === 'file') {
    const location = normalize(src)
    const filename = basename(location)

    invariant(
      filename === CONFIG_FILE || isDefinition(filename),
      `Only ".d.ts" and "${CONFIG_FILE}" files are supported`
    )

    return {
      raw,
      type,
      location
    }
  }

  if (type === 'github') {
    const meta = gitFromPath(src)
    const { org, repo, path, sha } = meta

    return {
      raw,
      meta,
      type,
      location: `https://raw.githubusercontent.com/${org}/${repo}/${sha}/${path}`
    }
  }

  if (type === 'bitbucket') {
    const meta = gitFromPath(src)
    const { org, repo, path, sha } = meta

    return {
      raw,
      meta,
      type,
      location: `https://bitbucket.org/${org}/${repo}/raw/${sha}/${path}`
    }
  }

  if (type === 'npm') {
    const parts = src.split('/')
    const isScoped = parts.length > 0 && parts[0].charAt(0) === '@'
    const hasPath = isScoped ? parts.length > 2 : parts.length > 1

    if (!hasPath) {
      parts.push('package.json')
    }

    return {
      raw,
      type: 'npm',
      meta: {
        name: isScoped ? parts.slice(0, 2).join('/') : parts[0],
        path: join(...parts.slice(isScoped ? 2 : 1))
      },
      location: join(...parts)
    }
  }

  if (type === 'bower') {
    const parts = src.split('/')

    if (parts.length === 1) {
      parts.push('bower.json')
    }

    return {
      raw,
      type: 'bower',
      meta: {
        name: parts[0],
        path: join(...parts.slice(1))
      },
      location: join(...parts)
    }
  }

  if (type === 'http' || type === 'https') {
    return {
      raw,
      type,
      location: raw
    }
  }

  throw new TypeError(`Unknown dependency: ${raw}`)
}

/**
 * Resolve a path relative to the raw string.
 */
export function resolveDependency (raw: string, path: string) {
  const { type, meta, location } = parseDependency(raw)

  // Handle git hosts.
  if (type === 'github' || type === 'bitbucket') {
    const { org, repo, sha } = meta
    const resolvedPath = normalizeSlashes(join(dirname(meta.path), path))

    return `${type}:${org}/${repo}/${resolvedPath}${sha === 'master' ? '' : '#' + sha}`
  }

  if (type === 'npm' || type === 'bower') {
    const resolvedPath = normalizeSlashes(join(dirname(meta.path), path))

    return `${type}:${meta.name}/${resolvedPath}`
  }

  if (type === 'http' || type === 'https') {
    return resolveUrl(location, path)
  }

  if (type === 'file') {
    return `file:${normalizeSlashes(join(location, path))}`
  }

  throw new TypeError(`Unable to resolve dependency from unknown scheme`)
}

/**
 * Infer a dependency name from the installation location.
 */
export function inferDependencyName (raw: string) {
  const { type, meta, location } = parseDependency(raw)

  if (type === 'npm' || type === 'bower') {
    return meta.name
  }

  if (type === 'http' || type === 'https' || type === 'file') {
    return inferDefinitionName(location)
  }

  if (type === 'github' || type === 'bitbucket') {
    const { org, repo, path } = meta

    if (isDefinition(path)) {
      return inferDefinitionName(path)
    }

    return sanitizeDefinitionName(repo)
  }

  throw new TypeError(`Unable to infer dependency name from unknown scheme`)
}

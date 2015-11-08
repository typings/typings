import invariant = require('invariant')
import { parse, format } from 'url'
import { normalize, basename } from 'path'
import { Dependency } from '../interfaces/main'
import { CONFIG_FILE } from './config'
import { isDefinition } from './path'

/**
 * Find the Git options from a path.
 */
function gitFromPathname (pathname: string) {
  const segments = pathname.substr(1).split('/')
  const repo = segments.shift()
  let path = segments.join('/')

  if (segments.length === 0) {
    path = CONFIG_FILE
  } else if (!isDefinition(path) && segments[segments.length - 1] !== CONFIG_FILE) {
    path += `/${CONFIG_FILE}`
  }

  return { repo, path }
}

/**
 * Extract the sha or default to `master`.
 */
function shaFromHash (hash: string): string {
  return hash ? hash.substr(1) : 'master'
}

/**
 * Parse the dependency string.
 */
export function parseDependency (raw: string): Dependency {
  const parsedurl = parse(raw)
  const { protocol, auth, hostname, pathname, hash } = parsedurl

  if (protocol === 'file:') {
    const location = normalize(pathname)
    const filename = basename(location)

    invariant(
      filename === CONFIG_FILE || isDefinition(filename),
      `Only ".d.ts" files and "${CONFIG_FILE}" are supported`
    )

    return {
      raw,
      type: 'file',
      location
    }
  }

  if (protocol === 'github:') {
    const sha = shaFromHash(hash)
    const { repo, path } = gitFromPathname(pathname)

    return {
      raw,
      type: 'hosted',
      location: `https://raw.githubusercontent.com/${hostname}/${repo}/${sha}/${path}`
    }
  }

  if (protocol === 'bitbucket:') {
    const sha = shaFromHash(hash)
    const { repo, path } = gitFromPathname(pathname)

    return {
      raw,
      type: 'hosted',
      location: `https://bitbucket.org/${hostname}/${repo}/raw/${sha}/${path}`
    }
  }

  if (protocol === 'npm:') {
    const scoped = auth === ''
    const parts = pathname ? pathname.substr(1).split('/') : []
    let name = hostname

    // Handle scoped packages.
    if (scoped) {
      name = `@${hostname}/${parts.shift()}`
    }

    return {
      raw,
      type: 'npm',
      location: normalize(name + '/' + (parts.length ? parts.join('/') : 'package.json'))
    }
  }

  if (protocol === 'bower:') {
    return {
      raw,
      type: 'bower',
      location: normalize(hostname + (pathname || '/bower.json'))
    }
  }

  if (protocol === 'http:' || protocol === 'https:') {
    return {
      raw,
      type: 'hosted',
      location: format(parsedurl)
    }
  }

  throw new TypeError(`Unsupported dependency: ${raw}`)
}

import extend = require('xtend')
import invariant = require('invariant')
import zipObject = require('zip-object')
import Promise = require('any-promise')
import { resolve, dirname, join } from 'path'
import { resolve as resolveUrl } from 'url'
import { readJson, readConfigFrom } from '../utils/fs'
import { parseDependency } from '../utils/parse'
import { findUp, findConfigFile } from '../utils/find'
import { isDefinition, isHttp } from '../utils/path'
import { CONFIG_FILE, PROJECT_NAME } from '../utils/config'
import { Dependency, DependencyBranch, DependencyTree } from '../interfaces/main'
import TypingsError from './error'

/**
 * Default dependency config options.
 */
const DEFAULT_DEPENDENCY: DependencyTree = {
  src: undefined,
  raw: undefined,
  dependencies: {},
  devDependencies: {},
  ambientDependencies: {},
  ambientDevDependencies: {}
}

/**
 * Options for resolving dependencies.
 */
export interface Options {
  cwd: string
  dev?: boolean
  ambient?: boolean
}

/**
 * Resolve all dependencies at the current path.
 */
export function resolveAllDependencies (options: Options): Promise<DependencyTree> {
  return Promise.all([
    resolveBowerDependencies(options).catch(() => extend(DEFAULT_DEPENDENCY)),
    resolveNpmDependencies(options).catch(() => extend(DEFAULT_DEPENDENCY)),
    resolveTypeDependencies(options).catch(() => extend(DEFAULT_DEPENDENCY))
  ])
    .then(mergeDependencies)
}

/**
 * Resolve a single dependency object.
 */
export function resolveDependency (dependency: Dependency, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
  if (dependency.type === 'npm') {
    return resolveNpmDependency(dependency.location, dependency.raw, options, parent)
  }

  if (dependency.type === 'bower') {
    return resolveBowerDependency(dependency.location, dependency.raw, options, parent)
  }

  return resolveFileDependency(dependency.location, dependency.raw, options, parent)
}

/**
 * Resolve a dependency in NPM.
 */
function resolveNpmDependency (name: string, raw: string, options: Options, parent?: DependencyTree) {
  return findUp(options.cwd, join('node_modules', name))
    .then(
      function (modulePath: string) {
        if (isDefinition(modulePath)) {
          return resolveFileDependency(modulePath, raw, options, parent)
        }

        return resolveNpmDependencyFrom(modulePath, raw, options, parent)
      },
      function (error) {
        return Promise.reject(resolveError(raw, error, parent))
      }
    )
}

/**
 * Resolve a dependency in Bower.
 */
function resolveBowerDependency (name: string, raw: string, options: Options, parent?: DependencyTree) {
  return resolveBowerComponentPath(options.cwd)
    .then(
      function (componentPath: string) {
        const modulePath = resolve(componentPath, name)

        if (isDefinition(modulePath)) {
          return resolveFileDependency(modulePath, raw, options, parent)
        }

        return resolveBowerDependencyFrom(modulePath, raw, componentPath, options, parent)
      },
      function (error) {
        return Promise.reject(resolveError(raw, error, parent))
      }
    )
}

/**
 * Resolve a local file dependency.
 */
function resolveFileDependency (location: string, raw: string, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
  let src: string

  if (isHttp(location)) {
    src = location
  } else if (parent && isHttp(parent.src)) {
    src = resolveUrl(parent.src, location)
  } else {
    src = resolve(options.cwd, location)
  }

  if (!isDefinition(src)) {
    return resolveTypeDependencyFrom(src, raw, options, parent)
  }

  // Resolve direct typings using `typings` property.
  return Promise.resolve(extend(DEFAULT_DEPENDENCY, {
    typings: src,
    src,
    raw,
    parent
  }))
}

/**
 * Follow and resolve bower dependencies.
 */
export function resolveBowerDependencies (options: Options): Promise<DependencyTree> {
  return findUp(options.cwd, 'bower.json')
    .then(
      function (bowerJsonPath: string) {
        return resolveBowerComponentPath(dirname(bowerJsonPath))
          .then(function (componentPath: string) {
            return resolveBowerDependencyFrom(bowerJsonPath, undefined, componentPath, options)
          })
      },
      function (cause) {
        return Promise.reject(new TypingsError(`Unable to resolve Bower dependencies`, cause))
      }
    )
}

/**
 * Resolve bower dependencies from a path.
 */
function resolveBowerDependencyFrom (
  src: string,
  raw: string,
  componentPath: string,
  options: Options,
  parent?: DependencyTree
): Promise<DependencyTree> {
  checkCircularDependency(parent, src)

  return readJson(src)
    .then(
      function (bowerJson: any = {}) {
        const tree = extend(DEFAULT_DEPENDENCY, {
          name: bowerJson.name,
          version: bowerJson.version,
          main: bowerJson.main,
          browser: bowerJson.browser,
          typings: bowerJson.typings,
          browserTypings: bowerJson.browserTypings,
          src,
          raw,
          parent
        })

        const dependencyMap = extend(bowerJson.dependencies)
        const devDependencyMap = extend(options.dev ? bowerJson.devDependencies : {})

        return Promise.all([
          resolveBowerDependencyMap(componentPath, dependencyMap, options, tree),
          resolveBowerDependencyMap(componentPath, devDependencyMap, options, tree),
          maybeResolveTypeDependencyFrom(join(src, '..', CONFIG_FILE), raw, options, tree)
        ])
          .then(function ([dependencies, devDependencies, typedPackage]) {
            tree.dependencies = extend(dependencies, typedPackage.dependencies)
            tree.devDependencies = extend(devDependencies, typedPackage.devDependencies)

            return tree
          })
      },
      function (error) {
        return Promise.reject(resolveError(raw, error, parent))
      }
    )
}

/**
 * Resolve the path to bower components.
 */
function resolveBowerComponentPath (path: string): Promise<string> {
  return readJson(resolve(path, '.bowerrc'))
    .then(
      function (bowerrc: any = {}) {
        return resolve(path, bowerrc.directory || 'bower_components')
      },
      function () {
        return resolve(path, 'bower_components')
      }
    )
}

/**
 * Recursively resolve dependencies from a list and component path.
 */
function resolveBowerDependencyMap (
  componentPath: string,
  dependencies: any,
  options: Options,
  parent: DependencyTree
): Promise<DependencyBranch> {
  const keys = Object.keys(dependencies)

  return Promise.all(keys.map(function (name) {
    const modulePath = resolve(componentPath, name, 'bower.json')
    const resolveOptions = extend(options, { dev: false, ambient: false })

    return resolveBowerDependencyFrom(modulePath, `bower:${name}`, componentPath, resolveOptions, parent)
  }))
    .then(results => zipObject(keys, results))
}

/**
 * Follow and resolve npm dependencies.
 */
export function resolveNpmDependencies (options: Options): Promise<DependencyTree> {
  return findUp(options.cwd, 'package.json')
    .then(
      function (packgeJsonPath: string) {
        return resolveNpmDependencyFrom(packgeJsonPath, undefined, options)
      },
      function (cause) {
        return Promise.reject(new TypingsError(`Unable to resolve NPM dependencies`, cause))
      }
    )
}

/**
 * Resolve NPM dependencies from `package.json`.
 */
function resolveNpmDependencyFrom (src: string, raw: string, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
  checkCircularDependency(parent, src)

  return readJson(src)
    .then(
      function (packageJson: any = {}) {
        const tree = extend(DEFAULT_DEPENDENCY, {
          name: packageJson.name,
          version: packageJson.version,
          main: packageJson.main || 'index.js',
          browser: packageJson.browser,
          typings: packageJson.typings,
          browserTypings: packageJson.browserTypings,
          src,
          raw,
          parent
        })

        const dependencyMap = extend(packageJson.dependencies, packageJson.peerDependencies)
        const devDependencyMap = extend(options.dev ? packageJson.devDependencies : {})

        return Promise.all([
          resolveNpmDependencyMap(src, dependencyMap, options, tree),
          resolveNpmDependencyMap(src, devDependencyMap, options, tree),
          maybeResolveTypeDependencyFrom(join(src, '..', CONFIG_FILE), raw, options, tree)
        ])
          .then(function ([dependencies, devDependencies, typedPackage]) {
            tree.dependencies = extend(dependencies, typedPackage.dependencies)
            tree.devDependencies = extend(devDependencies, typedPackage.devDependencies)

            return tree
          })
      },
      function (error) {
        return Promise.reject(resolveError(raw, error, parent))
      }
    )
}

/**
 * Recursively resolve dependencies from a list and component path.
 */
function resolveNpmDependencyMap (src: string, dependencies: any, options: Options, parent: DependencyTree) {
  const cwd = dirname(src)
  const keys = Object.keys(dependencies)

  return Promise.all(keys.map(function (name) {
    const resolveOptions = extend(options, { dev: false, ambient: false, cwd })

    return resolveNpmDependency(join(name, 'package.json'), `npm:${name}`, resolveOptions, parent)
  }))
    .then(results => zipObject(keys, results))
}

/**
 * Follow and resolve type dependencies.
 */
export function resolveTypeDependencies (options: Options): Promise<DependencyTree> {
  return findConfigFile(options.cwd)
    .then(
      function (path: string) {
        return resolveTypeDependencyFrom(path, undefined, options)
      },
      function (cause) {
        return Promise.reject(new TypingsError(`Unable to resolve Typings dependencies`, cause))
      }
    )
}

/**
 * Resolve type dependencies from an exact path.
 */
function resolveTypeDependencyFrom (src: string, raw: string, options: Options, parent?: DependencyTree) {
  checkCircularDependency(parent, src)

  return readConfigFrom(src)
    .then<DependencyTree>(
      function (config) {
        const tree = extend(DEFAULT_DEPENDENCY, {
          name: config.name,
          main: config.main,
          browser: config.browser,
          typings: config.typings,
          browserTypings: config.browserTypings,
          type: PROJECT_NAME,
          src,
          raw,
          parent
        })

        const { ambient, dev } = options

        const dependencyMap = extend(config.dependencies)
        const devDependencyMap = extend(dev ? config.devDependencies : {})
        const ambientDependencyMap = extend(ambient ? config.ambientDependencies : {})
        const ambientDevDependencyMap = extend(ambient && dev ? config.ambientDevDependencies : {})

        return Promise.all([
          resolveTypeDependencyMap(src, dependencyMap, options, tree),
          resolveTypeDependencyMap(src, devDependencyMap, options, tree),
          resolveTypeDependencyMap(src, ambientDependencyMap, options, tree),
          resolveTypeDependencyMap(src, ambientDevDependencyMap, options, tree),
        ])
          .then(function ([dependencies, devDependencies, ambientDependencies, ambientDevDependencies]) {
            tree.dependencies = dependencies
            tree.devDependencies = devDependencies
            tree.ambientDependencies = ambientDependencies
            tree.ambientDevDependencies = ambientDevDependencies

            return tree
          })
      },
      function (error) {
        return Promise.reject(resolveError(raw, error, parent))
      }
    )
}

/**
 * Resolve type dependency ignoring not found issues (E.g. when mixed resolve NPM/Bower).
 */
function maybeResolveTypeDependencyFrom (src: string, raw: string, options: Options, parent?: DependencyTree) {
  return resolveTypeDependencyFrom(src, raw, options, parent).catch(() => extend(DEFAULT_DEPENDENCY))
}

/**
 * Resolve type dependency map from a cache directory.
 */
function resolveTypeDependencyMap (src: string, dependencies: any, options: Options, parent: DependencyTree) {
  const cwd = dirname(src)
  const keys = Object.keys(dependencies)

  return Promise.all(keys.map(function (name) {
    const resolveOptions = extend(options, { dev: false, ambient: false, cwd })

    return resolveDependency(parseDependency(dependencies[name]), resolveOptions, parent)
  }))
    .then(results => zipObject(keys, results))
}

/**
 * Check whether the filename is a circular dependency.
 */
function checkCircularDependency (tree: DependencyTree, filename: string) {
  if (tree) {
    const currentSrc = tree.src

    do {
      invariant(tree.src !== filename, `Circular dependency detected using "${currentSrc}"`)
    } while (tree = tree.parent)
  }
}

/**
 * Create a resolved failure error message.
 */
function resolveError (raw: string, cause: Error, parent?: DependencyTree) {
  let message = `Unable to resolve ${raw == null ? 'typings' : `"${raw}"`}`

  if (parent != null && parent.raw != null) {
    message += ` from "${parent.raw}"`
  }

  return new TypingsError(message, cause)
}

/**
 * Merge dependency trees together.
 */
function mergeDependencies (trees: DependencyTree[]): DependencyTree {
  const dependency = extend(DEFAULT_DEPENDENCY)

  trees.forEach(function (dependencyTree) {
    // Skip empty dependency trees.
    if (dependencyTree == null) {
      return
    }

    const { name, src, main, browser, typings, browserTypings } = dependencyTree

    // Handle `main` and `typings` overrides all together.
    if (
      typeof main === 'string' ||
      typeof browser === 'string' ||
      typeof typings === 'string' ||
      typeof browserTypings === 'string'
    ) {
      dependency.name = name
      dependency.src = src
      dependency.main = main
      dependency.browser = browser
      dependency.typings = typings
      dependency.browserTypings = browserTypings
    }

    dependency.dependencies = extend(dependency.dependencies, dependencyTree.dependencies)
    dependency.devDependencies = extend(dependency.devDependencies, dependencyTree.devDependencies)
    dependency.ambientDependencies = extend(dependency.ambientDependencies, dependencyTree.ambientDependencies)
    dependency.ambientDevDependencies = extend(dependency.ambientDevDependencies, dependencyTree.ambientDevDependencies)
  })

  return dependency
}

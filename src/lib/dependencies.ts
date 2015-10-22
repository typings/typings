import extend = require('xtend')
import invariant = require('invariant')
import stripBom = require('strip-bom')
import arrify = require('arrify')
import Promise = require('native-or-bluebird')
import zipObject = require('zip-object')
import partial = require('util-partial')
import { resolve as resolveUrl } from 'url'
import { resolve, dirname, join } from 'path'
import { readJson, readConfigFrom, readJsonFrom, readConfig } from '../utils/fs'
import { parseDependency } from '../utils/parse'
import { findUp, findConfigFile } from '../utils/find'
import { isDefinition, isHttp } from '../utils/path'
import { CONFIG_FILE, PROJECT_NAME } from '../utils/config'

import {
  Dependency,
  Dependencies,
  DependencyBranch,
  DependencyTree
} from '../interfaces/main'

/**
 * Default dependency config options.
 */
const DEFAULT_DEPENDENCY: DependencyTree = {
  type: undefined,
  ambient: false,
  missing: false,
  src: undefined,
  dependencies: {},
  devDependencies: {},
  ambientDependencies: {}
}

/**
 * Default configuration for a missing dependency.
 */
const MISSING_DEPENDENCY = extend(DEFAULT_DEPENDENCY, {
  missing: true
})

/**
 * Options for resolving dependencies.
 */
export interface Options {
  dev?: boolean
  cwd: string
}

/**
 * Resolve all dependencies at the current path.
 */
export default function resolveDependencies (options: Options): Promise<DependencyTree> {
  return Promise.all([
    resolveBowerDependencies(options),
    resolveNpmDependencies(options),
    resolveTypeDependencies(options)
  ])
    .then(mergeDependencies)
}

/**
 * Resolve a single dependency object.
 */
export function resolveDependency (dependency: Dependency, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
  if (dependency.type === 'npm') {
    return resolveNpmDependency(dependency.location, options, parent)
  }

  if (dependency.type === 'bower') {
    return resolveBowerDependency(dependency.location, options, parent)
  }

  return resolveFileDependency(dependency.location, options, parent)
}

/**
 * Resolve a dependency in NPM.
 */
function resolveNpmDependency (name: string, options: Options, parent?: DependencyTree) {
  return findUp(options.cwd, join('node_modules', name))
    .then(function (modulePath: string) {
      if (isDefinition(modulePath)) {
        return resolveFileDependency(modulePath, options, parent)
      }

      return resolveNpmDependencyFrom(modulePath, options, parent)
    })
}

/**
 * Resolve a dependency in Bower.
 */
function resolveBowerDependency (name: string, options: Options, parent?: DependencyTree) {
  return resolveBowerComponentPath(options.cwd)
    .then(function (componentPath: string) {
      const modulePath = resolve(componentPath, name)

      if (isDefinition(modulePath)) {
        return resolveFileDependency(modulePath, options, parent)
      }

      return resolveBowerDependencyFrom(modulePath, componentPath, options, parent)
    })
}

/**
 * Resolve a local file dependency.
 */
function resolveFileDependency (location: string, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
  let src: string

  if (isHttp(location)) {
    src = location
  } else if (parent && isHttp(parent.src)) {
    src = resolveUrl(parent.src, location)
  } else {
    src = resolve(options.cwd, location)
  }

  if (!isDefinition(src)) {
    return resolveTypeDependencyFrom(src, options, parent)
  }

  // Resolve direct typings using `typings` property.
  return Promise.resolve(extend(DEFAULT_DEPENDENCY, {
    type: PROJECT_NAME,
    typings: src,
    src,
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
            return resolveBowerDependencyFrom(bowerJsonPath, componentPath, options)
          })
      },
      function () {
        return extend(MISSING_DEPENDENCY)
      }
    )
}

/**
 * Resolve bower dependencies from a path.
 */
function resolveBowerDependencyFrom (src: string, componentPath: string, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
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
          type: 'bower',
          src,
          parent
        })

        const dependencyMap = extend(bowerJson.dependencies)
        const devDependencyMap = extend(options.dev ? bowerJson.devDependencies : {})

        return Promise.all<any>([
          resolveBowerDependencyMap(componentPath, dependencyMap, options, tree),
          resolveBowerDependencyMap(componentPath, devDependencyMap, options, tree),
          resolveTypeDependencyFrom(join(src, '..', CONFIG_FILE), options, tree)
        ])
          .then(function ([dependencies, devDependencies, typedPackage]) {
            tree.dependencies = extend(dependencies, typedPackage.dependencies)
            tree.devDependencies = extend(devDependencies, typedPackage.devDependencies)

            return tree
          })
      },
      function () {
        return Promise.resolve(extend(MISSING_DEPENDENCY, {
          type: 'bower',
          src,
          parent
        }))
      }
    )
}

/**
 * Resolve the path to bower components.
 */
function resolveBowerComponentPath (path: string): Promise<string> {
  return readJson(resolve(path, '.bowerrc'))
    .then(function (bowerrc: any = {}) {
      return resolve(path, bowerrc.directory || 'bower_components')
    })
    .catch(function () {
      return resolve(path, 'bower_components')
    })
}

/**
 * Recursively resolve dependencies from a list and component path.
 */
function resolveBowerDependencyMap (componentPath: string, dependencies: any, options: Options, parent: DependencyTree): Promise<DependencyBranch> {
  const keys = Object.keys(dependencies)

  return Promise.all(keys.map(function (name) {
    const modulePath = resolve(componentPath, name, 'bower.json')

    return resolveBowerDependencyFrom(modulePath, componentPath, extend(options, { dev: false }), parent)
  }))
    .then(partial(zipObject, keys))
}

/**
 * Follow and resolve npm dependencies.
 */
export function resolveNpmDependencies (options: Options): Promise<DependencyTree> {
  return findUp(options.cwd, 'package.json')
    .then(
      function (packgeJsonPath: string) {
        return resolveNpmDependencyFrom(packgeJsonPath, options)
      },
      function () {
        return extend(MISSING_DEPENDENCY)
      }
    )
}

/**
 * Resolve NPM dependencies from `package.json`.
 */
function resolveNpmDependencyFrom (src: string, options: Options, parent?: DependencyTree): Promise<DependencyTree> {
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
          type: 'npm',
          src,
          parent
        })

        const dependencyMap = extend(packageJson.dependencies, packageJson.optionalDependencies)
        const devDependencyMap = extend(options.dev ? packageJson.devDependencies : {})

        return Promise.all<any>([
          resolveNpmDependencyMap(src, dependencyMap, options, tree),
          resolveNpmDependencyMap(src, devDependencyMap, options, tree),
          resolveTypeDependencyFrom(join(src, '..', CONFIG_FILE), options, tree)
        ])
          .then(function ([dependencies, devDependencies, typedPackage]) {
            tree.dependencies = extend(dependencies, typedPackage.dependencies)
            tree.devDependencies = extend(devDependencies, typedPackage.devDependencies)

            return tree
          })
      },
      function () {
        return Promise.resolve(extend(MISSING_DEPENDENCY, {
          type: 'npm',
          src,
          parent
        }))
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
    return resolveNpmDependency(join(name, 'package.json'), extend(options, { dev: false, cwd }), parent)
  }))
    .then(partial(zipObject, keys))
}

/**
 * Follow and resolve type dependencies.
 */
export function resolveTypeDependencies (options: Options): Promise<DependencyTree> {
  return findConfigFile(options.cwd)
    .then(
      function (path: string) {
        return resolveTypeDependencyFrom(path, options)
      },
      function () {
        return extend(MISSING_DEPENDENCY)
      }
    )
}

/**
 * Resolve type dependencies from an exact path.
 */
function resolveTypeDependencyFrom (src: string, options: Options, parent?: DependencyTree) {
  checkCircularDependency(parent, src)

  return readConfigFrom(src)
    .then<DependencyTree>(function (config) {
      const tree = extend(DEFAULT_DEPENDENCY, {
        name: config.name,
        main: config.main,
        browser: config.browser,
        ambient: !!config.ambient,
        type: PROJECT_NAME,
        src,
        parent
      })

      const dependencyMap = extend(config.dependencies)
      const devDependencyMap = extend(options.dev ? config.devDependencies : {})
      const ambientDependencyMap = extend(config.ambientDependencies)

      return Promise.all<any>([
        resolveTypeDependencyMap(src, dependencyMap, options, tree),
        resolveTypeDependencyMap(src, devDependencyMap, options, tree),
        resolveTypeDependencyMap(src, ambientDependencyMap, options, tree)
      ])
        .then(function ([dependencies, devDependencies, ambientDependencies]) {
          tree.dependencies = dependencies
          tree.devDependencies = devDependencies
          tree.ambientDependencies = ambientDependencies

          return tree
        })
    },
    function () {
      return extend(MISSING_DEPENDENCY, {
        type: PROJECT_NAME,
        src,
        parent
      })
    })
}

/**
 * Resolve type dependency map from a cache directory.
 */
function resolveTypeDependencyMap (src: string, dependencies: any, options: Options, parent: DependencyTree) {
  const cwd = dirname(src)
  const keys = Object.keys(dependencies)

  return Promise.all(keys.map(function (name) {
    // Map over the dependency list and resolve to the first found dependency.
    return arrify(dependencies[name])
      .reduce(function (result: Promise<DependencyTree>, dependency: string) {
        return result.then(function (tree) {
          // Continue trying to resolve when the dependency is missing.
          if (tree.missing) {
            return resolveDependency(parseDependency(dependency), extend(options, { dev: false, cwd }), parent)
          }

          return tree
        })
      }, Promise.resolve(MISSING_DEPENDENCY))
  }))
    .then(partial(zipObject, keys))
}

/**
 * Check whether the filename is a circular dependency.
 */
function checkCircularDependency (tree: DependencyTree, filename: string) {
  if (tree) {
    const currentSrc = tree.src

    do {
      invariant(tree.src !== filename, 'Circular dependency detected in %s', currentSrc)
    } while (tree = tree.parent)
  }
}

/**
 * Merge dependency trees together.
 */
function mergeDependencies (trees: DependencyTree[]): DependencyTree {
  const dependency = extend(DEFAULT_DEPENDENCY)

  trees.forEach(function (dependencyTree) {
    overrideProperty('name', dependency, dependencyTree)
    overrideProperty('main', dependency, dependencyTree)
    overrideProperty('browser', dependency, dependencyTree)
    overrideProperty('typings', dependency, dependencyTree)
    overrideProperty('browserTypings', dependency, dependencyTree)

    dependency.dependencies = extend(dependency.dependencies, dependencyTree.dependencies)
    dependency.devDependencies = extend(dependency.devDependencies, dependencyTree.devDependencies)
    dependency.ambientDependencies = extend(dependency.ambientDependencies, dependencyTree.ambientDependencies)
  })

  return dependency
}

/**
 * Extend a single property from one object to another.
 */
function overrideProperty (property: string, to: any, from: any) {
  if (from.hasOwnProperty(property)) {
    to[property] = from[property]
  }
}

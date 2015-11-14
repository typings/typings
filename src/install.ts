import extend = require('xtend')
import Promise = require('native-or-bluebird')
import { dirname } from 'path'
import { resolveDependency, resolveTypeDependencies } from './lib/dependencies'
import compile, { Options as CompileOptions } from './lib/compile'
import { findProject } from './utils/find'
import { writeDependency, transformConfig } from './utils/fs'
import { parseDependency } from './utils/parse'
import { DependencyTree, Dependency } from './interfaces/main'

/**
 * Options for installing a new dependency.
 */
export interface InstallDependencyOptions {
  save?: boolean
  saveDev?: boolean
  saveAmbient?: boolean
  ambient?: boolean
  name?: string
  cwd: string
  source?: string
}

/**
 * Only options required for a full install.
 */
export interface InstallOptions {
  cwd: string
}

/**
 * Install all dependencies on the current project.
 */
export function install (options: InstallOptions): Promise<DependencyTree> {
  return resolveTypeDependencies({ cwd: options.cwd, dev: true, ambient: true })
    .then(tree => {
      const cwd = dirname(tree.src)
      const queue: [string, DependencyTree, boolean][] = []

      function addToQueue (deps: { [key: string]: DependencyTree }, ambient: boolean) {
        for (const key of Object.keys(deps)) {
          queue.push([key, deps[key], ambient])
        }
      }

      addToQueue(tree.dependencies, false)
      addToQueue(tree.devDependencies, false)
      addToQueue(tree.ambientDependencies, true)

      // Install each dependency after each other.
      function chain (result: Promise<DependencyTree>, [name, tree, ambient]) {
        return result.then(() => installDependencyTree(tree, { cwd, name, ambient, meta: true }))
      }

      return queue.reduce(chain, Promise.resolve()).then(() => tree)
    })
}

/**
 * Install a dependency into the currect project.
 */
export function installDependency (dependency: string, options: InstallDependencyOptions): Promise<DependencyTree> {
  if (!options.name) {
    return Promise.reject(new Error('You must specify a name for the dependency'))
  }

  // Install dependency.
  function install (options: InstallDependencyOptions) {
    return installTo(dependency, options)
  }

  return findProject(options.cwd)
    .then(
      (cwd) => install(extend(options, { cwd })),
      () => install(options)
    )
}

/**
 * Install from a dependency string.
 */
function installTo (location: string, options: InstallDependencyOptions): Promise<DependencyTree> {
  const dependency = parseDependency(location)

  return resolveDependency(dependency, options)
    .then(tree => {
      if (tree.missing) {
        return Promise.reject(new TypeError(`Unable to resolve "${location}"`))
      }

      return installDependencyTree(tree, {
        cwd: options.cwd,
        name: options.name,
        ambient: options.ambient || options.saveAmbient,
        meta: true
      })
        .then(() => writeToConfig(dependency, options))
        .then(() => tree)
    })
}

/**
 * Compile a dependency tree into the users typings.
 */
function installDependencyTree (tree: DependencyTree, options: CompileOptions) {
  return compile(tree, options)
    .then(definitions => writeDependency(definitions, options))
}

/**
 * Write a dependency to the configuration file.
 */
function writeToConfig (dependency: Dependency, options: InstallDependencyOptions) {
  if (!options.save && !options.saveDev && !options.saveAmbient) {
    return
  }

  const { raw } = dependency

  return transformConfig(options.cwd, config => {
    // Extend different fields depending on the option passed in.
    if (options.save) {
      config.dependencies = extend(config.dependencies, { [options.name]: raw })
    } else if (options.saveDev) {
      config.devDependencies = extend(config.devDependencies, { [options.name]: raw })
    } else if (options.saveAmbient) {
      config.ambientDependencies = extend(config.ambientDependencies, { [options.name]: raw })
    }

    return config
  })
}

import extend = require('xtend')
import Promise = require('native-or-bluebird')
import { dirname } from 'path'
import { resolveDependency, resolveTypeDependencies } from './lib/dependencies'
import compile from './lib/compile'
import { findProject } from './utils/find'
import { writeDependency, transformConfig } from './utils/fs'
import { parseDependency, stringifyDependency } from './utils/parse'
import { DependencyTree, Dependency } from './interfaces/main'

export interface InstallDependencyOptions {
  save?: boolean
  saveDev?: boolean
  saveAmbient?: boolean
  ambient?: boolean
  name: string
  cwd: string
}

export interface InstallOptions {
  cwd: string
}

export function install (options: InstallOptions) {
  return resolveTypeDependencies(options)
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

      return queue.reduce((result, [name, tree, ambient]) => {
        return result.then(() => installDependencyTree(tree, { cwd, name, ambient }))
      }, Promise.resolve())
    })
}

export function installDependency (dependency: string, options: InstallDependencyOptions) {
  if (!options.name) {
    return Promise.reject(new Error('You must specify a name for the dependency'))
  }

  return findProject(options.cwd)
    .then(
      (cwd) => installTo(dependency, extend(options, { cwd })),
      () => installTo(dependency, options)
    )
}

function installTo (location: string, options: InstallDependencyOptions) {
  const dependency = parseDependency(location)

  return resolveDependency(dependency, options)
    .then(tree => {
      if (tree.missing) {
        return Promise.reject(new TypeError('Unable to resolve dependency'))
      }

      return installDependencyTree(tree, {
        cwd: options.cwd,
        name: options.name,
        ambient: options.ambient || options.saveAmbient
      })
    })
    .then(() => writeToConfig(dependency, options))
}

function installDependencyTree (tree: DependencyTree, options: { cwd: string; name: string; ambient: boolean }) {
  return compile(tree, options)
    .then(definitions => writeDependency(definitions, options))
}

function writeToConfig (dependency: Dependency, options: InstallDependencyOptions) {
  if (!options.save && !options.saveDev && !options.saveAmbient) {
    return
  }

  const location = stringifyDependency(dependency)

  return transformConfig(options.cwd, config => {
    // Extend different fields depending on the option passed in.
    if (options.save) {
      config.dependencies = extend(config.dependencies, { [options.name]: location })
    } else if (options.saveDev) {
      config.devDependencies = extend(config.devDependencies, { [options.name]: location })
    } else if (options.saveAmbient) {
      config.ambientDependencies = extend(config.ambientDependencies, { [options.name]: location })
    }

    return config
  })
}

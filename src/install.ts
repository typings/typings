import extend = require('xtend')
import Promise = require('any-promise')
import { dirname } from 'path'
import { resolveDependency, resolveTypeDependencies } from './lib/dependencies'
import compile, { Options as CompileOptions, CompiledOutput } from './lib/compile'
import { findProject } from './utils/find'
import { writeDependency, transformConfig, mkdirp, getTypingsLocation, touch } from './utils/fs'
import { parseDependency } from './utils/parse'
import { DependencyTree, Dependency, DependencyBranch } from './interfaces/main'

/**
 * Options for installing a new dependency.
 */
export interface InstallDependencyOptions {
  save?: boolean
  saveDev?: boolean
  ambient?: boolean
  name: string
  cwd: string
  source?: string
}

/**
 * Only options required for a full install.
 */
export interface InstallOptions {
  cwd: string
  production: boolean
}

/**
 * Install all dependencies on the current project.
 */
export function install (options: InstallOptions): Promise<{ tree: DependencyTree }> {
  return resolveTypeDependencies({ cwd: options.cwd, dev: !options.production, ambient: true })
    .then(tree => {
      const cwd = dirname(tree.src)
      const queue: Array<Promise<any>> = []

      function addToQueue (deps: DependencyBranch, ambient: boolean) {
        for (const name of Object.keys(deps)) {
          const tree = deps[name]

          queue.push(installDependencyTree(tree, { cwd, name, ambient, meta: true }))
        }
      }

      addToQueue(tree.dependencies, false)
      addToQueue(tree.devDependencies, false)
      addToQueue(tree.ambientDependencies, true)
      addToQueue(tree.ambientDevDependencies, true)

      return Promise.all(queue)
        .then(installed => {
          if (installed.length === 0) {
            const { typingsDir, mainDtsFile, browserDtsFile } = getTypingsLocation({ cwd })

            return mkdirp(typingsDir)
              .then(() => {
                return Promise.all([
                  touch(mainDtsFile, {}),
                  touch(browserDtsFile, {})
                ])
              })
          }
        })
        .then(() => ({ tree }))
    })
}

/**
 * Install a dependency into the currect project.
 */
export function installDependency (dependency: string, options: InstallDependencyOptions): Promise<CompiledOutput> {
  if (!options.name) {
    return Promise.reject(new TypeError('You must specify a name for the dependency'))
  }

  return findProject(options.cwd)
    .then(
      (cwd) => installTo(dependency, extend(options, { cwd })),
      () => installTo(dependency, options)
    )
}

/**
 * Install from a dependency string.
 */
function installTo (location: string, options: InstallDependencyOptions): Promise<CompiledOutput> {
  const dependency = parseDependency(location)

  return resolveDependency(dependency, options)
    .then(tree => {
      return installDependencyTree(tree, {
        cwd: options.cwd,
        name: options.name,
        ambient: options.ambient,
        meta: true
      })
        .then(result => {
          return writeToConfig(dependency, options).then(() => result)
        })
    })
}

/**
 * Compile a dependency tree into the users typings.
 */
function installDependencyTree (tree: DependencyTree, options: CompileOptions): Promise<CompiledOutput> {
  return compile(tree, options).then(result => writeDependency(result, options))
}

/**
 * Write a dependency to the configuration file.
 */
function writeToConfig (dependency: Dependency, options: InstallDependencyOptions) {
  if (options.save || options.saveDev) {
    const { raw } = dependency

    return transformConfig(options.cwd, config => {
      // Extend different fields depending on the option passed in.
      if (options.save) {
        if (options.ambient) {
          config.ambientDependencies = extend(config.ambientDependencies, { [options.name]: raw })
        } else {
          config.dependencies = extend(config.dependencies, { [options.name]: raw })
        }
      } else if (options.saveDev) {
        if (options.ambient) {
          config.ambientDevDependencies = extend(config.ambientDevDependencies, { [options.name]: raw })
        } else {
          config.devDependencies = extend(config.devDependencies, { [options.name]: raw })
        }
      }

      return config
    })
  }

  return Promise.resolve()
}

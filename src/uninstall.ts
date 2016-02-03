import extend = require('xtend')
import Promise = require('any-promise')
import { removeDependency, transformConfig, DefinitionOptions } from './utils/fs'
import { findProject } from './utils/find'

/**
 * Uninstall options.
 */
export interface UninstallDependencyOptions {
  save?: boolean
  saveDev?: boolean
  ambient?: boolean
  cwd: string
}

/**
 * Uninstall a dependency, given a name.
 */
export function uninstallDependency (name: string, options: UninstallDependencyOptions) {
  const { ambient } = options

  // Remove the dependency from fs and config.
  function uninstall (options: DefinitionOptions) {
    return removeDependency(options).then(() => writeToConfig(name, options))
  }

  return findProject(options.cwd)
    .then(
      (cwd) => uninstall(extend(options, { cwd, name, ambient })),
      () => uninstall(extend(options, { name, ambient }))
    )
}

/**
 * Delete the dependency from the configuration file.
 */
function writeToConfig (name: string, options: UninstallDependencyOptions) {
  if (options.save || options.saveDev) {
    return transformConfig(options.cwd, config => {
      if (options.save) {
        if (options.ambient) {
          if (config.ambientDependencies) {
            delete config.ambientDependencies[name]
          }
        } else {
          if (config.dependencies) {
            delete config.dependencies[name]
          }
        }
      }

      if (options.saveDev) {
        if (options.ambient) {
          if (config.ambientDevDependencies) {
            delete config.ambientDevDependencies[name]
          }
        } else {
          if (config.devDependencies) {
            delete config.devDependencies[name]
          }
        }
      }

      return config
    })
  }
}

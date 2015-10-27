import extend = require('xtend')
import { removeDependency, transformConfig } from './utils/fs'
import { findProject } from './utils/find'

export interface UninstallDependencyOptions {
  save?: boolean
  saveDev?: boolean
  saveAmbient?: boolean
  ambient?: boolean
  cwd: string
}

export function uninstallDependency (name: string, options: UninstallDependencyOptions) {
  const ambient = options.saveAmbient || options.ambient

  return findProject(options.cwd)
    .then(
      (cwd) => removeDependency(extend(options, { cwd, name, ambient })).then(() => writeToConfig(name, options)),
      () => removeDependency(extend(options, { name, ambient }))
    )
}

function writeToConfig (name: string, options: UninstallDependencyOptions) {
  if (!options.save && !options.saveDev && !options.saveAmbient) {
    return
  }

  return transformConfig(options.cwd, config => {
    if (options.save && config.dependencies) {
      delete config.dependencies[name]
    }

    if (options.saveDev && config.devDependencies) {
      delete config.devDependencies[name]
    }

    if (options.saveAmbient && config.ambientDependencies) {
      delete config.ambientDependencies
    }

    return config
  })
}

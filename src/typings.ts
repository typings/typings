let VERSION: string

export { install, installDependency } from './install'
export { uninstallDependency } from './uninstall'
export { init } from './init'

/**
 * Export version as a function, can't implement as a `getter` for lazy loading.
 */
export function version () {
  if (!VERSION) {
    VERSION = require('../package.json').version
  }

  return VERSION
}

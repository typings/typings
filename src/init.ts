import Promise = require('native-or-bluebird')
import { join } from 'path'
import { ConfigJson } from './interfaces/main'
import { writeJson, isFile } from './utils/fs'
import { CONFIG_FILE } from './utils/config'

/**
 * Options for initializing a configuration.
 */
export interface Options {
  cwd: string
}

/**
 * The default configuration file to initialize.
 */
const DEFAULT_CONFIG: ConfigJson = {
  dependencies: {},
  devDependencies: {},
  ambientDependencies: {}
}

/**
 * Initialize a configuration file here.
 */
export function init (options: Options) {
  const path = join(options.cwd, CONFIG_FILE)

  return isFile(path)
    .then(exists => {
      if (exists) {
        return Promise.reject(new Error(`A ${CONFIG_FILE} file already exists`))
      }

      return writeJson(path, DEFAULT_CONFIG, 2)
    })
}

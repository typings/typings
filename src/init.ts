import Promise = require('native-or-bluebird')
import { join } from 'path'
import { ConfigJson } from './interfaces/main'
import { writeJson, isFile, readJson } from './utils/fs'
import { CONFIG_FILE } from './utils/config'
import { inferDefinitionName } from './utils/path'

const TSD_JSON_FILE = 'tsd.json'
const DEFINITELYTYPED_REPO = 'DefinitelyTyped/DefinitelyTyped'
const OLD_DEFINITELYTYPED_REPO = 'borisyankov/DefinitelyTyped'

/**
 * Options for initializing a configuration.
 */
export interface Options {
  cwd: string
  upgrade?: boolean
}

/**
 * The default configuration file to initialize.
 */
const DEFAULT_CONFIG: ConfigJson = {
  dependencies: {},
  devDependencies: {}
}

/**
 * The interface for `tsd.json`.
 */
interface TsdJson {
  version?: string;
  repo?: string,
  ref?: string,
  path?: string,
  bundle?: string,
  githubHost?: string,
  installed?: {
    [path: string]: {
      commit: string
    }
  }
}

/**
 * Update an old `tsd.json` format to the new format.
 */
function upgradeTsdJson (tsdJson: TsdJson): ConfigJson {
  const typingsJson: ConfigJson = {}
  let repo = tsdJson.repo || DEFINITELYTYPED_REPO

  // Rewrite the old repo name which probably hasn't been updated in `tsd.json`.
  if (repo === OLD_DEFINITELYTYPED_REPO) {
    repo = DEFINITELYTYPED_REPO
  }

  // Copy all installed modules to ambient dependencies.
  if (tsdJson.installed) {
    typingsJson.ambientDependencies = {}

    Object.keys(tsdJson.installed).forEach(function (path) {
      const dependency = tsdJson.installed[path]
      const name = inferDefinitionName(path)
      const location = `github:${repo}/${path}#${dependency.commit}`

      typingsJson.ambientDependencies[name] = location
    })
  }

  return typingsJson
}

/**
 * Upgrade from `tsd.json`.
 */
function upgrade (options: Options) {
  return readJson(join(options.cwd, TSD_JSON_FILE)).then(upgradeTsdJson)
}

/**
 * Initialize a configuration file here.
 */
export function init (options: Options) {
  const path = join(options.cwd, CONFIG_FILE)

  return isFile(path)
    .then<ConfigJson>(exists => {
      if (exists) {
        return Promise.reject(new TypeError(`A ${CONFIG_FILE} file already exists`))
      }

      if (options.upgrade) {
        return upgrade(options)
      }

      return DEFAULT_CONFIG
    })
    .then(function (config) {
      return writeJson(path, config, 2)
    })
}

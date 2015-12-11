import * as fs from 'graceful-fs'
import thenify = require('thenify')
import stripBom = require('strip-bom')
import parse = require('parse-json')
import popsicle = require('popsicle')
import popsicleCache = require('popsicle-cache')
import popsicleStatus = require('popsicle-status')
import detectIndent = require('detect-indent')
import sortKeys = require('sort-keys')
import mdp = require('mkdirp')
import uniq = require('array-uniq')
import Promise = require('native-or-bluebird')
import lockfile = require('lockfile')
import rmrf = require('rimraf')
import promiseFinally from 'promise-finally'
import { join, dirname } from 'path'
import { CONFIG_FILE, TYPINGS_DIR, DTS_MAIN_FILE, DTS_BROWSER_FILE, CACHE_DIR } from './config'
import { isHttp, toDefinition } from './path'
import { parseReferences, stringifyReferences } from './references'
import { ConfigJson } from '../interfaces/main'

// Create a file cache for popsicle.
const requestFileCache = popsicleCache({
  store: new popsicleCache.Store({ path: join(CACHE_DIR, 'http') })
})

const mainTypingsDir = join(TYPINGS_DIR, 'main/definitions')
const browserTypingsDir = join(TYPINGS_DIR, 'browser/definitions')
const ambientMainTypingsDir = join(TYPINGS_DIR, 'main/ambient')
const ambientBrowserTypingsDir = join(TYPINGS_DIR, 'browser/ambient')

export type Stats = fs.Stats

export const stat = thenify(fs.stat)
export const readFile = thenify<string, string, string>(fs.readFile)
export const writeFile = thenify<string, string | Buffer, void>(fs.writeFile)
export const mkdirp = thenify<string, void>(mdp)
export const unlink = thenify<string, void>(fs.unlink)
export const lock = thenify<string, lockfile.Options, void>(lockfile.lock)
export const unlock = thenify(lockfile.unlock)
export const rimraf = thenify(rmrf)

/**
 * Verify a path exists and is a file.
 */
export function isFile (path: string): Promise<boolean> {
  return stat(path).then(stat => stat.isFile(), () => false)
}

/**
 * Read JSON from a path.
 */
export function readJson (path: string): Promise<any> {
  return readFile(path, 'utf8')
    .then(stripBom)
    .then(contents => parseJson(contents, path))
}

/**
 * Write JSON to a file.
 */
export function writeJson (path: string, json: any, indent: string | number = 2) {
  return writeFile(path, JSON.stringify(json, null, indent))
}

/**
 * Read a configuration file.
 */
export function readConfig (path: string): Promise<ConfigJson> {
  return readJson(path).then(data => parseConfig(data, path))
}

/**
 * Read a configuration file from anywhere (HTTP or local).
 */
export function readConfigFrom (path: string): Promise<ConfigJson> {
  return readJsonFrom(path).then(data => parseConfig(data, path))
}

export function parseConfig (config: ConfigJson, path: string): ConfigJson {
  // TODO(blakeembrey): Validate config object.
  return config
}

/**
 * Read a file over HTTP, using a file cache and status check.
 */
export function readHttp (url: string): Promise<string> {
  return popsicle.get({
    url,
    use: [
      popsicle.plugins.headers,
      popsicle.plugins.unzip,
      popsicle.plugins.concatStream('string')
    ]
  })
    .use(requestFileCache)
    .use(popsicleStatus(200))
    .then(x => x.body)
}

/**
 * Read a file from anywhere (HTTP or local filesystem).
 */
export function readFileFrom (from: string): Promise<string> {
  return isHttp(from) ? readHttp(from) : readFile(from, 'utf8')
}

/**
 * Read JSON from anywhere.
 */
export function readJsonFrom (from: string): Promise<any> {
  return readFileFrom(from)
    .then(stripBom)
    .then(contents => parseJson(contents, from))
}

/**
 * Parse a string as JSON.
 */
export function parseJson (contents: string, path: string) {
  return parse(contents, null, path)
}

/**
 * Transform a file contents (read and write in a single operation).
 */
export function transformFile (path: string, transform: (contents: string) => string | Promise<string>) {
  function handle (contents: string) {
    return Promise.resolve(transform(contents))
      .then(contents => writeFile(path, contents))
  }

  const lockfile = `${path}.lock`
  const lockOptions = { wait: 250, retries: 25, stale: 60000 }

  const result = lock(lockfile, lockOptions)
    .then(() => {
      return readFile(path, 'utf8')
    })
    .then(
      (contents) => handle(contents),
      () => handle(undefined)
    )

  return promiseFinally(result, () => unlock(lockfile))
}

/**
 * Transform a JSON file in a single operation.
 */
export function transformJson <T> (path: string, transform: (json: T) => T) {
  return transformFile(path, (contents) => {
    const indent = contents ? detectIndent(contents).indent : 2
    const json = contents ? parseJson(contents, path) : undefined

    return Promise.resolve(transform(json))
      .then(json => JSON.stringify(json, null, indent || 2))
  })
}

/**
 * Transform a configuration file in a single operation.
 */
export function transformConfig (cwd: string, transform: (config: ConfigJson) => ConfigJson) {
  const path = join(cwd, CONFIG_FILE)

  return transformJson<ConfigJson>(path, (config = {}) => {
    return Promise.resolve(transform(parseConfig(config, path)))
      .then(config => {
        if (config.dependencies) {
          config.dependencies = sortKeys(config.dependencies)
        }

        if (config.devDependencies) {
          config.devDependencies = sortKeys(config.devDependencies)
        }

        if (config.ambientDependencies) {
          config.ambientDependencies = sortKeys(config.ambientDependencies)
        }

        if (config.ambientDevDependencies) {
          config.ambientDevDependencies = sortKeys(config.ambientDevDependencies)
        }

        return config
      })
  })
}

export function transformDtsFile (path: string, transform: (typings: string[]) => string[]) {
  const cwd = dirname(path)

  return transformFile(path, contents => {
    const typings = parseReferences(contents, cwd)

    return Promise.resolve(transform(typings))
      .then(typings => stringifyReferences(uniq(typings).sort(), cwd))
  })
}

/**
 * Options for interacting with dependencies.
 */
export interface DefinitionOptions {
  cwd: string
  name: string
  ambient: boolean
}

/**
 * Write a dependency to the filesytem.
 */
export function writeDependency (contents: { main: string; browser: string }, options: DefinitionOptions): Promise<boolean> {
  const location = getDependencyLocation(options)

  // Execute the dependency creation flow.
  function create (path: string, file: string, contents: string, dtsFile: string) {
    return mkdirp(path)
      .then(() => writeFile(file, contents))
      .then(() => transformDtsFile(dtsFile, typings => typings.concat([file])))
  }

  // Create both typings concurrently.
  return Promise.all([
    create(location.mainPath, location.mainFile, contents.main, location.mainDtsFile),
    create(location.browserPath, location.browserFile, contents.browser, location.browserDtsFile)
  ]).then(() => undefined)
}

/**
 * Remove a dependency from the filesystem.
 */
export function removeDependency (options: DefinitionOptions) {
  const location = getDependencyLocation(options)

  // Remove the dependency from typings.
  function remove (path: string, file: string, dtsFile: string) {
    return promiseFinally(rimraf(path), () => {
      return transformDtsFile(dtsFile, typings => typings.filter(x => x !== file))
    })
  }

  // Remove dependencies concurrently.
  return Promise.all([
    remove(location.mainPath, location.mainFile, location.mainDtsFile),
    remove(location.browserPath, location.browserFile, location.browserDtsFile)
  ]).then(() => undefined)
}

/**
 * Return the dependency output locations based on definition options.
 */
function getDependencyLocation (options: DefinitionOptions) {
  const mainDir = options.ambient ? ambientMainTypingsDir : mainTypingsDir
  const browserDir = options.ambient ? ambientBrowserTypingsDir : browserTypingsDir

  const typingsDir = join(options.cwd, TYPINGS_DIR)
  const mainDtsFile = join(typingsDir, DTS_MAIN_FILE)
  const browserDtsFile = join(typingsDir, DTS_BROWSER_FILE)
  const mainPath = join(options.cwd, mainDir, options.name)
  const browserPath = join(options.cwd, browserDir, options.name)
  const mainFile = join(mainPath, toDefinition(options.name))
  const browserFile = join(browserPath, toDefinition(options.name))

  return {
    mainFile,
    browserFile,
    mainPath,
    browserPath,
    mainDtsFile,
    browserDtsFile
  }
}

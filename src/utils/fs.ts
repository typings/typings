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
import extend = require('xtend')
import Promise = require('native-or-bluebird')
import { join, dirname } from 'path'
import { CONFIG_FILE, TYPINGS_DIR, DTS_MAIN_FILE, DTS_BROWSER_FILE } from './config'
import { isHttp, toDefinition } from './path'
import { parseReferences, stringifyReferences } from './references'
import { ConfigJson } from '../interfaces/main'

// Create a file cache for popsicle.
const requestFileCache = popsicleCache()

const mainTypingsDir = join(TYPINGS_DIR, 'definitions/main')
const browserTypingsDir = join(TYPINGS_DIR, 'definitions/browser')
const ambientMainTypingsDir = join(TYPINGS_DIR, 'ambient/main')
const ambientBrowserTypingsDir = join(TYPINGS_DIR, 'ambient/browser')

export type Stats = fs.Stats

export const stat = thenify(fs.stat)
export const readFile = thenify<string, string, string>(fs.readFile)
export const writeFile = thenify<string, string | Buffer, void>(fs.writeFile)
export const mkdirp = thenify<string, void>(mdp)
export const unlink = thenify<string, void>(fs.unlink)

export function isFile (path: string): Promise<boolean> {
  return stat(path).then(stat => stat.isFile(), () => false)
}

export function readJson (path: string): Promise<any> {
  return readFile(path, 'utf8')
    .then(stripBom)
    .then(contents => parseJson(contents, path))
}

export function writeJson (path: string, json: any, indent: string | number = 2) {
  return writeFile(path, JSON.stringify(json, null, indent))
}

export function readConfig (path: string): Promise<ConfigJson> {
  return readJson(path)
}

export function readConfigFrom (path: string): Promise<ConfigJson> {
  // TODO(blakeembrey): Provide more insightful errors from config.
  return readJsonFrom(path)
}

export function readHttp (url: string): Promise<string> {
  return popsicle(url)
    .use(requestFileCache)
    .use(popsicleStatus(200))
    .then(x => x.body)
}

export function readFileFrom (from: string): Promise<string> {
  return isHttp(from) ? readHttp(from) : readFile(from, 'utf8')
}

export function readJsonFrom (from: string): Promise<any> {
  return readFileFrom(from)
    .then(stripBom)
    .then(contents => parseJson(contents, from))
}

export function parseConfig (contents: string, path: string) {
  return parseJson(contents, path)
}

export function parseJson (contents: string, path: string) {
  return parse(contents, null, path)
}

export function transformFile (path: string, transform: (contents: string) => string | Promise<string>) {
  function handle (contents: string) {
    return Promise.resolve(transform(contents))
      .then(contents => writeFile(path, contents))
  }

  return readFile(path, 'utf8')
    .then(
      (contents) => handle(contents),
      () => handle(undefined)
    )
}

export function transformJson (path: string, transform: (json: any) => any) {
  return transformFile(path, (contents) => {
    const indent = contents ? detectIndent(contents).indent : 2
    const json = contents ? parseJson(contents, path) : undefined

    return Promise.resolve(transform(json))
      .then(json => JSON.stringify(json, null, indent || 2))
  })
}

export function transformConfig (cwd: string, transform: (config: ConfigJson) => ConfigJson) {
  const path = join(cwd, CONFIG_FILE)

  return transformJson(path, (config = {}) => {
    // TODO: TSD structure validation.

    return Promise.resolve(transform(config))
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

export interface DefinitionOptions {
  cwd: string
  name: string
  ambient: boolean
}

export function writeDependency (contents: { main: string; browser: string }, options: DefinitionOptions): Promise<boolean> {
  const { mainFile, browserFile, mainDtsFile, browserDtsFile } = getDependencyLocation(options)

  return Promise.all([
    mkdirp(join(options.cwd, mainTypingsDir)),
    mkdirp(join(options.cwd, browserTypingsDir))
  ])
    .then(() => {
      return Promise.all([
        writeFile(mainFile, contents.main || ''),
        writeFile(browserFile, contents.browser || '')
      ])
    })
    .then(() => {
      return Promise.all([
        transformDtsFile(mainDtsFile, typings => typings.concat([mainFile])),
        transformDtsFile(browserDtsFile, typings => typings.concat([browserFile]))
      ])
    })
    .then(() => undefined)
}

export function removeDependency (options: DefinitionOptions) {
  const { mainFile, browserFile, mainDtsFile, browserDtsFile } = getDependencyLocation(options)

  return Promise.all([
    unlink(mainFile).catch(() => false),
    unlink(browserFile).catch(() => false)
  ])
    .then(() => {
      return Promise.all([
        transformDtsFile(mainDtsFile, typings => typings.filter(x => x !== mainFile)),
        transformDtsFile(browserDtsFile, typings => typings.filter(x => x !== browserFile))
      ])
    })
    .then(() => undefined)
}

/**
 * Return the dependency output locations based on definition options.
 */
function getDependencyLocation (options: DefinitionOptions) {
  const typingsDir = join(options.cwd, TYPINGS_DIR)
  const mainDtsFile = join(typingsDir, DTS_MAIN_FILE)
  const browserDtsFile = join(typingsDir, DTS_BROWSER_FILE)
  const mainDir = options.ambient ? ambientMainTypingsDir : mainTypingsDir
  const browserDir = options.ambient ? ambientBrowserTypingsDir : browserTypingsDir
  const mainFile = join(options.cwd, mainDir, toDefinition(options.name))
  const browserFile = join(options.cwd, browserDir, toDefinition(options.name))

  return { mainFile, browserFile, mainDtsFile, browserDtsFile }
}

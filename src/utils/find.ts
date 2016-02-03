import { join, dirname } from 'path'
import Promise = require('any-promise')
import { isFile } from '../utils/fs'
import { CONFIG_FILE } from './config'

export function findProject (dir: string): Promise<string> {
  return findConfigFile(dir).then(dirname)
}

export function findConfigFile (dir: string): Promise<string> {
  return findUp(dir, CONFIG_FILE)
}

export function findUp (dir: string, filename: string, from = dir): Promise<string> {
  const path = join(dir, filename)

  return isFile(path)
    .then(function (exists) {
      return exists ? path : findUpParent(dir, filename, from)
    })
}

function findUpParent (dir: string, filename: string, from: string): Promise<string | void> {
  const parentDir = dirname(dir)

  if (dir === parentDir) {
    return Promise.reject<void>(new Error(`Unable to find "${filename}" from "${from}"`))
  }

  return findUp(parentDir, filename, from)
}

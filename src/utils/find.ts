import { join, dirname } from 'path'
import { isFile } from '../utils/fs'
import { CONFIG_FILE } from './config'

export function findProject (dir: string): Promise<string> {
  return findConfigFile(dir).then(dirname)
}

export function findConfigFile (dir: string): Promise<string> {
  return findUp(dir, CONFIG_FILE)
}

export function findUpParent (dir: string, filename: string): Promise<string | void> {
  const parentDir = dirname(dir)

  if (dir === parentDir) {
    return Promise.reject(new Error(`Unable to resolve ${filename}`))
  }

  return findUp(parentDir, filename)
}

export function findUp (dir: string, filename: string): Promise<string> {
  const path = join(dir, filename)

  return isFile(path)
    .then(function (exists) {
      return exists ? path : findUpParent(dir, filename)
    })
}

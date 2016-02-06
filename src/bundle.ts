import Promise = require('any-promise')
import { resolveAllDependencies } from './lib/dependencies'
import compile, { CompiledOutput } from './lib/compile'

/**
 * Bundle configuration options.
 */
export interface BundleOptions {
  name?: string
  source: string
}

/**
 * Bundle the current typings project into a single ambient definition.
 */
export function bundle (options: BundleOptions): Promise<CompiledOutput> {
  const { source: cwd } = options

  return resolveAllDependencies({ cwd, dev: false, ambient: false })
    .then(function (tree) {
      const name = options.name || tree.name

      if (name == null) {
        return Promise.reject(new TypeError(
          'Unable to infer typings name from project. Use the `--name` flag to specify it manually'
        ))
      }

      return compile(tree, { cwd, name, ambient: false, meta: true })
    })
}
